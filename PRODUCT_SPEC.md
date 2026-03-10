# SmartSpend v2 — Product Specification
## Переход из демо в рабочую версию

---

## 1. Общая архитектура продукта

### Текущее состояние (демо)
- Все данные захардкожены в `mock.js`
- Авторизация фиктивная (просто пишет `ss_auth=true`)
- localStorage используется как временная замена базы данных
- Нет реальных API-вызовов
- Нет серверной части

### Целевое состояние (production)
```
Frontend (React SPA)
    ↕ REST API / WebSocket
Backend (Node.js / Python / Go)
    ↕
Database (PostgreSQL)
    ↕
Object Storage (S3-совместимое) — для медиа
    ↕
Queue / Scheduler — для уведомлений и напоминаний
```

---

## 2. Модули системы

### 2.1 Модуль Аутентификации

**Что реализовать:**

#### Регистрация
- Email + пароль (bcrypt хэш)
- OAuth: Яндекс ID, VK Max
- Подтверждение email (ссылка + токен, 24ч TTL)
- После подтверждения → онбординг-квиз (обязателен, не пропускается)

#### Квиз при регистрации
- 3 вопроса о потреблении + имя пользователя
- Ответы сохраняются в профиль (используются для персонализации рекомендаций)
- После квиза → автоматически создаётся профиль с базовыми настройками

#### Вход
- Email + пароль
- OAuth (Яндекс, VK)
- «Запомнить меня» — refresh token 30 дней
- Восстановление пароля через email (токен 1 час)

#### Сессии
- Access token (JWT, 15 мин) + Refresh token (httpOnly cookie, 30 дней)
- При истечении access token — автоматическое обновление через refresh
- При смене пароля — инвалидация всех refresh токенов

#### Состояния пользователя в системе
```
active        — нормальный аккаунт
unverified    — email не подтверждён (ограниченный доступ)
suspended     — временная блокировка (нарушения)
deleted       — удалён (контент отображается как "Привидение")
anonymous_pub — анонимный публикатор (специальный режим)
```

---

### 2.2 Модуль Профиля пользователя

**Что хранить:**

```sql
users
  id, email, username, display_name
  avatar_url, bio, handle (@username)
  quiz_answers (jsonb)         -- ответы из онбординга
  created_at, updated_at
  status (active/deleted/suspended)
  is_anonymous_publisher (bool) -- может публиковать анонимно

user_settings
  user_id
  theme (light/dark/system)
  sidebar_collapsed (bool)
  notif_new_sets, notif_articles, notif_reminders, notif_weekly
  privacy_sets, privacy_articles, privacy_profile
  social_yandex_linked, social_vk_linked
```

**API:**
```
GET  /api/me                    — текущий пользователь
PUT  /api/me                    — обновить профиль
POST /api/me/avatar             — загрузить аватар
PUT  /api/me/settings           — обновить настройки
POST /api/auth/change-email     — смена email (с подтверждением)
POST /api/auth/change-password  — смена пароля
DELETE /api/me                  — удалить аккаунт
```

**Логика удаления аккаунта:**
1. Статус пользователя → `deleted`
2. Email и personal data → анонимизируются
3. Все публикации остаются, но author → `ghost` запись
4. Подписки, лайки, комментарии — удаляются
5. Инвентарь и финансовые данные — удаляются
6. Через 30 дней — автоматическая полная очистка (job)

---

### 2.3 Модуль Инвентаря

Самый сложный модуль. Управляет жизненным циклом всех вещей пользователя.

#### Типы позиций

```
consumable (расходник)
  - qty: текущее количество
  - unit: единица измерения (шт, уп, мл, г)
  - daily_use: расход в день
  - purchase_date: дата последней покупки
  - price: стоимость единицы

wear (одежда / предметы длительного пользования)
  - wear_life_weeks: срок службы в неделях
  - purchase_date: дата приобретения
  - price: стоимость
```

#### Статусы позиции

```
frozen    — добавлена из набора, ещё не куплена
active    — куплена и в использовании
archived  — выведена из использования
```

#### Состояние "Заморозка" (frozen) — ключевой сценарий

Когда пользователь добавляет набор из каталога:

```
1. Каждая позиция набора создаётся в инвентаре со статусом frozen
2. В заморозке позиция:
   - Отображается отдельно (серый цвет, иконка ❄️)
   - Не участвует в расчёте сроков и статусов
   - Показывает рекомендованную цену из набора
   - Можно отредактировать перед активацией
3. Пользователь нажимает "Купил" → статус → active
   - consumable: qty = default из набора, purchase_date = today
   - wear: purchase_date = today
4. Теперь позиция участвует в расчёте статусов
```

#### Расчёт статусов (consumable)

```
days_left = qty / daily_use
normal_days = default_qty / daily_use  -- норма из набора

pct = days_left / normal_days

pct > 0.5  → ok (зелёный)
pct > 0.2  → soon (жёлтый)
pct > 0.0  → urgent (красный) + создаётся напоминание
pct <= 0.0 → over (фиолетовый) + уведомление
```

#### Расчёт статусов (wear)

```
days_used = today - purchase_date
total_days = wear_life_weeks * 7
pct = 1 - days_used / total_days

same thresholds as consumable
```

#### Операции

```
GET  /api/inventory                     — все группы с позициями
POST /api/inventory/items               — создать позицию вручную
PUT  /api/inventory/items/:id           — обновить (qty, price, dates)
PUT  /api/inventory/items/:id/activate  — frozen → active (Купил)
PUT  /api/inventory/items/:id/archive   — active → archived
DELETE /api/inventory/items/:id         — удалить
POST /api/inventory/items/:id/restock   — пополнить (consumable): qty += amount
```

#### Группы инвентаря

Группы создаются автоматически из категорий наборов. Пользователь может переименовывать.

```sql
inventory_groups
  id, user_id, name, color
  set_category (ссылка на категорию каталога)
  sort_order

inventory_items
  id, user_id, group_id, set_id (nullable — если из набора)
  name, status (frozen/active/archived)
  type (consumable/wear)
  price
  -- consumable:
  qty, unit, daily_use
  purchase_date
  -- wear:
  wear_life_weeks, purchase_date
  created_at, updated_at, is_manual (bool)
```

---

### 2.4 Модуль Наборов (Sets / Catalog)

#### Типы источников

```
ss         — официальные наборы SmartSpend (только админ)
community  — наборы от пользователей (публичные)
own        — личные наборы пользователя (приватные по умолчанию)
```

#### Структура набора

```sql
sets
  id, author_id, source (ss/community/own)
  title, short_desc, intro_text
  category, type (base/extra)
  color, is_public, is_anonymous
  created_at, published_at
  views, likes_count, users_count (денормализовано, обновляется триггерами)
  status (draft/published/archived)

set_items
  id, set_id
  name, note, qty, unit
  base_price, price_updated_at
  period_years (0 = consumable)
  daily_use (для consumable)
  sort_order

set_likes
  user_id, set_id, created_at

set_saves (добавил в конверт)
  user_id, set_id, created_at
```

#### API

```
GET  /api/catalog?cat=&source=&type=&sort=&page=   — список с фильтрами
GET  /api/catalog/:id                              — детали набора
POST /api/sets                                     — создать набор (черновик)
PUT  /api/sets/:id                                 — редактировать
POST /api/sets/:id/publish                         — опубликовать
DELETE /api/sets/:id                               — удалить
POST /api/sets/:id/like                            — поставить лайк
DELETE /api/sets/:id/like                          — убрать лайк
POST /api/sets/:id/save                            — добавить в профиль (запускает создание позиций в инвентаре)
DELETE /api/sets/:id/save                          — убрать из профиля
GET  /api/sets/my                                  — мои наборы
GET  /api/sets/liked                               — понравившиеся
```

#### Добавление набора в профиль (POST /api/sets/:id/save)

```
Server-side логика:
1. Создать запись в envelopes (профиль пользователя)
2. Для каждого set_item создать inventory_item:
   - status = frozen
   - все параметры из set_item
   - set_id = ссылка на набор
3. Вернуть { envelope_id, created_items: [...] }
```

---

### 2.5 Модуль Профиля (Финансы и конверты)

#### Конверты (Envelopes)

Конверты — это категории трат, организованные вокруг наборов.

```sql
envelopes
  id, user_id, category, sort_order, name (кастомное имя, опционально)

envelope_sets (связь конверт ↔ набор)
  id, envelope_id, set_id, added_at
```

#### Финансовые данные

```sql
user_finance
  user_id
  income (ежемесячный доход)
  housing, credit, food, transport, other (фиксированные расходы)
  capital (текущий капитал)
  core_rate (ставка пополнения ядра, %)
  safety_months (целевой резерв в месяцах)
  emo_rate (ставка EmoSpend, 4-10%)
  updated_at
```

#### Расчёты

**Smart-база (ежемесячный бюджет на наборы):**
```
Для каждого активного набора в конвертах:
  Для каждой позиции:
    consumable: price * (daily_use * 30) / qty
    wear: price / (wear_life_weeks * 7 / 30)
Итого = сумма всех позиций всех наборов
```

**Свободный остаток:**
```
free = income - housing - credit - food - transport - other - smart_base
```

**Отчисление в ядро:**
```
core_contribution = free * core_rate
emo_spend = capital * emo_rate / 12
```

**Прогноз капитала (10 лет):**
```
Каждый месяц:
  capital = capital * (1 + annual_rate/12) + core_contribution
```

#### API

```
GET  /api/profile/finance          — финансовые данные
PUT  /api/profile/finance          — обновить
GET  /api/profile/envelopes        — все конверты с наборами
POST /api/profile/envelopes        — создать конверт вручную
DELETE /api/profile/envelopes/:id  — удалить конверт
DELETE /api/profile/envelopes/:envelope_id/sets/:set_id — убрать набор из конверта
GET  /api/profile/summary          — сводка: smart-база, свободные, ядро, EmoSpend
```

---

### 2.6 Модуль Ленты (Feed)

#### Структура

Лента показывает статьи и наборы от авторов, на которых подписан пользователь + рекомендации.

```
Алгоритм ленты:
1. Контент от подписок (приоритет)
2. Популярный контент из категорий, интересных пользователю
3. Новые наборы SmartSpend
4. Случайные рекомендации для разнообразия
```

#### Фильтры

```
type: all / articles / sets
mode: subscriptions / unread / liked
cat: категория
sort: newest / popular_day / popular_week / popular_all
```

#### API

```
GET /api/feed?type=&mode=&cat=&sort=&page=&limit=
```

Ответ:
```json
{
  "items": [
    {
      "id": "...",
      "type": "article|set",
      "ts": 1234567890,
      "pop": 99000,
      "title": "...",
      "preview": "...",
      "author": { "id", "name", "initials", "color", "type" },
      "category": "...",
      "views": 0,
      "likes": 0,
      "comments": 0,
      "is_read": false,
      "is_liked": false
    }
  ],
  "next_cursor": "..."
}
```

---

### 2.7 Модуль Статей

#### Структура

```sql
articles
  id, author_id
  title, excerpt, body (markdown)
  category, article_type
  cover_image_url
  linked_set_id (nullable)
  status (draft/published/archived)
  is_anonymous (bool)
  created_at, published_at
  views_count, likes_count, comments_count (денормализовано)

article_likes
  user_id, article_id, created_at

article_reads
  user_id, article_id, read_at

article_images
  id, article_id, user_id
  file_key (S3 ключ)
  url, filename, size
  created_at

comments
  id, article_id, author_id
  body (текст)
  parent_id (nullable — для ответов)
  likes_count
  created_at, updated_at, is_deleted

comment_likes
  user_id, comment_id, created_at
```

#### API

```
GET    /api/articles?page=&cat=&sort=   — список статей
GET    /api/articles/:id                — статья с комментариями
POST   /api/articles                    — создать черновик
PUT    /api/articles/:id                — обновить
POST   /api/articles/:id/publish        — опубликовать
DELETE /api/articles/:id                — удалить
POST   /api/articles/:id/like           — лайк
DELETE /api/articles/:id/like           — убрать лайк
POST   /api/articles/:id/read           — отметить прочитанной
POST   /api/articles/:id/images         — загрузить изображение (multipart)
DELETE /api/articles/images/:id         — удалить изображение

GET    /api/articles/:id/comments       — комментарии
POST   /api/articles/:id/comments       — добавить комментарий
PUT    /api/comments/:id                — редактировать комментарий
DELETE /api/comments/:id                — удалить комментарий
POST   /api/comments/:id/like           — лайк комментария
```

---

### 2.8 Модуль Авторов и Подписок

```sql
follows
  follower_id, following_id, created_at

author_stats (view или денормализованная таблица)
  user_id
  followers_count, following_count
  articles_count, sets_count
  total_views, total_likes
```

#### API

```
GET    /api/users/:id                   — профиль автора (публичный)
GET    /api/users/:id/articles          — статьи автора
GET    /api/users/:id/sets              — наборы автора
POST   /api/users/:id/follow            — подписаться
DELETE /api/users/:id/follow            — отписаться
GET    /api/me/subscriptions            — мои подписки
```

#### Анонимная публикация

```
Если is_anonymous = true:
  - В ленте показывается "Анонимный автор" (тип anonymous)
  - В деталях статьи/набора — "Анонимный автор"
  - Переход по автору → AnonymousProfile (заблокировано)
  - Реальный автор виден только ему самому в аккаунте
  - Автор может раскрыть себя (снять анонимность) в любой момент
```

---

### 2.9 Модуль Уведомлений

#### Типы уведомлений

```
sub_new_article   — автор из подписок опубликовал статью
sub_new_set       — автор из подписок опубликовал набор
comment_reply     — ответили на комментарий
comment_on_my     — комментарий к моей статье/набору
new_follower      — новый подписчик
like_milestone    — набрал N лайков (50, 100, 500, ...)
inv_reminder      — напоминание из инвентаря (статус urgent/over)
inv_frozen        — новые позиции в заморозке добавлены
system_update     — системное сообщение
weekly_digest     — еженедельная сводка
```

#### Таблицы

```sql
notifications
  id, user_id
  type (из enum выше)
  title, body
  payload (jsonb — ссылка на объект: article_id / set_id / user_id / item_id)
  is_read (bool)
  created_at

notification_settings
  user_id
  type → enabled (bool)
  -- отдельно для каждого типа
```

#### API

```
GET  /api/notifications?filter=&page=  — список уведомлений
POST /api/notifications/:id/read       — отметить прочитанным
POST /api/notifications/read-all       — отметить все прочитанными
GET  /api/notifications/unread-count   — количество непрочитанных
```

#### Доставка (real-time)

```
Варианты (от простого к сложному):
1. Polling — GET /api/notifications/unread-count каждые 30 сек
2. SSE (Server-Sent Events) — держать соединение, пушить при новом
3. WebSocket — двустороннее, нужно если есть чат
```

Для MVP достаточно SSE.

#### Напоминания инвентаря (Scheduler)

```
Ежедневный job (например, в 09:00 по локальному времени):
  Для каждого пользователя:
    Проверить все active inventory_items
    Если статус изменился с ok/soon → urgent:
      Создать notification (type=inv_reminder)
    Если статус → over:
      Создать notification (type=inv_reminder, приоритет высокий)
```

---

### 2.10 Модуль Поиска (опционально для MVP)

```
GET /api/search?q=&type=sets|articles|users&page=
```

Индексируется:
- Наборы: title, desc, items.name
- Статьи: title, excerpt, body (первые 500 символов)
- Пользователи: display_name, handle, bio

Реализация: PostgreSQL full-text search (tsvector) или Elasticsearch для масштаба.

---

## 3. Пользовательские сценарии

### Сценарий 1: Регистрация и онбординг

```
1. Пользователь → кнопка "Начать бесплатно"
2. Открывается AuthModal, вкладка "Регистрация"
3. Вводит имя, email, пароль
   → POST /api/auth/register
   ← 201: { user, access_token } + письмо с подтверждением
4. Редирект на /onboarding (квиз)
   - 3 вопроса о потреблении (обязательны)
   - Имя как обращение
   → POST /api/me/onboarding { answers, display_name }
5. После квиза → /feed
6. Баннер: "Подтвердите email" (не блокирует доступ, но показывается)

Параллельно:
   - Создаётся профиль с дефолтными настройками
   - Создаются дефолтные группы инвентаря (Питание, Уход, Одежда, Быт, Здоровье, Разное)
   - Рекомендуются стартовые наборы от SmartSpend (показываются в ленте)
```

---

### Сценарий 2: Добавление набора из каталога

```
1. Каталог → карточка набора → клик
2. Страница SetDetail:
   - Пользователь видит все позиции с ценами
   - Может настроить qty, price через Edit Mode
   - Может изменить масштаб (Scale 0.25x – 5x)
3. Нажимает "Добавить в конверт"
   → POST /api/sets/:id/save

Server:
   a. Создать envelope если нет для этой категории
   b. Добавить набор в envelope_sets
   c. Для каждой позиции набора создать inventory_item:
      { status: 'frozen', set_id, all params from set_item }
   d. Создать notification (type=inv_frozen):
      "Добавлено 12 позиций в заморозку"

4. Редирект → /inventory (или /profile?)
5. В инвентаре видит раздел "Заморозка":
   - Все новые позиции серые, с ❄️
   - Каждая показывает: название, рекомендованная цена, ед.измерения
   - Кнопка "Купил" у каждой позиции

6. Пользователь нажимает "Купил" у позиции:
   → PUT /api/inventory/items/:id/activate
   { purchase_date: today, qty: actual_qty, price: actual_price }
   ← status: 'active', первый расчёт статуса

7. Позиция переходит в активные, начинают считаться сроки
```

---

### Сценарий 3: Управление расходником (consumable)

```
Контекст: у пользователя активен "Протеин", qty=1000г, daily_use=33г

1. Прошло 20 дней → qty_left ≈ 340г → 34% → статус "soon" (жёлтый)
2. Приложение показывает жёлтое кольцо в инвентаре
3. Прошло ещё 10 дней → qty_left ≈ 7г → 0.7% → статус "urgent" (красный)
4. Scheduler создаёт уведомление: "Протеин заканчивается — осталось 2 дня"
5. Пользователь идёт в магазин, покупает новую банку
6. В инвентаре нажимает "Пополнить"
   → POST /api/inventory/items/:id/restock { qty_added: 1000, price: 2500 }
7. qty = 7 + 1000 = 1007г, purchase_date обновляется, статус → ok

Альтернатива: Пользователь нажимает "Купил заново" (сброс)
   → PUT /api/inventory/items/:id/activate { qty: 1000, purchase_date: today }
```

---

### Сценарий 4: Управление вещью (wear)

```
Контекст: у пользователя активны "Кроссовки для бега", wear_life_weeks=52

1. Куплены 6 месяцев назад (26 недель)
   pct = 1 - 26/52 = 0.5 → граница ok/soon
2. Через 2 недели → pct ≈ 0.46 → soon (жёлтый)
3. Через ещё 6 недель → pct ≈ 0.23 → ещё soon
4. Через ещё 4 недели (всего год) → pct = 0 → over (фиолетовый)
5. Уведомление: "Кроссовки для бега — рекомендуется заменить"
6. Пользователь покупает новые:
   → PUT /api/inventory/items/:id/activate { purchase_date: today }
   Счётчик сбрасывается
7. Старые → archived (или удалить)
```

---

### Сценарий 5: Написание и публикация статьи

```
1. Пользователь → Создать статью (из аккаунта или ленты)
2. CreateArticle:
   - Вводит заголовок, лид, тело (markdown-редактор)
   - Загружает изображения (drag-and-drop)
     → POST /api/articles/:id/images (multipart/form-data)
     ← { id, url } — S3 ссылка
   - Вставляет изображение в текст: ![alt](url)
   - Выбирает категорию
   - Опционально: привязывает набор (LinkedSet)
   - Опционально: анонимная публикация (toggle)
3. Автосохранение черновика каждые 30 сек:
   → PUT /api/articles/:id (status=draft)
4. Предпросмотр: переключает режим, видит статью как читатель
5. Публикация:
   → POST /api/articles/:id/publish
6. Статья попадает в ленту подписчиков
7. Уведомления: все подписчики получают push (type=sub_new_article)
```

---

### Сценарий 6: Создание собственного набора

```
1. CreateSet:
   - Заголовок, краткое описание, развёрнутое описание
   - Категория (влияет на конверт в профиле)
   - Тип: база / дополнение
   - Видимость: публичный / приватный
   - Добавление позиций: название, ед.изм, цена, количество, срок
2. Превью: видит как будет выглядеть в каталоге
3. Публикация:
   → POST /api/sets/:id/publish
4. Если публичный → source=community, появляется в каталоге
5. Если приватный → source=own, виден только автору

Добавление собственного набора в конверт:
   - Аналогично п.2 (сценарий 2), но без раздела "заморозка":
   - Позиции сразу frozen, пользователь может активировать
   - ИЛИ: при создании спрашиваем "У вас уже есть эти вещи?"
     да → сразу active с текущей датой
     нет → frozen
```

---

### Сценарий 7: Финансовый профиль

```
1. Пользователь впервые открывает Profile
2. Видит баннер "Заполните финансовые данные для расчёта"
3. Открывает FinancialModal:
   - Доход: 80 000 ₽
   - Фикс. расходы: жильё 25 000, кредит 0, еда 15 000, транспорт 5 000, прочее 5 000
   - Текущий капитал: 150 000 ₽
   - Ставка ядра: 10%
   - Ставка EmoSpend: 6%
   → PUT /api/profile/finance
4. Система считает:
   Smart-база = сумма из всех активных наборов конвертов
   Свободные = 80000 - 25000 - 0 - 15000 - 5000 - 5000 - smart_base
   В ядро = свободные * 10%
   EmoSpend = 150000 * 6% / 12 = 750 ₽/мес
5. График прогноза капитала строится в реальном времени
6. При добавлении нового набора → smart_база пересчитывается автоматически

Изменение ставки EmoSpend:
   Пользователь двигает ползунок 4% → 8%
   → EmoSpend меняется в реальном времени (локально)
   → PUT /api/profile/finance { emo_rate: 0.08 } при отпускании
```

---

### Сценарий 8: Подписка на автора

```
1. Пользователь читает статью → нажимает "Подписаться" у автора
   → POST /api/users/:id/follow
2. Автор получает уведомление (type=new_follower):
   "На вас подписался Никита"
3. Статьи и наборы автора теперь появляются в ленте пользователя
   (приоритетно, в разделе "Подписки")
4. В Feed → фильтр "Подписки" показывает только контент от подписок
5. Пользователь может отписаться:
   → DELETE /api/users/:id/follow
```

---

### Сценарий 9: Уведомление о заморозке

```
Триггер: пользователь добавил набор "Базовая аптечка" (12 позиций)

Немедленно:
  → Уведомление в bell: "Добавлено 12 позиций в заморозку"
  → В инвентаре появляется раздел "Заморозка" с 12 позициями

Каждый день (если есть frozen позиции):
  → Напоминание (1 раз, не спамить):
    "У вас 8 позиций в заморозке. Отметьте купленные →"

Пользователь покупает позиции по одной:
  → Нажимает "Купил" → статус active → начинается отсчёт
  → При активации последней frozen позиции:
    Уведомление: "Все позиции набора активированы! ✅"
```

---

### Сценарий 10: Еженедельный дайджест

```
Каждое воскресенье 18:00 (если включено в настройках):

Формируется уведомление:
  "Дайджест за неделю:
   • Просрочено: 2 позиции (Зубная паста, Крем для рук)
   • Заканчиваются: 3 позиции
   • Новые наборы SS: Летний уход (22 позиции)
   • Новые статьи от ваших авторов: 4"

Нажатие на уведомление → специальная сводная страница
(или просто переход в нотификейшн с деталями)
```

---

### Сценарий 11: Анонимная публикация

```
1. При создании статьи/набора — toggle "Опубликовать анонимно"
2. Публикуется от имени "Анонимный автор"
3. В ленте других пользователей:
   - Видят: 🔒 Анонимный автор
   - Нажимают на автора → AnonymousProfile (заблокировано)
4. В аккаунте автора статья помечена "Анонимно"
5. Автор может в любой момент раскрыть себя:
   → PUT /api/articles/:id { is_anonymous: false }
   - Статья перестаёт быть анонимной, имя автора показывается

Случай "удалённый аккаунт":
1. Пользователь удаляет аккаунт
2. Все его публикации (не анонимные) переключаются на "ghost" автора
3. В ленте: 👻 Привидение
4. Нажатие → GhostProfile: "Этот аккаунт был удалён"
5. Контент остаётся доступным (статьи читаемы, наборы используемы)
```

---

## 4. Схема базы данных (сводная)

```sql
-- Пользователи
users (id, email, password_hash, username, display_name, avatar_url, bio, handle, status, created_at)
user_settings (user_id, theme, sidebar_collapsed, notif_*, privacy_*, emo_rate)
user_finance (user_id, income, housing, credit, food, transport, other, capital, core_rate, safety_months, emo_rate)

-- Auth
refresh_tokens (id, user_id, token_hash, expires_at, revoked_at)
email_verifications (id, user_id, token_hash, expires_at)
password_resets (id, user_id, token_hash, expires_at)

-- Подписки
follows (follower_id, following_id, created_at)

-- Наборы
sets (id, author_id, source, title, short_desc, intro_text, category, type, color, is_public, is_anonymous, status, views_count, likes_count, users_count, created_at, published_at)
set_items (id, set_id, name, note, qty, unit, base_price, period_years, daily_use, sort_order)
set_likes (user_id, set_id, created_at)
set_saves (user_id, set_id, created_at)

-- Инвентарь
inventory_groups (id, user_id, name, color, set_category, sort_order)
inventory_items (id, user_id, group_id, set_id, name, status, type, price, qty, unit, daily_use, purchase_date, wear_life_weeks, is_manual, created_at, updated_at)

-- Профиль (конверты)
envelopes (id, user_id, category, name, sort_order)
envelope_sets (id, envelope_id, set_id, added_at)

-- Статьи
articles (id, author_id, title, excerpt, body, category, article_type, cover_image_url, linked_set_id, status, is_anonymous, views_count, likes_count, comments_count, created_at, published_at)
article_likes (user_id, article_id, created_at)
article_reads (user_id, article_id, read_at)
article_images (id, article_id, user_id, file_key, url, filename, size, created_at)

-- Комментарии
comments (id, article_id, author_id, body, parent_id, likes_count, created_at, updated_at, is_deleted)
comment_likes (user_id, comment_id, created_at)

-- Уведомления
notifications (id, user_id, type, title, body, payload, is_read, created_at)
```

---

## 5. API — сводная таблица

| Метод | Путь | Описание |
|---|---|---|
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход |
| POST | /api/auth/logout | Выход |
| POST | /api/auth/refresh | Обновить токен |
| POST | /api/auth/verify-email | Подтвердить email |
| POST | /api/auth/forgot-password | Запрос сброса пароля |
| POST | /api/auth/reset-password | Сброс пароля |
| GET | /api/me | Текущий пользователь |
| PUT | /api/me | Обновить профиль |
| PUT | /api/me/settings | Настройки |
| DELETE | /api/me | Удалить аккаунт |
| GET | /api/users/:id | Профиль автора |
| POST | /api/users/:id/follow | Подписаться |
| DELETE | /api/users/:id/follow | Отписаться |
| GET | /api/feed | Лента |
| GET | /api/catalog | Каталог наборов |
| GET | /api/catalog/:id | Детали набора |
| POST | /api/sets | Создать набор |
| PUT | /api/sets/:id | Редактировать набор |
| POST | /api/sets/:id/publish | Опубликовать набор |
| POST | /api/sets/:id/like | Лайк набора |
| POST | /api/sets/:id/save | Добавить в конверт |
| GET | /api/inventory | Инвентарь |
| POST | /api/inventory/items | Создать позицию |
| PUT | /api/inventory/items/:id | Обновить позицию |
| PUT | /api/inventory/items/:id/activate | Активировать (frozen→active) |
| POST | /api/inventory/items/:id/restock | Пополнить расходник |
| GET | /api/profile/finance | Финансовые данные |
| PUT | /api/profile/finance | Обновить финансы |
| GET | /api/profile/envelopes | Конверты |
| GET | /api/articles | Список статей |
| GET | /api/articles/:id | Статья |
| POST | /api/articles | Создать статью |
| POST | /api/articles/:id/publish | Опубликовать |
| POST | /api/articles/:id/like | Лайк |
| POST | /api/articles/:id/images | Загрузить изображение |
| GET | /api/articles/:id/comments | Комментарии |
| POST | /api/articles/:id/comments | Добавить комментарий |
| GET | /api/notifications | Уведомления |
| POST | /api/notifications/read-all | Прочитать все |
| GET | /api/notifications/unread-count | Счётчик непрочитанных |

---

## 6. Frontend — что изменится

### Замена mock.js на API-вызовы

Каждая страница переходит от `import { data } from './mock.js'` к `fetch('/api/...')`.

**Паттерн для каждой страницы:**
```js
// До (демо)
import { catalogSets } from '../data/mock.js'
const sets = catalogSets

// После (production)
const [sets, setSets] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetch('/api/catalog?cat=' + cat + '&source=' + source)
    .then(r => r.json())
    .then(data => { setSets(data.items); setLoading(false) })
}, [cat, source])
```

### Новые UI-состояния

Каждая страница должна обрабатывать:
- `loading` — скелетон / спиннер
- `error` — ошибка загрузки + кнопка "Повторить"
- `empty` — нет данных (уже частично сделано для уведомлений)
- `optimistic update` — немедленный UI-отклик при лайке/подписке до ответа сервера

### Изменения в localStorage

После подключения API localStorage используется только для:
- `ss_theme` — тема (остаётся)
- `ss_sidebar` — состояние сайдбара (остаётся)
- `access_token` — JWT (или httpOnly cookie — лучше)

Всё остальное (likes, envelopes, inventory, finance, notif_read) → база данных.

### Глобальный API client

```js
// src/api/client.js
async function apiFetch(path, options = {}) {
  const res = await fetch('/api' + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getAccessToken(),
      ...options.headers
    }
  })
  if (res.status === 401) {
    await refreshToken()   // попытка обновить токен
    return apiFetch(path, options)  // повторить запрос
  }
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
```

---

## 7. Приоритизация (MVP → Full)

### MVP (минимально жизнеспособный продукт)

1. ✅ Регистрация / вход (email + пароль)
2. ✅ Каталог наборов (чтение)
3. ✅ Добавление набора → заморозка в инвентаре
4. ✅ Активация позиций (frozen → active)
5. ✅ Расчёт статусов инвентаря
6. ✅ Финансовый профиль (ввод данных + расчёты)
7. ✅ Уведомления (инвентарь: soon/urgent/over)
8. ✅ Настройки (тема, видимость, смена пароля)

### Phase 2

9. Статьи (чтение + написание)
10. Создание собственных наборов
11. Подписки на авторов
12. Лента с фильтрами
13. Лайки и комментарии
14. OAuth (Яндекс, VK)

### Phase 3

15. Поиск
16. Еженедельный дайджест
17. Анонимная публикация
18. Рекомендательный алгоритм ленты
19. Загрузка аватаров и обложек
20. Real-time уведомления (SSE)
21. Мобильное приложение (React Native на той же логике)

---

## 8. Технические решения

### Что требует особого внимания

**Расчёт статусов инвентаря**
- Не хранить статус в БД — вычислять на лету из `qty/daily_use/purchase_date`
- Кэшировать только если нагрузка высокая

**Изображения в статьях**
- Upload → S3 → получаем CDN URL
- В теле статьи хранить URL, не base64
- При удалении статьи → удалять файлы из S3 (job)

**Счётчики (likes, views, comments)**
- Денормализовать в основную таблицу (нет JOIN при чтении ленты)
- Обновлять через триггеры или background job
- Для views: не UPDATE при каждом просмотре — пишем в очередь, flush раз в 10 мин

**Удаление аккаунта**
- Soft delete: статус → deleted, data → анонимизация
- Hard delete через 30 дней (GDPR compliance)
- Публикации → автор = ghost_user (специальный системный пользователь)

**Анонимные публикации**
- В БД хранить реального author_id всегда
- Флаг is_anonymous определяет что показывать клиенту
- API никогда не отдаёт author_id для анонимных публикаций другим пользователям
