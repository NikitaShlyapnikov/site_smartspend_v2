import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import { articles } from '../data/mock'

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

const REACTION_EMOJIS = [
  '🔥','💡','😍','🤯','💸','🤮','🤔','👏',
  '😮','💪','🎯','🙏','❤️','😂','🥰','😅',
  '💯','✨','🎉','👀','🥲','😤','🫡','🤝',
]

function EmojiPicker({ onPick, onClose }) {
  const [popping, setPopping] = useState(null)
  const ref = useRef(null)
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  function handlePick(emoji) {
    setPopping(emoji)
    setTimeout(() => { onPick(emoji); onClose() }, 260)
  }

  return (
    <div className="emoji-picker" ref={ref}>
      {REACTION_EMOJIS.map(emoji => (
        <button key={emoji} className={`ep-btn${popping === emoji ? ' ep-pop' : ''}`} onClick={() => handlePick(emoji)}>{emoji}</button>
      ))}
    </div>
  )
}

const EMOJI_ANIM = { '🔥':'fire','😂':'laugh','💡':'bulb','🤯':'mindblown','💸':'money','👏':'clap','❤️':'heart','✨':'sparkle','🎉':'party','💪':'flex' }
const EMOJI_DUR  = { fire:900, laugh:650, bulb:1400, mindblown:1100, money:1000, clap:500, heart:1000, sparkle:1200, party:750, flex:1100 }

function ArticleReactionPill({ emoji, count, active, onToggle }) {
  const [popping, setPopping] = useState(false)
  const [emojiAnim, setEmojiAnim] = useState(false)
  const [particles, setParticles] = useState([])
  function handleClick() {
    setPopping(true)
    setTimeout(() => setPopping(false), 400)
    const key = EMOJI_ANIM[emoji]
    if (key) {
      setEmojiAnim(true)
      setTimeout(() => setEmojiAnim(false), EMOJI_DUR[key] + 50)
    }
    if (!active) {
      const newP = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() + i, angle: i * 72 + Math.random() * 20 - 10, dist: 20 + Math.random() * 10,
      }))
      setParticles(newP)
      setTimeout(() => setParticles([]), 600)
    }
    onToggle(emoji)
  }
  return (
    <div className="r-pill-wrap">
      <button className={`fa-reaction${active ? ' active' : ''}${popping ? ' popping' : ''}`} onClick={handleClick}>
        <span className={`r-emoji${emojiAnim && EMOJI_ANIM[emoji] ? ` r-emoji--${EMOJI_ANIM[emoji]}` : ''}`}>{emoji}</span>
        <span className="r-count">{count}</span>
      </button>
      {particles.map(p => (
        <span key={p.id} className="r-particle" style={{ '--angle': `${p.angle}deg`, '--dist': `${p.dist}px` }}>{emoji}</span>
      ))}
    </div>
  )
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

function isMyArticle(articleId) {
  try {
    const ids = JSON.parse(localStorage.getItem('ss_my_article_ids')) || []
    return ids.includes(articleId)
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
  const [toast, setToast] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showAddToSet, setShowAddToSet] = useState(false)
  const [myReactions, setMyReactions] = useState(new Set())
  const [showPicker, setShowPicker] = useState(false)
  const [reactions, setReactions] = useState(() => {
    const found = articles.find(a => a.id === id)
    const src = found?.reactions?.length ? found.reactions : [{ emoji: '🔥', count: 14 }, { emoji: '💡', count: 8 }, { emoji: '😍', count: 5 }]
    return src.map(r => ({ ...r }))
  })

  const isMine = isMyArticle(id)
  const article = articles.find(a => a.id === id)

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

  const sortedComments = [...(article.comments || [])].sort(
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

  function handleEditArticle() {
    navigate('/create-article')
    showToastMsg('Открыт редактор статьи')
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
            <div className="hero-title">{article.title}</div>
            <div className="hero-desc">{article.preview}</div>

            <div className="art-meta-row">
              <div className="fa-action-stat">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                {fmtNum(article.views)}
              </div>
              <ArticleLikeBtn liked={liked} count={article.likes + (liked ? 1 : 0)} onToggle={toggleLike} />
              {article.comments?.length > 0 && (
                <button className="fa-action-stat fa-action-stat--btn" onClick={() => commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  {article.comments.length}
                </button>
              )}
              <ArticleDislikeBtn disliked={disliked} onToggle={toggleDislike} />
              <ArticleBookmarkBtn bookmarked={bookmarked} onToggle={() => setBookmarked(b => !b)} />
              <div className="f-spacer" />
              <span className="fa-time">{article.date}{article.readTime ? ` · ${article.readTime} мин` : ''}</span>
            </div>

            <div className="art-actions-row">
              <button className="btn-secondary art-add-set-btn" onClick={() => setShowAddToSet(true)}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  <circle cx="19" cy="19" r="3.5" fill="var(--surface)" stroke="currentColor" strokeWidth="2"/>
                  <path d="M19 17.5v3M17.5 19h3"/>
                </svg>
                Добавить к набору
              </button>
              {isMine && (
                <>
                  <button className="btn-secondary" onClick={handleEditArticle}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                    Редактировать
                  </button>
                  <button className="btn-secondary btn-author-delete" onClick={() => setConfirmDelete(true)}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    </svg>
                    Удалить
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Author inside hero */}
          <div className="hero-author">
            <div className="author-avatar" style={{ background: article.authorColor, cursor: 'pointer' }}
              onClick={() => navigate('/author/' + (article.authorId || 'unknown'), { state: {
                name: article.author, ini: article.authorInitials,
                handle: '@' + (article.author || '').toLowerCase().replace(/\s+/g, '_'),
                bio: article.authorBio, color: article.authorColor,
                followers: '—', articles: 0, sets: 0, following: false,
              }})}>
              {article.authorInitials}
            </div>
            <div className="author-info" style={{ cursor: 'pointer' }}
              onClick={() => navigate('/author/' + (article.authorId || 'unknown'), { state: {
                name: article.author, ini: article.authorInitials,
                handle: '@' + (article.author || '').toLowerCase().replace(/\s+/g, '_'),
                bio: article.authorBio, color: article.authorColor,
                followers: '—', articles: 0, sets: 0, following: false,
              }})}>
              <div className="author-name">{article.author}</div>
              {article.authorBio && <div className="author-bio">{article.authorBio}</div>}
            </div>
            <FollowBtn following={isFollowing} onToggle={() => setFollowing(f => !f)} />
          </div>
        </div>

        {/* Article content */}
        <div className="content-card">
          <div className="content-body">
            {article.content.map((block, i) => renderBlock(block, i))}
          </div>
        </div>

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
            <div className="card-accent-bar" style={{ background: set.color }} />
            <div className="card-body">
              <div className="card-badges">
                <span className={`source-badge ${set.source}`}>
                  {set.source === 'ss' ? 'SmartSpend' : set.source === 'community' ? 'Сообщество' : 'Моё'}
                </span>
                <span className="base-badge">{set.type === 'base' ? 'Основа' : 'Дополнение'}</span>
              </div>
              <div className="card-title">{set.title}</div>
              <div className="card-desc">{set.desc}</div>
            </div>
            <div className="card-footer">
              <div className="card-amount-left">
                <div className="card-amount">{set.amount.toLocaleString('ru')}&thinsp;₽</div>
                <div className="card-amount-label">{set.amountLabel}</div>
              </div>
              <div className="card-meta-right">
                {set.users != null && (
                  <div className="users-count">
                    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                    {fmtNum(set.users)}
                  </div>
                )}
                {set.added && (
                  <div className="card-date">
                    с {new Date(set.added).toLocaleDateString('ru', { month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
          </div>
          </>
        )}

        {/* Comments */}
        {article.comments && article.comments.length > 0 && (
          <div className="section-card" ref={commentsRef}>
            <div className="section-header">
              <div className="section-title">
                Комментарии
                <span className="section-count">{article.comments.length}</span>
              </div>
            </div>

            {/* Emoji reactions */}
            <div className="art-reactions-row">
              <span className="art-reactions-label">Что вы думаете?</span>
              {reactions.map(r => (
                <ArticleReactionPill key={r.emoji} emoji={r.emoji} count={r.count} active={myReactions.has(r.emoji)} onToggle={toggleReaction} />
              ))}
              <div style={{ position: 'relative' }}>
                <button className="ar-add-btn" onClick={() => setShowPicker(p => !p)} title="Добавить реакцию">
                  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                </button>
                {showPicker && <EmojiPicker onPick={emoji => { toggleReaction(emoji); setShowPicker(false) }} onClose={() => setShowPicker(false)} />}
              </div>
            </div>

            <div className="comments-subheader">
              <div className="csort">
                <button className={`c-sort-btn${commentSort === 'new' ? ' active' : ''}`} onClick={() => setCommentSort('new')}>Новые</button>
                <button className={`c-sort-btn${commentSort === 'top' ? ' active' : ''}`} onClick={() => setCommentSort('top')}>Популярные</button>
              </div>
            </div>
            <div className="comments-list">
              {displayComments.map((c, i) => (
                <div key={i} className="comment-item">
                  <div className="c-avatar">{c.ini}</div>
                  <div className="c-body">
                    <div className="c-header">
                      <span className="c-name">{c.name}</span>
                      <span className="c-date">{c.date}</span>
                    </div>
                    <div className="c-text">{c.text}</div>
                    <div className="c-actions">
                      <button
                        className={`c-like${likedComments.has(i) ? ' liked' : ''}`}
                        onClick={() => toggleCommentLike(i)}
                      >
                        <svg width="11" height="11" fill={likedComments.has(i) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                        </svg>
                        {c.likes + (likedComments.has(i) ? 1 : 0)}
                      </button>
                      <button
                        className={`c-like c-dislike${dislikedComments.has(i) ? ' disliked' : ''}`}
                        onClick={() => toggleCommentDislike(i)}
                      >
                        <svg width="11" height="11" fill={dislikedComments.has(i) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                          <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                        </svg>
                        {(c.dislikes || 0) + (dislikedComments.has(i) ? 1 : 0)}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!showAll && article.comments.length > 2 && (
              <div className="show-more-row">
                <button className="btn-show" onClick={() => setShowAll(true)}>
                  Показать ещё {article.comments.length - 2}
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
          </div>
        )}

        {/* Toast */}
        <div className={`toast${toast ? ' show' : ''}`}>
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
