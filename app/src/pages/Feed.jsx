import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'
import FeedEndBlock from '../components/FeedEndBlock'
import { FilterIconBtn } from '../components/FilterDrawer'
import ReactionPill from '../components/ReactionPill'
import { feedItems, feedAuthors } from '../data/mock'

const FEED_SPOTLIGHT = [
  { targetId: 'sp-feed-filters', btnId: null,              title: 'Фильтры и категории',  desc: 'Выбирай категории, тип контента и сортировку — лента подстроится под твои интересы.' },
  { targetId: 'sp-feed-list',    btnId: null,              title: 'Лента статей и наборов', desc: 'Статьи от авторов и готовые наборы из каталога. Нажми на карточку, чтобы открыть подробности.' },
]

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const MODES = [
  { id: null,            label: 'Все' },
  { id: 'subscriptions', label: 'Подписки' },
  { id: 'my-sets',       label: 'Мои наборы' },
  { id: 'liked',         label: 'Избранное' },
]

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

const SORT_OPTIONS = [
  { group: 'Новизна',         id: 'newest',      label: 'Сначала новые' },
  { group: 'По популярности', id: 'popular_7d',  label: 'За 7 дней' },
  { group: 'По популярности', id: 'popular_30d', label: 'За месяц' },
  { group: 'По популярности', id: 'popular_all', label: 'За всё время' },
]

const MY_SET_TITLES = new Set([
  'Корейский уход за кожей',
  'Базовый гардероб на сезон',
  'Базовое питание',
  'Базовый уход за кошкой',
])

const CAT_LABEL_TO_ID = {
  'Еда и Супермаркеты':    'food',
  'Кафе, Бары, Рестораны': 'cafe',
  'Авто и Транспорт':      'transport',
  'Дом и Техника':         'home',
  'Одежда и Обувь':        'clothes',
  'Развлечения и Хобби':   'leisure',
  'Красота и Здоровье':    'health',
  'Образование и Дети':    'education',
  'Путешествия и Отдых':   'travel',
  'Прочие расходы':        'other',
}

function loadUserPublicArticles() {
  try {
    const saved = JSON.parse(localStorage.getItem('ss_account_articles') || '[]')
    const profile = JSON.parse(localStorage.getItem('ss_account_profile') || '{}')
    const regName = localStorage.getItem('ss_username') || ''
    const displayName = profile.displayName || regName || 'Я'
    const ini = displayName[0]?.toUpperCase() || 'Я'
    return saved
      .filter(a => a.pub && !a.draft)
      .map(a => ({
        id: a.id,
        type: 'article',
        ts: parseInt(a.id.slice(1)) || 0,
        pop: 0,
        readTime: parseInt((a.meta || '').match(/(\d+) мин/)?.[1]) || 1,
        title: a.title,
        preview: a.excerpt || '',
        authorId: '__me__',
        time: (a.meta || '').split(' · ')[0] || '',
        views: a.views || 0,
        likes: 0,
        comments: 0,
        reactions: [],
        category: CAT_LABEL_TO_ID[a.category] || '',
        _authorName: displayName,
        _authorIni: ini,
      }))
  } catch { return [] }
}

// ── ARTICLE CARD ──────────────────────────────────────────────────────────────

function AuthorPopoverCard({ author, authorId, navigate, onMouseEnter, onMouseLeave, style }) {
  const [following, setFollowing] = useState(author.following || false)
  const [followAnim, setFollowAnim] = useState(false)
  const isDeleted = author.type === 'deleted'

  function handleNameClick(e) {
    e.stopPropagation()
    navigate(`/author/${authorId}`, { state: { ...author, id: authorId } })
  }

  function handleFollow() {
    setFollowAnim(true)
    setTimeout(() => setFollowAnim(false), 450)
    setFollowing(f => !f)
  }

  return (
    <div className="author-popover" style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={e => e.stopPropagation()}>
      {/* Row 1: avatar + follow button */}
      <div className="ap-top">
        <div
          className="ap-avatar"
          style={{ background: author.color, cursor: isDeleted ? 'default' : 'pointer' }}
          onClick={isDeleted ? undefined : handleNameClick}
        >
          {isDeleted
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a8 8 0 0 0-8 8v10l3-3 3 3 3-3 3 3 3-3V10a8 8 0 0 0-8-8zm-2.5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>
            : author.initials
          }
        </div>
        {!isDeleted && (
          <button
            className={`ap-follow-btn${following ? ' following' : ''}${followAnim ? ' follow-pop' : ''}`}
            onClick={handleFollow}
          >
            {following ? 'Отменить подписку' : 'Подписаться'}
          </button>
        )}
      </div>
      {/* Row 2: name */}
      <button className="ap-name" onClick={handleNameClick}>{author.name}</button>
      {/* Row 3: followers */}
      {author.followers != null && (
        <div className="ap-meta">
          {typeof author.followers === 'number' ? author.followers.toLocaleString('ru') : author.followers} подписчиков
          {author.articles > 0 && <> · {author.articles} статей</>}
          {author.sets > 0 && <> · {author.sets} наборов</>}
        </div>
      )}
      {/* Row 4: description */}
      {author.desc && <p className="ap-desc">{author.desc}</p>}
    </div>
  )
}

function AuthorBottomSheet({ author, authorId, navigate, onClose }) {
  const [following, setFollowing] = useState(author.following || false)
  const [followAnim, setFollowAnim] = useState(false)
  const isDeleted = author.type === 'deleted'
  const touchStartY = useRef(0)

  function handleNameClick() {
    onClose()
    navigate(`/author/${authorId}`, { state: { ...author, id: authorId } })
  }
  function onTouchStart(e) { touchStartY.current = e.touches[0].clientY }
  function onTouchMove(e) { if (e.touches[0].clientY - touchStartY.current > 64) onClose() }

  function handleFollow() {
    setFollowAnim(true)
    setTimeout(() => setFollowAnim(false), 450)
    setFollowing(f => !f)
  }

  return createPortal(
    <>
      <div className="abs-backdrop" onClick={onClose} />
      <div className="author-bottom-sheet" onTouchStart={onTouchStart} onTouchMove={onTouchMove}>
        <div className="abs-handle" />
        <div className="ap-top">
          <div
            className="ap-avatar"
            style={{ background: author.color, cursor: isDeleted ? 'default' : 'pointer' }}
            onClick={isDeleted ? undefined : handleNameClick}
          >
            {isDeleted
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a8 8 0 0 0-8 8v10l3-3 3 3 3-3 3 3 3-3V10a8 8 0 0 0-8-8zm-2.5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>
              : author.initials
            }
          </div>
          {!isDeleted && (
            <button
              className={`ap-follow-btn${following ? ' following' : ''}${followAnim ? ' follow-pop' : ''}`}
              onClick={handleFollow}
            >
              {following ? 'Отменить подписку' : 'Подписаться'}
            </button>
          )}
        </div>
        <button className="ap-name" onClick={handleNameClick}>{author.name}</button>
        {author.followers != null && (
          <div className="ap-meta">
            {typeof author.followers === 'number' ? author.followers.toLocaleString('ru') : author.followers} подписчиков
            {author.articles > 0 && <> · {author.articles} статей</>}
            {author.sets > 0 && <> · {author.sets} наборов</>}
          </div>
        )}
        {author.desc && <p className="ap-desc">{author.desc}</p>}
      </div>
    </>,
    document.body
  )
}

function AuthorChip({ author, authorId, navigate, date }) {
  const [showCard, setShowCard] = useState(false)
  const [showSheet, setShowSheet] = useState(false)
  const [popPos, setPopPos] = useState(null)
  const showTimer = useRef(null)
  const hideTimer = useRef(null)
  const chipRef = useRef(null)

  if (!author) return null

  const isTouch = () => window.matchMedia('(hover: none)').matches
  const isDeleted = author.type === 'deleted'

  function handleClick(e) {
    e.stopPropagation()
    if (isTouch()) {
      setShowSheet(true)
    } else {
      navigate(`/author/${authorId}`, { state: { ...author, id: authorId } })
    }
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
      <button
        ref={chipRef}
        className={`author-chip${isDeleted ? ' author-chip--ghost' : ''}`}
        onClick={handleClick}
        title={isDeleted ? 'Аккаунт удалён' : undefined}
      >
        {isDeleted ? (
          <>
            <span className="author-avatar-sm author-avatar-ghost">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a8 8 0 0 0-8 8v10l3-3 3 3 3-3 3 3 3-3V10a8 8 0 0 0-8-8zm-2.5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
              </svg>
            </span>
            <span className="author-chip-meta">
              <span className="author-name-inline author-name--special">Привидение</span>
              {date && <span className="author-chip-date">{date}</span>}
            </span>
          </>
        ) : (
          <>
            <div className="author-avatar-sm" style={{ background: author.color }}>{author.initials}</div>
            <span className="author-chip-meta">
              <span className="author-name-inline">{author.name}</span>
              {date && <span className="author-chip-date">{date}</span>}
            </span>
          </>
        )}
      </button>
      {showCard && popPos && createPortal(
        <AuthorPopoverCard
          author={author}
          authorId={authorId}
          navigate={navigate}
          style={{ position: 'fixed', top: popPos.top, left: popPos.left }}
          onMouseEnter={() => clearTimeout(hideTimer.current)}
          onMouseLeave={onLeave}
        />,
        document.body
      )}
      {showSheet && (
        <AuthorBottomSheet
          author={author}
          authorId={authorId}
          navigate={navigate}
          onClose={() => setShowSheet(false)}
        />
      )}
    </span>
  )
}

// ReactionPill → shared component (see components/ReactionPill.jsx)

function LikeBtn({ liked, count, onToggle }) {
  const [anim, setAnim] = useState(false)
  const [sparks, setSparks] = useState([])
  function handleClick() {
    setAnim(true)
    setTimeout(() => setAnim(false), 480)
    if (!liked) {
      const s = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        angle: i * 60 + Math.random() * 18 - 9,
        dist: 16 + Math.random() * 8,
      }))
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
  function handleClick() {
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
  function handleClick() {
    setAnim(true)
    setTimeout(() => setAnim(false), 420)
    if (!bookmarked) {
      setFly(true)
      setTimeout(() => setFly(false), 520)
    }
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

function ArticleCard({ item, isRead, isLiked, isDisliked, isBookmarked, onLikeToggle, onDislikeToggle, onBookmarkToggle, onCategoryClick, onClick, navigate }) {
  const author = feedAuthors[item.authorId] || (item._authorName ? { name: item._authorName, initials: item._authorIni, color: '#4E8268', type: 'user' } : null)
  const catLabel = CATEGORIES.find(c => c.id === item.category)?.label
  const [reactions, setReactions] = useState(() => (item.reactions || []).map(r => ({ ...r })))
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

  return (
    <article className={`feed-article${isRead ? ' read' : ''}`} onClick={() => onClick(item)}>

      <h2 className="fa-title">{item.title}</h2>
      <p className="fa-preview">{item.preview}</p>

      {/* Author · Actions · Category+Set — single row */}
      <div className="fa-meta-row" onClick={e => e.stopPropagation()}>
        <AuthorChip
          author={author}
          authorId={item.authorId}
          navigate={navigate}
          date={item.time}
        />

        <div className="fa-meta-actions">
          <LikeBtn liked={isLiked} count={item.likes + (isLiked ? 1 : 0)} onToggle={() => onLikeToggle(item.id)} />
          <DislikeBtn disliked={isDisliked} onToggle={() => onDislikeToggle(item.id)} />
          {item.comments != null && (
            <div className="fa-action-stat">
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {item.comments}
            </div>
          )}
          <BookmarkBtn bookmarked={isBookmarked} onToggle={() => onBookmarkToggle(item.id)} />
        </div>

        <div className="fa-meta-right">
          {catLabel && catLabel !== 'Все' && (
            <button
              className="fa-category"
              onClick={e => { e.stopPropagation(); onCategoryClick(item.category) }}
            >{catLabel}</button>
          )}
          {item.setLink && (
            <span className="fa-set-link" style={{ '--set-clr': item.setLink.color }}>
              {item.setLink.title}
            </span>
          )}
        </div>
      </div>

    </article>
  )
}

// ── SIMPLE SELECT ─────────────────────────────────────────────────────────────

function SimpleSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open])

  const selected = options.find(o => o.id === value)
  const isDefault = value === 'all' || value === null

  return (
    <div className="ssel-wrap" ref={ref}>
      <button
        className={`ssel-btn${open ? ' open' : ''}${!isDefault ? ' active' : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <span className="ssel-label">{label}</span>
        {!isDefault && <span className="ssel-value">{selected?.label}</span>}
        <svg className="ssel-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="ssel-panel">
          {options.map(opt => (
            <button
              key={opt.id ?? 'all'}
              className={`ssel-option${value === opt.id ? ' active' : ''}`}
              onClick={() => { onChange(opt.id); setOpen(false) }}
            >
              {opt.label}
              {value === opt.id && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

// ── SORT DROPDOWN ─────────────────────────────────────────────────────────────

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
  const groups = [...new Set(SORT_OPTIONS.map(o => o.group))]

  function pick(id) { onSort(id); setOpen(false) }

  return (
    <div className="sort-wrap" ref={ref}>
      <span className="sort-label-txt">Сортировка:</span>
      <button className={`sort-btn${open ? ' open' : ''}${sort !== 'popular_7d' ? ' active' : ''}`} onClick={() => setOpen(o => !o)}>
        <span>{current?.group === 'По популярности' ? `По популярности ${current.label.toLowerCase()}` : current?.label}</span>
        <svg className="sort-btn-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div className={`sort-dropdown${open ? ' open' : ''}`}>
        {groups.map((grp, gi) => (
          <div key={grp}>
            {gi > 0 && <div className="sort-divider" />}
            <div className="sort-group-label">{grp}</div>
            {SORT_OPTIONS.filter(o => o.group === grp).map(opt => (
              <div
                key={opt.id}
                className={`sort-option${sort === opt.id ? ' active' : ''}`}
                onClick={() => pick(opt.id)}
              >
                {opt.label}
                <svg className="sort-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TAG SEARCH ─────────────────────────────────────────────────────────────────

function TagSearchInput({ value, onChange, allItems }) {
  const [focused, setFocused] = useState(false)
  const ref = useRef(null)
  const inputRef = useRef(null)

  const query = value.replace(/^#/, '').trim().toLowerCase()

  const allTags = [...new Set(allItems.flatMap(i => i.tags || []))].sort()
  const suggestions = query
    ? allTags.filter(t => t.toLowerCase().includes(query) && t.toLowerCase() !== query)
    : []

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setFocused(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function pick(tag) {
    onChange(tag)
    setFocused(false)
  }

  return (
    <div className="catalog-search-wrap" ref={ref}>
      <svg className="catalog-search-icon" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        ref={inputRef}
        className="catalog-search-input"
        placeholder="Поиск по хэштегу..."
        value={value.replace(/^#/, '')}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
      />
      {value && (
        <button className="catalog-search-clear" onClick={() => { onChange(''); inputRef.current?.focus() }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      )}
      {focused && suggestions.length > 0 && (
        <div className="tag-suggestions">
          {suggestions.slice(0, 8).map(t => (
            <button key={t} className="tag-suggestion" onMouseDown={() => pick(t)}>#{t}</button>
          ))}
        </div>
      )}
      {focused && !query && (
        <div className="tag-suggestions">
          {allTags.slice(0, 12).map(t => (
            <button key={t} className="tag-suggestion" onMouseDown={() => pick(t)}>#{t}</button>
          ))}
        </div>
      )}
    </div>
  )
}



// ── FILTER SELECT ─────────────────────────────────────────────────────────────

// value = Set of selected ids; onChange(id) toggles id; onChange('__clear__') clears all
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
            {item.color && <span className="fsel-chip-dot" style={{ background: item.color }} />}
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
              {item.color && <span className="fsel-dot" style={{ background: item.color }} />}
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

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function Feed() {
  const navigate = useNavigate()
  const [userArticles] = useState(() => loadUserPublicArticles())
  const [showSpotlight, setShowSpotlight] = useState(false)
  const [mode,        setMode]        = useState(null)
  const [cat,         setCat]         = useState(new Set())
  const [sort,        setSort]        = useState('popular_7d')
  const [tagSearch,   setTagSearch]   = useState('')
  const [readIds,       setReadIds]       = useState(new Set())
  const [likedIds,      setLikedIds]      = useState(new Set())
  const [dislikedIds,   setDislikedIds]   = useState(new Set())
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())
  const [filtersHidden,    setFiltersHidden]    = useState(false)
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)
  const [bounceKey,        setBounceKey]        = useState(0)
  const feedScrollElRef    = useRef(null)
  const filtersRef         = useRef(null)
  const wasAtEndRef        = useRef(false)
  const showDrawerRef      = useRef(false)
  showDrawerRef.current = showFilterDrawer

  const feedScrollRef = useCallback(el => {
    if (feedScrollElRef.current) {
      feedScrollElRef.current.removeEventListener('scroll', feedScrollElRef._handler)
    }
    feedScrollElRef.current = el
    if (!el) return
    const handler = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      if (filtersRef.current) {
        const { offsetTop, offsetHeight } = filtersRef.current
        setFiltersHidden(scrollTop >= offsetTop + offsetHeight)
      }
      if (showDrawerRef.current) setShowFilterDrawer(false)
      const atEnd = scrollTop + clientHeight >= scrollHeight - 80
      if (atEnd && !wasAtEndRef.current) setBounceKey(k => k + 1)
      wasAtEndRef.current = atEnd
    }
    feedScrollElRef._handler = handler
    el.addEventListener('scroll', handler, { passive: true })
  }, [])

  function scrollToTop() {
    feedScrollElRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCategoryQuickFilter(catId) {
    setCat(new Set([catId]))
    setMode(null)
  }

  function handleCatChange(id) {
    if (id === '__clear__') { setCat(new Set()); return }
    setCat(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function markRead(id) {
    setReadIds(prev => new Set([...prev, id]))
  }

  function toggleLike(id) {
    setLikedIds(prev => {
      const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
    })
    setDislikedIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  function toggleDislike(id) {
    setDislikedIds(prev => {
      const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
    })
    setLikedIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  function toggleBookmark(id) {
    setBookmarkedIds(prev => {
      const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
    })
  }

  const allItems = [...userArticles, ...feedItems]

  const tagQuery = tagSearch.replace(/^#/, '').trim().toLowerCase()

  let filtered = allItems.filter(item => {
    if (mode === 'liked')         return item.type === 'article' && likedIds.has(item.id)
    if (mode === 'subscriptions') return !!(item.authorId && feedAuthors[item.authorId]?.following)
    if (mode === 'my-sets')       return item.type === 'article' && item.setLink && MY_SET_TITLES.has(item.setLink.title)

    if (cat.size > 0 && !cat.has(item.category)) return false
    if (tagQuery && !(item.tags || []).some(t => t.toLowerCase().includes(tagQuery))) return false
    return true
  })

  filtered = [...filtered].sort(
    sort === 'newest' ? (a, b) => b.ts - a.ts : (a, b) => b.pop - a.pop
  )

  const hasFilters = mode || cat.size > 0 || sort !== 'popular_7d' || tagQuery

  function resetFilters() {
    setMode(null); setCat(new Set()); setSort('popular_7d'); setTagSearch('')
  }

  function handleItemClick(item) {
    markRead(item.id)
    if (item.type === 'set') navigate(`/set/${item.id}`)
    else navigate(`/article/${item.id}`)
  }

  return (
    <Layout>
      <main className="feed-main">
        <div className="page-header">
          <div className="page-title" style={{display:'flex',alignItems:'center',gap:10}}>
            Лента
            <HelpButton seenKey="ss_spl_feed" onOpen={() => setShowSpotlight(true)} />
            {filtersHidden && <FilterIconBtn active={!!hasFilters} onClick={() => setShowFilterDrawer(v => !v)} />}
          </div>
          {filtersHidden && showFilterDrawer && (
            <div className="header-filter-panel">
              <div className="filters-block">
                <TagSearchInput value={tagSearch} onChange={setTagSearch} allItems={allItems} />
                <div className="promo-selects-row">
                  <SimpleSelect label="Режим" options={MODES} value={mode} onChange={setMode} />
                  <SortDropdown sort={sort} onSort={setSort} />
                </div>
                <FilterSelect items={CATEGORIES} value={cat} onChange={handleCatChange} placeholder="Категории" />
                {hasFilters && (
                  <div className="filter-summary">
                    <span>{filtered.length} {noun(filtered.length)}</span>
                    <button className="reset-btn" onClick={resetFilters}>Сбросить</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="feed-scroll" ref={feedScrollRef} onClick={() => showDrawerRef.current && setShowFilterDrawer(false)}>
          <div id="sp-feed-filters" ref={filtersRef} className="filters-sticky">
            <div className="filters-block">
              <TagSearchInput value={tagSearch} onChange={setTagSearch} allItems={allItems} />
              <div className="promo-selects-row">
                <SimpleSelect label="Режим" options={MODES} value={mode} onChange={setMode} />
                <SortDropdown sort={sort} onSort={setSort} />
              </div>
              <FilterSelect items={CATEGORIES} value={cat} onChange={handleCatChange} placeholder="Категории" />
              {hasFilters && (
                <div className="filter-summary">
                  <span>{filtered.length} {noun(filtered.length)}</span>
                  <button className="reset-btn" onClick={resetFilters}>Сбросить</button>
                </div>
              )}
            </div>
          </div>
          <div id="sp-feed-list" className="feed-list">
            {filtered.length === 0 ? (
              <div className="empty-state">
                {mode === 'liked' && likedIds.size === 0 ? (
                  <>
                    <div className="empty-icon"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></div>
                    <div className="empty-title">Закладок пока нет</div>
                    <div className="empty-desc">Нажмите <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'middle',margin:'0 2px'}}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> на любой статье, чтобы сохранить её сюда</div>
                  </>
                ) : mode === 'subscriptions' ? (
                  <>
                    <div className="empty-icon"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                    <div className="empty-title">Нет подписок</div>
                    <div className="empty-desc">Подпишитесь на авторов через карточку профиля, чтобы видеть их статьи здесь</div>
                  </>
                ) : mode === 'my-sets' ? (
                  <>
                    <div className="empty-icon"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></div>
                    <div className="empty-title">Нет статей по вашим наборам</div>
                    <div className="empty-desc">Добавьте наборы из каталога — статьи, связанные с ними, появятся здесь</div>
                  </>
                ) : (
                  <>
                    <div className="empty-icon"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
                    <div className="empty-title">Ничего не найдено</div>
                    <div className="empty-desc">Попробуйте изменить фильтры</div>
                  </>
                )}
              </div>
            ) : <>
              {filtered.map(item => (
                <ArticleCard key={item.id} item={item}
                  isRead={readIds.has(item.id)}
                  isLiked={likedIds.has(item.id)}
                  isDisliked={dislikedIds.has(item.id)}
                  isBookmarked={bookmarkedIds.has(item.id)}
                  onLikeToggle={toggleLike}
                  onDislikeToggle={toggleDislike}
                  onBookmarkToggle={toggleBookmark}
                  onCategoryClick={handleCategoryQuickFilter}
                  onClick={handleItemClick}
                  navigate={navigate}
                />
              ))}
              <FeedEndBlock key={bounceKey} onScrollTop={scrollToTop} />
            </>}
          </div>
        </div>
      </main>

      {showSpotlight && <SpotlightTour steps={FEED_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
    </Layout>
  )
}

function noun(n) {
  const m = n % 10, c = n % 100
  if (m === 1 && c !== 11) return 'материал'
  if (m >= 2 && m <= 4 && (c < 10 || c >= 20)) return 'материала'
  return 'материалов'
}
