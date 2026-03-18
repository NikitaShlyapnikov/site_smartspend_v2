# SmartSpend v2 — Спецификация страниц и компонентов

> Документ описывает каждую страницу и компонент: интерфейс, логику, состояние, localStorage и навигацию.
> Основа: React + Vite + HashRouter. Все данные — мок, персистентность — через localStorage.

---

## Содержание

1. [Landing](#1-landing)
2. [Feed — Лента](#2-feed--лента)
3. [Catalog — Каталог](#3-catalog--каталог)
4. [Inventory — Инвентарь](#4-inventory--инвентарь)
5. [Profile — Профиль](#5-profile--профиль)
6. [SetDetail — Детали набора](#6-setdetail--детали-набора)
7. [Article — Статья](#7-article--статья)
8. [CreateSet — Создать набор](#8-createset--создать-набор)
9. [CreateArticle — Написать статью](#9-createarticle--написать-статью)
10. [Account — Аккаунт](#10-account--аккаунт)
11. [Settings — Настройки](#11-settings--настройки)
12. [Notifications — Уведомления](#12-notifications--уведомления)
13. [AuthorPage — Профиль автора](#13-authorpage--профиль-автора)
14. [Компоненты](#14-компоненты)
15. [Контекст и данные](#15-контекст-и-данные)
16. [Таблица localStorage](#16-таблица-localstorage)

---

## 1. Landing

**Маршрут:** `/`
**Файл:** `app/src/pages/Landing.jsx`
**Доступ:** Публичный. Если `ss_auth === 'true'` — сразу редирект на `/feed`.

### Интерфейс

| Секция | Описание |
|--------|----------|
| Hero | Главный баннер: слоган, две CTA-кнопки («Начать» / «Войти») |
| Pain points | 3 карточки с болевыми точками потребителя |
| For whom | 3 персоны: для кого продукт |
| How it works | 3 шага работы системы с иллюстрациями |
| Philosophy | Философский блок — осознанное потребление |
| Features | 4 фича-карточки |
| Scenario | Таймлайн из 3 этапов жизненного сценария |
| Footer | Ссылки на соцсети |

### Модальные окна

- **QuizModal** — онбординг-опросник (7 шагов): выбор жизненной ситуации, целей, дохода, трат → создаёт профиль пользователя в localStorage и редиректит на `/feed`
- **AuthModal** — табы «Войти» / «Зарегистрироваться» с полями email/пароль, кнопки соцсетей

### Состояние

```
quizOpen         — видимость QuizModal
authOpen         — видимость AuthModal
authTab          — 'login' | 'register'

Внутри QuizModal:
  step           — текущий шаг (0–6)
  answers        — собранные ответы
  selected       — выбранный вариант
  nameVal        — имя пользователя
  done           — завершён ли квиз

Внутри AuthModal:
  email, password, name
  passVisible    — показать/скрыть пароль
  loading        — ожидание
  emailError     — ошибка валидации
```

### localStorage

| Ключ | Операция | Содержимое |
|------|----------|------------|
| `ss_auth` | write | `'true'` |
| `ss_username` | write | имя пользователя |
| `ss_user_type` | write | `'full'` или `'empty'` (демо-режим) |

### Зависимости данных

- `loadFullUserData()`, `loadEmptyUserData()` из `data/demoUsers` — заполняют все localStorage-ключи сразу при старте

---

## 2. Feed — Лента

**Маршрут:** `/feed`
**Файл:** `app/src/pages/Feed.jsx`
**Доступ:** Требует `ss_auth`. Оборачивается в `<Layout>`.

### Интерфейс

| Секция | Описание |
|--------|----------|
| Заголовок | «Лента» + кнопка `?` (SpotlightTour) |
| Фильтры (sticky) | Ряд категорий-чипов + табы типа контента + выпадающий список сортировки + режим просмотра |
| Лента карточек | Карточки статей и наборов |
| Пустое состояние | Иконка + текст + сброс фильтров |
| WelcomeTour | Модальный тур (7 шагов) при первом входе |
| SpotlightTour | Тур подсветки по кнопке `?` (2 шага) |

### Типы контента в ленте

- **article** — статья: обложка, теги, заголовок, автор, просмотры, лайки
- **set** — набор: цветная полоса, источник, количество позиций, сумма/мес

### Состояние

```
showWelcome   — видимость WelcomeTour (из !localStorage.getItem('ss_tour_welcome'))
showSpotlight — видимость SpotlightTour
tab           — 'all' | 'articles' | 'coupons'
mode          — 'unread' | 'subscriptions' | 'my-sets' | 'liked' | null
cat           — выбранная категория
sort          — 'newest' | 'popular_7d' | 'popular_30d' | 'popular_all'
readIds       — Set<id> прочитанных
likedIds      — Set<id> лайкнутых
dislikedIds   — Set<id> дизлайкнутых
```

### localStorage

| Ключ | Операция | Содержимое |
|------|----------|------------|
| `ss_tour_welcome` | read/write | `'1'` после завершения тура |

### Данные

- `feedItems` — массив карточек (articles + sets)
- `feedAuthors` — объект `{ [authorId]: { name, initials, color, following } }`

### Spotlight шаги (id-якоря)

| ID | Элемент |
|----|---------|
| `sp-feed-filters` | блок sticky-фильтров |
| `sp-feed-list` | список карточек |

---

## 3. Catalog — Каталог

**Маршрут:** `/catalog`
**Файл:** `app/src/pages/Catalog.jsx`
**Доступ:** Публичный (гости видят, но некоторые действия требуют авторизации).

### Интерфейс

| Секция | Описание |
|--------|----------|
| Заголовок | «Каталог наборов» + подзаголовок + кнопка `?` |
| Фильтры (sticky) | Категориальные кнопки с счётчиками, поиск по тексту, фильтр типа, источника, сортировка |
| Сетка карточек | Карточки наборов в grid-сетке |
| Подсказка «Создать» | Показывается только при sourceFilter='own' |
| Пустое состояние | Иконка + кнопка сброса |
| SpotlightTour | 2 шага |

### Карточка набора

- Цветная полоса (accent bar)
- Бейджи: источник (SmartSpend / Сообщество / Моё), тип (Основа / Дополнение)
- Название, описание, кол-во позиций
- Footer: сумма/мес, иконка лайка

### Состояние

```
cat          — категория (из URL param ?cat= или 'all')
typeFilter   — 'all' | 'base' | 'extra'
sourceFilter — 'all' | 'liked' | 'ss' | 'community' | 'own'
sortFilter   — 'popular' | 'newest'
likedSets    — Set<id>
itemSearch   — строка поиска
showSpotlight
authed       — bool из localStorage
```

### localStorage

| Ключ | Операция | Содержимое |
|------|----------|------------|
| `ss_auth` | read | проверка авторизации |
| `ss_catalog_likes` | read/write | `JSON.stringify([...setIds])` |

### Данные

- `catalogSets` — массив всех наборов каталога

### Spotlight шаги

| ID | Элемент |
|----|---------|
| `sp-cat-filters` | блок фильтров |
| `sp-cat-grid` | сетка карточек |

---

## 4. Inventory — Инвентарь

**Маршрут:** `/inventory`
**Файл:** `app/src/pages/Inventory.jsx`
**Доступ:** Требует авторизации.

### Интерфейс

| Секция | Описание |
|--------|----------|
| Заголовок | «Инвентарь» + кнопка `?` |
| Сводные карточки | Итоговая стоимость + карточка срочных покупок (красная если есть срочные) |
| Группы инвентаря | По категориям, сворачиваемые. Цветная боковая полоса |
| Позиция | Кольцо прогресса (wear/consumable), статус, дата покупки, остаток |
| Форма добавления | Выбор типа (расходник / вещь), поля по типу |
| Кнопка редактирования | Inline-редактирование позиции |
| SpotlightTour | 3 шага |

### Типы позиций

**consumable** (расходник):
```
{ type:'consumable', name, price, qty, unit, dailyUse, lastBought, paused }
```
- Индикатор: дни до конца запаса = `qty / dailyUse`
- Прогресс: сколько использовано относительно объёма

**wear** (вещь с износом):
```
{ type:'wear', name, price, wearLifeWeeks, purchases:[{bought, purchaseDate}], paused }
```
- Одна карточка может включать несколько штук (массив `purchases`)
- Прогресс износа по каждой купленной вещи: `(дней с покупки) / (wearLifeWeeks × 7) × 100%`
- Статусы: `< 75%` = ok, `>= 75%` = soon, `>= 90%` = urgent
- Не купленная вещь (bought=false): статус `не активирован`
- `paused=true`: статус `не активирован`

### Расчёт стоимости инвентаря

- consumable: `price` за период
- wear (multi-purchase): `boughtList.length × price × (1 - pctUsed)` только для купленных

### Состояние

```
filter          — 'all' | 'ok' | 'soon' | 'urgent' | 'paused'
expandedGroups  — Set<groupId>
editingId       — id редактируемой позиции
showAdd         — показать форму добавления
groups          — объединённые мок + localStorage данные
```

### localStorage

| Ключ | Операция | Содержимое |
|------|----------|------------|
| `ss_inventory_extra` | read/write | JSON массив позиций добавленных из наборов или вручную |

### Данные

- `inventoryGroups` — мок группы с вложенными позициями (базовые)

### Spotlight шаги

| ID | Элемент |
|----|---------|
| `sp-inv-summary` | сводные карточки |
| `sp-inv-groups` | список групп |
| `sp-inv-edit` | кнопка редактирования |

---

## 5. Profile — Профиль

**Маршрут:** `/profile`
**Файл:** `app/src/pages/Profile.jsx`
**Доступ:** Требует авторизации.

### Интерфейс

| Секция | ID | Описание |
|--------|-----|----------|
| Приветствие | `sp-tiles` | Имя пользователя + кнопка `?` + 3 финансовые плитки (доход, сбережения, % сбережений) |
| Финансовая картина | `sp-finance` | Аккордеон с бюджетными группами: базовые расходы, кредиты, жильё. Кнопка редактирования |
| EmoSpend + Капитал | `sp-emo` | Выбор ставки эмоциональных трат (4%, 5%, 7%, 10%), прогноз капитала |
| Конверты | `sp-envelopes` | Категории расходов, внутри — добавленные наборы и позиции инвентаря |
| SpotlightTour | — | 4 шага |

### Финансовая логика

- `income`, `housing`, `credit`, `creditMonths`, `capital` — из `ss_finance`
- `savings = income - housing - credit - ...расходы по конвертам`
- `savingsPct = income > 0 ? round((savings / income) × 100) : 0`
- Прогноз через `emoRate`: ежемесячное откладывание = `savings × (1 - emoRate)`

### Конверты

- Хранятся в `ss_envelopes` как `{ [categoryId]: [{ id, name, amount, items, type, period, source }] }`
- Категории: clothes, food, home, health, transport, leisure, other
- Набор из каталога добавляется через SetDetail → попадает в нужную категорию
- Позиции из инвентаря (isExtra=false) отображаются отдельно

### Состояние

```
emoRate       — 0.04 | 0.05 | 0.07 | 0.10
envelopes     — объект из localStorage
editMode      — режим редактирования конвертов
finance       — { income, housing, credit, creditMonths, capital }
finOpen       — модал редактирования финансов
showSpotlight
```

### localStorage

| Ключ | Операция | Содержимое |
|------|----------|------------|
| `ss_finance` | read/write | `{ income, housing, credit, creditMonths, capital, updatedAt }` |
| `ss_envelopes` | read/write | `{ [catId]: [ envelopeEntry ] }` |
| `ss_inventory_extra` | read | для отображения личных позиций |

### Spotlight шаги

| ID | Кнопка (pulse) | Элемент |
|----|----------------|---------|
| `sp-tiles` | — | финансовые плитки |
| `sp-finance` | `sp-btn-finance` | блок финансов |
| `sp-emo` | `sp-btn-emo` | блок EmoSpend |
| `sp-envelopes` | `sp-btn-envelopes` | блок конвертов |

---

## 6. SetDetail — Детали набора

**Маршрут:** `/set/:id`
**Файл:** `app/src/pages/SetDetail.jsx`
**Доступ:** Публичный (через `PublicLayout`).

### Интерфейс

| Секция | ID | Описание |
|--------|-----|----------|
| Breadcrumb | — | Каталог › Название набора |
| Hero-карточка | `sp-sd-hero` | Бейджи, название + `?`, описание, статистика (₽/мес, кол-во пользователей), кнопки действий |
| Таблица позиций | `sp-sd-items` | Масштаб, таблица с позициями, inline-редактирование, итоговая строка, аккордеон «Как считается» |
| Автор | — | Аватар, имя, биография, кнопка «Все наборы» |
| О наборе | — | Заголовок и абзацы описания |
| Статьи автора | — | Список статей с тегами и просмотрами |
| Статьи сообщества | — | Аналогично |
| Комментарии | — | Сортировка, список, форма ввода |
| SpotlightTour | — | 2 шага |

### Ключевая логика

**Масштаб (scale):**
- Базовый: `×1.0`; диапазон: `0.25–5.0`; шаг ускоряется при удержании
- Все цены и количества умножаются на `scale`
- Если scale ≠ 1.0 или qty/price/period изменены → показывается бейдж «Под меня»

**Добавление в конверт:**
1. Рассчитывает `totalMonthly` (амортизация всех позиций)
2. Записывает в `ss_envelopes[category]`
3. Создаёт позиции в `ss_inventory_extra`:
   - Food → `consumable` с `dailyUse`
   - Остальные → `wear` с `purchases` (всё с `paused: true`)
4. После добавления → редирект на `/inventory` через 800мс

**Удаление:** удаляет только `paused=true` позиции этого набора из инвентаря и конверт из `ss_envelopes`.

### Состояние

```
items         — массив позиций (редактируемый)
added         — добавлен ли набор в конверт
liked/disliked
editMode      — режим редактирования таблицы
scale         — множитель
expOpen       — аккордеон «Как считается»
showAllArticles, cmtExpanded
cmtSort       — 'popular' | 'new'
cmtText       — ввод комментария
likes/dislikes — реакции на комментарии
showSpotlight
```

### localStorage

| Ключ | Операция | Содержимое |
|------|----------|------------|
| `ss_envelopes` | write | добавление набора в конверт |
| `ss_inventory_extra` | write | позиции набора в инвентарь |
| `ss_catalog_likes` | read/write | лайки |
| `ss_catalog_dislikes` | read/write | дизлайки |

### Spotlight шаги

| ID | Кнопка (pulse) | Элемент |
|----|----------------|---------|
| `sp-sd-hero` | `sp-sd-add` | hero-карточка |
| `sp-sd-items` | — | таблица позиций |

---

## 7. Article — Статья

**Маршрут:** `/article/:id`
**Файл:** `app/src/pages/Article.jsx`
**Доступ:** Публичный (через `PublicLayout`).

### Интерфейс

| Секция | Описание |
|--------|----------|
| Breadcrumb | Лента › Название статьи |
| Hero-карточка | Бейджи, заголовок, краткое описание, статистика (просмотры, ~время чтения), автор, кнопки лайк/дизлайк/подписка |
| Контент | Markdown-рендеринг (параграфы, h2, blockquote, изображения) |
| Прикреплённый набор | Карточка набора (если есть) |
| Комментарии | Сортировка, список с реакциями, форма ввода |
| Toast | Уведомление об операции |
| Confirm-модал | Подтверждение удаления |
| Add-to-set модал | Добавить статью в свой набор |

### Логика для автора

- Если `ss_my_article_ids` содержит `article.id` → показывается кнопка «Редактировать» и «Удалить»
- Удаление: удаляет из `ss_account_articles` и `ss_my_article_ids`

### Состояние

```
liked, disliked, following
commentSort    — 'new' | 'top'
commentInput
likedComments, dislikedComments — Sets
showAll        — показать все комментарии
toast
confirmDelete  — модал подтверждения удаления
showAddToSet   — модал добавления в набор
```

### localStorage

| Ключ | Операция | Содержимое |
|------|----------|------------|
| `ss_article_sets` | read/write | `{ [articleId]: [setIds] }` |
| `ss_account_articles` | read/write | массив статей аккаунта |
| `ss_my_article_ids` | read/write | массив ID своих статей |

---

## 8. CreateSet — Создать набор

**Маршрут:** `/create-set`
**Файл:** `app/src/pages/CreateSet.jsx`
**Доступ:** Требует авторизации.

### Интерфейс

| Секция | ID | Описание |
|--------|-----|----------|
| Toolbar | `sp-cs-toolbar` | Заголовок «Создать набор» + кнопка `?` + «Предпросмотр» + «Опубликовать» |
| Метаданные | `sp-cs-meta` | Категория (чипы), видимость (Публичный / Приватный) |
| Название | — | Textarea |
| Краткое описание | — | Textarea (видно в карточке) |
| Позиции набора | `sp-cs-items` | Список добавленных позиций + форма добавления новой |
| Подробное описание | — | Textarea |
| Предпросмотр | — | Карточка набора + таблица позиций (как на SetDetail) |
| SpotlightTour | — | 3 шага |

### Форма добавления позиции (AddItemForm)

Поля зависят от типа:
- **consumable**: название, цена, объём, единица, суточный расход, дата покупки
- **wear**: название, цена, срок службы (в неделях), дата покупки, ожидаемая цена

### Состояние

```
showSpotlight
preview       — режим предпросмотра
title, shortDesc, introText
category      — выбранная категория
isPublic      — видимость
items         — массив позиций набора
showForm      — показать форму добавления
totalPerMonth — расчётная сумма ₽/мес
```

### Spotlight шаги

| ID | Кнопка (pulse) | Элемент |
|----|----------------|---------|
| `sp-cs-toolbar` | `sp-cs-publish` | панель инструментов |
| `sp-cs-meta` | — | метаданные |
| `sp-cs-items` | — | позиции набора |

---

## 9. CreateArticle — Написать статью

**Маршрут:** `/create-article`
**Файл:** `app/src/pages/CreateArticle.jsx`
**Доступ:** Требует авторизации.

### Интерфейс

| Секция | ID | Описание |
|--------|-----|----------|
| Toolbar | `sp-ca-toolbar` | Кнопки форматирования (B/I/H2/«») + счётчик слов + кнопка `?` + «Предпросмотр» + «Опубликовать» |
| Метаданные | `sp-ca-meta` | Категория, видимость, прикреплённый набор (picker) |
| Заголовок | — | Textarea |
| Краткое описание | — | Textarea (анонс для ленты) |
| Текст статьи | — | Большое textarea с поддержкой Markdown |
| Счётчик символов | — | Предупреждение при > 10 000 символов |
| Фотографии | `sp-ca-photo` | Drag-and-drop загрузка, галерея превью, копирование кода вставки |
| Предпросмотр | — | Hero-карточка + рендеренный контент + прикреплённый набор |
| SpotlightTour | — | 3 шага |

### Markdown-поддержка

- `**текст**` → **жирный**
- `*текст*` → *курсив*
- `## Заголовок` → h2
- `> Цитата` → blockquote
- `![alt](photo-id)` → изображение из загруженных фото

### Состояние

```
showSpotlight
title, excerpt, body
category, isPublic
preview
images         — [{ id, name, url }]
dragOver       — drag state
toast
linkedSet      — выбранный набор
setPickerOpen  — picker набора
```

### Spotlight шаги

| ID | Кнопка (pulse) | Элемент |
|----|----------------|---------|
| `sp-ca-toolbar` | `sp-ca-publish` | тулбар |
| `sp-ca-meta` | — | метаданные |
| `sp-ca-photo` | — | блок фотографий |

---

## 10. Account — Аккаунт

**Маршрут:** `/account`
**Файл:** `app/src/pages/Account.jsx`
**Доступ:** Требует авторизации.

### Интерфейс

| Секция | ID | Описание |
|--------|-----|----------|
| Шапка профиля | `sp-acc-header` | Аватар (инициалы) + кнопка `?` + имя, @username, биография, дата регистрации, счётчик подписчиков. Кнопка «Редактировать» |
| Табы | `sp-acc-tabs` | Статьи / Наборы / Подписки |
| Панель статей | — | Список карточек + кнопка «Написать статью» |
| Панель наборов | — | Сетка карточек + кнопка «Создать набор» |
| Панель подписок | — | Список пользователей |
| Редактирование | `sp-acc-edit` | Поля: отображаемое имя, биография; кнопка «Сохранить» |
| Confirm-модалы | — | Удаление статьи / набора |
| Toast | — | Уведомление |
| SpotlightTour | — | 2 шага |

### Пустые состояния (SVG-иконки)

- Нет статей: иконка карандаша + «Ещё не написали ни одной статьи»
- Нет наборов: иконка сетки + «Ещё не создали ни одного набора»
- Нет подписок: иконка добавления пользователя + «Нет подписок»

### Состояние

```
tab            — 'articles' | 'sets' | 'subs'
editing        — режим редактирования профиля
profile        — { displayName, username, bio, joined, followers }
draft          — черновик редактируемого профиля
articles       — массив статей
sets           — массив наборов
subs           — массив подписок
confirmArticle, confirmSet — id для подтверждения удаления
showSpotlight
toast
```

### localStorage

| Ключ | Операция | Содержимое |
|------|----------|------------|
| `ss_account_profile` | read/write | `{ displayName, username, bio, joined, followers }` |
| `ss_account_articles` | read/write | массив статей |
| `ss_account_sets` | read/write | массив наборов |
| `ss_account_subs` | read/write | массив подписок |
| `ss_my_article_ids` | read/write | при удалении статьи |

### Spotlight шаги

| ID | Кнопка (pulse) | Элемент |
|----|----------------|---------|
| `sp-acc-header` | — | шапка профиля |
| `sp-acc-tabs` | `sp-acc-edit` | панель табов |

---

## 11. Settings — Настройки

**Маршрут:** `/settings`
**Файл:** `app/src/pages/Settings.jsx`
**Доступ:** Требует авторизации.

### Интерфейс

| Секция | ID | Описание |
|--------|-----|----------|
| Внешний вид | `sp-settings-appear` | Переключатель тёмной темы (через AppContext) |
| Уведомления | `sp-settings-notifs` | Тогглы: новые наборы, статьи подписок, напоминания (инвентарь) |
| Региональные | — | Выбор часового пояса |
| Конфиденциальность | `sp-settings-privacy` | Видимость: наборы, статьи, профиль (Публично / Подписчики / Только я) |
| Аккаунт и безопасность | — | Email, пароль, подключение соцсетей (Яндекс, ВКонтакте) |
| Зона опасности | — | Выйти из аккаунта, Удалить аккаунт |
| Модалы | — | Смена email, смена пароля, подтверждение выхода/удаления |
| SpotlightTour | — | 3 шага |

### Состояние

```
showSpotlight
notifs         — { newSets, articles, reminders }
timezone       — строка таймзоны
privacy        — { sets, articles, profile }
currentEmail
socials        — { yandex, vk }
emailModal, passModal, logoutModal, deleteModal
```

### localStorage

| Ключ | Операция | Содержимое |
|------|----------|------------|
| `ss_email` | read | текущий email |
| `ss_timezone` | write | выбранный таймзон |
| `ss_auth` | write | `''` при выходе |
| `ss_username` | write | `''` при выходе |

### Spotlight шаги

| ID | Элемент |
|----|---------|
| `sp-settings-appear` | внешний вид |
| `sp-settings-notifs` | уведомления |
| `sp-settings-privacy` | конфиденциальность |

---

## 12. Notifications — Уведомления

**Маршрут:** `/notifications`
**Файл:** `app/src/pages/Notifications.jsx`
**Доступ:** Требует авторизации.

### Интерфейс

| Секция | ID | Описание |
|--------|-----|----------|
| Шапка | `sp-notif-header` | Заголовок + кнопка «Отметить все прочитанными» (`sp-notif-mark`) + кнопка `?` |
| Фильтры | `sp-notif-filters` | Табы: Все / Подписки / Ответы / Напоминания |
| Список | `sp-notif-list` | Секция непрочитанных + секция прочитанных |
| Пустое состояние | — | Иконка + текст |
| SpotlightTour | — | 3 шага |

### Типы уведомлений

- **subscription** — новые статьи / наборы от подписок → `/feed`
- **reply** — ответы на комментарии → `/article/:id`
- **reminder** — напоминание о покупке из инвентаря → `/inventory`
- **system** — системные сообщения

### Состояние

```
readIds        — Set<id> (из ss_notif_read)
filter         — 'all' | 'subscriptions' | 'replies' | 'reminders'
showSpotlight
```

### localStorage

| Ключ | Операция | Содержимое |
|------|----------|------------|
| `ss_notif_read` | read/write | JSON массив прочитанных ID |

### Custom events

- `notif-update` — диспатчится после изменения `readIds`, слушается в Sidebar для обновления счётчика

### Spotlight шаги

| ID | Кнопка (pulse) | Элемент |
|----|----------------|---------|
| `sp-notif-header` | `sp-notif-mark` | шапка |
| `sp-notif-filters` | — | фильтры |
| `sp-notif-list` | — | список |

---

## 13. AuthorPage — Профиль автора

**Маршрут:** `/author/:id`
**Файл:** `app/src/pages/AuthorPage.jsx`
**Доступ:** Публичный. Данные передаются через `location.state`.

### Интерфейс

| Секция | Описание |
|--------|----------|
| Кнопка «Назад» | `navigate(-1)` |
| Шапка | Аватар, имя, @handle, биография, счётчики (подписчиков, статей, наборов), кнопка «Подписаться» |
| Табы | Статьи / Наборы |
| Список статей | Карточки с тегом, заголовком, просмотрами |
| Сетка наборов | Карточки наборов |
| Спецсостояния | «Пользователь заблокирован» (анонимный), «Аккаунт удалён» (ghost) |

### Состояние

```
tab        — 'articles' | 'sets'
following  — подписка
```

---

## 14. Компоненты

### Layout

**Файл:** `app/src/components/Layout.jsx`
Обёртка для всех авторизованных страниц. Проверяет `ss_auth`, при отсутствии — редирект на `/`. Рендерит `<Sidebar>` + `<main>children</main>`.

### Sidebar

**Файл:** `app/src/components/Sidebar.jsx`
Боковая навигация. Сворачивается (240px → 56px) через `AppContext.collapsed`.

| Элемент | Маршрут |
|---------|---------|
| Логотип | `/` |
| Профиль | `/profile` |
| Инвентарь | `/inventory` |
| Лента | `/feed` |
| Каталог | `/catalog` |
| Уведомления | `/notifications` (с бейджем непрочитанных) |
| Настройки | `/settings` |
| Карточка пользователя | `/account` |
| Кнопка темы | toggleTheme() |

Счётчик непрочитанных: `ALL_NOTIFS.length - readIds.size`. Слушает `storage` и `notif-update` events.

### PublicLayout

**Файл:** `app/src/components/PublicLayout.jsx`
Для страниц без обязательной авторизации (SetDetail, Article). Если `ss_auth` → рендерит обычный `<Layout>`. Иначе → гостевая шапка с кнопками «Войти» / «Зарегистрироваться».

### SpotlightTour

**Файл:** `app/src/components/SpotlightTour.jsx`

**Props:**
- `steps: Array<{ targetId, btnId?, title, desc }>` — шаги тура
- `onClose: () => void` — колбэк закрытия

**Логика:**
1. `scrollIntoView({ block: 'center' })` на целевой элемент
2. Через 380мс берёт `getBoundingClientRect()`
3. Рисует highlight-overlay (`box-shadow: 0 0 0 9999px rgba(0,0,0,0.58)`)
4. Высота highlight ограничена 45% viewport (чтобы длинные списки не перекрывали тултип)
5. Тултип позиционируется выше или ниже highlight в зависимости от доступного места
6. Если `btnId` — добавляет класс `spotlight-pulse` на кнопку (анимация переливания)

**HelpButton (именованный экспорт):**
```jsx
<HelpButton seenKey="ss_spl_pagename" onOpen={() => setShowSpotlight(true)} />
```
- При первом нажатии записывает `localStorage.setItem(seenKey, '1')`
- Новому пользователю: класс `help-btn--new` → пульсирующая анимация приглашения

---

## 15. Контекст и данные

### AppContext

**Файл:** `app/src/context/AppContext.jsx`

```js
const { dark, collapsed, username, toggleTheme, toggleSidebar, setUsername } = useApp()
```

| Переменная | localStorage ключ | Описание |
|------------|------------------|----------|
| `dark` | `ss_theme` | тёмная тема (`body.dark`) |
| `collapsed` | `ss_sidebar` | свёрнутый сайдбар |
| `username` | `ss_username` | имя пользователя |

### mock.js

**Файл:** `app/src/data/mock.js`

| Экспорт | Используется в |
|---------|---------------|
| `feedItems` | Feed |
| `feedAuthors` | Feed |
| `catalogSets` | Catalog, SetDetail |
| `setDetails` | SetDetail |
| `inventoryGroups` | Inventory, Profile |
| `articles` | Article |
| `notifications` | Notifications, Sidebar |

---

## 16. Таблица localStorage

| Ключ | Тип | Кто пишет | Кто читает |
|------|-----|-----------|-----------|
| `ss_auth` | `'true'` / `''` | Landing, Settings | Layout, PublicLayout, Catalog |
| `ss_username` | строка | Landing, Settings | AppContext, Sidebar |
| `ss_user_type` | `'full'` / `'empty'` | Landing | (не используется активно) |
| `ss_theme` | `'dark'` / `''` | AppContext | AppContext |
| `ss_sidebar` | `'1'` / `''` | AppContext | AppContext |
| `ss_tour_welcome` | `'1'` | Feed | Feed |
| `ss_spl_*` | `'1'` | HelpButton | HelpButton |
| `ss_catalog_likes` | JSON array | Catalog, SetDetail | Catalog, SetDetail |
| `ss_catalog_dislikes` | JSON array | SetDetail | SetDetail |
| `ss_envelopes` | JSON object | SetDetail, Profile | Profile |
| `ss_inventory_extra` | JSON array | SetDetail, Inventory | Inventory, Profile |
| `ss_finance` | JSON object | Profile | Profile |
| `ss_notif_read` | JSON array | Notifications | Notifications, Sidebar |
| `ss_account_profile` | JSON object | Account | Account |
| `ss_account_articles` | JSON array | Account, Article | Account |
| `ss_account_sets` | JSON array | Account | Account |
| `ss_account_subs` | JSON array | Account | Account |
| `ss_my_article_ids` | JSON array | Account, Article | Article |
| `ss_article_sets` | JSON object | Article | Article |
| `ss_timezone` | строка | Settings | Settings |
| `ss_email` | строка | (Auth) | Settings |

---

## Дизайн-система (кратко)

| Параметр | Значение |
|----------|----------|
| Шрифт | Geist (sans) + Geist Mono (числа) |
| Фон (light) | `#EEEDE9` |
| Surface (light) | `#FFFFFF` |
| Акцент | `#4E8268` (light) / `#6AAF8E` (dark) |
| Фон (dark) | `#141412` |
| Surface (dark) | `#1E1D1B` |
| Border-radius | `--r: 16px`, `--r-sm: 10px` |
| Статус ok | `#5E9478` |
| Статус soon | `#B08840` |
| Статус urgent | `#B85555` |
| Статус over | `#7B5EA7` |
| Ширина страниц | узкая: 720px / стандарт: 860px / широкая: 1060px |
