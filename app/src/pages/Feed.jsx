import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { feedItems, feedAuthors } from '../data/mock'

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'all', label: 'Все' },
  { id: 'sets', label: 'Наборы' },
  { id: 'articles', label: 'Статьи' },
]

const MODES = [
  {
    id: 'unread', label: 'Непрочитанное',
    icon: <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  {
    id: 'subscriptions', label: 'Подписки',
    icon: <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    id: 'my-sets', label: 'Мои наборы',
    icon: <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    id: 'liked', label: 'Понравившиеся',
    icon: <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  },
]

const CATEGORIES = [
  { id: 'all',       label: 'Все' },
  { id: 'food',      label: 'Еда и продукты' },
  { id: 'clothes',   label: 'Одежда' },
  { id: 'home',      label: 'Дом и техника' },
  { id: 'health',    label: 'Здоровье и уход' },
  { id: 'transport', label: 'Авто и транспорт' },
  { id: 'leisure',   label: 'Досуг и подписки' },
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

function fmtUsers(n) {
  if (!n) return null
  if (n >= 10000) return (Math.round(n / 100) / 10) + 'k'
  if (n >= 1000)  return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return String(n)
}

// ── SET CARD ──────────────────────────────────────────────────────────────────

function SetCard({ item, isRead, onClick }) {
  const author = item.authorId ? feedAuthors[item.authorId] : null
  const srcLabel = item.source === 'ss' ? 'SmartSpend' : item.source === 'community' ? 'Сообщество' : 'Моё'
  return (
    <div className={`card${isRead ? ' read' : ''}`} onClick={() => onClick(item)}>
      <div className="set-accent" style={{ background: item.color }} />
      <div className="set-body">
        <div className="set-top">
          <div className="set-left">
            <div className="set-badges">
              <span className={`source-badge ${item.source}`}>{srcLabel}</span>
              <span className={item.badge === 'base' ? 'base-badge' : 'extra-badge'}>
                {item.badge === 'base' ? 'Основа' : 'Дополнение'}
              </span>
            </div>
            <div className="set-title">{item.title}</div>
            <div className="set-desc">{item.desc}</div>
          </div>
          <div className="set-amount-block">
            <div className="set-amount">{item.amount.toLocaleString('ru')}&thinsp;₽</div>
            <div className="set-amount-label">{item.amountLabel || 'в месяц'}</div>
          </div>
        </div>
        <div className="set-items">
          {item.items.slice(0, 5).map((t, i) => <span key={i} className="set-item-tag">{t}</span>)}
          {(item.more > 0 || item.items.length > 5) && (
            <span className="set-item-more">+{item.more || item.items.length - 5}</span>
          )}
        </div>
      </div>
      <div className="set-footer">
        {item.users != null && (
          <div className="meta-item">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            {fmtUsers(item.users)}
          </div>
        )}
        {author && (
          <div className="meta-item">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            {author.name}
          </div>
        )}
        <span className="meta-time" style={{ marginLeft: 'auto' }}>{item.time}</span>
      </div>
    </div>
  )
}

// ── ARTICLE CARD ──────────────────────────────────────────────────────────────

function ArticleCard({ item, isRead, isLiked, onLikeToggle, onClick }) {
  const author = feedAuthors[item.authorId]
  return (
    <div className={`card${isRead ? ' read' : ''}`} onClick={() => onClick(item)}>
      <div className="article-body">
        <div className="article-header">
          <div className="article-header-top">
            <div className="author-avatar-sm" style={{ background: author?.color }}>{author?.initials}</div>
            <span className="author-name-inline">{author?.name}</span>
            <span className="article-time-chip">{item.time}</span>
          </div>
          <div className="article-title">{item.title}</div>
        </div>
        <div className="article-preview">{item.preview}</div>
      </div>
      <div className="article-footer">
        <button
          className={`liked-btn${isLiked ? ' liked' : ''}`}
          onClick={e => { e.stopPropagation(); onLikeToggle(item.id) }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {item.likes + (isLiked ? 1 : 0)}
        </button>
        {item.comments != null && (
          <div className="a-stat">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {item.comments}
          </div>
        )}
        <div className="a-stat">
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          {item.views.toLocaleString('ru')}
        </div>
        <div className="f-spacer" />
        {item.setLink && (
          <div className="set-link">
            <div className="set-dot" style={{ background: item.setLink.color }} />
            <span className="set-link-label">Набор: {item.setLink.title}</span>
          </div>
        )}
      </div>
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
      <button className={`sort-btn${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
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

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function Feed() {
  const navigate = useNavigate()
  const [tab,     setTab]     = useState('all')
  const [mode,    setMode]    = useState(null)
  const [cat,     setCat]     = useState('all')
  const [sort,    setSort]    = useState('popular_7d')
  const [readIds, setReadIds] = useState(new Set())
  const [likedIds, setLikedIds] = useState(new Set())

  function markRead(id) {
    setReadIds(prev => new Set([...prev, id]))
  }

  function toggleLike(id) {
    setLikedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleMode(m) {
    setMode(prev => prev === m ? null : m)
  }

  let filtered = feedItems.filter(item => {
    if (mode === 'liked')         return item.type === 'article' && likedIds.has(item.id)
    if (mode === 'subscriptions') return !!(item.authorId && feedAuthors[item.authorId]?.following)
    if (mode === 'my-sets')       return item.type === 'article' && item.setLink && MY_SET_TITLES.has(item.setLink.title)
    if (mode === 'unread')        { if (readIds.has(item.id)) return false }

    if (tab === 'sets'     && item.type !== 'set')     return false
    if (tab === 'articles' && item.type !== 'article') return false
    if (cat !== 'all' && item.category !== cat)        return false
    return true
  })

  filtered = [...filtered].sort(
    sort === 'newest' ? (a, b) => b.ts - a.ts : (a, b) => b.pop - a.pop
  )

  const hasFilters = mode || tab !== 'all' || cat !== 'all' || sort !== 'popular_7d'

  function resetFilters() {
    setTab('all'); setMode(null); setCat('all'); setSort('popular_7d')
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
          <div className="page-title">Лента</div>
          <div className="page-subtitle">Новые наборы и статьи от авторов</div>
        </div>

        <div className="filters-sticky">
          <div className="filters-block">
            {/* Row 1: type tabs + sort dropdown */}
            <div className="filters-row1">
              <div className="tab-group">
                {TABS.map(t => (
                  <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`}
                    onClick={() => setTab(t.id)}>{t.label}</button>
                ))}
              </div>
              <div className="filters-spacer" />
              <SortDropdown sort={sort} onSort={setSort} />
            </div>

            {/* Row 2: mode pills */}
            <div className="filters-row2">
              {MODES.map(m => (
                <button key={m.id} className={`mode-pill${mode === m.id ? ' active' : ''}`}
                  onClick={() => toggleMode(m.id)}>
                  {m.icon}{m.label}
                </button>
              ))}
            </div>

            {/* Row 3: category pills */}
            <div className="cats-scroll">
              {CATEGORIES.map(c => (
                <button key={c.id} className={`cat-pill${cat === c.id ? ' active' : ''}`}
                  onClick={() => setCat(c.id)}>{c.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="feed-scroll">
          {hasFilters && (
            <div className="filter-summary">
              <span>{filtered.length} {noun(filtered.length)}</span>
              <button className="reset-btn" onClick={resetFilters}>Сбросить</button>
            </div>
          )}

          <div className="feed-list">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <div className="empty-title">Ничего не найдено</div>
                <div className="empty-desc">Попробуйте изменить фильтры</div>
              </div>
            ) : filtered.map(item =>
              item.type === 'set'
                ? <SetCard key={item.id} item={item} isRead={readIds.has(item.id)} onClick={handleItemClick} />
                : <ArticleCard key={item.id} item={item}
                    isRead={readIds.has(item.id)}
                    isLiked={likedIds.has(item.id)}
                    onLikeToggle={toggleLike}
                    onClick={handleItemClick}
                  />
            )}
          </div>
        </div>
      </main>
    </Layout>
  )
}

function noun(n) {
  const m = n % 10, c = n % 100
  if (m === 1 && c !== 11) return 'материал'
  if (m >= 2 && m <= 4 && (c < 10 || c >= 20)) return 'материала'
  return 'материалов'
}
