import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

// Fallback mock articles per author handle
const AUTHOR_ARTICLES = {
  '@finance_psy': [
    { title: 'Почему мы тратим больше, когда нам грустно', excerpt: 'Эмоциональные траты — не слабость, а физиология. Разбираю механизм и три простых способа остановиться до того, как карточка уже считана.', meta: '12 мар 2026', views: 4200 },
    { title: 'Как перестать считать деньги на сдачу и начать видеть картину целиком', excerpt: 'Фокус на мелких тратах часто мешает увидеть, куда уходят настоящие деньги. О чём стоит думать вместо этого.', meta: '1 фев 2026', views: 3800 },
    { title: '5 денежных убеждений, которые тянут вас вниз', excerpt: 'Установки из детства, которые мешают копить — и как их заменить на работающие.', meta: '10 янв 2026', views: 6100 },
  ],
  '@pension_invest': [
    { title: 'Мой портфель на 45 лет: что работало, что нет', excerpt: 'Реальные цифры, реальные ошибки. Рассказываю, от чего пришлось отказаться и что принесло основной результат за 20 лет инвестиций.', meta: '8 мар 2026', views: 11400 },
    { title: 'Пенсионный калькулятор, которому я доверяю', excerpt: 'Разбираю несколько популярных инструментов планирования — какой считает честно, а где скрытые допущения делают картину розовее реальности.', meta: '15 фев 2026', views: 8700 },
  ],
  '@budget_life': [
    { title: 'Конверты 2.0: как я адаптировал систему под цифровой мир', excerpt: 'Классические конверты работали в эпоху наличных. Показываю, как сохранить психологию метода в эпоху карт и подписок.', meta: '5 мар 2026', views: 3100 },
    { title: 'Жить на одну зарплату и ещё откладывать: пошаговый план', excerpt: 'Без кредитов, без инвестиций, без волшебства. Просто конкретные шаги для тех, кто устал от «советов богатых».', meta: '18 янв 2026', views: 5400 },
    { title: 'Набор «Базовый месяц»: что купить, чтобы не думать о еде неделю', excerpt: 'Полный список покупок на 4 500 ₽, который закрывает завтраки, обеды и ужины для одного человека.', meta: '2 дек 2025', views: 7200 },
  ],
}

const AUTHOR_SETS = {
  '@finance_psy': [
    { name: 'Стресс-бюджет', color: '#B89AAE', amount: '5 000 ₽', period: '/ мес', tags: ['8 поз.', 'ежемесячно'] },
    { name: 'Антикризисный фонд', color: '#9AB8A8', amount: '15 000 ₽', period: '/ квартал', tags: ['5 поз.', 'квартально'] },
  ],
  '@pension_invest': [
    { name: 'Базовый инвестиционный', color: '#8A9EB8', amount: '30 000 ₽', period: '/ мес', tags: ['6 поз.', 'ежемесячно'] },
    { name: 'Пенсионный портфель', color: '#9696B8', amount: '50 000 ₽', period: '/ квартал', tags: ['12 поз.', 'квартально'] },
    { name: 'Страховой буфер', color: '#B8A87A', amount: '20 000 ₽', period: 'разово', tags: ['4 поз.', 'разово'] },
  ],
  '@budget_life': [
    { name: 'Базовый месяц', color: '#7DAF92', amount: '4 500 ₽', period: '/ мес', tags: ['18 поз.', 'еженедельно'] },
    { name: 'Конверт «Продукты»', color: '#9AB8A8', amount: '8 000 ₽', period: '/ мес', tags: ['22 поз.', 'еженедельно'] },
  ],
}

const DEFAULT_ARTICLES = [
  { title: 'Об осознанных расходах', excerpt: 'Практические советы по ведению бюджета и планированию трат на месяц вперёд.', meta: 'мар 2026', views: 1200 },
]
const DEFAULT_SETS = [
  { name: 'Базовый набор', color: '#9AB8A8', amount: '5 000 ₽', period: '/ мес', tags: ['10 поз.', 'ежемесячно'] },
]

const TABS = [
  { id: 'articles', label: 'Статьи' },
  { id: 'sets',     label: 'Наборы' },
]

// ── ANONYMOUS PROFILE ────────────────────────────────────────────────────────

function AnonymousProfile({ navigate }) {
  return (
    <Layout>
      <main className="account-main">
        <div className="user-header author-special-header">
          <div className="author-special-avatar author-special-avatar--anon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div className="user-info">
            <div className="user-name-line">
              <span className="user-display-name">Анонимный пользователь</span>
            </div>
            <div className="user-bio" style={{ marginTop: 8 }}>
              Этот пользователь ограничил доступ к своей странице. Профиль, статьи и наборы скрыты от посторонних.
            </div>
          </div>
          <button className="btn-follow" style={{ position: 'absolute', top: 28, right: 32 }} disabled>
            Подписаться
          </button>
        </div>
        <div className="author-special-blocked">
          <div className="author-special-blocked-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <div className="author-special-blocked-title">Профиль скрыт</div>
          <div className="author-special-blocked-desc">Пользователь ограничил доступ к своей странице в настройках конфиденциальности</div>
          <button className="btn-cancel" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>← Назад</button>
        </div>
      </main>
    </Layout>
  )
}

// ── GHOST (DELETED) PROFILE ───────────────────────────────────────────────────

const GHOST_ARTICLES = [
  { title: 'Почему мы переплачиваем за доставку и как это остановить', excerpt: 'Подписки на доставку, минимальные суммы заказа, наценки за «быстро» — лишние 2 000–4 000 ₽ в месяц.', meta: '9 мар 2026', views: 22100 },
  { title: 'Скрытые расходы: что мы не замечаем в ежедневных тратах', excerpt: 'Небольшие ежедневные покупки складываются в суммы, которые мало кто осознаёт. Разбираю по категориям.', meta: '2 фев 2026', views: 9800 },
]
const GHOST_SETS = [
  { name: 'Еда и доставка', color: '#C4A882', amount: '12 000 ₽', period: '/ мес', tags: ['14 поз.', 'еженедельно'] },
]

function GhostProfile({ navigate }) {
  const [tab, setTab] = useState('articles')
  const tabs = [
    { id: 'articles', label: `Статьи · ${GHOST_ARTICLES.length}` },
    { id: 'sets',     label: `Наборы · ${GHOST_SETS.length}` },
  ]
  return (
    <Layout>
      <main className="account-main">
        <div className="user-header author-special-header">
          <div className="author-special-avatar author-special-avatar--ghost">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a8 8 0 0 0-8 8v10l3-3 3 3 3-3 3 3 3-3V10a8 8 0 0 0-8-8zm-2.5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
            </svg>
          </div>
          <div className="user-info">
            <div className="user-name-line">
              <span className="user-display-name author-ghost-name">Привидение</span>
            </div>
            <div className="user-bio" style={{ marginTop: 8 }}>
              Этот аккаунт был удалён пользователем. Опубликованные материалы сохранены и переданы анонимному автору.
            </div>
          </div>
        </div>

        <div className="author-ghost-notice">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a8 8 0 0 0-8 8v10l3-3 3 3 3-3 3 3 3-3V10a8 8 0 0 0-8-8zm-2.5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
          </svg>
          Материалы удалённого пользователя сохранены на платформе и доступны для чтения
        </div>

        <div className="acc-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`acc-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}>{t.label}
            </button>
          ))}
        </div>

        {tab === 'articles' && (
          <div className="acc-panel">
            {GHOST_ARTICLES.map((a, i) => (
              <div key={i} className="acc-article-card">
                <div className="acc-article-title">{a.title}</div>
                <div className="acc-article-excerpt">{a.excerpt}</div>
                <div className="article-footer-meta">
                  <span>{a.meta}</span>
                  {a.views != null && <span>{a.views.toLocaleString('ru')} просмотров</span>}
                  <span className="author-ghost-attr">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.6 }}>
                      <path d="M12 2a8 8 0 0 0-8 8v10l3-3 3 3 3-3 3 3 3-3V10a8 8 0 0 0-8-8zm-2.5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                    </svg>
                    Привидение
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'sets' && (
          <div className="acc-panel">
            <div className="acc-sets-grid">
              {GHOST_SETS.map((s, i) => (
                <div key={i} className="acc-set-card">
                  <div className="acc-set-accent" style={{ background: s.color }} />
                  <div className="acc-set-body">
                    <div className="acc-set-top-row">
                      <span className="acc-set-source author-ghost-attr">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.6 }}>
                          <path d="M12 2a8 8 0 0 0-8 8v10l3-3 3 3 3-3 3 3 3-3V10a8 8 0 0 0-8-8zm-2.5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                        </svg>
                        Привидение
                      </span>
                    </div>
                    <div className="acc-set-name">{s.name}</div>
                    <div className="acc-set-tags">
                      {s.tags.map((tag, j) => <span key={j} className="acc-set-tag">{tag}</span>)}
                    </div>
                  </div>
                  <div className="acc-set-footer">
                    <span className="acc-set-amount">{s.amount}</span>
                    <span className="acc-set-period">{s.period}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </Layout>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function AuthorPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [tab, setTab] = useState('articles')
  const [following, setFollowing] = useState(state?.following ?? false)

  if (!state) {
    return (
      <Layout>
        <main className="account-main">
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <div className="empty-title">Автор не найден</div>
            <button className="btn-sm" style={{ marginTop: 8 }} onClick={() => navigate(-1)}>← Назад</button>
          </div>
        </main>
      </Layout>
    )
  }

  if (state.type === 'anonymous') return <AnonymousProfile navigate={navigate} />
  if (state.type === 'deleted')   return <GhostProfile navigate={navigate} />

  const author = state
  const articles = AUTHOR_ARTICLES[author.handle] ?? DEFAULT_ARTICLES
  const sets = AUTHOR_SETS[author.handle] ?? DEFAULT_SETS

  const tabs = [
    { id: 'articles', label: `Статьи · ${articles.length}` },
    { id: 'sets',     label: `Наборы · ${sets.length}` },
  ]

  return (
    <Layout>
      <main className="account-main">

        {/* Profile header — guest view */}
        <div className="user-header">
          <div className="user-avatar-large" style={{ fontSize: 28 }}>
            <span>{author.ini}</span>
          </div>

          <div className="user-info">
            <div className="user-name-line">
              <span className="user-display-name">{author.name}</span>
            </div>
            <div className="user-nickname-line">
              <span className="user-username">{author.handle}</span>
            </div>
            <div className="user-meta">
              <span className="user-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14"/><path d="M22 3h-6a4 4 0 0 0-4 4v14"/>
                </svg>
                {author.followers} подписчиков
              </span>
              <span className="user-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h7"/>
                </svg>
                {author.articles} статей
              </span>
              <span className="user-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                {author.sets} наборов
              </span>
            </div>
            <div className="user-bio">{author.desc}</div>
          </div>

          <button
            className={`btn-follow${following ? ' following' : ''}`}
            style={{ position: 'absolute', top: 28, right: 32 }}
            onClick={() => setFollowing(f => !f)}
          >
            {following ? 'Подписан' : 'Подписаться'}
          </button>
        </div>

        {/* Tabs */}
        <div className="acc-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`acc-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Articles */}
        {tab === 'articles' && (
          <div className="acc-panel">
            {articles.map((a, i) => (
              <div key={i} className="acc-article-card">
                <div className="acc-article-title">{a.title}</div>
                <div className="acc-article-excerpt">{a.excerpt}</div>
                <div className="article-footer-meta">
                  <span>{a.meta}</span>
                  {a.views != null && <span>{a.views.toLocaleString('ru')} просмотров</span>}
                  <span className="visibility-badge public">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/><path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"/>
                    </svg>
                    Публичный
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sets */}
        {tab === 'sets' && (
          <div className="acc-panel">
            <div className="acc-sets-grid">
              {sets.map((s, i) => (
                <div key={i} className="acc-set-card">
                  <div className="acc-set-accent" style={{ background: s.color }} />
                  <div className="acc-set-body">
                    <div className="acc-set-top-row">
                      <span className="acc-set-source">{author.name}</span>
                      <span className="visibility-badge public" style={{ fontSize: 9 }}>Публичный</span>
                    </div>
                    <div className="acc-set-name">{s.name}</div>
                    <div className="acc-set-tags">
                      {s.tags.map((tag, j) => <span key={j} className="acc-set-tag">{tag}</span>)}
                    </div>
                  </div>
                  <div className="acc-set-footer">
                    <span className="acc-set-amount">{s.amount}</span>
                    <span className="acc-set-period">{s.period}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </Layout>
  )
}
