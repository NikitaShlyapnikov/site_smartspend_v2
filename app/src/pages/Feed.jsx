import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'
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

function AuthorPopoverCard({ author, authorId, navigate, onMouseEnter, onMouseLeave }) {
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
    <div className="author-popover" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={e => e.stopPropagation()}>
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
  const showTimer = useRef(null)
  const hideTimer = useRef(null)

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
    showTimer.current = setTimeout(() => setShowCard(true), 350)
  }
  function onLeave() {
    if (isTouch()) return
    clearTimeout(showTimer.current)
    hideTimer.current = setTimeout(() => setShowCard(false), 180)
  }

  return (
    <span className="author-chip-wrap" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
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
      {showCard && (
        <AuthorPopoverCard
          author={author}
          authorId={authorId}
          navigate={navigate}
          onMouseEnter={() => clearTimeout(hideTimer.current)}
          onMouseLeave={onLeave}
        />
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
    if (key) {
      setEmojiAnim(true)
      setTimeout(() => setEmojiAnim(false), EMOJI_DUR[key] + 50)
    }
    if (!active) {
      const newP = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        angle: i * 60 + Math.random() * 20 - 10,
        dist: 22 + Math.random() * 10,
      }))
      setParticles(newP)
      setTimeout(() => setParticles([]), 600)
    }
    onToggle(emoji)
  }

  return (
    <div className="r-pill-wrap">
      <button
        className={`fa-reaction${active ? ' active' : ''}${popping ? ' popping' : ''}`}
        onClick={handleClick}
      >
        <span className={`r-emoji${emojiAnim && EMOJI_ANIM[emoji] ? ` r-emoji--${EMOJI_ANIM[emoji]}` : ''}`}>{emoji}</span>
        <span className="r-count">{count}</span>
      </button>
      {particles.map(p => (
        <span
          key={p.id}
          className="r-particle"
          style={{ '--angle': `${p.angle}deg`, '--dist': `${p.dist}px` }}
        >{emoji}</span>
      ))}
    </div>
  )
}

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
          {item.comments != null && (
            <div className="fa-action-stat">
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {item.comments}
            </div>
          )}
          <DislikeBtn disliked={isDisliked} onToggle={() => onDislikeToggle(item.id)} />
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
        <span>{current?.label || 'По популярности'}</span>
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

// ── WELCOME TOUR ───────────────────────────────────────────────────────────────

function WMockup({ title, children }) {
  return (
    <div className="tour-mockup">
      <div className="tour-mockup-bar">
        <span className="tour-mockup-dot"/><span className="tour-mockup-dot"/><span className="tour-mockup-dot"/>
        <span className="tour-mockup-label">{title}</span>
      </div>
      <div className="tour-mockup-body">{children}</div>
    </div>
  )
}

const WIllust1 = () => (
  <WMockup title="SmartSpend / Профиль">
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      {[['#B8A0C8','Одежда и обувь','12 000 ₽'],['#8DBFA8','Еда и супермаркеты','22 000 ₽'],['#9EA8C0','Дом и техника','8 000 ₽'],['#B8C49A','Здоровье','5 000 ₽']].map(([c,n,a])=>(
        <div key={n} className="tour-mk-env-item" style={{borderLeft:`3px solid ${c}`}}>
          <span className="tour-mk-env-dot" style={{background:c}}/>
          {n}
          <span className="tour-mk-env-amt">{a}</span>
        </div>
      ))}
    </div>
    <div style={{fontSize:10,color:'var(--text-3)',textAlign:'center',paddingTop:2}}>4 конверта · 47 000 ₽/мес</div>
  </WMockup>
)

const WIllust2 = () => (
  <WMockup title="Конверт: Одежда и обувь">
    <div className="tour-mk-env-card" style={{borderColor:'#B8A0C8'}}>
      <div className="tour-mk-env-head"><span className="tour-mk-env-dot" style={{background:'#B8A0C8'}}/>Одежда и обувь<span className="tour-mk-env-amt">12 000 ₽/мес</span></div>
      <div style={{height:4,background:'var(--border)',borderRadius:4,overflow:'hidden',margin:'2px 0 4px'}}>
        <div style={{width:'75%',height:'100%',background:'#B8A0C8',borderRadius:4}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--text-3)'}}>
        <span>9 000 ₽ отложено</span><span>осталось 3 000 ₽</span>
      </div>
    </div>
    <div className="tour-mk-fin-rows" style={{marginTop:2}}>
      {[['Январь','100%','#4E8268'],['Февраль','100%','#4E8268'],['Март','60%','#B08840']].map(([m,w,c])=>(
        <div key={m} className="tour-mk-fin-row">
          <span className="tour-mk-fin-lbl">{m}</span>
          <span className="tour-mk-fin-bar"><span style={{width:w,background:c}}/></span>
          <span className="tour-mk-fin-val">{w}</span>
        </div>
      ))}
    </div>
  </WMockup>
)

const WIllust3 = () => (
  <WMockup title="SmartSpend / Каталог">
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      {[['Базовый гардероб на сезон','Одежда','8 000 ₽',true],['Здоровое питание на месяц','Еда','18 000 ₽',false],['Домашняя аптечка','Здоровье','3 500 ₽',false]].map(([n,c,a,added])=>(
        <div key={n} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 10px',display:'flex',alignItems:'center',gap:8}}>
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--text)',letterSpacing:'-0.01em'}}>{n}</div>
            <div style={{fontSize:9,color:'var(--text-3)',marginTop:2}}>{c} · {a}</div>
          </div>
          <div style={{fontSize:9,fontWeight:600,padding:'3px 8px',borderRadius:6,
            background: added ? 'var(--accent-green-light)' : 'var(--surface-2)',
            color: added ? 'var(--accent-green)' : 'var(--text-3)',
            border: `1px solid ${added ? 'var(--accent-green-border)' : 'var(--border)'}`,
            whiteSpace:'nowrap'}}>
            {added ? '✓ Добавлен' : '+ Добавить'}
          </div>
        </div>
      ))}
    </div>
  </WMockup>
)

const WIllust4 = () => (
  <WMockup title="SmartSpend / Инвентарь">
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      {[
        {name:'Кроссовки Nike',days:'через 180 дней',pct:15,c:'var(--status-ok)'},
        {name:'Зимняя куртка',days:'через 42 дня',pct:72,c:'var(--status-soon)'},
        {name:'Протеин Whey',days:'через 3 дня',pct:92,c:'var(--status-urgent)'},
      ].map(({name,days,pct,c})=>(
        <div key={name} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'7px 10px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{fontSize:10,fontWeight:600,color:'var(--text)'}}>{name}</span>
            <span style={{fontSize:9,color:c,fontWeight:500}}>{days}</span>
          </div>
          <div style={{height:3,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
            <div style={{width:`${pct}%`,height:'100%',background:c,borderRadius:3}}/>
          </div>
        </div>
      ))}
    </div>
    <div style={{fontSize:10,color:'var(--text-3)',textAlign:'center',paddingTop:2}}>Инвентарь предупредит о покупке заранее</div>
  </WMockup>
)

const WIllust5 = () => (
  <WMockup title="SmartSpend / Профиль">
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8}}>
        <div style={{flex:1,fontSize:10,color:'var(--text-2)'}}>Конверты (47 000 ₽)</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        <div style={{fontSize:10,color:'var(--text-2)'}}>расходы</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'var(--accent-green-light)',border:'1px solid var(--accent-green-border)',borderRadius:8}}>
        <div style={{flex:1,fontSize:10,fontWeight:600,color:'var(--accent-green)'}}>Остаток (24 000 ₽)</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        <div style={{fontSize:10,fontWeight:600,color:'var(--accent-green)'}}>накопления</div>
      </div>
      <div className="tour-mk-block" style={{textAlign:'center'}}>
        <div className="tour-mk-block-lbl">Размер капитала</div>
        <div className="tour-mk-block-num" style={{fontSize:16}}>186 400 ₽</div>
        <div className="tour-mk-block-sub" style={{color:'var(--accent-green)'}}>↑ растёт каждый месяц</div>
      </div>
    </div>
  </WMockup>
)

const WIllust6 = () => (
  <WMockup title="SmartSpend / EmoSpend">
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <div style={{display:'flex',gap:6}}>
        <div className="tour-mk-block" style={{flex:1}}>
          <div className="tour-mk-block-lbl">Капитал</div>
          <div className="tour-mk-block-num">186 400 ₽</div>
          <div className="tour-mk-block-sub">доходность 5%</div>
        </div>
        <div style={{display:'flex',alignItems:'center',color:'var(--text-3)'}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
        <div className="tour-mk-block tour-mk-block--emo" style={{flex:1}}>
          <div className="tour-mk-block-lbl">EmoSpend</div>
          <div className="tour-mk-block-num">775 ₽</div>
          <div className="tour-mk-block-sub">в месяц</div>
        </div>
      </div>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 10px',fontSize:10,color:'var(--text-2)',lineHeight:1.5}}>
        Трать на <strong style={{color:'var(--text)'}}>импульсивные покупки</strong> и <strong style={{color:'var(--text)'}}>непредвиденные расходы</strong> — капитал продолжит расти
      </div>
    </div>
  </WMockup>
)

const WIllust7 = () => {
  const points = [18,22,20,26,24,30,28,36,34,42]
  const max = 42, min = 18, w = 300, h = 70
  const xs = points.map((_,i) => (i/(points.length-1))*w)
  const ys = points.map(v => h - ((v-min)/(max-min))*(h-8) - 4)
  const d = points.map((_, i) => `${i===0?'M':'L'}${xs[i].toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const fill = `${d} L${w},${h} L0,${h} Z`
  return (
    <WMockup title="Рост накоплений">
      <div style={{position:'relative',borderRadius:8,overflow:'hidden',background:'var(--surface)',border:'1px solid var(--border)',padding:'10px 12px 8px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
          <div><div style={{fontSize:9,color:'var(--text-3)'}}>Капитал через 3 года</div><div style={{fontFamily:'var(--mono)',fontSize:14,fontWeight:600,color:'var(--accent-green)',letterSpacing:'-0.02em'}}>320 000 ₽</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:9,color:'var(--text-3)'}}>Ежемес. взнос</div><div style={{fontFamily:'var(--mono)',fontSize:14,fontWeight:600,color:'var(--text)',letterSpacing:'-0.02em'}}>24 000 ₽</div></div>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height:70,display:'block'}}>
          <defs>
            <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={fill} fill="url(#wg)"/>
          <path d={d} fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="4" fill="var(--accent-green)"/>
        </svg>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'var(--text-3)',marginTop:2}}>
          <span>Сейчас</span><span>+1 год</span><span>+2 года</span><span>+3 года</span>
        </div>
      </div>
    </WMockup>
  )
}

const WELCOME_STEPS = [
  { illust: <WIllust1/>, title: 'Система конвертов', desc: 'SmartSpend построен на конвертах. Конверт — это направление трат: еда, одежда, техника и другие. Каждый месяц вы откладываете нужную сумму в каждый конверт.' },
  { illust: <WIllust2/>, title: 'Откладывайте регулярно', desc: 'Каждый месяц пополняйте конверты в рамках запланированной суммы. Система покажет, сколько уже отложено и сколько осталось до цели.' },
  { illust: <WIllust3/>, title: 'Наборы определяют суммы', desc: 'Выбирайте наборы из каталога, которые описывают ваш образ жизни, или создавайте собственные. Наборы автоматически рассчитают нужную сумму для каждого конверта.' },
  { illust: <WIllust4/>, title: 'Планирование покупок', desc: 'Наборы и инвентарь помогают планировать покупки заранее. Система предупредит, когда подходит время заменить вещь — никаких сюрпризов и импульсивных трат.' },
  { illust: <WIllust5/>, title: 'Остаток идёт в накопления', desc: 'Всё, что остаётся после конвертов, автоматически уходит в накопления. Чем точнее спланированы конверты — тем быстрее растёт ваш капитал.' },
  { illust: <WIllust6/>, title: 'EmoSpend — доход от капитала', desc: 'Накопления приносят доход. Этот доход называется EmoSpend — его можно смело тратить на импульсивные желания или непредвиденные расходы, не трогая капитал.' },
  { illust: <WIllust7/>, title: 'Капитал растёт предсказуемо', desc: 'Придерживайтесь системы — и накопления будут расти стабильно каждый месяц. Через несколько лет капитал начнёт работать на вас самостоятельно.' },
]

function WelcomeTour({ onClose }) {
  const [step, setStep] = useState(0)
  const current = WELCOME_STEPS[step]
  const isLast = step === WELCOME_STEPS.length - 1

  function finish() {
    localStorage.setItem('ss_tour_welcome', '1')
    onClose()
  }

  return (
    <div className="tour-overlay" onClick={finish}>
      <div className="tour-modal tour-modal--wide" onClick={e => e.stopPropagation()}>
        <button className="tour-close" onClick={finish} aria-label="Закрыть">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/>
          </svg>
        </button>
        <div className="tour-illust">{current.illust}</div>
        <div className="tour-step-dots">
          {WELCOME_STEPS.map((_, i) => (
            <span key={i} className={`tour-dot${i === step ? ' active' : ''}`} onClick={() => setStep(i)} />
          ))}
        </div>
        <div className="tour-title">{current.title}</div>
        <div className="tour-desc">{current.desc}</div>
        <div className="tour-actions">
          {step > 0
            ? <button className="tour-btn-back" onClick={() => setStep(s => s - 1)}>Назад</button>
            : <button className="tour-btn-back" onClick={finish}>Пропустить всё</button>
          }
          <button className="tour-btn-next" onClick={isLast ? finish : () => setStep(s => s + 1)}>
            {isLast ? 'Начать' : 'Далее'}
          </button>
        </div>
      </div>
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

// ── CUBE + END OF FEED ────────────────────────────────────────────────────────

function HappyCube({ size = 80, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 80 80" fill="none">
      <rect width="80" height="80" rx="18" fill="#0E0E0C"/>
      <rect x="14" y="14" width="52" height="52" rx="10" fill="#EEEDE9"/>
      <path d="M26 36 Q29 31 32 36" stroke="#0E0E0C" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M48 36 Q51 31 54 36" stroke="#0E0E0C" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M29 48 Q40 58 51 48" stroke="#0E0E0C" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function FeedEndBlock({ onScrollTop }) {
  return (
    <div className="feed-end-block">
      <div className="feed-end-cube-wrap">
        <HappyCube size={48} className="feed-end-cube" />
        <div className="feed-end-shadow" />
      </div>
      <div className="feed-end-title">Это всё</div>
      <div className="feed-end-sub">Ты прочитал всё что было.<br/>Загляни позже — появится новое.</div>
      <button className="feed-end-up-btn" onClick={onScrollTop}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 10 L6 2 M2 5 L6 2 L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Вернуться наверх
      </button>
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function Feed() {
  const navigate = useNavigate()
  const [userArticles] = useState(() => loadUserPublicArticles())
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('ss_tour_welcome'))
  const [showSpotlight, setShowSpotlight] = useState(false)
  const [mode,        setMode]        = useState(null)
  const [cat,         setCat]         = useState(new Set())
  const [sort,        setSort]        = useState('popular_7d')
  const [readIds,       setReadIds]       = useState(new Set())
  const [likedIds,      setLikedIds]      = useState(new Set())
  const [dislikedIds,   setDislikedIds]   = useState(new Set())
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())
  const [filtersScrolled, setFiltersScrolled] = useState(false)
  const feedScrollElRef = useRef(null)

  const feedScrollRef = useCallback(el => {
    if (feedScrollElRef.current) {
      feedScrollElRef.current.removeEventListener('scroll', feedScrollElRef._handler)
    }
    feedScrollElRef.current = el
    if (!el) return
    setFiltersScrolled(false)
    const handler = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      setFiltersScrolled(scrollTop > 8)
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

  let filtered = allItems.filter(item => {
    if (mode === 'liked')         return item.type === 'article' && likedIds.has(item.id)
    if (mode === 'subscriptions') return !!(item.authorId && feedAuthors[item.authorId]?.following)
    if (mode === 'my-sets')       return item.type === 'article' && item.setLink && MY_SET_TITLES.has(item.setLink.title)

    if (cat.size > 0 && !cat.has(item.category)) return false
    return true
  })

  filtered = [...filtered].sort(
    sort === 'newest' ? (a, b) => b.ts - a.ts : (a, b) => b.pop - a.pop
  )

  const hasFilters = mode || cat.size > 0 || sort !== 'popular_7d'

  function resetFilters() {
    setMode(null); setCat(new Set()); setSort('popular_7d')
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
          </div>
        </div>

        <div id="sp-feed-filters" className={`filters-sticky${filtersScrolled ? ' scrolled' : ''}`}>
          <div className="filters-block">
            {/* Row 1: modes + sort */}
            <div className="cats-scroll feed-mode-pills">
              {MODES.map(m => (
                <button key={String(m.id)} className={`cat-pill${mode === m.id ? ' active' : ''}`}
                  onClick={() => setMode(m.id)}>{m.label}</button>
              ))}
            </div>

            <SortDropdown sort={sort} onSort={setSort} />

            <FilterSelect
              items={CATEGORIES}
              value={cat}
              onChange={handleCatChange}
              placeholder="Категории"
            />

            {/* Filter summary — shown inside sticky block */}
            {hasFilters && (
              <div className="filter-summary">
                <span>{filtered.length} {noun(filtered.length)}</span>
                <button className="reset-btn" onClick={resetFilters}>Сбросить</button>
              </div>
            )}
          </div>
        </div>

        <div className="feed-scroll" ref={feedScrollRef}>
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
              <FeedEndBlock onScrollTop={scrollToTop} />
            </>}
          </div>
        </div>
      </main>

      {showWelcome && <WelcomeTour onClose={() => setShowWelcome(false)} />}
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
