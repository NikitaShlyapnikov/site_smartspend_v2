// Feed authors
export const feedAuthors = {
  a1: { name: 'Анна Соколова',  initials: 'АС', color: '#7DAF92', following: true  },
  a2: { name: 'Максим Лебедев', initials: 'МЛ', color: '#8A9EB8', following: true  },
  a3: { name: 'Оля Петрова',    initials: 'ОП', color: '#C4A882', following: false },
  a4: { name: 'Иван Козлов',    initials: 'ИК', color: '#B89AAE', following: false },
}

export const feedItems = [
  {
    id: 'f1', type: 'set',
    ts: 20260307, pop: 9800,
    title: 'Корейский уход за кожей',
    desc: 'Полный базовый уход по K-beauty методике: двойное очищение, тонер, эссенция, крем и SPF',
    amount: 5800, amountLabel: 'руб / месяц',
    source: 'ss', badge: 'base', color: '#96B8A0',
    category: 'health',
    items: ['Гидрофильное масло', 'Пенка для умывания', 'Тонер', 'Эссенция'], more: 3,
    users: 1240, time: '2 ч назад',
  },
  {
    id: 'f2', type: 'article',
    ts: 20260307, pop: 8700,
    title: 'Боул с киноа и запечёнными овощами',
    preview: 'Из набора «Правильное питание» можно приготовить идеальный обед: сытный, богатый белком и готовится всего за 30 минут. Рассказываю пошагово.',
    authorId: 'a1', time: '3 ч назад',
    views: 3200, likes: 87, comments: 12,
    setLink: { title: 'Правильное питание', color: '#9AB8A8' },
    category: 'food',
  },
  {
    id: 'f3', type: 'set',
    ts: 20260306, pop: 5600,
    title: 'Хоум-офис для удалёнки',
    desc: 'Расходники для комфортной работы из дома: кофе, блокноты, канцелярия и мелкая техника',
    amount: 3200, amountLabel: 'руб / месяц',
    source: 'community', badge: 'extra', color: '#B89AAE',
    category: 'home',
    items: ['Кофе в зёрнах', 'Блокноты А5', 'Канцелярия'], more: 2,
    users: 560, authorId: 'a2', time: '1 д назад',
  },
  {
    id: 'f4', type: 'article',
    ts: 20260306, pop: 12300,
    title: '5 способов снизить расходы на автомобиль без потери комфорта',
    preview: 'Страховка, ТО, топливо и парковка — разбираю каждую статью и показываю, где реально можно сэкономить, а где экономия оборачивается лишними тратами.',
    authorId: 'a2', time: '1 д назад',
    views: 8900, likes: 214, comments: 38,
    setLink: { title: 'Авто и транспорт', color: '#9696B8' },
    category: 'transport',
  },
  {
    id: 'f5', type: 'article',
    ts: 20260305, pop: 14300,
    title: 'Как экономить 15% на подписках: гайд по семейным планам',
    preview: 'Яндекс Плюс Семья, Netflix Premium, Spotify Duo — объясняю, как объединиться с близкими и сократить расходы на стриминг почти вдвое.',
    authorId: 'a3', time: '2 д назад',
    views: 12400, likes: 143, comments: 31,
    setLink: { title: 'Подписки и стриминг', color: '#A8B4A0' },
    category: 'leisure',
  },
  {
    id: 'f6', type: 'article',
    ts: 20260304, pop: 20400,
    title: 'Капсульный гардероб: как выбрать базу и не переплатить',
    preview: 'Разбираю набор «Базовый гардероб» по деталям — какие бренды выбрать, где лучше соотношение цена/качество, и почему 10 вещей лучше 40.',
    authorId: 'a1', time: '3 д назад',
    views: 21700, likes: 204, comments: 47,
    setLink: { title: 'Базовый гардероб', color: '#8A9EB8' },
    category: 'clothes',
  },
  {
    id: 'f7', type: 'set',
    ts: 20260303, pop: 3200,
    title: 'Аптечка путешественника',
    desc: 'Компактный набор для поездок: от пластыря до противодиарейных и средств от укусов',
    amount: 1800, amountLabel: 'руб',
    source: 'community', badge: 'extra', color: '#C4B496',
    category: 'health',
    items: ['Пластыри', 'Обезболивающие', 'Противодиарейные', 'Репеллент'], more: 2,
    users: 890, authorId: 'a4', time: '5 д назад',
  },
  {
    id: 'f8', type: 'article',
    ts: 20260302, pop: 6700,
    title: 'Бытовая химия: что покупать оптом, а что раз в полгода',
    preview: 'Прохожусь по каждой позиции набора «Бытовая химия» — стирка, уборка, посуда. Объясняю логику частоты закупок и где дешевле без потери качества.',
    authorId: 'a4', time: '6 д назад',
    views: 5400, likes: 98, comments: 19,
    setLink: { title: 'Бытовая химия', color: '#B8A87A' },
    category: 'home',
  },
  {
    id: 'f9', type: 'set',
    ts: 20260228, pop: 7100,
    title: 'Базовый уход за кошкой',
    desc: 'Ежемесячный набор для кошки: корм, наполнитель, лакомства, средства гигиены',
    amount: 4200, amountLabel: 'руб / месяц',
    source: 'ss', badge: 'base', color: '#A8B8A0',
    category: 'health',
    items: ['Сухой корм', 'Наполнитель', 'Лакомства', 'Когтеточка'], more: 2,
    users: 3100, time: '1 нед назад',
  },
  {
    id: 'f10', type: 'article',
    ts: 20260227, pop: 4500,
    title: 'Недельное меню из базового набора питания за 12 000 ₽',
    preview: 'Показываю, как из стандартных позиций набора «Базовое питание» составить разнообразное меню на 7 дней — без скуки и повторов.',
    authorId: 'a3', time: '1 нед назад',
    views: 2900, likes: 61, comments: 8,
    setLink: { title: 'Базовое питание', color: '#7DAF92' },
    category: 'food',
  },
  {
    id: 'f11', type: 'article',
    ts: 20260224, pop: 3800,
    title: 'Как правильно читать состав продуктов в магазине',
    preview: 'Е-добавки, консерванты, скрытый сахар — рассказываю что реально важно смотреть на этикетке, а на что не стоит обращать внимание.',
    authorId: 'a2', time: '2 нед назад',
    views: 4100, likes: 77, comments: 14,
    category: 'food',
  },
  {
    id: 'f12', type: 'set',
    ts: 20260220, pop: 4400,
    title: 'Базовый гардероб на сезон',
    desc: 'Минимальный, но функциональный гардероб для повседневной жизни',
    amount: 42000, amountLabel: 'руб / сезон',
    source: 'ss', badge: 'base', color: '#4E8268',
    category: 'clothes',
    items: ['Джинсы', 'Футболки ×3', 'Куртка', 'Кроссовки', 'Рубашка'], more: 0,
    users: 9300, time: '2 нед назад',
  },
]

export const catalogSets = [
  // ── ОДЕЖДА ─────────────────────────────────────────────────
  {
    id: 's1', source: 'ss', category: 'clothes', type: 'base', color: '#8A9EB8',
    title: 'Базовый гардероб на сезон',
    desc: 'Капсульный гардероб на год — то без чего невозможно обойтись',
    amount: 42000, amountLabel: 'руб / сезон',
    items: ['Футболки (5 шт)', 'Джинсы (2 шт)', 'Кроссовки', 'Куртка'], more: 6,
    users: 9300, added: '2024-01-20', articles: 9,
  },
  {
    id: 's7', source: 'community', category: 'clothes', type: 'extra', color: '#B89AAE',
    title: 'Офисный гардероб',
    desc: 'Деловой стиль: рубашки, брюки, туфли, пиджак',
    amount: 7200, amountLabel: 'руб',
    items: ['Рубашки (3 шт)', 'Классические брюки', 'Туфли', 'Пиджак'], more: 3,
    users: 2800, added: '2024-06-05', articles: 3,
  },
  {
    id: 's8', source: 'community', category: 'clothes', type: 'extra', color: '#A8A89A',
    title: 'Спортивная одежда',
    desc: 'Для тренировок и активного отдыха: зал, бег, велопрогулки',
    amount: 4100, amountLabel: 'руб',
    items: ['Лосины / шорты', 'Спортивные футболки', 'Кроссовки беговые'], more: 2,
    users: 5200, added: '2024-05-18', articles: 0,
  },
  // ── ПИТАНИЕ ────────────────────────────────────────────────
  {
    id: 's2', source: 'ss', category: 'food', type: 'base', color: '#7DAF92',
    title: 'Базовое питание',
    desc: 'Полноценный рацион на месяц: крупы, овощи, белок, молочка, масло',
    amount: 12000, amountLabel: 'руб / месяц',
    items: ['Крупы', 'Овощи и фрукты', 'Мясо и рыба', 'Молочные продукты'], more: 4,
    users: 14200, added: '2024-01-15', articles: 18,
  },
  {
    id: 's9', source: 'ss', category: 'food', type: 'extra', color: '#C4A882',
    title: 'Вкусняшки и снеки',
    desc: 'Сладкое, кофе, соки, снеки — всё что балует, но не обязательно',
    amount: 3500, amountLabel: 'руб / месяц',
    items: ['Шоколад и конфеты', 'Кофе и чай', 'Соки и напитки'], more: 2,
    users: 8700, added: '2024-02-10', articles: 4,
  },
  {
    id: 's10', source: 'ss', category: 'food', type: 'extra', color: '#9AB8A8',
    title: 'Правильное питание',
    desc: 'Фитнес-ориентированный рацион с упором на белок и нутриенты',
    amount: 16500, amountLabel: 'руб / месяц',
    items: ['Протеин', 'Куриная грудка', 'Греческий йогурт', 'Овсянка'], more: 3,
    users: 4100, added: '2024-03-22', articles: 11,
  },
  {
    id: 's11', source: 'own', category: 'food', type: 'extra', color: '#B8A8B8',
    title: 'Мой рацион',
    desc: 'Персонализированный набор под мои предпочтения и диету',
    amount: 9400, amountLabel: 'руб / месяц',
    items: ['Гречка', 'Куриное филе', 'Творог', 'Яйца'], more: 5,
    users: null, added: '2025-01-03', articles: 0, private: true,
  },
  // ── ДОМ ────────────────────────────────────────────────────
  {
    id: 's3', source: 'ss', category: 'home', type: 'base', color: '#B8A87A',
    title: 'Бытовая химия',
    desc: 'Стирка, уборка, посуда — всё что нужно для чистоты дома',
    amount: 2200, amountLabel: 'руб / месяц',
    items: ['Стиральный порошок', 'Средство для посуды', 'Чистящие'], more: 4,
    users: 11500, added: '2024-01-15', articles: 6,
  },
  {
    id: 's12', source: 'ss', category: 'home', type: 'extra', color: '#C4B496',
    title: 'Уют дома',
    desc: 'Свечи, текстиль, декор — небольшие покупки для уюта',
    amount: 3800, amountLabel: 'руб / месяц',
    items: ['Свечи', 'Пледы и подушки', 'Комнатные растения'], more: 2,
    users: 3400, added: '2024-04-11', articles: 5,
  },
  // ── ЗДОРОВЬЕ ───────────────────────────────────────────────
  {
    id: 's5', source: 'ss', category: 'health', type: 'base', color: '#96B8A0',
    title: 'Забота о себе — базовый уход',
    desc: 'Средства гигиены и ухода на каждый день',
    amount: 4500, amountLabel: 'руб / месяц',
    items: ['Шампунь', 'Гель для душа', 'Крем', 'Зубная паста'], more: 3,
    users: 7800, added: '2024-01-15', articles: 7,
  },
  {
    id: 's13', source: 'community', category: 'health', type: 'extra', color: '#A0B4C8',
    title: 'Уход за кожей',
    desc: 'Базовый корейский уход: очищение, тонер, крем, SPF',
    amount: 4500, amountLabel: 'руб / месяц',
    items: ['Пенка для умывания', 'Тонер', 'Увлажняющий крем', 'Санскрин'], more: 2,
    users: 5600, added: '2024-07-30', articles: 12,
  },
  // ── ТРАНСПОРТ ──────────────────────────────────────────────
  {
    id: 's4', source: 'ss', category: 'transport', type: 'base', color: '#9696B8',
    title: 'Общественный транспорт',
    desc: 'Ежемесячный проездной + такси на крайний случай',
    amount: 3200, amountLabel: 'руб / месяц',
    items: ['Проездной ЕТК', 'Такси (резерв)'], more: 0,
    users: 8100, added: '2024-01-20', articles: 2,
  },
  // ── ДОСУГ ──────────────────────────────────────────────────
  {
    id: 's6', source: 'own', category: 'leisure', type: 'extra', color: '#688870',
    title: 'Подписки и досуг',
    desc: 'Стриминговые сервисы, спортзал и книги',
    amount: 5200, amountLabel: 'руб / месяц',
    items: ['Netflix', 'Spotify', 'Яндекс.Плюс', 'Спортзал', 'Книги'], more: 0,
    users: null, added: '2025-03-01', articles: 0, private: true,
  },
  // ── ПОДАРКИ ────────────────────────────────────────────────
  {
    id: 's14', source: 'ss', category: 'gifts', type: 'extra', color: '#C8A08A',
    title: 'Подарки близким',
    desc: 'Откладываем весь год — тратим на дни рождения и праздники',
    amount: 2500, amountLabel: 'руб / месяц',
    items: ['День рождения (×4)', 'НГ и праздники', 'Спонтанные подарки'], more: 0,
    users: 6200, added: '2024-02-28', articles: 8,
  },
]

export const setDetails = {
  s1: {
    id: 's1', source: 'community', type: 'base', color: '#8A9EB8',
    category: 'clothes', categoryLabel: 'Одежда',
    title: 'Базовый гардероб на сезон',
    desc: 'Капсульный гардероб на год — всё без чего невозможно обойтись. Рассчитан на мужчину с учётом срока носки каждой вещи.',
    amountLabel: 'руб / месяц',
    users: 9300, added: '2024-01-20', articles: 9,
    author: {
      name: 'Михаил Коваль', initials: 'МК',
      bio: 'Финансовый планировщик · 12 наборов · 4 800 подписчиков',
    },
    about: {
      title: 'Как формируется капсульный гардероб',
      paragraphs: [
        'Набор построен на принципе минимальной достаточности: каждая вещь выбрана так, чтобы сочетаться с остальными и покрывать повседневные сценарии — работа, прогулки, спорт, выходы.',
        'Стоимость рассчитана через амортизацию: куртка служит 8 лет, футболка — 2 года. Вместо суммы разовых покупок вы видите, сколько нужно откладывать ежемесячно.',
        'Базовый расчёт — мужчина ростом около 180 см, стандартный размер M–L. Коэффициент масштаба позволяет скорректировать количество единиц под ваши реальные потребности.',
      ],
    },
    items: [
      { id: 1, name: 'Куртка',                note: 'Демисезон + зима',    qty: 1,  basePrice: 12000, unit: 'шт',  period: 8   },
      { id: 2, name: 'Джинсы',                note: '2 пары',              qty: 2,  basePrice: 5500,  unit: 'шт',  period: 3   },
      { id: 3, name: 'Футболки',              note: '5 штук базовых',      qty: 5,  basePrice: 1500,  unit: 'шт',  period: 2   },
      { id: 4, name: 'Толстовка / свитшот',   note: '',                    qty: 2,  basePrice: 4000,  unit: 'шт',  period: 3   },
      { id: 5, name: 'Кроссовки повседневные',note: '',                    qty: 1,  basePrice: 7000,  unit: 'пар', period: 2   },
      { id: 6, name: 'Кроссовки спортивные',  note: 'Для зала или бега',   qty: 1,  basePrice: 6000,  unit: 'пар', period: 1.5 },
      { id: 7, name: 'Ботинки / зимняя обувь',note: '',                    qty: 1,  basePrice: 9000,  unit: 'пар', period: 4   },
      { id: 8, name: 'Брюки классические',    note: 'Офис и выходы',       qty: 2,  basePrice: 4500,  unit: 'шт',  period: 4   },
      { id: 9, name: 'Нижнее бельё',          note: 'Комплект 7 шт',       qty: 7,  basePrice: 600,   unit: 'шт',  period: 1.5 },
      { id: 10, name: 'Носки',                note: 'Упаковка 10 пар',     qty: 10, basePrice: 200,   unit: 'пар', period: 1   },
    ],
    authorArticles: [
      { tag: 'Капсула',        title: 'Как выбрать базовые футболки, которые прослужат 3 года',    views: '12.4k' },
      { tag: 'Верхняя одежда', title: 'Куртка на 8 лет: материалы, бренды и уход',                 views: '21.7k' },
      { tag: 'Уход за вещами', title: 'Стирка и хранение: как продлить срок службы одежды',        views: '6.3k'  },
      { tag: 'Шоппинг',        title: 'Где покупать базовый гардероб без переплат',                 views: '9.8k'  },
      { tag: 'Капсула',        title: 'Мужской базовый гардероб: полный чеклист по сезонам',        views: '34.2k' },
      { tag: 'Планирование',   title: 'Как не потратить лишнего: обновляем гардероб по плану',      views: '15.1k' },
    ],
    recArticles: [
      { tag: 'Обувь',         title: 'Кроссовки за 5–8 тысяч: на что смотреть при выборе',    views: '8.1k',  source: 'Городской гардероб' },
      { tag: 'Брюки',         title: 'Классические брюки: посадка, ткань, уход',              views: '4.5k',  source: 'Офисный гардероб' },
      { tag: 'Нижнее бельё',  title: 'Сколько комплектов нижнего белья на самом деле нужно',  views: '7.9k',  source: 'Базовый гардероб 2.0' },
    ],
    comments: [
      { ini: 'АК', name: 'Артём К.',  date: '12 янв', likes: 18, text: 'Пользуюсь набором второй год, очень точно по деньгам. Единственное — добавил бы ещё одни джинсы, у меня они изнашиваются быстрее заявленных 3 лет.' },
      { ini: 'МС', name: 'Мария С.',  date: '3 янв',  likes: 11, text: 'Набор рассчитан на мужчин, для женского гардероба нужно пересчитать количество. Использую коэффициент ×0.8 по обуви — вполне справедливо.' },
      { ini: 'ДВ', name: 'Денис В.',  date: '28 дек', likes: 8,  text: 'Хорошая база. Добавил позиции из офисного набора и получился полный гардероб под мои нужды.' },
      { ini: 'НО', name: 'Настя О.',  date: '15 дек', likes: 5,  text: 'Срок по кроссовкам занижен если бегаешь каждый день. Поставила 0.75 года — стало точнее.' },
      { ini: 'ИП', name: 'Илья П.',   date: '10 дек', likes: 3,  text: 'Отличный набор для старта. Правда в Москве цены немного выше, пришлось откорректировать вручную.' },
      { ini: 'КЛ', name: 'Катя Л.',   date: '5 дек',  likes: 2,  text: 'Очень удобно что можно менять срок службы прямо в таблице. Наконец-то нормальный инструмент планирования одежды.' },
    ],
  },

  s7: {
    id: 's7', source: 'community', type: 'extra', color: '#B89AAE',
    category: 'clothes', categoryLabel: 'Одежда',
    title: 'Офисный гардероб',
    desc: 'Деловой стиль для офиса и встреч: рубашки, брюки, туфли, пиджак.',
    users: 2800, added: '2024-06-05', articles: 3,
    author: { name: 'Сообщество', initials: 'СС', bio: 'Набор от сообщества пользователей SmartSpend' },
    about: { title: 'Офисный гардероб', paragraphs: ['Минимальный набор вещей для делового стиля. Рассчитан на 3–5 дней в неделю в офисе.'] },
    items: [
      { id: 1, name: 'Рубашки',         note: '3 шт',            qty: 3, basePrice: 3000,  unit: 'шт', period: 3   },
      { id: 2, name: 'Классические брюки', note: '2 пары',       qty: 2, basePrice: 5000,  unit: 'шт', period: 4   },
      { id: 3, name: 'Туфли',           note: '',                 qty: 1, basePrice: 9000,  unit: 'пар', period: 4  },
      { id: 4, name: 'Пиджак',          note: 'Базовый, тёмный', qty: 1, basePrice: 12000, unit: 'шт', period: 5   },
      { id: 5, name: 'Галстук / платок',note: '2 шт',             qty: 2, basePrice: 1500,  unit: 'шт', period: 5   },
      { id: 6, name: 'Ремень',          note: 'Кожаный',          qty: 1, basePrice: 3500,  unit: 'шт', period: 5   },
      { id: 7, name: 'Носки деловые',   note: 'Упаковка 5 пар',  qty: 5, basePrice: 300,   unit: 'пар', period: 1   },
    ],
    authorArticles: [], recArticles: [], comments: [],
  },

  s8: {
    id: 's8', source: 'community', type: 'extra', color: '#A8A89A',
    category: 'clothes', categoryLabel: 'Одежда',
    title: 'Спортивная одежда',
    desc: 'Для тренировок и активного отдыха: зал, бег, велопрогулки.',
    users: 5200, added: '2024-05-18', articles: 0,
    author: { name: 'Сообщество', initials: 'СС', bio: 'Набор от сообщества пользователей SmartSpend' },
    about: { title: 'Спортивная одежда', paragraphs: ['Базовый набор для регулярных тренировок. Рассчитан на 3–4 занятия в неделю.'] },
    items: [
      { id: 1, name: 'Лосины / шорты',       note: '2 шт',      qty: 2, basePrice: 2500, unit: 'шт', period: 1.5 },
      { id: 2, name: 'Спортивные футболки',   note: '3 шт',      qty: 3, basePrice: 1500, unit: 'шт', period: 1.5 },
      { id: 3, name: 'Кроссовки беговые',     note: '',           qty: 1, basePrice: 8000, unit: 'пар', period: 1  },
      { id: 4, name: 'Спортивная куртка',     note: 'Ветровка',  qty: 1, basePrice: 5000, unit: 'шт', period: 3   },
      { id: 5, name: 'Носки спортивные',      note: '5 пар',     qty: 5, basePrice: 350,  unit: 'пар', period: 1  },
    ],
    authorArticles: [], recArticles: [], comments: [],
  },

  s2: {
    id: 's2', source: 'ss', type: 'base', color: '#7DAF92',
    category: 'food', categoryLabel: 'Питание',
    title: 'Базовое питание',
    desc: 'Полноценный рацион на месяц: крупы, овощи, белок, молочка, масло.',
    users: 14200, added: '2024-01-15', articles: 18,
    author: { name: 'SmartSpend', initials: 'SS', bio: 'Официальный набор от команды SmartSpend' },
    about: { title: 'Как формируется базовый рацион', paragraphs: ['Набор покрывает базовые потребности в БЖУ для одного человека в месяц. Цены — средние по России.'] },
    items: [
      { id: 1, name: 'Крупы',               note: 'Гречка, рис, овсянка', qty: 3,  basePrice: 150,  unit: 'кг',  period: 1/12 },
      { id: 2, name: 'Овощи и фрукты',      note: 'Сезонные',             qty: 5,  basePrice: 120,  unit: 'кг',  period: 1/12 },
      { id: 3, name: 'Мясо и рыба',         note: 'Курица, рыба',         qty: 4,  basePrice: 350,  unit: 'кг',  period: 1/12 },
      { id: 4, name: 'Молочные продукты',   note: 'Молоко, творог, кефир',qty: 6,  basePrice: 90,   unit: 'л',   period: 1/12 },
      { id: 5, name: 'Яйца',                note: '2 десятка',            qty: 20, basePrice: 12,   unit: 'шт',  period: 1/12 },
      { id: 6, name: 'Масло',               note: 'Растительное + слив.', qty: 2,  basePrice: 200,  unit: 'шт',  period: 1/12 },
      { id: 7, name: 'Бакалея',             note: 'Макароны, хлеб, мука', qty: 3,  basePrice: 130,  unit: 'кг',  period: 1/12 },
      { id: 8, name: 'Специи и соусы',      note: '',                     qty: 3,  basePrice: 150,  unit: 'шт',  period: 2/12 },
    ],
    authorArticles: [], recArticles: [], comments: [],
  },

  s3: {
    id: 's3', source: 'ss', type: 'base', color: '#B8A87A',
    category: 'home', categoryLabel: 'Дом',
    title: 'Бытовая химия',
    desc: 'Стирка, уборка, посуда — всё что нужно для чистоты дома.',
    users: 11500, added: '2024-01-15', articles: 6,
    author: { name: 'SmartSpend', initials: 'SS', bio: 'Официальный набор от команды SmartSpend' },
    about: { title: 'Бытовая химия', paragraphs: ['Базовый набор для поддержания чистоты. Расчёт на одного-двух человек в месяц.'] },
    items: [
      { id: 1, name: 'Стиральный порошок',  note: '3 кг',         qty: 1, basePrice: 500,  unit: 'шт', period: 2/12  },
      { id: 2, name: 'Средство для посуды', note: '500 мл',        qty: 2, basePrice: 200,  unit: 'шт', period: 1/12  },
      { id: 3, name: 'Чистящее для ванной', note: '',              qty: 1, basePrice: 180,  unit: 'шт', period: 1.5/12},
      { id: 4, name: 'Средство для унитаза',note: '',              qty: 1, basePrice: 150,  unit: 'шт', period: 2/12  },
      { id: 5, name: 'Мешки для мусора',    note: '60 л, 20 шт',  qty: 2, basePrice: 120,  unit: 'уп', period: 1/12  },
      { id: 6, name: 'Кондиционер для белья',note: '',             qty: 1, basePrice: 350,  unit: 'шт', period: 2/12  },
      { id: 7, name: 'Губки для мытья',     note: '5 шт',         qty: 1, basePrice: 100,  unit: 'уп', period: 1/12  },
    ],
    authorArticles: [], recArticles: [], comments: [],
  },

  s5: {
    id: 's5', source: 'ss', type: 'base', color: '#96B8A0',
    category: 'health', categoryLabel: 'Здоровье',
    title: 'Забота о себе — базовый уход',
    desc: 'Средства гигиены и ухода на каждый день.',
    users: 7800, added: '2024-01-15', articles: 7,
    author: { name: 'SmartSpend', initials: 'SS', bio: 'Официальный набор от команды SmartSpend' },
    about: { title: 'Базовый уход', paragraphs: ['Минимальный набор средств личной гигиены для одного человека.'] },
    items: [
      { id: 1, name: 'Шампунь',             note: '400 мл',       qty: 1, basePrice: 450,  unit: 'шт', period: 1.5/12 },
      { id: 2, name: 'Гель для душа',       note: '300 мл',       qty: 1, basePrice: 350,  unit: 'шт', period: 1/12   },
      { id: 3, name: 'Зубная паста',        note: '100 г, 2 шт',  qty: 2, basePrice: 200,  unit: 'шт', period: 1/12   },
      { id: 4, name: 'Зубная щётка',        note: '',             qty: 1, basePrice: 250,  unit: 'шт', period: 3/12   },
      { id: 5, name: 'Дезодорант',          note: '150 мл',       qty: 1, basePrice: 300,  unit: 'шт', period: 1.5/12 },
      { id: 6, name: 'Крем для лица',       note: 'Увлажняющий',  qty: 1, basePrice: 600,  unit: 'шт', period: 2/12   },
      { id: 7, name: 'Бритвенные станки',   note: '4 шт',         qty: 4, basePrice: 180,  unit: 'шт', period: 1/12   },
    ],
    authorArticles: [], recArticles: [], comments: [],
  },

  s4: {
    id: 's4', source: 'ss', type: 'base', color: '#9696B8',
    category: 'transport', categoryLabel: 'Транспорт',
    title: 'Общественный транспорт',
    desc: 'Ежемесячный проездной + такси на крайний случай.',
    users: 8100, added: '2024-01-20', articles: 2,
    author: { name: 'SmartSpend', initials: 'SS', bio: 'Официальный набор от команды SmartSpend' },
    about: { title: 'Транспортные расходы', paragraphs: ['Базовый набор для передвижения по городу без личного автомобиля.'] },
    items: [
      { id: 1, name: 'Проездной ЕТК',      note: 'На месяц',     qty: 1, basePrice: 2800, unit: 'шт', period: 1/12 },
      { id: 2, name: 'Такси (резерв)',      note: '4 поездки',    qty: 4, basePrice: 300,  unit: 'шт', period: 1/12 },
    ],
    authorArticles: [], recArticles: [], comments: [],
  },

  s6: {
    id: 's6', source: 'own', type: 'extra', color: '#688870',
    category: 'leisure', categoryLabel: 'Досуг',
    title: 'Подписки и досуг',
    desc: 'Стриминговые сервисы, спортзал и книги.',
    users: null, added: '2025-03-01', articles: 0, private: true,
    author: { name: 'Мой набор', initials: 'МН', bio: 'Персональный набор' },
    about: { title: 'Досуг и подписки', paragraphs: ['Ежемесячные расходы на развлечения и личное развитие.'] },
    items: [
      { id: 1, name: 'Netflix',             note: '',             qty: 1, basePrice: 799,  unit: 'шт', period: 1/12 },
      { id: 2, name: 'Spotify',             note: '',             qty: 1, basePrice: 299,  unit: 'шт', period: 1/12 },
      { id: 3, name: 'Яндекс.Плюс',        note: '',             qty: 1, basePrice: 399,  unit: 'шт', period: 1/12 },
      { id: 4, name: 'Спортзал',            note: 'Абонемент',   qty: 1, basePrice: 2500, unit: 'шт', period: 1/12 },
      { id: 5, name: 'Книги',              note: '1–2 кн./мес', qty: 2, basePrice: 600,  unit: 'шт', period: 1/12 },
    ],
    authorArticles: [], recArticles: [], comments: [],
  },

  s9: {
    id: 's9', source: 'ss', type: 'extra', color: '#C4A882',
    category: 'food', categoryLabel: 'Питание',
    title: 'Вкусняшки и снеки',
    desc: 'Сладкое, кофе, соки, снеки — всё что балует, но не обязательно.',
    users: 8700, added: '2024-02-10', articles: 4,
    author: { name: 'SmartSpend', initials: 'SS', bio: 'Официальный набор от команды SmartSpend' },
    about: { title: 'Снеки и вкусняшки', paragraphs: ['Приятные, но необязательные расходы на сладкое и напитки.'] },
    items: [
      { id: 1, name: 'Шоколад и конфеты',  note: '',             qty: 4, basePrice: 200,  unit: 'шт', period: 1/12 },
      { id: 2, name: 'Кофе зерновой',      note: '250 г',        qty: 1, basePrice: 800,  unit: 'шт', period: 1/12 },
      { id: 3, name: 'Чай',                note: 'Разные сорта', qty: 2, basePrice: 300,  unit: 'шт', period: 2/12 },
      { id: 4, name: 'Соки и напитки',     note: '',             qty: 4, basePrice: 120,  unit: 'шт', period: 1/12 },
      { id: 5, name: 'Снеки',             note: 'Орехи, чипсы', qty: 4, basePrice: 180,  unit: 'шт', period: 1/12 },
    ],
    authorArticles: [], recArticles: [], comments: [],
  },

  s10: {
    id: 's10', source: 'ss', type: 'extra', color: '#9AB8A8',
    category: 'food', categoryLabel: 'Питание',
    title: 'Правильное питание',
    desc: 'Фитнес-ориентированный рацион с упором на белок и нутриенты.',
    users: 4100, added: '2024-03-22', articles: 11,
    author: { name: 'SmartSpend', initials: 'SS', bio: 'Официальный набор от команды SmartSpend' },
    about: { title: 'Правильное питание', paragraphs: ['Набор для тех, кто тренируется и следит за составом питания.'] },
    items: [
      { id: 1, name: 'Протеин',            note: '1 кг',         qty: 1, basePrice: 2800, unit: 'кг',  period: 1/12 },
      { id: 2, name: 'Куриная грудка',     note: '2 кг',         qty: 2, basePrice: 400,  unit: 'кг',  period: 1/12 },
      { id: 3, name: 'Греческий йогурт',   note: '500 г × 4',    qty: 4, basePrice: 200,  unit: 'шт',  period: 1/12 },
      { id: 4, name: 'Овсянка',            note: '1 кг',         qty: 1, basePrice: 130,  unit: 'кг',  period: 1/12 },
      { id: 5, name: 'Яйца',              note: '30 шт',         qty: 30,basePrice: 12,   unit: 'шт',  period: 1/12 },
      { id: 6, name: 'Авокадо',           note: '4 шт',          qty: 4, basePrice: 120,  unit: 'шт',  period: 1/12 },
    ],
    authorArticles: [], recArticles: [], comments: [],
  },

  s11: {
    id: 's11', source: 'own', type: 'extra', color: '#B8A8B8',
    category: 'food', categoryLabel: 'Питание',
    title: 'Мой рацион',
    desc: 'Персонализированный набор под мои предпочтения и диету.',
    users: null, added: '2025-01-03', articles: 0, private: true,
    author: { name: 'Мой набор', initials: 'МН', bio: 'Персональный набор' },
    about: { title: 'Мой рацион', paragraphs: ['Личный рацион, адаптированный под предпочтения и диету.'] },
    items: [
      { id: 1, name: 'Гречка',            note: '2 кг',          qty: 2, basePrice: 150,  unit: 'кг',  period: 1/12 },
      { id: 2, name: 'Куриное филе',      note: '2 кг',          qty: 2, basePrice: 380,  unit: 'кг',  period: 1/12 },
      { id: 3, name: 'Творог',            note: '200 г × 4',     qty: 4, basePrice: 120,  unit: 'шт',  period: 1/12 },
      { id: 4, name: 'Яйца',             note: '20 шт',          qty: 20,basePrice: 12,   unit: 'шт',  period: 1/12 },
      { id: 5, name: 'Брокколи',         note: 'Замороженная',   qty: 2, basePrice: 180,  unit: 'кг',  period: 1/12 },
      { id: 6, name: 'Оливковое масло',  note: '500 мл',         qty: 1, basePrice: 600,  unit: 'шт',  period: 3/12 },
    ],
    authorArticles: [], recArticles: [], comments: [],
  },

  s12: {
    id: 's12', source: 'ss', type: 'extra', color: '#C4B496',
    category: 'home', categoryLabel: 'Дом',
    title: 'Уют дома',
    desc: 'Свечи, текстиль, декор — небольшие покупки для уюта.',
    users: 3400, added: '2024-04-11', articles: 5,
    author: { name: 'SmartSpend', initials: 'SS', bio: 'Официальный набор от команды SmartSpend' },
    about: { title: 'Уют дома', paragraphs: ['Небольшие, но важные покупки для создания атмосферы дома.'] },
    items: [
      { id: 1, name: 'Свечи ароматические',note: '2 шт',         qty: 2, basePrice: 500,  unit: 'шт', period: 2/12  },
      { id: 2, name: 'Плед',              note: '',              qty: 1, basePrice: 2500, unit: 'шт', period: 4     },
      { id: 3, name: 'Подушки декоративные',note: '2 шт',        qty: 2, basePrice: 800,  unit: 'шт', period: 3     },
      { id: 4, name: 'Комнатные растения',note: '1 шт',          qty: 1, basePrice: 600,  unit: 'шт', period: 2     },
      { id: 5, name: 'Картины / постеры', note: '',              qty: 2, basePrice: 1500, unit: 'шт', period: 5     },
    ],
    authorArticles: [], recArticles: [], comments: [],
  },

  s13: {
    id: 's13', source: 'community', type: 'extra', color: '#A0B4C8',
    category: 'health', categoryLabel: 'Здоровье',
    title: 'Уход за кожей',
    desc: 'Базовый корейский уход: очищение, тонер, крем, SPF.',
    users: 5600, added: '2024-07-30', articles: 12,
    author: { name: 'Сообщество', initials: 'СС', bio: 'Набор от сообщества пользователей SmartSpend' },
    about: { title: 'Уход за кожей', paragraphs: ['4-шаговый базовый уход по корейской системе. Подходит для всех типов кожи.'] },
    items: [
      { id: 1, name: 'Пенка для умывания', note: '150 мл',       qty: 1, basePrice: 700,  unit: 'шт', period: 2/12  },
      { id: 2, name: 'Тонер',              note: '200 мл',        qty: 1, basePrice: 1200, unit: 'шт', period: 3/12  },
      { id: 3, name: 'Увлажняющий крем',   note: '50 мл',         qty: 1, basePrice: 1500, unit: 'шт', period: 3/12  },
      { id: 4, name: 'Санскрин SPF50',     note: '50 мл',         qty: 1, basePrice: 900,  unit: 'шт', period: 2/12  },
      { id: 5, name: 'Патчи под глаза',    note: '60 пар',        qty: 1, basePrice: 800,  unit: 'шт', period: 2/12  },
    ],
    authorArticles: [], recArticles: [], comments: [],
  },

  s14: {
    id: 's14', source: 'ss', type: 'extra', color: '#C8A08A',
    category: 'gifts', categoryLabel: 'Подарки',
    title: 'Подарки близким',
    desc: 'Откладываем весь год — тратим на дни рождения и праздники.',
    users: 6200, added: '2024-02-28', articles: 8,
    author: { name: 'SmartSpend', initials: 'SS', bio: 'Официальный набор от команды SmartSpend' },
    about: { title: 'Подарки близким', paragraphs: ['Откладывайте небольшую сумму каждый месяц, чтобы не тратить много разом на праздники.'] },
    items: [
      { id: 1, name: 'День рождения',      note: '4 человека',   qty: 4, basePrice: 3000, unit: 'шт', period: 1     },
      { id: 2, name: 'Новый год',          note: '',              qty: 1, basePrice: 5000, unit: 'шт', period: 1     },
      { id: 3, name: '8 марта / 23 февраля',note: '2 праздника', qty: 2, basePrice: 2000, unit: 'шт', period: 1     },
      { id: 4, name: 'Спонтанные подарки', note: '',              qty: 3, basePrice: 1500, unit: 'шт', period: 1     },
    ],
    authorArticles: [], recArticles: [], comments: [],
  },
}

function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10);
}

// type: 'consumable' — fields: price, qty, dailyUse, unit?, lastBought, set?, setId?
// type: 'wear'       — fields: price, expectedPrice?, wearLifeWeeks, purchaseDate, set?, setId?
export const inventoryGroups = [
  {
    id: 'g1', name: 'Одежда', color: '#4E8268',
    items: [
      { id: 'i1', name: 'Зимняя куртка', type: 'wear',
        price: 12000, expectedPrice: 10000, wearLifeWeeks: 156, purchaseDate: daysAgo(120),
        set: 'Базовый гардероб на сезон', setId: 's1' },
      { id: 'i2', name: 'Кроссовки Nike', type: 'wear',
        price: 8500, expectedPrice: 7000, wearLifeWeeks: 78, purchaseDate: daysAgo(490),
        set: 'Базовый гардероб на сезон', setId: 's1' },
      { id: 'i3', name: 'Базовые футболки', type: 'wear',
        price: 4500, expectedPrice: 3000, wearLifeWeeks: 104, purchaseDate: daysAgo(800),
        set: 'Базовый гардероб на сезон', setId: 's1' },
    ],
  },
  {
    id: 'g2', name: 'Питание', color: '#8268A0',
    items: [
      { id: 'i4', name: 'Гречка', type: 'consumable',
        price: 180, qty: 1000, dailyUse: 70, unit: 'г', lastBought: daysAgo(12),
        set: 'Здоровое питание — базовый набор', setId: 's2' },
      { id: 'i5', name: 'Витамин D', type: 'consumable',
        price: 650, qty: 90, dailyUse: 1, unit: 'кап', lastBought: daysAgo(20),
        set: 'Здоровое питание — базовый набор', setId: 's2' },
      { id: 'i10', name: 'Протеин', type: 'consumable',
        price: 2800, qty: 2000, dailyUse: 33, unit: 'г', lastBought: daysAgo(58),
        set: 'Здоровое питание — базовый набор', setId: 's2' },
    ],
  },
  {
    id: 'g3', name: 'Техника', color: '#6888A0',
    items: [
      { id: 'i6', name: 'Ноутбук MacBook', type: 'wear',
        price: 120000, expectedPrice: 90000, wearLifeWeeks: 260, purchaseDate: daysAgo(60),
        set: 'Домашний офис — всё необходимое', setId: 's3' },
      { id: 'i7', name: 'Наушники Sony', type: 'wear',
        price: 15000, expectedPrice: 12000, wearLifeWeeks: 104, purchaseDate: daysAgo(900),
        set: 'Домашний офис — всё необходимое', setId: 's3' },
    ],
  },
  {
    id: 'g4', name: 'Гигиена и уход', color: '#A08268',
    items: [
      { id: 'i8', name: 'Шампунь', type: 'consumable',
        price: 450, qty: 400, dailyUse: 10, unit: 'мл', lastBought: daysAgo(37),
        set: 'Забота о себе — базовый уход', setId: 's5' },
      { id: 'i9', name: 'Зубная паста', type: 'consumable',
        price: 290, qty: 100, dailyUse: 3, unit: 'г', lastBought: daysAgo(10),
        set: 'Забота о себе — базовый уход', setId: 's5' },
      { id: 'i11', name: 'Крем для лица', type: 'consumable',
        price: 1200, qty: 50, dailyUse: 0.5, unit: 'мл', lastBought: daysAgo(20),
        set: null, setId: null, paused: true },
    ],
  },
]

export const inventoryItems = [
  { id: 'i1', title: 'Базовый гардероб на сезон', set: 'Набор "Одежда"', status: 'owned', amount: 42000, amountLabel: 'куплено', date: 'янв 2025', progress: 100 },
  { id: 'i2', title: 'Кофемашина', set: 'Набор "Кухня"', status: 'owned', amount: 15000, amountLabel: 'куплено', date: 'фев 2025', progress: 100 },
  { id: 'i3', title: 'Домашний офис', set: 'Набор "Работа"', status: 'planning', amount: 65000, amountLabel: 'планирую потратить', date: 'апр 2025', progress: 40 },
  { id: 'i4', title: 'Велосипед', set: 'Набор "Спорт"', status: 'wishlist', amount: 35000, amountLabel: 'в желаниях', date: null, progress: 0 },
]

export const articles = [
  {
    id: 'a1',
    title: '7 правил осознанных покупок, которые изменят ваш бюджет',
    author: 'Анна Смирнова', authorColor: '#6B8EA8', authorInitials: 'АС',
    authorBio: 'Финансовый консультант, автор блога об осознанном потреблении. Помогаю людям тратить меньше без потери качества жизни.',
    date: '28 фев 2025', readTime: '5 мин', views: 3420, likes: 156,
    category: 'Финансы',
    preview: 'Мы часто покупаем вещи импульсивно, поддавшись рекламе или просто плохому настроению. Но есть несколько простых правил, которые помогут тратить деньги осознаннее.',
    content: `Мы часто покупаем вещи импульсивно, поддавшись рекламе или просто плохому настроению. Но есть несколько простых правил, которые помогут тратить деньги осознаннее и сохранить больше для важного.

## 1. Правило 24 часов

Прежде чем совершить незапланированную покупку дороже 1000 ₽, подождите сутки. За это время первоначальный импульс утихнет, и вы сможете трезво оценить, нужна ли вам эта вещь на самом деле.

## 2. Список = закон

Ходите в магазин только со списком и придерживайтесь его. Это простое правило способно сократить спонтанные расходы на 30–40%.

## 3. Стоимость в часах работы

Переводите стоимость вещи в часы работы. Если джинсы за 8000 ₽ стоят вам 10 часов работы — действительно ли они того стоят?

> Каждая покупка — это обмен вашего времени на вещь. Убедитесь, что обмен честный.

## 4. Один заходит — один выходит

При покупке новой вещи избавляйтесь от аналогичной старой. Это не только сокращает лишние расходы, но и помогает поддерживать порядок.

## 5. Анализируйте чеки раз в неделю

Просматривайте все покупки еженедельно. Часто мы просто не осознаём, сколько тратим на мелочи.

## 6. Разделяйте нужды и желания

Перед каждой покупкой задайте себе вопрос: это необходимость или желание? Желания не плохи — просто планируйте их заранее.

## 7. Наборы как система

Используйте готовые наборы вещей, как в SmartSpend. Это помогает не изобретать велосипед каждый раз и опираться на проверенный опыт других людей.`,
    setLink: { id: 's1', title: 'Базовый гардероб на сезон', color: '#4E8268' },
  },
]

export const notifications = [
  { id: 'n1', type: 'new-set', unread: true, title: 'Новый набор в каталоге', desc: 'Появился набор «Велосипедист: базовое снаряжение» от SmartSpend', time: '10 мин назад' },
  { id: 'n2', type: 'article', unread: true, title: 'Новая статья от Анны Смирновой', desc: '«Как не купить лишнего в чёрную пятницу» — 5 мин чтения', time: '2 ч. назад' },
  { id: 'n3', type: 'reminder', unread: false, title: 'Напоминание об обновлении инвентаря', desc: 'Вы не обновляли инвентарь уже 14 дней', time: 'вчера' },
  { id: 'n4', type: 'system', unread: false, title: 'Добро пожаловать в SmartSpend!', desc: 'Заполните профиль и добавьте первые наборы в инвентарь', time: '3 дн. назад' },
]

export const userData = {
  name: 'Никита Орлов',
  nickname: '@n.orlov',
  bio: 'Осознанно трачу деньги с 2022 года. Веду учёт всего имущества и стараюсь покупать только нужное.',
  plan: 'Базовый план',
  joined: 'янв 2025',
  capital: 187400,
  budgets: [
    { name: 'Продукты', spent: 14200, limit: 18000, color: '#4E8268' },
    { name: 'Одежда', spent: 3200, limit: 5000, color: '#6888A0' },
    { name: 'Досуг', spent: 4800, limit: 5200, color: '#A08268' },
    { name: 'Транспорт', spent: 8700, limit: 10000, color: '#8268A0' },
    { name: 'Дом', spent: 6100, limit: 15000, color: '#688870' },
    { name: 'Здоровье', spent: 2300, limit: 4000, color: '#A06870' },
  ],
  stats: { sets: 6, articles: 3, followers: 12 },
  achievements: [
    { id: 1, name: 'Первый набор', icon: '📦', earned: true },
    { id: 2, name: 'Осознанный', icon: '🎯', earned: true },
    { id: 3, name: 'Автор', icon: '✍️', earned: false },
    { id: 4, name: '100 дней', icon: '🔥', earned: false },
    { id: 5, name: 'Планировщик', icon: '📅', earned: true },
    { id: 6, name: 'Аналитик', icon: '📊', earned: false },
    { id: 7, name: 'Ментор', icon: '🌟', earned: false },
    { id: 8, name: 'Инвестор', icon: '💰', earned: false },
  ],
}
