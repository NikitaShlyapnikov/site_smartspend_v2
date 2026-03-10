# SmartSpend v2 — Документация проекта

## Стек и сборка

| Параметр | Значение |
|---|---|
| Фреймворк | React 18 + Vite |
| Роутинг | HashRouter (react-router-dom v6) |
| Стили | Один файл `app/src/index.css` (~3900 строк) |
| Данные | Мок-данные в `app/src/data/mock.js` |
| Сборка | `npm run build` в папке `app/` → `app/dist/` |
| Шрифты | Geist (текст) + Geist Mono (числа) — Google Fonts |

---

## Структура файлов

```
site_smartspend_v2/
├── app/
│   ├── src/
│   │   ├── App.jsx                  — корневой роутер
│   │   ├── index.css                — все стили (дизайн-система)
│   │   ├── main.jsx                 — точка входа
│   │   ├── context/
│   │   │   └── AppContext.jsx       — глобальный контекст (тема, сайдбар, username)
│   │   ├── components/
│   │   │   ├── Layout.jsx           — обёртка app-страниц
│   │   │   ├── Sidebar.jsx          — десктопный сайдбар
│   │   │   └── MobileNav.jsx        — мобильная навигация (топ + боттом)
│   │   ├── data/
│   │   │   └── mock.js              — все мок-данные
│   │   └── pages/
│   │       ├── Landing.jsx          — лендинг + квиз + авторизация
│   │       ├── Feed.jsx             — лента статей и наборов
│   │       ├── Catalog.jsx          — каталог наборов
│   │       ├── SetDetail.jsx        — детали набора
│   │       ├── Inventory.jsx        — инвентарь вещей
│   │       ├── Profile.jsx          — финансовый профиль
│   │       ├── Article.jsx          — просмотр статьи
│   │       ├── AuthorPage.jsx       — профиль автора
│   │       ├── CreateSet.jsx        — создание набора
│   │       ├── CreateArticle.jsx    — редактор статьи
│   │       ├── Notifications.jsx    — уведомления
│   │       ├── Settings.jsx         — настройки
│   │       └── Account.jsx          — аккаунт пользователя
├── raw_sample_page/                  — HTML-прототипы (только референс)
└── DOCUMENTATION.md                  — этот файл
```

---

## Маршруты (HashRouter)

| URL | Компонент | Тип |
|---|---|---|
| `/` | Landing | публичный |
| `/feed` | Feed | защищённый |
| `/catalog` | Catalog | защищённый |
| `/inventory` | Inventory | защищённый |
| `/profile` | Profile | защищённый |
| `/settings` | Settings | защищённый |
| `/account` | Account | защищённый |
| `/notifications` | Notifications | защищённый |
| `/set/:id` | SetDetail | защищённый |
| `/article/:id` | Article | защищённый |
| `/create-set` | CreateSet | защищённый |
| `/create-article` | CreateArticle | защищённый |
| `/author/:id` | AuthorPage | защищённый |
| `/*` | → Navigate `/` | catch-all |

**Защита маршрутов:** `Layout.jsx` проверяет `localStorage.getItem('ss_auth') === 'true'`. Если нет — редиректит на `/?auth=1`, что автоматически открывает модал авторизации.

---

## Дизайн-система (CSS переменные)

```css
/* Светлая тема (по умолчанию) */
--bg: #EEEDE9          /* фон страницы */
--surface: #FFFFFF     /* карточки */
--surface-2: #F6F5F2   /* вложенные элементы */
--surface-3: #EFEEE9   /* ещё глубже */
--border: rgba(0,0,0,0.07)
--text: #1A1916
--text-2: #6B6860      /* вторичный текст */
--text-3: #AEACA5      /* плейсхолдеры, подсказки */
--accent-green: #4E8268
--accent-green-light: #F2F7F4
--accent-green-border: #C8DDD3
--r: 16px              /* border-radius карточек */
--r-sm: 10px           /* кнопки, инпуты */

/* Тёмная тема (body.dark) */
--bg: #141412
--surface: #1E1D1B
--surface-2: #252420
--surface-3: #2C2B27
--accent-green: #6AAF8E
--accent-green-light: #1A2820
--accent-green-border: #2A4035

/* Статусы инвентаря */
--ok: #5E9478          /* норма */
--soon: #B08840        /* скоро */
--urgent: #B85555      /* срочно */
--over: #7B5EA7        /* истёк */
```

**Тёмная тема** активируется добавлением класса `dark` на `body`. Управляется через `AppContext.toggleTheme()`.

---

## Глобальный контекст — AppContext

**Файл:** `src/context/AppContext.jsx`

### Состояние

| Переменная | Тип | localStorage ключ | Описание |
|---|---|---|---|
| `dark` | boolean | `ss_theme` ('dark'/'light') | Тёмная тема |
| `collapsed` | boolean | `ss_sidebar` ('true'/'false') | Сайдбар свёрнут |
| `username` | string | `ss_username` | Имя пользователя |

### API контекста

```js
const { dark, collapsed, username, toggleTheme, toggleSidebar, setUsername } = useApp()
```

| Функция | Действие |
|---|---|
| `toggleTheme()` | Инвертирует `dark`, обновляет `body.classList` и `ss_theme` |
| `toggleSidebar()` | Инвертирует `collapsed`, обновляет `ss_sidebar` |
| `setUsername(name)` | Обновляет `username` в state |

---

## Компоненты навигации

### Layout.jsx

Оборачивает все защищённые страницы. Рендерит `<Sidebar>` и `<MobileNav>` рядом с `children`.

**Логика:**
1. При монтировании читает `ss_auth`. Если нет — `navigate('/?auth=1', { replace: true })`
2. Добавляет класс `app-body` на `body`
3. Синхронизирует класс `sidebar-collapsed` с состоянием `collapsed` из контекста

```jsx
<Layout>
  <main>...</main>   {/* контент страницы */}
</Layout>
```

### Sidebar.jsx

Десктопный сайдбар (240px → 56px в collapsed-режиме).

**Состояние:**
- `unreadCount: number` — количество непрочитанных уведомлений

**Вычисление unreadCount:**
```js
function getUnreadCount() {
  const readIds = JSON.parse(localStorage.getItem('ss_notif_read') || '[]')
  return notifications.filter(n => n.unread && !readIds.includes(n.id)).length
}
```

**События (listeners):**
- `window: 'notif-update'` — пересчитывает `unreadCount` (диспатчится из Notifications.jsx)
- `window: 'storage'` — синхронизация между вкладками

**Значок уведомлений:**
- Expanded: `<span className="nav-notif-badge">{unreadCount}</span>` рядом с лейблом
- Collapsed: `<span className="nav-notif-dot" />` на иконке

**Порядок пунктов меню (сверху):**
Профиль → Инвентарь → Лента → Каталог

**Снизу:** переключатель темы, аватар пользователя

### MobileNav.jsx

Мобильная навигация: топ-бар + нижний nav.

**Топ-бар:**
- Логотип слева
- Иконка уведомлений справа (с `mobile-notif-dot` если есть непрочитанные) → `/notifications`
- Аватар пользователя → `/account`

**Нижний nav (5 пунктов):**
Профиль → Инвентарь → Лента → Каталог → Настройки

**CSS grid:** `repeat(5, 1fr)`

---

## Мок-данные — mock.js

**Файл:** `src/data/mock.js`

### feedAuthors

```js
{
  a1: { name, initials, color, following },
  a2: { name, initials, color, following },
  a3: { name, initials, color, following },
  a4: { name, initials, color, following },
  anon: {
    name: 'Анонимный автор', initials: '?', color: '#A0A0A0',
    type: 'anonymous',   // специальный тип
    handle, followers: '—', articles: 5, sets: 2, desc
  },
  ghost: {
    name: 'Привидение', initials: '?', color: '#B0B0B0',
    type: 'deleted',     // специальный тип
    handle, followers: '—', articles: 0, sets: 0, desc
  }
}
```

### feedItems (array, 11+ элементов)

```js
{
  id: string,
  type: 'article' | 'coupon',
  ts: number,          // timestamp для сортировки
  pop: number,         // популярность
  title: string,
  preview: string,
  authorId: string,    // ключ в feedAuthors
  time: string,        // "2 часа назад"
  views: number,
  likes: number,
  comments: number,
  setLink: { title, color } | null,
  category: string
}
```

### catalogSets (array, 14 элементов)

```js
{
  id: string,           // 's1'–'s14'
  source: 'ss' | 'community' | 'own',
  category: string,
  type: 'base' | 'extra',
  color: string,        // цвет акцента
  title: string,
  desc: string,
  amount: number,       // бюджет набора
  amountLabel: string,  // 'в месяц' / 'разово' / etc
  items: string[],      // краткий список
  more: number,         // сколько ещё позиций
  users: number,
  added: string,        // дата
  articles: number,
  private?: boolean
}
```

### setDetails (object)

Ключи: `s1`–`s14`. Расширенные данные для SetDetail.

```js
{
  ...catalogSet,
  author: { name, initials, bio },
  about: { title, paragraphs: string[] },
  items: [
    {
      id, name, note,
      qty: number,
      basePrice: number,
      unit: string,          // 'шт', 'уп', 'мл'
      period: number         // лет (для wear) или 0 (consumable)
    }
  ],
  authorArticles: article[],
  recArticles: article[],
  comments: comment[]
}
```

### inventoryGroups (array, 6 групп)

```js
{
  id: string,
  name: string,
  color: string,
  setCategories: string[],  // категории каталога для этой группы
  items: [
    // Consumable (расходник):
    {
      id, name, type: 'consumable',
      price: number,
      qty: number,           // текущее количество
      unit: string,
      dailyUse: number,      // расход в день
      lastBought: string     // ISO дата
    },
    // Wear (одежда/обувь):
    {
      id, name, type: 'wear',
      price: number,
      wearLifeWeeks: number, // срок службы в неделях
      purchaseDate: string   // ISO дата
    }
  ]
}
```

### articles (array)

```js
{
  id: string,
  title: string,
  preview: string,
  catLabel: string,
  articleType: string,
  author: string, authorColor, authorInitials, authorBio,
  authorSetLink: { id, title } | null,
  views, likes, date, following: boolean,
  content: [
    { type: 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'note' | 'highlight' | 'key-points', text | items }
  ],
  comments: comment[],
  products: product[],
  setLink: { id, title, color } | null
}
```

### notifications (array)

```js
{
  id: string,
  type: 'sub' | 'reply' | 'reminder' | 'system',
  title: string,
  desc: string,
  time: string,
  unread: boolean,
  author?: { name, initials, color }
}
```

---

## Страницы — детальное описание

### Landing.jsx

**Публичная страница.** Содержит два вложенных компонента-модала.

#### Состояние

```js
const [quizOpen, setQuizOpen] = useState(false)
const [authOpen, setAuthOpen] = useState(false)
const [authTab, setAuthTab] = useState('login') // 'login' | 'register'
```

#### Логика при монтировании

```js
// Уже авторизован → в ленту
if (localStorage.getItem('ss_auth') === 'true') navigate('/feed', { replace: true })

// Редирект с защищённой страницы → открыть модал
if (searchParams.get('auth') === '1') setAuthOpen(true)
```

#### Флоу авторизации

```
QuizModal → onFinish(name) ──┐
AuthModal → onAuth(name)  ──┤→ handleAuth(name):
                              │   ss_auth = 'true'
                              │   ss_username = name
                              │   setUsername(name)
                              └→  navigate('/feed')
```

#### QuizModal

4 шага: 3 вопроса с вариантами + поле имени. Прогресс-бар. Кнопка «Пропустить».

#### AuthModal

Вкладки «Войти» / «Регистрация». Социальные кнопки (Яндекс ID, VK Max). Email + пароль. Имитирует запрос 700ms задержкой.

---

### Feed.jsx

**Лента контента.** Фильтры, сортировка, карточки.

#### Состояние

```js
const [tab, setTab] = useState('all')         // 'all' | 'articles' | 'coupons'
const [mode, setMode] = useState(null)         // 'unread' | 'subscriptions' | 'my-sets' | 'liked'
const [cat, setCat] = useState('all')          // категория
const [sort, setSort] = useState('newest')     // 'newest' | 'popular_day' | 'popular_week' | 'popular_all'
const [readIds, setReadIds] = useState(new Set())
const [likedIds, setLikedIds] = useState(new Set())
```

#### Компонент AuthorChip

Рендерит имя автора в карточке. Обрабатывает 3 случая:

| `author.type` | Отображение | Клик |
|---|---|---|
| `'anonymous'` | 🔒 *Анонимный автор* (серый курсив) | → `/author/anon` |
| `'deleted'` | 👻 *Привидение* (серый курсив) | → `/author/ghost` |
| обычный | Цветной аватар + имя | → `/author/:id` |

Клик вызывает `e.stopPropagation()` чтобы не срабатывал клик по карточке.

#### Фильтрация

```js
items
  .filter(tab)       // тип контента
  .filter(mode)      // режим (непрочитанные, подписки, etc)
  .filter(cat)       // категория
  .sort(sort)        // сортировка
```

---

### Catalog.jsx

**Каталог наборов.**

#### Состояние

```js
const [cat, setCat] = useState('all')           // категория
const [typeFilter, setTypeFilter] = useState('all')     // 'all' | 'base' | 'extra'
const [sourceFilter, setSourceFilter] = useState('all') // 'all' | 'ss' | 'community' | 'own' | 'liked'
const [sortFilter, setSortFilter] = useState('popular')
const [likedSets, setLikedSets] = useState(new Set())
```

#### localStorage

- `ss_catalog_likes` — JSON-массив id понравившихся наборов

#### Фильтр «Понравившиеся»

Находится в строке source-фильтров (рядом с SmartSpend / Сообщество / Мои). При `sourceFilter === 'liked'` игнорирует остальные фильтры и показывает только liked наборы.

---

### SetDetail.jsx

**Детали набора.** Самая функциональная страница.

#### Состояние

```js
const [items, setItems] = useState(...)     // копия items из setDetails[id]
const [added, setAdded] = useState(false)   // добавлен в конверт
const [liked, setLiked] = useState(...)     // из ss_catalog_likes
const [editMode, setEditMode] = useState(false)
const [scale, setScale] = useState(1)       // множитель бюджета (0.25–5)
const [expOpen, setExpOpen] = useState(false)
const [showAllArticles, setShowAllArticles] = useState(false)
const [cmtExpanded, setCmtExpanded] = useState(false)
const [cmtSort, setCmtSort] = useState('popular')
const [cmtText, setCmtText] = useState('')
const [likes, setLikes] = useState({})
```

#### handleAdd() — добавление набора

```js
// 1. Добавляет набор в ss_envelopes (профиль)
const envelopes = JSON.parse(localStorage.getItem('ss_envelopes') || '{}')
const cat = set.category  // категория набора
envelopes[cat] = [...(envelopes[cat] || []), { id, title, color, source, items }]
localStorage.setItem('ss_envelopes', JSON.stringify(envelopes))

// 2. Добавляет wear-items в ss_inventory_extra
const inventoryItems = items
  .filter(i => i.period > 0)
  .map(i => ({ id, name, type: 'wear', price, setId: id, isExtra: true, ... }))
localStorage.setItem('ss_inventory_extra', JSON.stringify(inventoryItems))

// 3. navigate('/inventory')
```

#### Scale (масштабирование бюджета)

Hold-кнопки +/- с ускорением: первые 400ms медленно, затем быстро. Диапазон 0.25–5×.

#### Лайк набора

```js
// toggleLike(e):
const set = new Set(JSON.parse(localStorage.getItem('ss_catalog_likes') || '[]'))
next ? set.add(id) : set.delete(id)
localStorage.setItem('ss_catalog_likes', JSON.stringify([...set]))
```

---

### Inventory.jsx

**Инвентарь вещей.** Управление расходниками и одеждой.

#### Состояние

```js
const [items, setItems] = useState([])      // все items (mock + extra)
const [currentGroupId, setCurrentGroupId] = useState(string)
const [editingItemId, setEditingItemId] = useState(null)
const [showAddForm, setShowAddForm] = useState(false)
const [expandedGroupId, setExpandedGroupId] = useState(null)
// + поля формы добавления
```

#### localStorage

```js
// Чтение при инициализации:
const extra = JSON.parse(localStorage.getItem('ss_inventory_extra') || '[]')
// items = [...mockItems, ...extra]

// Запись (syncExtra):
function syncExtra(allItems) {
  const extra = allItems.filter(i => i.isExtra)
  localStorage.setItem('ss_inventory_extra', JSON.stringify(extra))
}
```

#### getItemInfo(item) — расчёт статуса

```js
// consumable:
const daysLeft = (qty / dailyUse)   // дней осталось
const pct = daysLeft / normalDays   // процент от нормы

// wear:
const daysPassed = diff(today, purchaseDate)
const totalDays = wearLifeWeeks * 7
const pct = 1 - daysPassed / totalDays

// Статус:
if (pct > 0.5)  → 'ok'      // зелёный
if (pct > 0.2)  → 'soon'    // жёлтый
if (pct > 0)    → 'urgent'  // красный
if (pct <= 0)   → 'over'    // фиолетовый (просрочен)
```

#### Кольцо прогресса (CSS)

```html
<div class="ring-wrap">
  <svg><circle class="ring-bg"/><circle class="ring-fill" style="stroke-dashoffset: ..."/></svg>
  <span class="ring-days">12 дн</span>
</div>
```

---

### Profile.jsx

**Финансовый профиль.** Наиболее сложная страница.

#### Состояние

```js
const [emoRate, setEmoRate] = useState(0.06)     // ставка EmoSpend (4–10%)
const [envelopes, setEnvelopes] = useState({})   // { category: [setObj, ...] }
const [editMode, setEditMode] = useState(false)
const [finOpen, setFinOpen] = useState(false)    // модал финансов
const [finance, setFinance] = useState({         // финансовые данные
  income: 0, housing: 0, credit: 0, food: 0,
  transport: 0, other: 0, capital: 0,
  coreRate: 0.10, safetyMonths: 6
})
```

#### localStorage

```js
ss_envelopes  // { [category]: [{ id, title, color, source, items }] }
ss_finance    // объект finance
ss_inventory_extra  // для вычисления ежемесячной стоимости "Личного"
```

#### Структура конвертов (Envelopes)

Категории из каталога образуют конверты в профиле. Каждый конверт содержит добавленные наборы. Пользователь может удалять наборы из конвертов прямо в профиле.

```
Профиль
├── Питание        ← конверт (категория)
│   ├── Smart-набор питания (ss)
│   └── Мой рацион (own)
├── Одежда и обувь ← конверт
│   └── Базовый гардероб (ss)
└── Личное         ← специальный конверт
    └── (items из ss_inventory_extra без setId)
```

#### "Личное" — специальный конверт

Показывает предметы из инвентаря, у которых нет `setId` (добавлены вручную без привязки к набору). Группируется по `GROUP_CATS` маппингу groupId → category.

#### calcTrajectory() — прогноз капитала

Считает 10-летний рост капитала с учётом:
- Ежемесячных отчислений в ядро
- Сложного процента (10% годовых по умолчанию)
- EmoSpend ставки

Результат рендерится на `<canvas>` в `ForecastChart`.

---

### Article.jsx

**Просмотр статьи.**

#### Состояние

```js
const [liked, setLiked] = useState(false)
const [following, setFollowing] = useState(article.following)
const [commentSort, setCommentSort] = useState('new')   // 'new' | 'top'
const [commentInput, setCommentInput] = useState('')
const [likedComments, setLikedComments] = useState(new Set())
const [showAll, setShowAll] = useState(false)
const [toast, setToast] = useState(null)
```

#### renderBlock(block) — рендер контента

Поддерживаемые типы блоков:
- `h2`, `h3` — заголовки
- `p` — параграф
- `ul`, `ol` — списки
- `note` — заметка (жёлтый блок)
- `highlight` — выделение (зелёный блок)
- `key-points` — ключевые тезисы (список с иконками)

---

### AuthorPage.jsx

**Профиль автора.** Три режима рендера в зависимости от типа автора.

#### Получение данных

Данные автора передаются через `location.state` при навигации:
```js
navigate(`/author/${authorId}`, { state: { ...author } })
```

#### Три режима

**1. Обычный автор** (нет `state.type`)
- Аватар с инициалами
- Статистика (подписчики, статьи, наборы)
- Вкладки «Статьи» / «Наборы»
- Кнопка «Подписаться» / «Отписаться»

**2. Анонимный автор** (`state.type === 'anonymous'`)
- Аватар с иконкой замка
- Заголовок «Анонимный пользователь»
- Блок «Профиль скрыт» вместо контента
- Кнопка «Подписаться» заблокирована

**3. Удалённый аккаунт** (`state.type === 'deleted'`)
- Аватар с иконкой привидения 👻
- Заголовок «Привидение»
- Баннер «Этот аккаунт был удалён»
- Вкладки показывают материалы с атрибуцией «Привидение»

---

### Notifications.jsx

**Уведомления.**

#### Состояние

```js
const [readIds, setReadIds] = useState(() =>
  new Set(JSON.parse(localStorage.getItem('ss_notif_read') || '[]'))
)
const [filter, setFilter] = useState('all')  // 'all' | 'subs' | 'replies' | 'reminders'
```

#### Синхронизация бейджа

```js
// После изменения readIds:
localStorage.setItem('ss_notif_read', JSON.stringify([...readIds]))
window.dispatchEvent(new Event('notif-update'))
// → Sidebar и MobileNav пересчитывают unreadCount
```

#### Типы уведомлений

| type | Фильтр | Иконка |
|---|---|---|
| `'sub'` | Подписки | аватар автора |
| `'reply'` | Ответы | иконка комментария |
| `'reminder'` | Напоминания | иконка колокольчика |
| `'system'` | все | иконка системы |

---

### Settings.jsx

**Настройки.**

#### Состояние

```js
const [notifs, setNotifs] = useState({ newSets, articles, reminders, weekly })  // true/false
const [privacy, setPrivacy] = useState({ sets, articles, profile })              // 'all'|'followers'|'only_me'
const [socials, setSocials] = useState({ yandex: false, vk: false })
const [emailModal, passModal, logoutModal, deleteModal] = useState(false)        // модалы
```

#### Опасная зона

```js
// Выход:
function logout() {
  localStorage.removeItem('ss_auth')
  localStorage.removeItem('ss_username')
  navigate('/', { replace: true })
}

// Удаление аккаунта (требует ввода слова "УДАЛИТЬ"):
function deleteAccount() {
  localStorage.clear()
  navigate('/', { replace: true })
}
```

---

### CreateSet.jsx

**Создание набора.**

#### Состояние

```js
const [preview, setPreview] = useState(false)
const [title, setTitle] = useState('')
const [shortDesc, setShortDesc] = useState('')
const [introText, setIntroText] = useState('')
const [category, setCategory] = useState('food')
const [isPublic, setIsPublic] = useState(true)
const [items, setItems] = useState([])
const [showForm, setShowForm] = useState(false)
```

Данные нигде не сохраняются (нет бэкенда). При «Опубликовать» → `navigate('/catalog')`.

---

### CreateArticle.jsx

**Редактор статьи.**

#### Состояние

```js
const [title, setTitle] = useState('')
const [excerpt, setExcerpt] = useState('')
const [body, setBody] = useState('')
const [category, setCategory] = useState('finance')
const [isPublic, setIsPublic] = useState(true)
const [preview, setPreview] = useState(false)
const [images, setImages] = useState([])      // { id, name, url (dataURL) }
const [dragOver, setDragOver] = useState(false)
const [toast, setToast] = useState(null)
const [linkedSet, setLinkedSet] = useState(null)
const [setPickerOpen, setSetPickerOpen] = useState(false)
const [wordCount, setWordCount] = useState(0)  // computed из body
```

#### Markdown → JSX (renderMarkdown)

Парсит `body` построчно:
- `## ...` → `<h2>`
- `### ...` → `<h3>`
- `**text**` → `<strong>`
- `*text*` → `<em>`
- `![alt](url)` → `<img>` из загруженных images
- пустая строка → разрыв параграфа

#### Вставка изображений

```js
// Загрузка: FileReader → dataURL → images[]
// Вставка в текст: ![название](img://id)
// При рендере: img:// заменяется на dataURL
```

#### Тулбар форматирования

| Кнопка | Вставляет |
|---|---|
| **B** | `**текст**` |
| *I* | `*текст*` |
| H2 | `## Заголовок` |
| H3 | `### Заголовок` |
| • | `- пункт` |
| 1. | `1. пункт` |

---

### Account.jsx

**Аккаунт пользователя.**

#### Состояние

```js
const [tab, setTab] = useState('comments')    // 'comments' | 'articles' | 'sets' | 'subs'
const [editing, setEditing] = useState(false)
const [profile, setProfile] = useState({ name, handle, bio, avatar })
const [draft, setDraft] = useState({ ...profile })
```

При сохранении `draft` становится `profile`. Не сохраняется в localStorage.

---

## Межкомпонентное взаимодействие

### localStorage как шина данных

```
SetDetail ──ss_catalog_likes──→ Catalog (отображает ♥)
SetDetail ──ss_envelopes──────→ Profile (конверты)
SetDetail ──ss_inventory_extra→ Inventory (wear-items)
Inventory ──ss_inventory_extra→ Profile (Личное)
Landing   ──ss_auth───────────→ Layout (guard)
Landing   ──ss_username───────→ AppContext → Sidebar (аватар)
Notifications ──ss_notif_read→ Sidebar/MobileNav (бейдж)
Settings  ──(clear all)───────→ Landing (logout)
```

### Window Events

```
Notifications.jsx
  → dispatchEvent('notif-update')
    → Sidebar.jsx (listener) → пересчитать unreadCount
    → MobileNav.jsx (listener) → пересчитать unreadCount
```

### React Router State

```
Feed.jsx / AuthorPage (любой)
  → navigate('/author/:id', { state: { ...author } })
    → AuthorPage.jsx читает location.state
      → выбирает режим рендера (обычный / анонимный / ghost)
```

### Context → Components

```
AppContext
  ├── dark → body.dark (CSS) → все цвета через переменные
  ├── collapsed → Sidebar ширина / иконки
  └── username → Sidebar аватар / MobileNav аватар
```

---

## Все localStorage ключи

| Ключ | Тип | Кто пишет | Кто читает |
|---|---|---|---|
| `ss_auth` | `'true'` | Landing, Settings | Layout, Landing |
| `ss_username` | string | Landing | AppContext, Sidebar |
| `ss_theme` | `'dark'`/`'light'` | AppContext | AppContext (init) |
| `ss_sidebar` | `'true'`/`'false'` | AppContext | AppContext (init) |
| `ss_catalog_likes` | JSON `string[]` | Catalog, SetDetail | Catalog, SetDetail |
| `ss_envelopes` | JSON `object` | SetDetail | Profile |
| `ss_inventory_extra` | JSON `Item[]` | Inventory, SetDetail | Inventory, Profile |
| `ss_notif_read` | JSON `string[]` | Notifications | Sidebar, MobileNav, Notifications |
| `ss_finance` | JSON `object` | Profile | Profile |
| `ss_email` | string | — | Settings (display) |

---

## CSS-архитектура

Все стили в одном файле `app/src/index.css`. Структура файла:

```
1.    CSS переменные (:root, body.dark)
2.    Reset и base
3.    Типографика
4.    Layout (sidebar, main, mobile)
5.    Навигация (nav-item, badges)
6.    Landing-страница (landing-*)
7.    Auth модал (auth-*)
8.    Quiz модал (quiz-*)
9.    Feed (feed-*, filters-*, cat-*)
10.   Catalog (catalog-*)
11.   SetDetail (sd-*)
12.   Inventory (inv-*)
13.   Profile (profile-*, entry-*, envelope-*)
14.   Article (article-*, hero-card, content-card)
15.   CreateSet / CreateArticle (editor-*, cs-*)
16.   Settings (settings-*)
17.   Account (account-*, acc-*)
18.   Notifications (notif-*)
19.   AuthorPage (author-special-*)
20.   Утилиты (toast, breadcrumb, badges, toggles)
21.   Mobile media queries
```

### Паттерны

**Тёмная тема:** `body.dark .class { ... }` — переопределяет CSS-переменные и отдельные правила.

**Flex text-overflow fix:**
```css
.flex-parent > div:first-child {
  flex: 1;
  min-width: 0;      /* без этого flex-child не сжимается */
}
.text-in-flex {
  word-break: break-word;
  overflow-wrap: anywhere;
}
```

**Ring progress (Inventory):**
```css
.ring-fill {
  stroke-dasharray: circumference;
  stroke-dashoffset: circumference * (1 - pct);  /* вычисляется inline */
}
```

---

## Статусы инвентаря

| Статус | CSS-класс | Цвет | Условие (consumable) | Условие (wear) |
|---|---|---|---|---|
| Норма | `.ring-ok` | зелёный #5E9478 | > 50% осталось | > 50% срока |
| Скоро | `.ring-soon` | жёлтый #B08840 | 20–50% | 20–50% срока |
| Срочно | `.ring-urgent` | красный #B85555 | 1–20% | 1–20% срока |
| Истёк | `.ring-over` | фиолетовый #7B5EA7 | 0% | истёк срок |

---

## Типы наборов

| `source` | Отображение | Бейдж |
|---|---|---|
| `'ss'` | SmartSpend | зелёный «SS» |
| `'community'` | Сообщество | серый |
| `'own'` | Мои | тёмный |

| `type` | Отображение |
|---|---|
| `'base'` | «База» — фундаментальные наборы |
| `'extra'` | «Доп.» — расширенные/специальные |

---

## Специальные аккаунты

### Анонимный автор (`type: 'anonymous'`)

- В ленте: иконка 🔒 + курсив «Анонимный автор»
- В AuthorPage: блок «Профиль скрыт», нет контента, кнопка подписки заблокирована
- Нет бейджа, нет stats

### Удалённый аккаунт (`type: 'deleted'`)

- В ленте: иконка 👻 + курсив «Привидение»
- В AuthorPage: баннер об удалении, вкладки показывают контент с атрибуцией «Привидение»
- Нет бейджа, нет зачёркивания имени

---

## Расчёты Profile

### EmoSpend

```
EmoSpend = capital * emoRate / 12
```
где `emoRate` — ставка 4–10%, выбирается пользователем.

### Smart-база (месячный бюджет)

```
Суммируются monthlyPrice всех items во всех наборах конвертов:
  consumable: price * qty / (qty / dailyUse / 30)  // цена на месяц
  wear: price / (wearLifeWeeks * 7 / 30)            // амортизация
```

### Прогноз капитала (10 лет)

```js
for (let month = 0; month <= 120; month++) {
  capital = capital * (1 + annualRate/12) + monthlyContribution
}
// annualRate = finance.coreRate (по умолчанию 10%)
// monthlyContribution = income - housing - credit - food - transport - other - smartBase
```
