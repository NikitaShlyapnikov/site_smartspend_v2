import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

// ── helpers ─────────────────────────────────────────────────────────────────

function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}

function initProfile() {
  return readLS('ss_account_profile', {
    displayName: '', pseudonym: '', username: '', bio: '', joined: 'март 2026', followers: 0,
  })
}

// ── Confirm delete modal ─────────────────────────────────────────────────────

function ConfirmModal({ open, title, desc, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="acc-confirm-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="acc-confirm-modal">
        <div className="acc-confirm-icon">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </div>
        <div className="acc-confirm-title">{title}</div>
        <div className="acc-confirm-desc">{desc}</div>
        <div className="acc-confirm-actions">
          <button className="acc-confirm-cancel" onClick={onCancel}>Отмена</button>
          <button className="acc-confirm-delete" onClick={onConfirm}>Удалить</button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
  const [msg, setMsg] = useState(null)
  function show(text) { setMsg(text); setTimeout(() => setMsg(null), 2200) }
  return [msg, show]
}

// ── Main component ───────────────────────────────────────────────────────────

export default function Account() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('articles')
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState(initProfile)
  const [draft, setDraft] = useState(initProfile)

  const [articles, setArticles] = useState(() => readLS('ss_account_articles', []))
  const [sets, setSets] = useState(() => readLS('ss_account_sets', []))
  const [subs] = useState(() => readLS('ss_account_subs', []))

  const [confirmArticle, setConfirmArticle] = useState(null) // article object to delete
  const [confirmSet, setConfirmSet] = useState(null)         // set object to delete

  const [toast, showToast] = useToast()

  function startEdit() { setDraft({ ...profile }); setEditing(true) }
  function cancelEdit() { setEditing(false) }
  function saveEdit() {
    setProfile({ ...draft })
    localStorage.setItem('ss_account_profile', JSON.stringify({ ...draft }))
    setEditing(false)
    showToast('Профиль обновлён')
  }

  const initials = profile.displayName
    ? profile.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  // ── Article actions ────────────────────────────────────────────────────────

  function handleEditArticle(a) {
    if (a.pub && a.id && !a.id.startsWith('draft')) {
      navigate(`/article/${a.id}`)
    } else {
      navigate('/create-article')
    }
  }

  function handleDeleteArticle(a) {
    setConfirmArticle(a)
  }

  function confirmDeleteArticle() {
    const updated = articles.filter(a => a.id !== confirmArticle.id)
    setArticles(updated)
    localStorage.setItem('ss_account_articles', JSON.stringify(updated))
    // Also remove from myArticleIds
    const myIds = readLS('ss_my_article_ids', []).filter(id => id !== confirmArticle.id)
    localStorage.setItem('ss_my_article_ids', JSON.stringify(myIds))
    setConfirmArticle(null)
    showToast('Статья удалена')
  }

  // ── Set actions ────────────────────────────────────────────────────────────

  function handleEditSet(s) {
    if (s.setId) {
      navigate(`/set/${s.setId}`)
    } else {
      navigate('/create-set')
    }
    showToast('Открыт редактор набора')
  }

  function handleDeleteSet(s) {
    setConfirmSet(s)
  }

  function confirmDeleteSet() {
    const updated = sets.filter(s => s.id !== confirmSet.id)
    setSets(updated)
    localStorage.setItem('ss_account_sets', JSON.stringify(updated))
    setConfirmSet(null)
    showToast('Набор удалён')
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────

  const TABS = [
    { id: 'articles', label: `Статьи · ${articles.length}` },
    { id: 'sets',     label: `Наборы · ${sets.length}` },
    { id: 'subs',     label: `Подписки · ${subs.length}` },
  ]

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
                    onChange={e => setDraft(d => ({ ...d, displayName: e.target.value }))}
                    placeholder="Имя и фамилия" />
                : <span className="user-display-name">{profile.displayName || <span className="acc-placeholder">Имя не указано</span>}</span>
              }
            </div>
            <div className="user-nickname-line">
              {editing
                ? <input className="acc-edit-field" value={draft.pseudonym} style={{ width: 220 }}
                    onChange={e => setDraft(d => ({ ...d, pseudonym: e.target.value }))}
                    placeholder="Псевдоним" />
                : <span className="user-pseudonym">{profile.pseudonym}</span>
              }
            </div>
            <div className="user-nickname-line">
              {editing
                ? <input className="acc-edit-field" value={draft.username} style={{ width: 180 }}
                    onChange={e => setDraft(d => ({ ...d, username: e.target.value }))}
                    placeholder="@username" />
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
                  onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
                  placeholder="Расскажите о себе..." />
                <div className="profile-edit-actions">
                  <button className="btn-save" onClick={saveEdit}>Сохранить</button>
                  <button className="btn-cancel" onClick={cancelEdit}>Отмена</button>
                </div>
              </>
            ) : (
              <div className="user-bio">{profile.bio || <span className="acc-placeholder">Биография не заполнена</span>}</div>
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
                Написать статью
              </button>
            </div>

            <div className="acc-visibility-hint">
              <div className="acc-vh-item">
                <span className="visibility-badge public">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/><path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"/>
                  </svg>
                  Публичный
                </span>
                <span className="acc-vh-desc">— видна всем в ленте и каталоге, набирает просмотры и подписчиков</span>
              </div>
              <div className="acc-vh-item">
                <span className="visibility-badge private">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Личный
                </span>
                <span className="acc-vh-desc">— черновик, виден только вам, не отображается в ленте</span>
              </div>
            </div>

            {articles.length === 0 && (
              <div className="acc-empty">
                <div className="acc-empty-icon">✍️</div>
                <div className="acc-empty-title">Нет статей</div>
                <div className="acc-empty-desc">Напишите первую статью и поделитесь опытом с сообществом</div>
              </div>
            )}

            {articles.map((a) => (
              <div key={a.id} className="acc-article-card">
                <div className="acc-article-title">{a.title}</div>
                <div className="acc-article-excerpt">{a.excerpt}</div>
                <div className="article-footer-meta">
                  <span>{a.meta}</span>
                  {a.views > 0 && <span>{a.views.toLocaleString('ru')} просмотров</span>}
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
                        Черновик
                      </>
                    )}
                  </span>
                </div>
                {/* UC-31 / UC-33: Edit & Delete */}
                <div className="acc-card-actions">
                  <button className="acc-btn-edit" onClick={() => handleEditArticle(a)}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                    Редактировать
                  </button>
                  <button className="acc-btn-delete" onClick={() => handleDeleteArticle(a)}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    </svg>
                    Удалить
                  </button>
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

            <div className="acc-visibility-hint">
              <div className="acc-vh-item">
                <span className="visibility-badge public">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/><path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"/>
                  </svg>
                  Публичный
                </span>
                <span className="acc-vh-desc">— виден в каталоге, другие могут добавить его в свой инвентарь</span>
              </div>
              <div className="acc-vh-item">
                <span className="visibility-badge private">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Личный
                </span>
                <span className="acc-vh-desc">— только для вас, не отображается в общем каталоге</span>
              </div>
            </div>

            {sets.length === 0 && (
              <div className="acc-empty">
                <div className="acc-empty-icon">📦</div>
                <div className="acc-empty-title">Нет наборов</div>
                <div className="acc-empty-desc">Создайте первый набор или добавьте готовый из каталога</div>
              </div>
            )}

            <div className="acc-sets-grid">
              {sets.map((s) => (
                <div key={s.id} className="acc-set-card">
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
                  {/* UC-35 / UC-36 / UC-37: Edit & Delete */}
                  <div className="acc-card-actions acc-card-actions-set">
                    <button className="acc-btn-edit" onClick={() => handleEditSet(s)}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                      Редактировать
                    </button>
                    <button className="acc-btn-delete" onClick={() => handleDeleteSet(s)}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                      </svg>
                      Удалить
                    </button>
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
            {subs.length === 0 && (
              <div className="acc-empty">
                <div className="acc-empty-icon">🌟</div>
                <div className="acc-empty-title">Нет подписок</div>
                <div className="acc-empty-desc">Подписывайтесь на авторов, чтобы следить за их статьями и наборами</div>
              </div>
            )}
            {subs.map((s, i) => (
              <div key={i} className="subscription-card" style={{ cursor: 'pointer' }}
                onClick={() => navigate('/author/' + s.handle.replace('@', ''), { state: s })}>
                <div className="subscription-header">
                  <div className="subscription-avatar">{s.ini}</div>
                  <div style={{ flex: 1 }}>
                    <div className="subscription-name">{s.name}</div>
                    <div className="subscription-meta">{s.handle} · {s.followers}</div>
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

      {/* Delete article confirm */}
      <ConfirmModal
        open={!!confirmArticle}
        title="Удалить статью?"
        desc={confirmArticle ? `«${confirmArticle.title}» будет безвозвратно удалена.` : ''}
        onConfirm={confirmDeleteArticle}
        onCancel={() => setConfirmArticle(null)}
      />

      {/* Delete set confirm */}
      <ConfirmModal
        open={!!confirmSet}
        title="Удалить набор?"
        desc={confirmSet ? `«${confirmSet.name}» будет удалён из вашего профиля.` : ''}
        onConfirm={confirmDeleteSet}
        onCancel={() => setConfirmSet(null)}
      />

      {/* Toast */}
      <div className={`toast${toast ? ' show' : ''}`}>
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {toast}
      </div>

    </Layout>
  )
}
