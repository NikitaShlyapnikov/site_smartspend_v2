import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const INIT_PROFILE = {
  displayName: '',
  pseudonym: '',
  username: '',
  bio: '',
  joined: 'март 2026',
  followers: 0,
}

const ARTICLES = []
const SETS = []
const SUBS = []

const TABS = [
  { id: 'articles', label: `Статьи · ${ARTICLES.length}` },
  { id: 'sets',     label: `Наборы · ${SETS.length}` },
  { id: 'subs',     label: `Подписки · ${SUBS.length}` },
]

export default function Account() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('articles')
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState(INIT_PROFILE)
  const [draft, setDraft] = useState(INIT_PROFILE)

  function startEdit() { setDraft({ ...profile }); setEditing(true) }
  function cancelEdit() { setEditing(false) }
  function saveEdit() { setProfile({ ...draft }); setEditing(false) }

  const initials = profile.displayName
    ? profile.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

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
            {ARTICLES.length === 0 && (
              <div className="acc-empty">
                <div className="acc-empty-icon">✍️</div>
                <div className="acc-empty-title">Нет статей</div>
                <div className="acc-empty-desc">Напишите первую статью и поделитесь опытом с сообществом</div>
              </div>
            )}
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
            {SETS.length === 0 && (
              <div className="acc-empty">
                <div className="acc-empty-icon">📦</div>
                <div className="acc-empty-title">Нет наборов</div>
                <div className="acc-empty-desc">Создайте первый набор или добавьте готовый из каталога</div>
              </div>
            )}
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
            {SUBS.length === 0 && (
              <div className="acc-empty">
                <div className="acc-empty-icon">🌟</div>
                <div className="acc-empty-title">Нет подписок</div>
                <div className="acc-empty-desc">Подписывайтесь на авторов, чтобы следить за их статьями и наборами</div>
              </div>
            )}
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
