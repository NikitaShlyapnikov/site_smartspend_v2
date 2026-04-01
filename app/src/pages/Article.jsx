import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CommentItem from '../components/CommentAuthorChip'
import PublicLayout from '../components/PublicLayout'
import { useApp } from '../context/AppContext'
import { articles } from '../data/mock'
import ReactionPill from '../components/ReactionPill'
import EmojiPickerPopup from '../components/EmojiPickerPopup'

const CATEGORIES = [
  { id: 'other', name: 'Прочие расходы' },
  { id: 'all', name: 'Все покупки' },
  { id: 'food', name: 'Еда и Супермаркеты' },
  { id: 'cafe', name: 'Кафе, Бары, Рестораны' },
  { id: 'transport', name: 'Авто и Транспорт' },
  { id: 'home', name: 'Дом и Техника' },
  { id: 'clothes', name: 'Одежда и Обувь' },
  { id: 'leisure', name: 'Развлечения и Хобби' },
  { id: 'health', name: 'Красота и Здоровье' },
  { id: 'education', name: 'Образование и Дети' },
  { id: 'travel', name: 'Путешествия и Отдых' },
]

function loadAllSets() {
  try {
    const envelopes = JSON.parse(localStorage.getItem('ss_envelopes') || '{}')
    const result = []
    for (const catId of Object.keys(envelopes)) {
      const cat = CATEGORIES.find(c => c.id === catId)
      for (const s of (envelopes[catId] || [])) {
        result.push({ ...s, catName: cat?.name || catId })
      }
    }
    return result
  } catch { return [] }
}

function loadLinkedSets(articleId) {
  try { return JSON.parse(localStorage.getItem('ss_article_sets') || '{}')[articleId] || [] } catch { return [] }
}

function saveLinkedSet(articleId, setId) {
  try {
    const data = JSON.parse(localStorage.getItem('ss_article_sets') || '{}')
    const list = data[articleId] || []
    if (!list.includes(setId)) list.push(setId)
    data[articleId] = list
    localStorage.setItem('ss_article_sets', JSON.stringify(data))
  } catch {}
}

function AddToSetModal({ articleId, onClose, onSaved }) {
  const [sets, setSets] = useState([])
  const [linked, setLinked] = useState([])
  const [selected, setSelected] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    setSets(loadAllSets())
    setLinked(loadLinkedSets(articleId))
  }, [articleId])

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  function handleConfirm() {
    if (!selected) return
    saveLinkedSet(articleId, selected)
    const set = sets.find(s => s.id === selected)
    onSaved(set?.name || 'набор')
    onClose()
  }

  return (
    <div className="add-to-set-overlay">
      <div className="add-to-set-modal" ref={ref}>
        <div className="ats-header">
          <div className="ats-title">Прикрепить статью к набору</div>
          <button className="ats-close" onClick={onClose}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {sets.length === 0 ? (
          <div className="ats-empty">
            <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <div>У вас пока нет наборов в конвертах</div>
            <div className="ats-empty-hint">Добавьте наборы из каталога в раздел Профиль → Конверты</div>
          </div>
        ) : (
          <>
            <div className="ats-desc">Статья будет сохранена в выбранном наборе — так вы сможете быстро найти её через раздел Инвентарь. Выберите набор:</div>
            <div className="ats-list">
              {sets.map(s => {
                const isLinked = linked.includes(s.id)
                return (
                  <button
                    key={s.id}
                    className={`ats-item${selected === s.id ? ' selected' : ''}${isLinked ? ' already' : ''}`}
                    onClick={() => !isLinked && setSelected(s.id)}
                    disabled={isLinked}
                  >
                    <div className="ats-item-name">{s.name}</div>
                    <div className="ats-item-cat">{s.catName}</div>
                    {isLinked && <span className="ats-item-badge">Уже добавлено</span>}
                    {selected === s.id && !isLinked && (
                      <svg className="ats-check" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="ats-actions">
              <button className="ats-cancel" onClick={onClose}>Отмена</button>
              <button className="ats-confirm" disabled={!selected} onClick={handleConfirm}>Прикрепить</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function fmtNum(n) {
  if (n >= 1000) return (Math.round(n / 100) / 10) + 'k'
  return String(n)
}

function renderBlock(block, i) {
  switch (block.type) {
    case 'h2':
      return <h2 key={i}>{block.text}</h2>
    case 'h3':
      return <h3 key={i}>{block.text}</h3>
    case 'p':
      return <p key={i}>{block.text}</p>
    case 'ul':
      return <ul key={i}>{block.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
    case 'ol':
      return <ol key={i}>{block.items.map((it, j) => <li key={j}>{it}</li>)}</ol>
    case 'note':
      return <div key={i} className="content-note" dangerouslySetInnerHTML={{ __html: block.html }} />
    case 'highlight':
      return <div key={i} className="content-highlight" dangerouslySetInnerHTML={{ __html: block.html }} />
    case 'key-points':
      return (
        <div key={i} className="key-points">
          <div className="key-points-title">{block.title}</div>
          <ul className="key-points-list">
            {block.items.map((it, j) => <li key={j}>{it}</li>)}
          </ul>
        </div>
      )
    default:
      return null
  }
}

function ArticleLikeBtn({ liked, count, onToggle }) {
  const [anim, setAnim] = useState(false)
  const [sparks, setSparks] = useState([])
  function handleClick() {
    setAnim(true)
    setTimeout(() => setAnim(false), 480)
    if (!liked) {
      const s = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i, angle: i * 60 + Math.random() * 18 - 9, dist: 16 + Math.random() * 8,
      }))
      setSparks(s)
      setTimeout(() => setSparks([]), 560)
    }
    onToggle()
  }
  return (
    <div className="action-wrap">
      <button className={`fa-action-btn${liked ? ' liked' : ''}${anim ? ' like-pop' : ''}`} onClick={handleClick} title="Нравится">
        <svg width="15" height="15" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
        </svg>
        {count}
      </button>
      {sparks.map(s => (
        <span key={s.id} className="like-spark" style={{ '--angle': `${s.angle}deg`, '--dist': `${s.dist}px` }}>✦</span>
      ))}
    </div>
  )
}

function ArticleDislikeBtn({ disliked, onToggle }) {
  const [anim, setAnim] = useState(false)
  function handleClick() {
    setAnim(true)
    setTimeout(() => setAnim(false), 420)
    onToggle()
  }
  return (
    <button className={`fa-action-btn fa-action-dislike${disliked ? ' active' : ''}${anim ? ' dislike-shake' : ''}`} onClick={handleClick} title="Не нравится">
      <svg width="15" height="15" fill={disliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
        <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
      </svg>
    </button>
  )
}

function ArticleBookmarkBtn({ bookmarked, onToggle }) {
  const [anim, setAnim] = useState(false)
  const [fly, setFly] = useState(false)
  function handleClick() {
    setAnim(true)
    setTimeout(() => setAnim(false), 420)
    if (!bookmarked) { setFly(true); setTimeout(() => setFly(false), 520) }
    onToggle()
  }
  return (
    <div className="action-wrap">
      <button className={`fa-action-btn fa-action-bookmark${bookmarked ? ' active' : ''}${anim ? ' bookmark-snap' : ''}`} onClick={handleClick} title="В закладки">
        <svg width="15" height="15" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
      {fly && <span className="bookmark-fly">✦</span>}
    </div>
  )
}

function FollowBtn({ following, onToggle }) {
  const [anim, setAnim] = useState(false)
  function handleClick(e) {
    e.stopPropagation()
    setAnim(true)
    setTimeout(() => setAnim(false), 450)
    onToggle()
  }
  return (
    <button
      className={`btn-follow${following ? ' following' : ''}${anim ? ' follow-pop' : ''}`}
      onClick={handleClick}
    >
      {following ? 'Отменить подписку' : 'Подписаться'}
    </button>
  )
}

function resolvePhotoUrls(html, images) {
  if (!images?.length) return html
  const map = {}
  images.forEach(img => { map[img.id] = img.url })
  return html.replace(/src="(photo-[^"]+)"/g, (_, id) => `src="${map[id] || ''}"`)
}

function isMyArticle(articleId) {
  try {
    const ids = JSON.parse(localStorage.getItem('ss_my_article_ids')) || []
    if (ids.includes(articleId)) return true
    const saved = JSON.parse(localStorage.getItem('ss_account_articles') || '[]')
    return saved.some(a => a.id === articleId)
  } catch { return false }
}

function ConfirmDeleteModal({ open, onConfirm, onCancel }) {
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
        <div className="acc-confirm-title">Удалить статью?</div>
        <div className="acc-confirm-desc">Статья будет безвозвратно удалена из вашего профиля и ленты.</div>
        <div className="acc-confirm-actions">
          <button className="acc-confirm-cancel" onClick={onCancel}>Отмена</button>
          <button className="acc-confirm-delete" onClick={onConfirm}>Удалить</button>
        </div>
      </div>
    </div>
  )
}

export default function Article() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { collapsed } = useApp()
  const sidebarOffset = collapsed ? 28 : 120
  const commentsRef = useRef(null)
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [following, setFollowing] = useState(() => articles.find(a => a.id === id)?.following || false)
  const [commentSort, setCommentSort] = useState('new')
  const [commentInput, setCommentInput] = useState('')
  const [likedComments, setLikedComments] = useState(new Set())
  const [dislikedComments, setDislikedComments] = useState(new Set())
  const [showAll, setShowAll] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [toast, setToast] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showAddToSet, setShowAddToSet] = useState(false)
  const [replyView, setReplyView] = useState(null) // null or { origIdx, comment }
  const [commentReplies, setCommentReplies] = useState(() => {
    const a = articles.find(x => x.id === id)
    const init = {}
    ;(a?.comments || []).forEach((c, i) => {
      if (c.replies?.length) init[i] = [...c.replies]
    })
    return init
  })
  const [replyInput, setReplyInput] = useState('')
  const [likedReplies, setLikedReplies] = useState(new Set())
  const [dislikedReplies, setDislikedReplies] = useState(new Set())
  const [myReactions, setMyReactions] = useState(new Set())
  const [showPicker, setShowPicker] = useState(false)
  const [justAdded, setJustAdded] = useState(null)
  const [reactions, setReactions] = useState(() => {
    const found = articles.find(a => a.id === id)
    const src = found?.reactions?.length ? found.reactions : [{ emoji: '🔥', count: 14 }, { emoji: '💡', count: 8 }, { emoji: '😍', count: 5 }]
    return src.map(r => ({ ...r }))
  })

  const [noteText,  setNoteText]  = useState('')
  const [notes,     setNotes]     = useState(() => {
    try { return JSON.parse(localStorage.getItem(`ss_article_notes_${id}`) || '[]') } catch { return [] }
  })

  function addNote(e) {
    e.preventDefault()
    if (!noteText.trim()) return
    const n = { id: Date.now(), text: noteText.trim(), createdAt: new Date().toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' }) }
    const next = [n, ...notes]
    setNotes(next)
    localStorage.setItem(`ss_article_notes_${id}`, JSON.stringify(next))
    setNoteText('')
  }
  function deleteNote(noteId) {
    const next = notes.filter(n => n.id !== noteId)
    setNotes(next)
    localStorage.setItem(`ss_article_notes_${id}`, JSON.stringify(next))
  }

  const isMine = isMyArticle(id)
  const article = articles.find(a => a.id === id) || (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ss_account_articles') || '[]')
      const a = saved.find(x => x.id === id)
      if (!a) return null
      const profile = JSON.parse(localStorage.getItem('ss_account_profile') || '{}')
      const regName = localStorage.getItem('ss_username') || 'Я'
      const displayName = profile.displayName || regName
      const ini = displayName[0]?.toUpperCase() || 'Я'
      return {
        ...a,
        preview: a.excerpt || '',
        catLabel: 'Мои статьи',
        date: (a.meta || '').split(' · ')[0] || '',
        readTime: ((a.meta || '').match(/(\d+) мин/) || [])[1] || '',
        likes: 0, comments: [],
        author: displayName, authorInitials: ini,
        authorColor: '#4E8268', authorBio: '',
        content: [],
        _userBody: a.editorMode !== 'html' ? (a.body || '') : '',
        _userHtml: a.editorMode === 'html' ? (a.htmlBody || '') : '',
      }
    } catch { return null }
  })()

  if (!article) {
    return (
      <PublicLayout>
        <main className="article-main">
          <div className="article-not-found">
            <div className="article-nf-icon">
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <rect x="14" y="10" width="52" height="66" rx="7" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5"/>
                <rect x="26" y="26" width="28" height="3" rx="1.5" fill="var(--border)"/>
                <rect x="26" y="35" width="20" height="3" rx="1.5" fill="var(--border)"/>
                <rect x="26" y="44" width="24" height="3" rx="1.5" fill="var(--border)"/>
                <rect x="26" y="53" width="16" height="3" rx="1.5" fill="var(--border)"/>
                <circle cx="72" cy="72" r="20" fill="var(--bg)" stroke="var(--border)" strokeWidth="1.5"/>
                <path d="M64 64l16 16M80 64L64 80" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="article-nf-title">Статья не найдена</div>
            <div className="article-nf-desc">Возможно, она была удалена или вы перешли по неверной ссылке</div>
            <div className="article-nf-actions">
              <button className="btn-secondary" onClick={() => navigate(-1)}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Назад
              </button>
              <button className="btn-primary-action" onClick={() => navigate('/feed')}>
                Перейти в ленту
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        </main>
      </PublicLayout>
    )
  }

  const isFollowing = following
  const set = article.setLink

  const sortedComments = [...(article.comments || [])].map((c, i) => ({ ...c, _origIdx: i })).sort(
    commentSort === 'top' ? (a, b) => b.likes - a.likes : () => 0
  )
  const displayComments = showAll ? sortedComments : sortedComments.slice(0, 2)

  function toggleLike() {
    setLiked(l => { if (!l) setDisliked(false); return !l })
  }
  function toggleDislike() {
    setDisliked(d => { if (!d) setLiked(false); return !d })
  }

  function toggleCommentLike(idx) {
    setLikedComments(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
    setDislikedComments(prev => { const next = new Set(prev); next.delete(idx); return next })
  }

  function toggleCommentDislike(idx) {
    setDislikedComments(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
    setLikedComments(prev => { const next = new Set(prev); next.delete(idx); return next })
  }

  function toggleReaction(emoji) {
    setMyReactions(prev => {
      const next = new Set(prev)
      const hadIt = next.has(emoji)
      hadIt ? next.delete(emoji) : next.add(emoji)
      setReactions(rs => {
        const existing = rs.find(r => r.emoji === emoji)
        if (existing) return rs.map(r => r.emoji === emoji ? { ...r, count: r.count + (hadIt ? -1 : 1) } : r).filter(r => r.count > 0)
        return [...rs, { emoji, count: 1 }]
      })
      return next
    })
  }

  function showToastMsg(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  function handleSubmitComment(e) {
    e.preventDefault()
    if (!commentInput.trim()) return
    setCommentInput('')
    showToastMsg('Комментарий отправлен')
  }

  function handleSubmitReply(e) {
    e.preventDefault()
    if (!replyInput.trim() || replyView === null) return
    const username = localStorage.getItem('ss_username') || 'Я'
    const ini = username[0]?.toUpperCase() || 'Я'
    const reply = { ini, name: username, date: 'только что', likes: 0, text: replyInput.trim() }
    setCommentReplies(prev => ({
      ...prev,
      [replyView.origIdx]: [...(prev[replyView.origIdx] || []), reply]
    }))
    setReplyInput('')
  }

  function toggleReplyLike(key) {
    setLikedReplies(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else { next.add(key); setDislikedReplies(d => { const dd = new Set(d); dd.delete(key); return dd }) }
      return next
    })
  }

  function toggleReplyDislike(key) {
    setDislikedReplies(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else { next.add(key); setLikedReplies(d => { const dd = new Set(d); dd.delete(key); return dd }) }
      return next
    })
  }

  function handleEditArticle() {
    navigate(`/create-article?edit=${id}`)
  }

  function handleDeleteArticle() {
    // Remove from account articles and myArticleIds
    try {
      const articles = JSON.parse(localStorage.getItem('ss_account_articles')) || []
      localStorage.setItem('ss_account_articles', JSON.stringify(articles.filter(a => a.id !== id)))
      const ids = JSON.parse(localStorage.getItem('ss_my_article_ids')) || []
      localStorage.setItem('ss_my_article_ids', JSON.stringify(ids.filter(i => i !== id)))
    } catch {}
    setConfirmDelete(false)
    showToastMsg('Статья удалена')
    setTimeout(() => navigate('/account'), 1500)
  }

  return (
    <PublicLayout>
      <main className="article-main">

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-item" onClick={() => navigate('/feed')}>Лента</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="breadcrumb-item">{article.catLabel}</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="breadcrumb-current">{article.title}</span>
        </div>

        {/* Hero card */}
        <div className="hero-card">
          <div className="hero-body">
            <div className="hero-body-main">
              <div className="hero-title">{article.title}</div>
              <div className="hero-desc">{article.preview}</div>
            </div>
          </div>


          {/* Author + stats row */}
          {article.pub !== false ? (
            <div className="art-meta-row">
              <span className="author-chip-wrap">
                <button className="author-chip" onClick={() => navigate('/author/' + (article.authorId || 'unknown'), { state: {
                  name: article.author, ini: article.authorInitials,
                  handle: '@' + (article.author || '').toLowerCase().replace(/\s+/g, '_'),
                  bio: article.authorBio, color: article.authorColor,
                  followers: '—', articles: 0, sets: 0, following: false,
                }})}>
                  <div className="author-avatar-sm" style={{ background: article.authorColor }}>{article.authorInitials}</div>
                  <span className="author-chip-meta">
                    <span className="author-name-inline">{article.author}</span>
                    {article.date && <span className="author-chip-date">{article.date}{article.readTime ? ` · ${article.readTime} мин` : ''}</span>}
                  </span>
                </button>
              </span>
              <div className="art-meta-sep" />
              <div className="fa-action-stat">
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                {fmtNum(article.views)}
              </div>
              <ArticleLikeBtn liked={liked} count={article.likes + (liked ? 1 : 0)} onToggle={toggleLike} />
              <button className="fa-action-stat fa-action-stat--btn" onClick={() => commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {Array.isArray(article.comments) ? article.comments.length : (article.comments || 0)}
              </button>
              <ArticleDislikeBtn disliked={disliked} onToggle={toggleDislike} />
              <ArticleBookmarkBtn bookmarked={bookmarked} onToggle={() => setBookmarked(b => !b)} />
              <div className="f-spacer" />
              <button className="art-add-set-btn" onClick={() => setShowAddToSet(true)}>
                Прикрепить к набору
              </button>
              {isMine && (
                <>
                  <button className="fa-action-btn" onClick={handleEditArticle} title="Редактировать">
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  </button>
                  <button className="fa-action-btn art-delete-btn" onClick={() => setConfirmDelete(true)} title="Удалить">
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    </svg>
                  </button>
                </>
              )}
            </div>
          ) : isMine && (
            <div className="art-meta-row art-meta-row--private">
              <span className="author-chip-wrap">
                <button className="author-chip">
                  <div className="author-avatar-sm" style={{ background: article.authorColor }}>{article.authorInitials}</div>
                  <span className="author-chip-meta">
                    <span className="author-name-inline">{article.author}</span>
                    {article.date && <span className="author-chip-date">{article.date}{article.readTime ? ` · ${article.readTime} мин` : ''}</span>}
                  </span>
                </button>
              </span>
              <div className="f-spacer" />
              <button className="fa-action-btn" onClick={handleEditArticle} title="Редактировать">
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </button>
              <button className="fa-action-btn art-delete-btn" onClick={() => setConfirmDelete(true)} title="Удалить">
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Article content */}
        <div className="content-card">
          <div className="content-body">
            {article._userHtml
              ? <div dangerouslySetInnerHTML={{ __html: resolvePhotoUrls(article._userHtml, article.images) }} />
              : article._userBody
                ? article._userBody.split('\n\n').filter(Boolean).map((block, i) => {
                    if (block.startsWith('## ')) return <h2 key={i}>{block.slice(3)}</h2>
                    if (block.startsWith('> ')) return <blockquote key={i} className="content-note">{block.slice(2)}</blockquote>
                    // resolve ![alt](photo-id) → <img>
                    const withImgs = block.replace(/!\[([^\]]*)\]\((photo-[^)]+)\)/g, (_, alt, id) => {
                      const url = article.images?.find(img => img.id === id)?.url || ''
                      return url ? `<img src="${url}" alt="${alt}" style="max-width:100%;border-radius:10px;display:block;margin:12px auto">` : `[${alt}]`
                    })
                    const html = withImgs.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>')
                    return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />
                  })
                : article.content.map((block, i) => renderBlock(block, i))
            }
          </div>
        </div>

        {/* Linked sets from user article */}
        {(() => {
          const sets = (article.linkedSets || []).filter(s => s && typeof s === 'object' && s.id)
          if (!sets.length) return null
          return (
            <>
              <div className="article-set-label">
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                {sets.length === 1 ? 'Набор, связанный с этой статьёй' : 'Наборы, связанные с этой статьёй'}
              </div>
              {sets.map(s => (
                <div key={s.id} className="linked-set-article-card">
                  <div className="linked-set-article-dot" style={{ background: s.color }} />
                  <div className="linked-set-article-info">
                    <div className="linked-set-article-name">{s.name}</div>
                    {s.category && <div className="linked-set-article-cat">{s.category}</div>}
                  </div>
                  {s.amount && <div className="linked-set-article-amount">{s.amount}<span className="linked-set-article-period"> {s.period}</span></div>}
                </div>
              ))}
            </>
          )
        })()}

        {/* Linked set as catalog card */}
        {set && (
          <>
            <div className="article-set-label">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Набор, связанный с этой статьёй
            </div>
          <div className="catalog-card" onClick={() => navigate(`/set/${set.id}`)}>
            <div className="card-body">
              <div className="card-title">{set.title}</div>
              {set.desc && <div className="card-desc">{set.desc}</div>}
            </div>
            <div className="card-cost-row">
              <div className="card-cost-item card-cost-monthly">
                <div className="card-cost-val">{(set.amount || 0).toLocaleString('ru')} ₽</div>
                <div className="card-cost-lbl">{set.amountLabel || 'в месяц'}</div>
              </div>
              {set.period && <>
                <div className="card-cost-sep" />
                <div className="card-cost-item">
                  <div className="card-cost-val">{set.period}</div>
                  <div className="card-cost-lbl">период</div>
                </div>
              </>}
              {set.users != null && <>
                <div className="card-cost-sep" />
                <div className="card-cost-item">
                  <div className="card-cost-val">{fmtNum(set.users)}</div>
                  <div className="card-cost-lbl">подписчиков</div>
                </div>
              </>}
            </div>
            <div className="card-bottom" onClick={e => e.stopPropagation()}>
              <div className="card-bottom-author">
                {set.source === 'ss' && <span className="source-badge ss">SmartSpend</span>}
                {set.source === 'community' && <span className="source-badge community">Сообщество</span>}
              </div>
              <div className="fa-meta-actions" />
              <div className="fa-meta-right" />
            </div>
          </div>
          </>
        )}

        {/* Notes block for private own articles only */}
        {isMine && !article.pub && (
          <div className="section-card">
            <div className="section-header">
              <div className="section-title">
                Заметки
                {notes.length > 0 && <span className="section-count">{notes.length}</span>}
              </div>
            </div>
            {notes.length === 0 && (
              <div className="sd-notes-empty">
                <div className="sd-notes-empty-text">Заметок пока нет. Добавьте мысли или наблюдения к этой статье.</div>
              </div>
            )}
            {notes.length > 0 && (
              <div className="sd-notes-list">
                {notes.map(note => (
                  <div key={note.id} className="sd-note-item">
                    <div className="sd-note-text">{note.text}</div>
                    <div className="sd-note-footer">
                      <span className="sd-note-date">{note.createdAt}</span>
                      <button className="sd-note-delete" onClick={() => deleteNote(note.id)} title="Удалить">
                        <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <form className="sd-note-form" onSubmit={addNote}>
              <input className="sd-note-input" placeholder="Добавить заметку…"
                value={noteText} onChange={e => setNoteText(e.target.value)} />
              <button type="submit" className="sd-note-submit" disabled={!noteText.trim()}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>
        )}

        {/* Comments */}
        {article.pub !== false && (
          <div className="section-card" ref={commentsRef}>
            {replyView === null ? (
              <>
                {/* Level 1: comment list */}
                <div className="sd-comments-header-row">
                  <span className="sd-section-title">Комментарии</span>
                  <span className="sd-comments-header-spacer" />
                  {reactions.map(r => (
                    <ReactionPill key={r.emoji} emoji={r.emoji} count={r.count} active={myReactions.has(r.emoji)} onToggle={toggleReaction} autoAnimate={justAdded === r.emoji} />
                  ))}
                  {reactions.length < 6 && (
                    <div style={{ position: 'relative' }}>
                      <button className="ar-add-btn" onClick={() => setShowPicker(p => !p)} title="Добавить реакцию">
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                        </svg>
                      </button>
                      {showPicker && <EmojiPickerPopup onPick={emoji => { toggleReaction(emoji); setJustAdded(emoji); setTimeout(() => setJustAdded(null), 700); setShowPicker(false) }} onClose={() => setShowPicker(false)} />}
                    </div>
                  )}
                  <span className="sd-comments-header-spacer" />
                  <div className="csort" style={{ flexShrink: 0 }}>
                    <button className={`c-sort-btn${commentSort === 'new' ? ' active' : ''}`} onClick={() => setCommentSort('new')}>Новые</button>
                    <button className={`c-sort-btn${commentSort === 'top' ? ' active' : ''}`} onClick={() => setCommentSort('top')}>Популярные</button>
                  </div>
                </div>
                <div className="comments-list">
                  {displayComments.map((c, i) => {
                    const replyCount = (commentReplies[c._origIdx] || []).length
                    return (
                      <div key={i} className="comment-item">
                        <CommentItem name={c.name} ini={c.ini} navigate={navigate} avatarClass="c-avatar" nameClass="c-name" date={c.date}>
                          <div className="c-text">{c.text}</div>
                          <div className="c-actions">
                            <button className={`c-like${likedComments.has(i) ? ' liked' : ''}`} onClick={() => toggleCommentLike(i)}>
                              <svg width="11" height="11" fill={likedComments.has(i) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                              </svg>
                              {c.likes + (likedComments.has(i) ? 1 : 0)}
                            </button>
                            <button className={`c-like c-dislike${dislikedComments.has(i) ? ' disliked' : ''}`} onClick={() => toggleCommentDislike(i)}>
                              <svg width="11" height="11" fill={dislikedComments.has(i) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                                <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                              </svg>
                              {(c.dislikes || 0) + (dislikedComments.has(i) ? 1 : 0)}
                            </button>
                            <button className="c-like c-reply-btn" onClick={() => setReplyView({ origIdx: c._origIdx, comment: c })}>
                              <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                              </svg>
                              {replyCount > 0 && replyCount}
                            </button>
                          </div>
                        </CommentItem>
                      </div>
                    )
                  })}
                </div>
                {!showAll && article.comments.length > 2 && (
                  <div className="show-more-row">
                    <button className="btn-show" onClick={() => setShowAll(true)}>
                      Показать все комментарии ({article.comments.length})
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                  </div>
                )}
                <form className="comments-input" onSubmit={handleSubmitComment}>
                  <input
                    className="c-input"
                    placeholder="Написать комментарий..."
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                  />
                  <button type="submit" className="c-submit">Отправить</button>
                </form>
              </>
            ) : (
              <>
                {/* Level 2: reply view */}
                <div className="sd-comments-header-row">
                  <button className="c-back-btn" onClick={() => setReplyView(null)}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </button>
                  <span className="sd-section-title">Ответы</span>
                </div>
                {/* Parent comment */}
                <div className="comment-item comment-item--parent">
                  <CommentItem name={replyView.comment.name} ini={replyView.comment.ini} navigate={navigate} avatarClass="c-avatar" nameClass="c-name" date={replyView.comment.date}>
                    <div className="c-text">{replyView.comment.text}</div>
                    <div className="c-actions">
                      <button className="c-like">
                        <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                        </svg>
                        {replyView.comment.likes}
                      </button>
                    </div>
                  </CommentItem>
                </div>
                {/* Replies */}
                <div className="replies-list">
                  {(commentReplies[replyView.origIdx] || []).length === 0 && (
                    <div className="comments-empty">Пока нет ответов</div>
                  )}
                  {(commentReplies[replyView.origIdx] || []).map((r, j) => {
                    const key = `${replyView.origIdx}-${j}`
                    return (
                      <div key={j} className="comment-item reply-item">
                        <CommentItem name={r.name} ini={r.ini} navigate={navigate} avatarClass="c-avatar" nameClass="c-name" date={r.date}>
                          <div className="c-text">{r.text}</div>
                          <div className="c-actions">
                            <button className={`c-like${likedReplies.has(key) ? ' liked' : ''}`} onClick={() => toggleReplyLike(key)}>
                              <svg width="11" height="11" fill={likedReplies.has(key) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                              </svg>
                              {r.likes + (likedReplies.has(key) ? 1 : 0)}
                            </button>
                            <button className={`c-like c-dislike${dislikedReplies.has(key) ? ' disliked' : ''}`} onClick={() => toggleReplyDislike(key)}>
                              <svg width="11" height="11" fill={dislikedReplies.has(key) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                                <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                              </svg>
                              {(r.dislikes || 0) + (dislikedReplies.has(key) ? 1 : 0)}
                            </button>
                          </div>
                        </CommentItem>
                      </div>
                    )
                  })}
                </div>
                <form className="comments-input" onSubmit={handleSubmitReply}>
                  <input
                    className="c-input"
                    placeholder="Написать ответ..."
                    value={replyInput}
                    onChange={e => setReplyInput(e.target.value)}
                  />
                  <button type="submit" className="c-submit">Отправить</button>
                </form>
              </>
            )}
          </div>
        )}

        {/* Toast */}
        <div className={`toast${toast ? ' show' : ''}`} style={{ left: `calc(50% + ${sidebarOffset}px)` }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast}
        </div>

      </main>

      <ConfirmDeleteModal
        open={confirmDelete}
        onConfirm={handleDeleteArticle}
        onCancel={() => setConfirmDelete(false)}
      />

      {showAddToSet && (
        <AddToSetModal
          articleId={id}
          onClose={() => setShowAddToSet(false)}
          onSaved={setName => showToastMsg(`Статья прикреплена к набору «${setName}»`)}
        />
      )}

    </PublicLayout>
  )
}
