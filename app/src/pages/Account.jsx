import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'

const ACC_SPOTLIGHT = [
  { targetId: 'sp-acc-header', btnId: 'sp-acc-edit',   title: 'Профиль',        desc: 'Твоё имя, аватар и биография. Нажми «Редактировать», чтобы обновить информацию о себе.' },
  { targetId: 'sp-acc-tabs',   btnId: null,             title: 'Разделы аккаунта', desc: 'Статьи, наборы и подписки — три раздела твоего профиля. Переключайся между ними.' },
]

// ── helpers ─────────────────────────────────────────────────────────────────

function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}

// Russian → Latin transliteration for auto-username
function toLatinUsername(name) {
  const map = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh',
    'з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
    'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts',
    'ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
  }
  return name.toLowerCase()
    .split('').map(c => map[c] ?? (c.match(/[a-z0-9]/) ? c : ' '))
    .join('').trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 20)
}

function initProfile() {
  // Seed displayName from registration username if not set
  const regName = localStorage.getItem('ss_username') || ''
  const saved = readLS('ss_account_profile', null)
  if (saved) return { followers: 0, avatar: '', ...saved }
  return {
    displayName: regName, pseudonym: '', username: toLatinUsername(regName),
    bio: '', followers: 0, avatar: '',
  }
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
  const location = useLocation()
  const [tab, setTab] = useState(location.state?.tab || 'articles')
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState(initProfile)
  const [draft, setDraft] = useState(initProfile)

  const [articles,  setArticles]  = useState(() => readLS('ss_account_articles', []))
  const [sets,      setSets]      = useState(() => readLS('ss_account_sets', []))
  const [subs,      setSubs]      = useState(() => readLS('ss_account_subs', []))
  const [whispers,  setWhispers]  = useState(() => readLS('ss_account_whispers', []))

  const [confirmArticle, setConfirmArticle] = useState(null)
  const [confirmSet,     setConfirmSet]     = useState(null)
  const [confirmWhisper, setConfirmWhisper] = useState(null)
  const [showSpotlight,  setShowSpotlight]  = useState(false)

  const [toast, showToast] = useToast()

  const avatarInputRef = useRef(null)

  // ── Profile ────────────────────────────────────────────────────────────────

  function startEdit() {
    const base = { ...profile }
    if (!base.username && base.displayName) base.username = toLatinUsername(base.displayName)
    setDraft(base)
    setEditing(true)
  }
  function cancelEdit() { setEditing(false) }
  function saveEdit() {
    setProfile({ ...draft })
    localStorage.setItem('ss_account_profile', JSON.stringify({ ...draft }))
    setEditing(false)
    showToast('Профиль обновлён')
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const url = ev.target.result
      const updated = { ...profile, avatar: url }
      setProfile(updated)
      localStorage.setItem('ss_account_profile', JSON.stringify(updated))
      showToast('Фото обновлено')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const initials = (profile.displayName || profile.username || localStorage.getItem('ss_username') || 'U')[0].toUpperCase()

  // ── Article actions ────────────────────────────────────────────────────────

  function handleEditArticle(a) {
    navigate(`/create-article?edit=${a.id}`)
  }

  function handleToggleArticleVisibility(a) {
    const updated = articles.map(x => x.id === a.id ? { ...x, pub: !x.pub } : x)
    setArticles(updated)
    localStorage.setItem('ss_account_articles', JSON.stringify(updated))
    showToast(a.pub ? 'Статья скрыта — теперь личная' : 'Статья опубликована')
  }

  function handleDeleteArticle(a) { setConfirmArticle(a) }

  function confirmDeleteArticle() {
    const updated = articles.filter(a => a.id !== confirmArticle.id)
    setArticles(updated)
    localStorage.setItem('ss_account_articles', JSON.stringify(updated))
    const myIds = readLS('ss_my_article_ids', []).filter(id => id !== confirmArticle.id)
    localStorage.setItem('ss_my_article_ids', JSON.stringify(myIds))
    setConfirmArticle(null)
    showToast('Статья удалена')
  }

  // ── Set actions ────────────────────────────────────────────────────────────

  function handleEditSet(s) {
    navigate(s.setId ? `/set/${s.setId}` : '/create-set')
  }

  function handleToggleSetVisibility(s) {
    const updated = sets.map(x => x.id === s.id ? { ...x, pub: !x.pub } : x)
    setSets(updated)
    localStorage.setItem('ss_account_sets', JSON.stringify(updated))
    showToast(s.pub ? 'Набор скрыт из каталога' : 'Набор опубликован в каталоге')
  }

  function handleDeleteSet(s) { setConfirmSet(s) }

  function confirmDeleteSet() {
    const updated = sets.filter(s => s.id !== confirmSet.id)
    setSets(updated)
    localStorage.setItem('ss_account_sets', JSON.stringify(updated))
    setConfirmSet(null)
    showToast('Набор удалён')
  }

  // ── Whisper actions ────────────────────────────────────────────────────────

  function confirmDeleteWhisperFn() {
    const updated = whispers.filter(w => w.id !== confirmWhisper.id)
    setWhispers(updated)
    localStorage.setItem('ss_account_whispers', JSON.stringify(updated))
    setConfirmWhisper(null)
    showToast('Запись удалена')
  }

  // ── Sub actions ────────────────────────────────────────────────────────────

  function handleUnsubscribe(s) {
    const updated = subs.filter(x => x.handle !== s.handle)
    setSubs(updated)
    localStorage.setItem('ss_account_subs', JSON.stringify(updated))
    showToast(`Вы отписались от ${s.name}`)
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────

  const TABS = [
    { id: 'articles', label: `Статьи · ${articles.length}` },
    { id: 'sets',     label: `Наборы · ${sets.length}` },
    { id: 'whispers', label: `Промо · ${whispers.length}` },
    { id: 'subs',     label: `Подписки · ${subs.length}` },
  ]

  return (
    <Layout>
      <main className="account-main">

        {/* Page title */}
        <div className="inv-page-header">
          <div>
            <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              Аккаунт
              <HelpButton seenKey="ss_spl_account" onOpen={() => setShowSpotlight(true)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button id="sp-acc-edit" className={`btn-edit-mode${editing ? ' active' : ''}`} onClick={editing ? saveEdit : startEdit}>
              {editing ? (
                <>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Готово
                </>
              ) : (
                <>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Редактировать
                </>
              )}
            </button>
            {editing && (
              <button className="btn-edit-mode" onClick={cancelEdit}>Отмена</button>
            )}
          </div>
        </div>


        {/* Profile header */}
        <div id="sp-acc-header" className="user-header">
          <div className="user-avatar-large-wrap">
            <div className="user-avatar-large">
              {profile.avatar
                ? <img src={profile.avatar} alt="avatar" className="user-avatar-img" />
                : <span>{initials}</span>
              }
            </div>
            {editing && profile.avatar && (
              <button className="user-avatar-delete" onClick={() => {
                const updated = { ...profile, avatar: '' }
                setProfile(updated)
                setDraft(d => ({ ...d, avatar: '' }))
                localStorage.setItem('ss_account_profile', JSON.stringify(updated))
                showToast('Фото удалено')
              }} title="Удалить фото">
                <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
            <button className="user-avatar-change" onClick={() => avatarInputRef.current?.click()} title="Сменить фото">
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>

          <div className="user-info">
            <div className="user-name-line">
              {editing
                ? <input className="acc-edit-field large" value={draft.displayName}
                    onChange={e => setDraft(d => ({ ...d, displayName: e.target.value }))}
                    placeholder="Имя и фамилия" />
                : <span className="user-display-name">{profile.displayName || <span className="acc-placeholder acc-placeholder--name">Имя не указано</span>}</span>
              }
            </div>
            <div className="user-nickname-line">
              {editing
                ? <div className="acc-username-input-wrap">
                    <span className="acc-username-at">@</span>
                    <input className="acc-edit-field" value={draft.username} style={{ width: 160 }}
                      onChange={e => setDraft(d => ({ ...d, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                      placeholder="username" />
                  </div>
                : <span className="user-username">{profile.username ? '@' + profile.username : <span className="acc-placeholder" style={{ fontSize: 13 }}>username не задан</span>}</span>
              }
            </div>

            <div className="user-meta">
              {profile.followers > 0 && (
                <span className="user-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14"/><path d="M22 3h-6a4 4 0 0 0-4 4v14"/>
                  </svg>
                  {profile.followers} подписчиков
                </span>
              )}
            </div>

            {editing ? (
              <textarea className="user-bio-input" rows={3} value={draft.bio}
                onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
                placeholder="О себе..." />
            ) : (
              <div className="user-bio">{profile.bio || <span className="acc-placeholder acc-placeholder--bio">О себе...</span>}</div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div id="sp-acc-tabs" className="acc-tabs">
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


            {articles.length === 0 && (
              <div className="acc-empty">
                <div className="acc-empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </div>
                <div className="acc-empty-title">Нет статей</div>
                <div className="acc-empty-desc">Напишите первую статью и поделитесь опытом с сообществом</div>
              </div>
            )}

            {articles.map((a) => {
              const isDraft  = !!a.draft
              const isPublic = !!a.pub
              const commentCount = Array.isArray(a.comments) ? a.comments.length : (a.comments ?? 0)

              if (isPublic) {
                return (
                  <article key={a.id} className="feed-article acc-feed-article"
                    onClick={() => navigate(`/article/${a.id}`)}>
                    <div className="fa-author-row">
                      {a.category && <><span className="fa-category">{a.category}</span><span className="fa-sep">·</span></>}
                      <span className="visibility-badge public">Публичный</span>
                    </div>
                    <h2 className="fa-title">{a.title}</h2>
                    <p className="fa-preview">{a.excerpt}</p>
                    <div className="fa-bottom" onClick={e => e.stopPropagation()}>
                      <div className="fa-action-stat">
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                        </svg>
                        {a.likes ?? 0}
                      </div>
                      <div className="fa-action-stat">
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        {commentCount}
                      </div>
                      <div className="fa-action-stat">
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                          <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                        </svg>
                        {a.dislikes ?? 0}
                      </div>
                      {Array.isArray(a.reactions) && a.reactions.length > 0 && (
                        <><span className="fa-reactions-sep" />
                          {a.reactions.slice(0, 4).map(r => (
                            <span key={r.emoji} className="acc-reaction-pill">{r.emoji} {r.count}</span>
                          ))}</>
                      )}
                      <div className="f-spacer" />
                      <span className="fa-time">{a.meta}</span>
                      <button className="acc-btn-visibility acc-btn-delete-gray"
                        onClick={e => { e.stopPropagation(); handleDeleteArticle(a) }}>
                        Удалить
                      </button>
                    </div>
                  </article>
                )
              }

              // ── Личная / черновик ──
              const badgeClass = isDraft ? 'draft' : 'private'
              const badgeLabel = isDraft ? 'Черновик' : 'Личное'
              const handleCardClick = () => isDraft ? handleEditArticle(a) : navigate(`/article/${a.id}`)
              return (
                <div key={a.id} className="acc-article-card acc-article-card--clickable"
                  onClick={handleCardClick}>
                  <div className="acc-article-title-row">
                    <span className="acc-article-title">{a.title}</span>
                    <span className={`visibility-badge ${badgeClass}`}>{badgeLabel}</span>
                  </div>
                  <div className="acc-article-excerpt">{a.excerpt}</div>
                  <div className="acc-card-actions" onClick={e => e.stopPropagation()}>
                    <span className="acc-card-meta">{a.meta}</span>
                    <div className="acc-card-actions-right">
                      <button className="acc-btn-edit" onClick={() => handleEditArticle(a)}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                        Редактировать
                      </button>
                      <button className="acc-btn-visibility acc-btn-delete-gray"
                        onClick={e => { e.stopPropagation(); handleDeleteArticle(a) }}>
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
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
                <span className="acc-vh-desc">— виден в каталоге, другие могут добавить его в инвентарь</span>
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
                <div className="acc-empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="9" height="9" rx="1.5"/><rect x="13" y="3" width="9" height="9" rx="1.5"/><rect x="2" y="13" width="9" height="9" rx="1.5"/><rect x="13" y="13" width="9" height="9" rx="1.5"/>
                  </svg>
                </div>
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
                  <div className="acc-card-actions acc-card-actions-set">
                    <button className="acc-btn-visibility" onClick={() => handleToggleSetVisibility(s)}
                      title={s.pub ? 'Скрыть из каталога' : 'Опубликовать в каталоге'}>
                      {s.pub ? (
                        <>
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                          Скрыть
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                          Опубликовать
                        </>
                      )}
                    </button>
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

        {/* Whispers */}
        {tab === 'whispers' && (
          <div className="acc-panel">
            <div className="panel-header">
              <span className="panel-title">Скидки и промокоды, которые вы добавили</span>
              <button className="acc-btn-primary" onClick={() => navigate('/create-whisper')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Создать купон
              </button>
            </div>

            {whispers.length === 0 && (
              <div className="acc-empty">
                <div className="acc-empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
                  </svg>
                </div>
                <div className="acc-empty-title">Нет записей</div>
                <div className="acc-empty-desc">Делитесь скидками и промокодами в разделе Промо → Промо</div>
              </div>
            )}

            {whispers.map(w => (
              <div key={w.id} className="acc-article-card">
                <div className="acc-whisper-header">
                  <div className="promo-logo" style={{ background: w.companyColor, width: 28, height: 28, fontSize: 10 }}>{w.companyAbbr}</div>
                  <div>
                    <div className="acc-whisper-company">{w.companyName}</div>
                    <div className="acc-whisper-meta">{w.expires ? `до ${w.expires}` : 'бессрочно'}</div>
                  </div>
                </div>
                <div className="acc-article-title" style={{ marginTop: 8 }}>{w.title}</div>
                {w.code && (
                  <div className="acc-whisper-code">{w.code}</div>
                )}
                <div className="acc-card-actions">
                  <button className="acc-btn-delete" onClick={() => setConfirmWhisper(w)}>
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

        {/* Subscriptions */}
        {tab === 'subs' && (
          <div className="acc-panel">
            <div className="panel-header">
              <span className="panel-title">Авторы и блоги, на которые вы подписаны</span>
            </div>
            {subs.length === 0 && (
              <div className="acc-empty">
                <div className="acc-empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                </div>
                <div className="acc-empty-title">Нет подписок</div>
                <div className="acc-empty-desc">Подписывайтесь на авторов, чтобы следить за их статьями и наборами</div>
              </div>
            )}
            {subs.map((s, i) => (
              <div key={i} className="subscription-card">
                <div className="subscription-header" style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/author/' + s.handle.replace('@', ''), { state: s })}>
                  <div className="subscription-avatar">{s.ini}</div>
                  <div style={{ flex: 1 }}>
                    <div className="subscription-name">{s.name}</div>
                    <div className="subscription-meta">{s.handle} · {s.followers}</div>
                  </div>
                  <button className="acc-btn-unsub" onClick={e => { e.stopPropagation(); handleUnsubscribe(s) }}>
                    Отписаться
                  </button>
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

      {/* Delete whisper confirm */}
      <ConfirmModal
        open={!!confirmWhisper}
        title="Удалить запись?"
        desc={confirmWhisper ? `«${confirmWhisper.title}» будет удалена из раздела Промо.` : ''}
        onConfirm={confirmDeleteWhisperFn}
        onCancel={() => setConfirmWhisper(null)}
      />

      {/* Toast */}
      <div className={`toast${toast ? ' show' : ''}`}>
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {toast}
      </div>

      {showSpotlight && <SpotlightTour steps={ACC_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
    </Layout>
  )
}
