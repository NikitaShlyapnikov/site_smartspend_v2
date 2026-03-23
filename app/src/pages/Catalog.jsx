import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import { useAuthModal } from '../components/AuthModal'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'
import { catalogSets } from '../data/mock'

const CATALOG_SPOTLIGHT = [
  { targetId: 'sp-cat-filters', btnId: null,           title: 'Фильтры каталога',   desc: 'Фильтруй наборы по категориям, типу и источнику — SmartSpend, сообщество или твои собственные.' },
  { targetId: 'sp-cat-grid',    btnId: 'sp-cat-create', title: 'Наборы',              desc: 'Готовые наборы товаров. Открой набор, чтобы посмотреть состав и добавить в свой конверт. Или создай свой.' },
]

function loadLikes() {
  try { return new Set(JSON.parse(localStorage.getItem('ss_catalog_likes') || '[]')) } catch { return new Set() }
}
function saveLikes(set) {
  try { localStorage.setItem('ss_catalog_likes', JSON.stringify([...set])) } catch {}
}


const CATEGORIES = [
  { id: 'all',        label: 'Все'                   },
  { id: 'food',       label: 'Еда и Супермаркеты'    },
  { id: 'cafe',       label: 'Кафе, Бары, Рестораны' },
  { id: 'transport',  label: 'Авто и Транспорт'      },
  { id: 'home',       label: 'Дом и Техника'         },
  { id: 'clothes',    label: 'Одежда и Обувь'        },
  { id: 'leisure',    label: 'Развлечения и Хобби'   },
  { id: 'health',     label: 'Красота и Здоровье'    },
  { id: 'education',  label: 'Образование и Дети'    },
  { id: 'travel',     label: 'Путешествия и Отдых'   },
  { id: 'other',      label: 'Прочие расходы'        },
]

const VALID_CATS = CATEGORIES.map(c => c.id)

const SOURCE_MODES = [
  { id: 'all',       label: 'Все' },
  { id: 'ss',        label: 'SmartSpend' },
  { id: 'community', label: 'Сообщество' },
  { id: 'own',       label: 'Мои' },
  { id: 'liked',     label: 'Избранное' },
]

const SORT_OPTIONS = [
  { id: 'popular', label: 'По популярности' },
  { id: 'newest',  label: 'Сначала новые' },
]

function SortDropdown({ sort, onSort }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = SORT_OPTIONS.find(o => o.id === sort)

  return (
    <div className="sort-wrap" ref={ref}>
      <span className="sort-label-txt">Сортировка:</span>
      <button className={`sort-btn${open ? ' open' : ''}${sort !== 'popular' ? ' active' : ''}`} onClick={() => setOpen(o => !o)}>
        <span>{current?.label || 'По популярности'}</span>
        <svg className="sort-btn-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div className={`sort-dropdown sort-dropdown--left${open ? ' open' : ''}`}>
        {SORT_OPTIONS.map(opt => (
          <div key={opt.id} className={`sort-option${sort === opt.id ? ' active' : ''}`} onClick={() => { onSort(opt.id); setOpen(false) }}>
            {opt.label}
            <svg className="sort-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── AUTHOR HELPERS ────────────────────────────────────────────────────────────

const AUTHOR_COLORS = ['#7B9E8A','#8A7B9E','#9E8A7B','#7B8A9E','#9E7B8A','#8A9E7B','#7B9E9E']
function authorFromUsername(username) {
  const parts = username.split(/[_\s]/)
  const name = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : username.slice(0, 2).toUpperCase()
  const colorIdx = username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AUTHOR_COLORS.length
  return { name, initials, color: AUTHOR_COLORS[colorIdx], followers: 80 + (username.length * 17), articles: username.length % 6, sets: 3 + username.length % 9 }
}

function AuthorPopoverCard({ author, onMouseEnter, onMouseLeave, navigate, style }) {
  const [following, setFollowing] = useState(false)
  const [followAnim, setFollowAnim] = useState(false)
  function handleFollow() { setFollowAnim(true); setTimeout(() => setFollowAnim(false), 450); setFollowing(f => !f) }
  return (
    <div className="author-popover" style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={e => e.stopPropagation()}>
      <div className="ap-top">
        <div className="ap-avatar" style={{ background: author.color }}>{author.initials}</div>
        <button className={`ap-follow-btn${following ? ' following' : ''}${followAnim ? ' follow-pop' : ''}`} onClick={handleFollow}>
          {following ? 'Отменить подписку' : 'Подписаться'}
        </button>
      </div>
      <button className="ap-name" onClick={e => { e.stopPropagation() }}>{author.name}</button>
      <div className="ap-meta">
        {author.followers.toLocaleString('ru')} подписчиков · {author.sets} наборов
        {author.articles > 0 && <> · {author.articles} статей</>}
      </div>
    </div>
  )
}

function AuthorBottomSheet({ author, onClose, navigate }) {
  const [following, setFollowing] = useState(false)
  const [followAnim, setFollowAnim] = useState(false)
  const touchStartY = useRef(0)
  function handleFollow() { setFollowAnim(true); setTimeout(() => setFollowAnim(false), 450); setFollowing(f => !f) }
  return createPortal(
    <>
      <div className="abs-backdrop" onClick={onClose} />
      <div className="author-bottom-sheet"
        onTouchStart={e => { touchStartY.current = e.touches[0].clientY }}
        onTouchMove={e => { if (e.touches[0].clientY - touchStartY.current > 64) onClose() }}
      >
        <div className="abs-handle" />
        <div className="ap-top">
          <div className="ap-avatar" style={{ background: author.color }}>{author.initials}</div>
          <button className={`ap-follow-btn${following ? ' following' : ''}${followAnim ? ' follow-pop' : ''}`} onClick={handleFollow}>
            {following ? 'Отменить подписку' : 'Подписаться'}
          </button>
        </div>
        <button className="ap-name" onClick={onClose}>{author.name}</button>
        <div className="ap-meta">
          {author.followers.toLocaleString('ru')} подписчиков · {author.sets} наборов
          {author.articles > 0 && <> · {author.articles} статей</>}
        </div>
      </div>
    </>,
    document.body
  )
}

function AuthorChip({ username, navigate }) {
  const [showCard, setShowCard] = useState(false)
  const [showSheet, setShowSheet] = useState(false)
  const [popPos, setPopPos] = useState(null)
  const showTimer = useRef(null)
  const hideTimer = useRef(null)
  const chipRef = useRef(null)
  const author = authorFromUsername(username)
  const isTouch = () => window.matchMedia('(hover: none)').matches

  function handleClick(e) {
    e.stopPropagation()
    if (isTouch()) setShowSheet(true)
  }
  function onEnter() {
    if (isTouch()) return
    clearTimeout(hideTimer.current)
    showTimer.current = setTimeout(() => {
      if (chipRef.current) {
        const r = chipRef.current.getBoundingClientRect()
        setPopPos({ top: r.bottom + 8, left: r.left })
      }
      setShowCard(true)
    }, 350)
  }
  function onLeave() {
    if (isTouch()) return
    clearTimeout(showTimer.current)
    hideTimer.current = setTimeout(() => setShowCard(false), 180)
  }

  return (
    <span className="author-chip-wrap" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button className="author-chip" ref={chipRef} onClick={handleClick}>
        <div className="author-avatar-sm" style={{ background: author.color }}>{author.initials}</div>
        <span className="author-name-inline">{author.name}</span>
      </button>
      {showCard && popPos && createPortal(
        <AuthorPopoverCard author={author} navigate={navigate}
          style={{ position: 'fixed', top: popPos.top, left: popPos.left }}
          onMouseEnter={() => clearTimeout(hideTimer.current)} onMouseLeave={onLeave} />,
        document.body
      )}
      {showSheet && <AuthorBottomSheet author={author} navigate={navigate} onClose={() => setShowSheet(false)} />}
    </span>
  )
}

// ── FEED-STYLE ACTIONS ────────────────────────────────────────────────────────

const EMOJI_ANIM = { '🔥':'fire','😂':'laugh','💡':'bulb','🤯':'mindblown','💸':'money','👏':'clap','❤️':'heart','✨':'sparkle','🎉':'party','💪':'flex' }
const EMOJI_DUR  = { fire:900, laugh:650, bulb:1400, mindblown:1100, money:1000, clap:500, heart:1000, sparkle:1200, party:750, flex:1100 }

function ReactionPill({ emoji, count, active, onToggle }) {
  const [popping, setPopping] = useState(false)
  const [emojiAnim, setEmojiAnim] = useState(false)
  const [particles, setParticles] = useState([])

  function handleClick(e) {
    e.stopPropagation()
    setPopping(true)
    setTimeout(() => setPopping(false), 400)
    const key = EMOJI_ANIM[emoji]
    if (key) { setEmojiAnim(true); setTimeout(() => setEmojiAnim(false), EMOJI_DUR[key] + 50) }
    if (!active) {
      const newP = Array.from({ length: 6 }, (_, i) => ({ id: Date.now() + i, angle: i * 60 + Math.random() * 20 - 10, dist: 22 + Math.random() * 10 }))
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

function LikeBtn({ liked, count, onToggle }) {
  const [anim, setAnim] = useState(false)
  const [sparks, setSparks] = useState([])
  function handleClick(e) {
    e.stopPropagation()
    setAnim(true)
    setTimeout(() => setAnim(false), 480)
    if (!liked) {
      const s = Array.from({ length: 6 }, (_, i) => ({ id: Date.now() + i, angle: i * 60 + Math.random() * 18 - 9, dist: 16 + Math.random() * 8 }))
      setSparks(s)
      setTimeout(() => setSparks([]), 560)
    }
    onToggle()
  }
  return (
    <div className="action-wrap">
      <button className={`fa-action-btn${liked ? ' liked' : ''}${anim ? ' like-pop' : ''}`} onClick={handleClick} title="Нравится">
        <svg width="16" height="16" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

function DislikeBtn({ disliked, onToggle }) {
  const [anim, setAnim] = useState(false)
  function handleClick(e) {
    e.stopPropagation()
    setAnim(true)
    setTimeout(() => setAnim(false), 420)
    onToggle()
  }
  return (
    <button className={`fa-action-btn fa-action-dislike${disliked ? ' active' : ''}${anim ? ' dislike-shake' : ''}`} onClick={handleClick} title="Не нравится">
      <svg width="16" height="16" fill={disliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
        <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
      </svg>
    </button>
  )
}

function BookmarkBtn({ bookmarked, onToggle }) {
  const [anim, setAnim] = useState(false)
  const [fly, setFly] = useState(false)
  function handleClick(e) {
    e.stopPropagation()
    setAnim(true)
    setTimeout(() => setAnim(false), 420)
    if (!bookmarked) { setFly(true); setTimeout(() => setFly(false), 520) }
    onToggle()
  }
  return (
    <div className="action-wrap">
      <button className={`fa-action-btn fa-action-bookmark${bookmarked ? ' active' : ''}${anim ? ' bookmark-snap' : ''}`} onClick={handleClick} title="В избранное">
        <svg width="16" height="16" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
      {fly && <span className="bookmark-fly">✦</span>}
    </div>
  )
}

const SS_AUTHOR = { name: 'SmartSpend', initials: 'SS', color: '#4E8268', followers: 12400, articles: 47, sets: 14, desc: 'Официальные наборы и статьи от команды SmartSpend' }

function SmartSpendChip() {
  const [showCard, setShowCard] = useState(false)
  const [popPos, setPopPos] = useState(null)
  const [following, setFollowing] = useState(false)
  const [followAnim, setFollowAnim] = useState(false)
  const showTimer = useRef(null)
  const hideTimer = useRef(null)
  const chipRef = useRef(null)

  const isTouch = () => window.matchMedia('(hover: none)').matches

  function onEnter() {
    if (isTouch()) return
    clearTimeout(hideTimer.current)
    showTimer.current = setTimeout(() => {
      if (chipRef.current) {
        const r = chipRef.current.getBoundingClientRect()
        setPopPos({ top: r.bottom + 8, left: r.left })
      }
      setShowCard(true)
    }, 350)
  }
  function onLeave() {
    if (isTouch()) return
    clearTimeout(showTimer.current)
    hideTimer.current = setTimeout(() => setShowCard(false), 180)
  }
  function handleFollow() { setFollowAnim(true); setTimeout(() => setFollowAnim(false), 450); setFollowing(f => !f) }

  return (
    <span className="author-chip-wrap" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button className="author-chip" ref={chipRef} onClick={e => e.stopPropagation()}>
        <div className="author-avatar-sm" style={{ background: SS_AUTHOR.color, fontSize: 9, fontWeight: 700 }}>SS</div>
        <span className="author-name-inline">SmartSpend</span>
      </button>
      {showCard && popPos && createPortal(
        <div
          className="author-popover"
          style={{ position: 'fixed', top: popPos.top, left: popPos.left }}
          onMouseEnter={() => clearTimeout(hideTimer.current)}
          onMouseLeave={onLeave}
          onClick={e => e.stopPropagation()}
        >
          <div className="ap-top">
            <div className="ap-avatar" style={{ background: SS_AUTHOR.color, fontSize: 13, fontWeight: 700 }}>SS</div>
            <button className={`ap-follow-btn${following ? ' following' : ''}${followAnim ? ' follow-pop' : ''}`} onClick={handleFollow}>
              {following ? 'Отменить подписку' : 'Подписаться'}
            </button>
          </div>
          <div className="ap-name">{SS_AUTHOR.name}</div>
          <div className="ap-meta">
            {SS_AUTHOR.followers.toLocaleString('ru')} подписчиков · {SS_AUTHOR.sets} наборов · {SS_AUTHOR.articles} статей
          </div>
          {SS_AUTHOR.desc && <p className="ap-desc">{SS_AUTHOR.desc}</p>}
        </div>,
        document.body
      )}
    </span>
  )
}

function CatalogCard({ set, isLiked, isDisliked, isBookmarked, onLike, onDislike, onBookmark, onCategoryClick, navigate, username }) {
  const catLabel = CATEGORIES.find(c => c.id === set.category)?.label
  const totalItems = set.items.length + (set.more || 0)
  const [reactions, setReactions] = useState(() => (set.reactions || []).map(r => ({ ...r })))
  const [myReactions, setMyReactions] = useState(new Set())

  function toggleReaction(emoji) {
    setMyReactions(prev => {
      const next = new Set(prev)
      const hadIt = next.has(emoji)
      hadIt ? next.delete(emoji) : next.add(emoji)
      setReactions(rs => rs.map(r => r.emoji === emoji ? { ...r, count: r.count + (hadIt ? -1 : 1) } : r))
      return next
    })
  }

  const effectiveFullCost = set.fullCost || set.monthly || set.amount

  const authorRow = set.source === 'ss'
    ? <SmartSpendChip />
    : set.source === 'own'
      ? <AuthorChip username={username || 'я'} navigate={navigate} />
      : set.addedBy
        ? <AuthorChip username={set.addedBy} navigate={navigate} />
        : null

  return (
    <div className="catalog-card" onClick={() => navigate(`/set/${set.id}`)}>
      {authorRow && (
        <div className="card-author-row" onClick={e => e.stopPropagation()}>
          {authorRow}
          {catLabel && <><span className="fa-sep">·</span><button className="fa-category" onClick={e => { e.stopPropagation(); onCategoryClick(set.category) }}>{catLabel}</button></>}
        </div>
      )}
      <div className="card-body">
        <div>
          <div className="card-title">{set.title}</div>
          <div className="card-desc">{set.desc}</div>
        </div>
      </div>
      <div className="card-cost-row">
        <div className="card-cost-item card-cost-monthly">
          <div className="card-cost-val">{(set.monthly || set.amount).toLocaleString('ru')} ₽</div>
          <div className="card-cost-lbl">в месяц</div>
        </div>
        <div className="card-cost-sep" />
        <div className="card-cost-item">
          <div className="card-cost-val">{set.period || '—'}</div>
          <div className="card-cost-lbl">период</div>
        </div>
        <div className="card-cost-sep" />
        <div className="card-cost-item">
          <div className="card-cost-val">{effectiveFullCost.toLocaleString('ru')} ₽</div>
          <div className="card-cost-lbl">полная стоимость</div>
        </div>
        <div className="card-cost-sep" />
        <div className="card-cost-item">
          <div className="card-cost-val">
            {set.private ? (
              <span style={{display:'flex',alignItems:'center',gap:3}}>
                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                Приватный
              </span>
            ) : fmtUsers(set.users)}
          </div>
          <div className="card-cost-lbl">подписчиков</div>
        </div>
      </div>
      <div className="card-bottom" onClick={e => e.stopPropagation()}>
        <LikeBtn liked={isLiked} count={(set.likes || 0) + (isLiked ? 1 : 0)} onToggle={onLike} />
        {set.comments > 0 && (
          <button className="fa-action-stat fa-action-stat--btn" onClick={() => navigate(`/set/${set.id}`)}>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {set.comments}
          </button>
        )}
        <DislikeBtn disliked={isDisliked} onToggle={onDislike} />
        <BookmarkBtn bookmarked={isBookmarked} onToggle={onBookmark} />
        {reactions.length > 0 && (
          <>
            <span className="fa-reactions-sep" />
            {reactions.map(r => (
              <ReactionPill key={r.emoji} emoji={r.emoji} count={r.count} active={myReactions.has(r.emoji)} onToggle={toggleReaction} />
            ))}
          </>
        )}
        <div className="f-spacer" />
        <div className="fa-time">
          {totalItems} позиций
          {set.articles > 0 && <> · {set.articles} {set.articles === 1 ? 'статья' : set.articles < 5 ? 'статьи' : 'статей'}</>}
        </div>
      </div>
    </div>
  )
}

// ── FILTER SELECT ─────────────────────────────────────────────────────────────

// value = Set of selected ids; onChange(id) toggles; onChange('__clear__') clears all
function FilterSelect({ items, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open])

  const selectable = items.filter(i => i.id !== 'all')
  const selected   = selectable.filter(i => value.has(i.id))

  return (
    <div className="fsel-wrap" ref={ref}>
      <div className="fsel-bar">
        {selected.map(item => (
          <button key={item.id} className="fsel-chip" onClick={() => onChange(item.id)}>
            {item.label}
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/>
            </svg>
          </button>
        ))}
        <button className={`fsel-btn${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
          {selected.length === 0 && <span>{placeholder}</span>}
          <svg className="fsel-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
      {open && (
        <div className="fsel-panel">
          {value.size > 0 && (
            <button className="fsel-clear" onClick={() => onChange('__clear__')}>Сбросить выбор</button>
          )}
          {selectable.map(item => (
            <button
              key={item.id}
              className={`fsel-option${value.has(item.id) ? ' active' : ''}`}
              onClick={() => onChange(item.id)}
            >
              {item.label}
              {value.has(item.id) && (
                <svg className="fsel-check" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function fmtUsers(n) {
  if (n === null || n === undefined) return null
  if (n >= 10000) return Math.round(n / 1000) + 'k'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return String(n)
}

export default function Catalog() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initCatId = VALID_CATS.includes(searchParams.get('cat')) && searchParams.get('cat') !== 'all' ? searchParams.get('cat') : null
  const authed = localStorage.getItem('ss_auth') === 'true'
  const username = localStorage.getItem('ss_username') || 'я'

  const [cat, setCat]             = useState(() => initCatId ? new Set([initCatId]) : new Set())
  const [sourceFilter, setSrc]    = useState('all')
  const [sortFilter, setSort]     = useState('popular')
  const [likedSets, setLikedSets] = useState(loadLikes)
  const [itemSearch, setItemSearch] = useState('')
  const [catalogLikes, setCatalogLikes] = useState(new Set())
  const [catalogDislikes, setCatalogDislikes] = useState(new Set())
  const { modal: authModal, requireAuth } = useAuthModal()
  const [showSpotlight, setShowSpotlight] = useState(false)

  function toggleLike(id, e) {
    e.stopPropagation()
    if (!requireAuth()) return
    setLikedSets(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      saveLikes(next)
      return next
    })
  }

  function handleSourceFilter(id) {
    if ((id === 'liked' || id === 'own') && !authed) { requireAuth(); return }
    setSrc(id)
  }

  function handleCatChange(id) {
    if (id === '__clear__') { setCat(new Set()); return }
    setCat(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const itemQuery = itemSearch.trim().toLowerCase()

  // Filter + sort
  let filtered = catalogSets.filter(s => {
    if (cat.size > 0 && !cat.has(s.category)) return false
    if (sourceFilter === 'liked') return likedSets.has(s.id)
    if (sourceFilter !== 'all' && s.source !== sourceFilter) return false
    if (itemQuery) {
      const inItems = s.items.some(item => item.toLowerCase().includes(itemQuery))
      const inTitle = s.title.toLowerCase().includes(itemQuery)
      if (!inItems && !inTitle) return false
    }
    return true
  })

  filtered = [...filtered].sort(
    sortFilter === 'newest'
      ? (a, b) => new Date(b.added) - new Date(a.added)
      : (a, b) => (b.users || 0) - (a.users || 0)
  )


  const hasFilters = cat.size > 0 || sourceFilter !== 'all' || sortFilter !== 'popular' || itemSearch.trim() !== ''

  function resetFilters() {
    setCat(new Set()); setSrc('all'); setSort('popular'); setItemSearch('')
  }

  const fmtDate = iso => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

  return (
    <PublicLayout>
      <main className="catalog-main">
        {/* Header */}
        <div className="catalog-header">
          <div className="catalog-page-header">
            <div>
              <div className="page-title" style={{display:'flex',alignItems:'center',gap:10}}>
                Наборы
                <HelpButton seenKey="ss_spl_catalog" onOpen={() => setShowSpotlight(true)} />
              </div>
              <div className="page-subtitle">Готовые наборы товаров от SmartSpend и сообщества</div>
            </div>
          </div>
        </div>

        {/* Sticky Filters */}
        <div id="sp-cat-filters" className="catalog-filters-bar">
          <div className="filters-block">
            {/* Row 1: source pills */}
            <div className="cats-scroll feed-mode-pills">
              {SOURCE_MODES.map(m => (
                <button key={m.id} className={`cat-pill${sourceFilter === m.id ? ' active' : ''}`}
                  onClick={() => handleSourceFilter(m.id)}>{m.label}</button>
              ))}
            </div>

            {/* Row 2: sort */}
            <SortDropdown sort={sortFilter} onSort={setSort} />

            {/* Row 3: categories */}
            <FilterSelect
              items={CATEGORIES}
              value={cat}
              onChange={handleCatChange}
              placeholder="Категории"
            />

            {hasFilters && (
              <div className="filter-summary">
                <span>{filtered.length} {noun(filtered.length)}</span>
                <button className="reset-btn" onClick={resetFilters}>Сбросить</button>
              </div>
            )}

            {/* Row 4: item search */}
            <div className="catalog-search-row">
              <div className="catalog-search-wrap">
                <svg className="catalog-search-icon" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  className="catalog-search-input"
                  type="text"
                  placeholder="Поиск по составу набора..."
                  value={itemSearch}
                  onChange={e => setItemSearch(e.target.value)}
                />
                {itemSearch && (
                  <button className="catalog-search-clear" onClick={() => setItemSearch('')}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Grid */}
        <div className="catalog-scroll">
        <div id="sp-cat-grid" className="catalog-grid">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-title">Наборов не найдено</div>
              <div className="empty-state-desc">Попробуйте изменить фильтры</div>
            </div>
          ) : filtered.map(set => (
            <CatalogCard
              key={set.id}
              set={set}
              isLiked={catalogLikes.has(set.id)}
              isDisliked={catalogDislikes.has(set.id)}
              isBookmarked={likedSets.has(set.id)}
              onLike={() => { if (!requireAuth()) return; setCatalogLikes(prev => { const n = new Set(prev); n.has(set.id) ? n.delete(set.id) : n.add(set.id); if (n.has(set.id)) setCatalogDislikes(p => { const d = new Set(p); d.delete(set.id); return d }); return n }) }}
              onDislike={() => { if (!requireAuth()) return; setCatalogDislikes(prev => { const n = new Set(prev); n.has(set.id) ? n.delete(set.id) : n.add(set.id); if (n.has(set.id)) setCatalogLikes(p => { const l = new Set(p); l.delete(set.id); return l }); return n }) }}
              onBookmark={() => { if (!requireAuth()) return; setLikedSets(prev => { const next = new Set(prev); next.has(set.id) ? next.delete(set.id) : next.add(set.id); saveLikes(next); return next }) }}
              onCategoryClick={handleCatChange}
              navigate={navigate}
              username={username}
            />
          ))}

          {/* "Мои" hint card */}
          {sourceFilter === 'own' && (
            <div className="my-sets-hint" onClick={() => navigate('/create-set')}>
              <div className="my-sets-hint-icon">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
              <div>
                <div className="my-sets-hint-title">Создать свой набор</div>
                <div className="my-sets-hint-desc">Подберите товары под свои нужды и добавьте в конверт</div>
              </div>
            </div>
          )}
        </div>
        </div>
      </main>
      {authModal}
      {showSpotlight && <SpotlightTour steps={CATALOG_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
    </PublicLayout>
  )
}

function noun(n) {
  const m = n % 10, c = n % 100
  if (m === 1 && c !== 11) return 'набор'
  if (m >= 2 && m <= 4 && (c < 10 || c >= 20)) return 'набора'
  return 'наборов'
}
