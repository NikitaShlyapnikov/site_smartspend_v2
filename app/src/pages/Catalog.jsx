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
  { group: 'Новизна',         id: 'newest',      label: 'Сначала новые' },
  { group: 'По популярности', id: 'popular_7d',  label: 'За 7 дней' },
  { group: 'По популярности', id: 'popular_30d', label: 'За месяц' },
  { group: 'По популярности', id: 'popular_all', label: 'За всё время' },
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
  const groups = [...new Set(SORT_OPTIONS.map(o => o.group))]

  return (
    <div className="sort-wrap" ref={ref}>
      <span className="sort-label-txt">Сортировка:</span>
      <button className={`sort-btn${open ? ' open' : ''}${sort !== 'popular_7d' ? ' active' : ''}`} onClick={() => setOpen(o => !o)}>
        <span>{current?.label || 'За 7 дней'}</span>
        <svg className="sort-btn-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div className={`sort-dropdown sort-dropdown--left${open ? ' open' : ''}`}>
        {groups.map((grp, gi) => (
          <div key={grp}>
            {gi > 0 && <div className="sort-divider" />}
            <div className="sort-group-label">{grp}</div>
            {SORT_OPTIONS.filter(o => o.group === grp).map(opt => (
              <div key={opt.id} className={`sort-option${sort === opt.id ? ' active' : ''}`} onClick={() => { onSort(opt.id); setOpen(false) }}>
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

// ── AUTHOR HELPERS ────────────────────────────────────────────────────────────

const AUTHOR_COLORS = ['#7B9E8A','#8A7B9E','#9E8A7B','#7B8A9E','#9E7B8A','#8A9E7B','#7B9E9E']
function authorFromUsername(username) {
  const parts = username.split(/[_\s]/)
  const name = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : username.slice(0, 2).toUpperCase()
  const colorIdx = username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AUTHOR_COLORS.length
  return { name, initials, color: AUTHOR_COLORS[colorIdx], followers: 80 + (username.length * 17), articles: username.length % 6, sets: 3 + username.length % 9 }
}

function AuthorPopoverCard({ author, onMouseEnter, onMouseLeave, navigate }) {
  const [following, setFollowing] = useState(false)
  const [followAnim, setFollowAnim] = useState(false)
  function handleFollow() { setFollowAnim(true); setTimeout(() => setFollowAnim(false), 450); setFollowing(f => !f) }
  return (
    <div className="author-popover" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={e => e.stopPropagation()}>
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
  const showTimer = useRef(null)
  const hideTimer = useRef(null)
  const author = authorFromUsername(username)
  const isTouch = () => window.matchMedia('(hover: none)').matches

  function handleClick(e) {
    e.stopPropagation()
    if (isTouch()) setShowSheet(true)
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
      <button className="author-chip" onClick={handleClick}>
        <div className="author-avatar-sm" style={{ background: author.color }}>{author.initials}</div>
        <span className="author-name-inline">{author.name}</span>
      </button>
      {showCard && (
        <AuthorPopoverCard author={author} navigate={navigate}
          onMouseEnter={() => clearTimeout(hideTimer.current)} onMouseLeave={onLeave} />
      )}
      {showSheet && <AuthorBottomSheet author={author} navigate={navigate} onClose={() => setShowSheet(false)} />}
    </span>
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

  const [cat, setCat]             = useState(() => initCatId ? new Set([initCatId]) : new Set())
  const [sourceFilter, setSrc]    = useState('all')
  const [sortFilter, setSort]     = useState('popular_7d')
  const [likedSets, setLikedSets] = useState(loadLikes)
  const [itemSearch, setItemSearch] = useState('')
  const [setVotes, setSetVotes] = useState(new Map()) // id → 'like'|'dislike'
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

  function voteSet(id, type, e) {
    e.stopPropagation()
    if (!requireAuth()) return
    setSetVotes(prev => {
      const next = new Map(prev)
      next.set(id, next.get(id) === type ? null : type)
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

            {/* Row 3: item search */}
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
          ) : filtered.map(set => {
            const myVote = setVotes.get(set.id) || null
            const catLabel = CATEGORIES.find(c => c.id === set.category)?.label
            const totalItems = set.items.length + (set.more || 0)
            return (
            <div key={set.id} className="catalog-card" onClick={() => navigate(`/set/${set.id}`)}>
              {set.addedBy && (
                <div className="card-author-row" onClick={e => e.stopPropagation()}>
                  <AuthorChip username={set.addedBy} navigate={navigate} />
                </div>
              )}
              <div className="card-body">
                <div className="card-badges">
                  <span className={`source-badge ${set.source}`}>
                    {set.source === 'ss' ? 'SmartSpend' : set.source === 'community' ? 'Сообщество' : 'Мой набор'}
                  </span>
                </div>
                <div>
                  <div className="card-title-row">
                    <span className="card-title">{set.title}</span>
                    {catLabel && (
                      <button className="cat-badge" onClick={e => { e.stopPropagation(); handleCatChange(set.category) }}>
                        {catLabel}
                      </button>
                    )}
                  </div>
                  <div className="card-desc">{set.desc}</div>
                </div>
              </div>
              <div className="card-footer">
                <div className="card-amount-left">
                  <div className="card-amount">{set.amount.toLocaleString('ru')} ₽</div>
                  <div className="card-amount-label">{set.amountLabel}</div>
                </div>
                <div className="card-meta-right">
                  {set.private ? (
                    <div className="private-label">
                      <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                      Приватный
                    </div>
                  ) : (
                    <div className="users-count">
                      <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                      {fmtUsers(set.users)}
                    </div>
                  )}
                  <div className="card-date">{fmtDate(set.added)}</div>
                  <div className="card-items-count">
                    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                    {totalItems}
                  </div>
                </div>
              </div>
              <div className="card-actions" onClick={e => e.stopPropagation()}>
                <button className={`ca-btn ca-like${myVote === 'like' ? ' active' : ''}`} onClick={e => voteSet(set.id, 'like', e)}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                  </svg>
                  {(set.likes || 0) + (myVote === 'like' ? 1 : 0)}
                </button>
                <button className={`ca-btn ca-dislike${myVote === 'dislike' ? ' active' : ''}`} onClick={e => voteSet(set.id, 'dislike', e)}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                    <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                  </svg>
                  {(set.dislikes || 0) + (myVote === 'dislike' ? 1 : 0)}
                </button>
                <button className="ca-btn ca-comments" onClick={() => navigate(`/set/${set.id}`)}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  {set.comments || 0}
                </button>
                <button className={`ca-btn ca-bookmark${likedSets.has(set.id) ? ' active' : ''}`} onClick={e => toggleLike(set.id, e)}>
                  <svg width="13" height="13" fill={likedSets.has(set.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              </div>
            </div>
            )
          })}

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
