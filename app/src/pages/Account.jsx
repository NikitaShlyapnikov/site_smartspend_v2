import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const INIT_PROFILE = {
  displayName: 'Никита Орлов',
  pseudonym: 'nicky_finance',
  username: '@nicky_orlov',
  bio: 'Интересуюсь личными финансами, инвестициями и оптимизацией бюджета. Создаю наборы для разных жизненных сценариев.',
  joined: 'март 2024',
  followers: 12,
}

const COMMENTS = [
  { ini: 'НО', date: '2 дня назад', text: 'Отличный подход к учёту! Я тоже использую конверты для категории «Еда» — очень дисциплинирует. А как вы учитываете незапланированные траты?', postLink: 'Мой бюджет на август' },
  { ini: 'НО', date: '5 дней назад', text: 'Спасибо за статью! Очень полезно про EmoSpend. Я раньше не задумывался, что можно тратить доход от капитала, не трогая тело.', postLink: 'Что такое EmoSpend' },
  { ini: 'НО', date: '2 недели назад', text: 'Использую набор «Базовое питание» уже 3 месяца — экономия около 2 000 ₽ в месяц по сравнению с хаотичными покупками.', postLink: 'Набор «Базовое питание»' },
  { ini: 'НО', date: '1 месяц назад', text: 'А можно ли адаптировать набор под веганский рацион? Интересует замена белков животного происхождения.', postLink: 'Боул с киноа и запечёнными овощами' },
]

const ARTICLES = [
  {
    title: 'Как я перестал бояться и полюбил EmoSpend',
    excerpt: 'Многие боятся тратить деньги, даже когда капитал уже позволяет. В этой статье я рассказываю, как концепция EmoSpend помогла мне перестать чувствовать вину за траты на удовольствия...',
    meta: 'Опубликовано · 15 июля 2025', views: 1240, pub: true,
  },
  {
    title: 'Почему я веду бюджет в конвертах (и вам советую)',
    excerpt: 'Система конвертов — это не просто «раскидать деньги по папкам». Это психологический трюк, который помогает видеть реальные лимиты и перестать тратить сверх плана...',
    meta: 'Черновик · 2 июня 2025', views: null, pub: false,
  },
]

const SETS = [
  { name: 'Базовое питание', color: '#8DBFA8', source: 'SmartSpend', amount: '7 500 ₽', period: '/ мес', tags: ['18 поз.', 'еженедельно'], pub: true },
  { name: 'Вкусняшки', color: '#C4A882', source: 'Мой набор', amount: '2 500 ₽', period: '/ мес', tags: ['6 поз.', 'еженедельно'], pub: false },
  { name: 'Домашняя аптечка', color: '#B89AAE', source: 'Мой набор', amount: '1 200 ₽', period: '/ квартал', tags: ['12 поз.', 'квартально'], pub: false },
  { name: 'Базовый уход за кошкой', color: '#9AB8A8', source: 'SmartSpend', amount: '3 800 ₽', period: '/ мес', tags: ['9 поз.', 'ежемесячно'], pub: true },
  { name: 'Домашний офис', color: '#8A9EB8', source: 'Мой набор', amount: '65 000 ₽', period: 'разово', tags: ['8 поз.', 'разово'], pub: false },
]

const SUBS = [
  { ini: 'Ф', name: 'Финансовый психолог', handle: '@finance_psy', followers: '2.4K', desc: 'Как перестать бояться денег, начать копить и при этом жить хорошо. Разбираем психологические ловушки в финансах.', articles: 15, sets: 8, following: true },
  { ini: 'И', name: 'Инвестор на пенсии', handle: '@pension_invest', followers: '5.1K', desc: 'Личный опыт выхода на пенсию в 45. Показываю реальные цифры, портфели и ошибки. Только практика.', articles: 43, sets: 12, following: true },
  { ini: 'Б', name: 'Бюджет для жизни', handle: '@budget_life', followers: '890', desc: 'Простые шаги к финансовой свободе. Конверты, наборы, планирование — для тех, кто устал жить от зарплаты до зарплаты.', articles: 24, sets: 5, following: false },
]

const TABS = [
  { id: 'comments', label: `Комментарии · ${COMMENTS.length}` },
  { id: 'articles', label: `Статьи · ${ARTICLES.length}` },
  { id: 'sets',     label: `Наборы · ${SETS.length}` },
  { id: 'subs',     label: `Подписки · ${SUBS.length}` },
]

export default function Account() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('comments')
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState(INIT_PROFILE)
  const [draft, setDraft] = useState(INIT_PROFILE)

  function startEdit() { setDraft({ ...profile }); setEditing(true) }
  function cancelEdit() { setEditing(false) }
  function saveEdit() { setProfile({ ...draft }); setEditing(false) }

  const initials = profile.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Layout>
      <main className="account-main">

        {/* Profile header */}
        <div className="user-header">
          <div className="user-avatar-large">
            <span>{initials}</span>
          </div>

          <div className="user-info">
            <div className="user-name-line">
              {editing
                ? <input className="acc-edit-field large" value={draft.displayName}
                    onChange={e => setDraft(d => ({ ...d, displayName: e.target.value }))} />
                : <span className="user-display-name">{profile.displayName}</span>
              }
            </div>
            <div className="user-nickname-line">
              {editing
                ? <input className="acc-edit-field" value={draft.pseudonym} style={{ width: 220 }}
                    onChange={e => setDraft(d => ({ ...d, pseudonym: e.target.value }))} />
                : <span className="user-pseudonym">{profile.pseudonym}</span>
              }
            </div>
            <div className="user-nickname-line">
              {editing
                ? <input className="acc-edit-field" value={draft.username} style={{ width: 180 }}
                    onChange={e => setDraft(d => ({ ...d, username: e.target.value }))} />
                : <span className="user-username">{profile.username}</span>
              }
            </div>

            <div className="user-meta">
              <span className="user-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/>
                </svg>
                Зарегистрирован: {profile.joined}
              </span>
              <span className="user-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14"/><path d="M22 3h-6a4 4 0 0 0-4 4v14"/>
                </svg>
                {profile.followers} подписчиков
              </span>
            </div>

            {editing ? (
              <>
                <textarea className="user-bio-input" rows={3} value={draft.bio}
                  onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} />
                <div className="profile-edit-actions">
                  <button className="btn-save" onClick={saveEdit}>Сохранить</button>
                  <button className="btn-cancel" onClick={cancelEdit}>Отмена</button>
                </div>
              </>
            ) : (
              <div className="user-bio">{profile.bio}</div>
            )}
          </div>

          {!editing && (
            <button className="btn-edit-profile" onClick={startEdit}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Редактировать
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="acc-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`acc-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Comments */}
        {tab === 'comments' && (
          <div className="acc-panel">
            {COMMENTS.map((c, i) => (
              <div key={i} className="comment-card">
                <div className="comment-header">
                  <div className="avatar-sm" style={{ width: 28, height: 28, fontSize: 10 }}>{c.ini}</div>
                  <div className="comment-meta">{profile.displayName} · {c.date}</div>
                </div>
                <div className="comment-text">{c.text}</div>
                <span className="comment-post-link">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  К публикации «{c.postLink}»
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Articles */}
        {tab === 'articles' && (
          <div className="acc-panel">
            <div className="panel-header">
              <span className="panel-title">Статьи, которые вы написали</span>
              <button className="acc-btn-primary" onClick={() => navigate('/create-article')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Создать статью
              </button>
            </div>
            {ARTICLES.map((a, i) => (
              <div key={i} className="acc-article-card">
                <div className="acc-article-title">{a.title}</div>
                <div className="acc-article-excerpt">{a.excerpt}</div>
                <div className="article-footer-meta">
                  <span>{a.meta}</span>
                  {a.views != null && <span>{a.views.toLocaleString('ru')} просмотров</span>}
                  <span className={`visibility-badge ${a.pub ? 'public' : 'private'}`}>
                    {a.pub ? (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"/><path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"/>
                        </svg>
                        Публичный
                      </>
                    ) : (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        Личный
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sets */}
        {tab === 'sets' && (
          <div className="acc-panel">
            <div className="panel-header">
              <span className="panel-title">Наборы, которые вы создали</span>
              <button className="acc-btn-primary" onClick={() => navigate('/create-set')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Создать набор
              </button>
            </div>
            <div className="acc-sets-grid">
              {SETS.map((s, i) => (
                <div key={i} className="acc-set-card">
                  <div className="acc-set-accent" style={{ background: s.color }} />
                  <div className="acc-set-body">
                    <div className="acc-set-top-row">
                      <span className="acc-set-source">{s.source}</span>
                      <span className={`visibility-badge ${s.pub ? 'public' : 'private'}`} style={{ fontSize: 9 }}>
                        {s.pub ? 'Публичный' : 'Личный'}
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

        {/* Subscriptions */}
        {tab === 'subs' && (
          <div className="acc-panel">
            <div className="panel-header">
              <span className="panel-title">Авторы и блоги, на которые вы подписаны</span>
            </div>
            {SUBS.map((s, i) => (
              <div key={i} className="subscription-card" style={{ cursor: 'pointer' }}
                onClick={() => navigate('/author/' + s.handle.replace('@', ''), { state: s })}>
                <div className="subscription-header">
                  <div className="subscription-avatar">{s.ini}</div>
                  <div style={{ flex: 1 }}>
                    <div className="subscription-name">{s.name}</div>
                    <div className="subscription-meta">{s.handle} · {s.followers} подписчиков</div>
                  </div>
                </div>
                <div className="subscription-description">{s.desc}</div>
                <div className="subscription-stats">
                  <span>{s.articles} статей</span>
                  <span>{s.sets} наборов</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </Layout>
  )
}
