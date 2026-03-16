// Demo users for SmartSpend v2 demonstration
// empty@user.ru  → пустой профиль (новый пользователь)
// full@user.ru   → заполненный профиль (активный пользователь)

export const EMPTY_USER = {
  userType: 'empty',
  username: 'Новый пользователь',
  profile: {
    displayName: '',
    pseudonym: '',
    username: '',
    bio: '',
    joined: 'март 2026',
    followers: 0,
  },
  articles: [],
  myArticleIds: [],
  sets: [],
  subs: [],
}

export const FULL_USER = {
  userType: 'full',
  username: 'Никита Орлов',
  profile: {
    displayName: 'Никита Орлов',
    pseudonym: 'NOrlov',
    username: '@n_orlov',
    bio: 'Финансовый блогер и фанат осознанного потребления. Помогаю людям тратить осознанно и копить без боли. Веду инвентарь уже 2 года — экономлю в среднем 8 000 ₽/мес.',
    joined: 'январь 2024',
    followers: 247,
  },
  // Статьи отображаемые в Account (карточки)
  articles: [
    {
      id: 'f6',
      title: 'Капсульный гардероб: как выбрать базу и не переплатить',
      excerpt: 'Разбираю набор «Базовый гардероб» по деталям — какие бренды выбрать, где лучше соотношение цена/качество, и почему 10 вещей лучше 40.',
      meta: '4 марта 2026',
      views: 21700,
      likes: 204,
      pub: true,
      category: 'Одежда',
    },
    {
      id: 'f4',
      title: '5 способов снизить расходы на автомобиль без потери комфорта',
      excerpt: 'Страховка, ТО, топливо и парковка — разбираю каждую статью и показываю, где реально можно сэкономить.',
      meta: '6 марта 2026',
      views: 8900,
      likes: 214,
      pub: true,
      category: 'Транспорт',
    },
    {
      id: 'draft-1',
      title: 'Как выбрать протеин: мой опыт после 3 лет тренировок',
      excerpt: 'Разбираю популярные бренды — что брать, что не стоит и где покупать выгодно.',
      meta: 'Черновик · 15 марта 2026',
      views: 0,
      likes: 0,
      pub: false,
      category: 'Здоровье',
    },
  ],
  // ID статей из mock.js articles[], у которых показываем кнопки редактирования
  myArticleIds: ['f6', 'f4'],
  // Наборы отображаемые в Account
  sets: [
    {
      id: 'my-s1',
      name: 'Мой рацион',
      source: 'Моё',
      color: '#B8A8B8',
      tags: ['Питание', 'Личный'],
      amount: '9 400 ₽',
      period: 'в месяц',
      pub: false,
      setId: 's11',
    },
    {
      id: 'my-s2',
      name: 'Подписки и досуг',
      source: 'Моё',
      color: '#688870',
      tags: ['Досуг', 'Публичный'],
      amount: '5 200 ₽',
      period: 'в месяц',
      pub: true,
      setId: 's6',
    },
  ],
  // Подписки
  subs: [
    {
      ini: 'АС',
      name: 'Анна Соколова',
      handle: '@anna_sokolova',
      followers: '2 400 подписчиков',
      articles: 24,
      sets: 8,
      desc: 'Нутрициолог. Пишу о здоровом питании и осознанном потреблении. Набор «Правильное питание» — мой флагман.',
      authorId: 'a1',
    },
    {
      ini: 'МЛ',
      name: 'Максим Лебедев',
      handle: '@m_lebedev',
      followers: '1 800 подписчиков',
      articles: 18,
      sets: 5,
      desc: 'Финансовый аналитик. Пишу о рациональных покупках и системных подходах к экономии.',
      authorId: 'a2',
    },
  ],
  // Финансовые данные для Profile.jsx (ss_finance)
  finance: {
    income: 120000,
    housing: 35000,
    hasCredit: false,
    creditPayment: 0,
    creditMonths: 0,
    capital: 186400,
  },
  emoRate: '7',
}

/** Загрузить данные полного пользователя в localStorage */
export function loadFullUserData() {
  const u = FULL_USER
  localStorage.setItem('ss_account_profile', JSON.stringify(u.profile))
  localStorage.setItem('ss_account_articles', JSON.stringify(u.articles))
  localStorage.setItem('ss_account_sets', JSON.stringify(u.sets))
  localStorage.setItem('ss_account_subs', JSON.stringify(u.subs))
  localStorage.setItem('ss_my_article_ids', JSON.stringify(u.myArticleIds))
  localStorage.setItem('ss_finance', JSON.stringify(u.finance))
  localStorage.setItem('ss_emo_rate', u.emoRate)
}

/** Загрузить данные пустого пользователя в localStorage */
export function loadEmptyUserData() {
  const u = EMPTY_USER
  localStorage.setItem('ss_account_profile', JSON.stringify(u.profile))
  localStorage.setItem('ss_account_articles', JSON.stringify([]))
  localStorage.setItem('ss_account_sets', JSON.stringify([]))
  localStorage.setItem('ss_account_subs', JSON.stringify([]))
  localStorage.setItem('ss_my_article_ids', JSON.stringify([]))
  localStorage.removeItem('ss_finance')
  localStorage.removeItem('ss_emo_rate')
  localStorage.removeItem('ss_envelopes')
  localStorage.removeItem('ss_inventory_extra')
}
