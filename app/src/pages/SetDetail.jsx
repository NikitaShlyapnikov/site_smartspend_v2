import { useState, useRef, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'
import { setDetails, catalogSets } from '../data/mock'

const COMMENT_EMOJIS = [
  '😊','👍','🔥','💡','❤️','😍','🤔','👏',
  '😂','🙏','✨','🎉','💪','💸','😮','🥲',
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
    setTimeout(() => { onPick(emoji); onClose() }, 220)
  }
  return (
    <div className="emoji-picker" ref={ref}>
      {COMMENT_EMOJIS.map(emoji => (
        <button key={emoji} className={`ep-btn${popping === emoji ? ' ep-pop' : ''}`}
          onClick={() => handlePick(emoji)}>{emoji}</button>
      ))}
    </div>
  )
}

const SD_SPOTLIGHT = [
  { targetId: 'sp-sd-hero',  btnId: 'sp-sd-add',   title: 'Карточка набора',      desc: 'Здесь — название, описание и ключевые показатели набора. Кнопка «В инвентарь» добавит позиции в твой инвентарь.' },
  { targetId: 'sp-sd-items', btnId: null,           title: 'Состав набора',        desc: 'Список позиций. Нажми «Редактировать» — появится масштаб, позволяющий адаптировать набор под свои нужды (например, ×2 для двух человек).' },
  { targetId: 'sp-sd-calc',  btnId: null,           title: 'Как считается сумма?', desc: 'Вещи: цена × кол-во ÷ (срок_лет × 12) = ₽/мес — это ежемесячная амортизация. Расходники: стоимость партии ÷ месяцев между закупками = ₽/мес. «Общая стоимость» — итого за одну закупку.' },
]

// Category → envelope category (Profile)
const CAT_TO_ENV = {
  clothes: 'clothes', food: 'food', home: 'home',
  health: 'health', transport: 'transport', leisure: 'leisure', gifts: 'other',
}
// Category → inventory group ID
const CAT_TO_GROUP = {
  clothes: 'g1', food: 'g2', home: 'g3', health: 'g4',
  transport: 'g5', leisure: 'g6', gifts: 'g8',
}
// Source → envelope source key
const SRC_TO_ENV = { ss: 'smartspend', community: 'community', own: 'custom' }

const fmtRub = n => Math.round(n).toLocaleString('ru') + '\u00a0₽'
const fmtNum = n => {
  if (!n && n !== 0) return '—'
  if (n >= 10000) return (Math.round(n / 100) / 10) + 'k'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return String(n)
}
const fmtDate = iso => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })

const CATEGORY_LABELS = {
  food: 'Еда и Супермаркеты', clothes: 'Одежда и Обувь', home: 'Дом и Техника',
  health: 'Красота и Здоровье', transport: 'Авто и Транспорт', leisure: 'Развлечения и Хобби',
  gifts: 'Прочие расходы', education: 'Образование и Дети', travel: 'Путешествия и Отдых',
}

function LikeBtn({ liked, count, onToggle }) {
  const [anim, setAnim] = useState(false)
  const [sparks, setSparks] = useState([])
  function handleClick() {
    setAnim(true); setTimeout(() => setAnim(false), 480)
    if (!liked) {
      const s = Array.from({ length: 6 }, (_, i) => ({ id: Date.now() + i, angle: i * 60 + Math.random() * 18 - 9, dist: 16 + Math.random() * 8 }))
      setSparks(s); setTimeout(() => setSparks([]), 560)
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
      {sparks.map(s => <span key={s.id} className="like-spark" style={{ '--angle': `${s.angle}deg`, '--dist': `${s.dist}px` }}>✦</span>)}
    </div>
  )
}

function DislikeBtn({ disliked, onToggle }) {
  const [anim, setAnim] = useState(false)
  function handleClick() { setAnim(true); setTimeout(() => setAnim(false), 420); onToggle() }
  return (
    <button className={`fa-action-btn fa-action-dislike${disliked ? ' active' : ''}${anim ? ' dislike-shake' : ''}`} onClick={handleClick} title="Не нравится">
      <svg width="15" height="15" fill={disliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
        <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
      </svg>
    </button>
  )
}

function FollowBtn({ following, onToggle }) {
  const [anim, setAnim] = useState(false)
  function handleClick(e) { e.stopPropagation(); setAnim(true); setTimeout(() => setAnim(false), 450); onToggle() }
  return (
    <button className={`btn-follow${following ? ' following' : ''}${anim ? ' follow-pop' : ''}`} onClick={handleClick}>
      {following ? 'Отменить подписку' : 'Подписаться'}
    </button>
  )
}

function BookmarkBtn({ bookmarked, onToggle }) {
  const [anim, setAnim] = useState(false)
  const [fly, setFly] = useState(false)
  function handleClick() {
    setAnim(true); setTimeout(() => setAnim(false), 420)
    if (!bookmarked) { setFly(true); setTimeout(() => setFly(false), 520) }
    onToggle()
  }
  return (
    <div className="action-wrap">
      <button className={`fa-action-btn fa-action-bookmark${bookmarked ? ' active' : ''}${anim ? ' bookmark-snap' : ''}`} onClick={handleClick} title="В избранное">
        <svg width="15" height="15" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
      {fly && <span className="bookmark-fly">✦</span>}
    </div>
  )
}

function AddInventoryBtn({ added, onAdd, onRemove }) {
  const [pressing, setPressing] = useState(false)
  function handleAdd() {
    if (added || pressing) return
    setPressing(true)
    setTimeout(() => { setPressing(false); onAdd() }, 380)
  }
  return (
    <div className="sd-inv-btn-wrap">
      <button
        id="sp-sd-add"
        className={`sd-inv-btn${added ? ' added' : ''}${pressing ? ' pressing' : ''}`}
        onClick={handleAdd}
      >
        {added ? (
          <>
            <svg className="sd-inv-icon" width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            В инвентаре
          </>
        ) : (
          <>
            <svg className="sd-inv-icon" width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v13M7 10l5 5 5-5"/>
              <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/>
            </svg>
            В инвентарь
          </>
        )}
      </button>
      {added && (
        <button className="sd-btn-remove" onClick={onRemove} title="Удалить из инвентаря">
          <TrashIcon />
        </button>
      )}
    </div>
  )
}

function itemMonthly(item, scale) {
  return (item.basePrice * scale * item.qty) / (item.period * 12)
}

export default function SetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const detail  = setDetails[id]
  const catalog = catalogSets.find(s => s.id === id)
  const set     = detail || catalog

  // Расходники (еда) — не амортизируются, закупаются ежемесячно
  const isConsumable = set?.category === 'food'

  // Mutable items state (for editing)
  const defaultItems = useMemo(
    () => (detail?.items || []).filter(i => 'basePrice' in i).map(i => ({ ...i })),
    [detail]
  )
  const [items, setItems]         = useState(() => defaultItems.map(i => ({ ...i })))
  const [added, setAdded]         = useState(() => {
    try {
      const envData = JSON.parse(localStorage.getItem('ss_envelopes') || '{}')
      return Object.values(envData).some(list => list.some(e => e.id === id))
    } catch { return false }
  })
  const [liked, setLiked]         = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ss_catalog_likes') || '[]')).has(id) } catch { return false }
  })
  const [disliked, setDisliked]   = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ss_catalog_dislikes') || '[]')).has(id) } catch { return false }
  })

  function toggleLike() {
    setLiked(prev => {
      const next = !prev
      try {
        const set_ = new Set(JSON.parse(localStorage.getItem('ss_catalog_likes') || '[]'))
        next ? set_.add(id) : set_.delete(id)
        localStorage.setItem('ss_catalog_likes', JSON.stringify([...set_]))
      } catch {}
      return next
    })
    if (!liked) setDisliked(false)
  }

  function toggleDislike() {
    setDisliked(prev => {
      const next = !prev
      try {
        const set_ = new Set(JSON.parse(localStorage.getItem('ss_catalog_dislikes') || '[]'))
        next ? set_.add(id) : set_.delete(id)
        localStorage.setItem('ss_catalog_dislikes', JSON.stringify([...set_]))
      } catch {}
      return next
    })
    if (!disliked) setLiked(false)
  }
  const [showSpotlight, setShowSpotlight] = useState(false)
  const [editMode, setEditMode]   = useState(false)
  const [scale, setScaleRaw]      = useState(1.0)
  const [artSort, setArtSort]     = useState('author')
  const [artExpanded, setArtExpanded] = useState(false)
  const [cmtExpanded, setCmtExpanded] = useState(false)
  const [cmtSort, setCmtSort]     = useState('popular')
  const [cmtText, setCmtText]     = useState('')
  const [likes, setLikes]         = useState({})
  const [dislikes, setDislikes]   = useState({})
  const [following, setFollowing] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [addToast, setAddToast] = useState(false)
  const [showCmtEmoji, setShowCmtEmoji] = useState(false)
  const addToastTimerRef = useRef(null)

  // Modified = scale changed OR any item differs from defaults
  const isDefault = useMemo(() => {
    if (scale !== 1.0) return false
    return items.every(item => {
      const d = defaultItems.find(x => x.id === item.id)
      return d && d.qty === item.qty && d.basePrice === item.basePrice && d.period === item.period
    })
  }, [scale, items, defaultItems])

  // Scale hold-acceleration
  const scaleTimerRef = useRef(null)
  const scaleHoldRef  = useRef(0)
  function stopScale() {
    if (scaleTimerRef.current) { clearTimeout(scaleTimerRef.current); scaleTimerRef.current = null }
  }
  function startScale(dir) {
    stopScale()
    scaleHoldRef.current = Date.now()
    function tick() {
      const elapsed = Date.now() - scaleHoldRef.current
      const step = elapsed < 1200 ? 0.05 : elapsed < 2500 ? 0.1 : 0.25
      setScaleRaw(s => Math.max(0.25, Math.min(5, Math.round((s + dir * step) * 100) / 100)))
      scaleTimerRef.current = setTimeout(tick, elapsed < 400 ? 350 : 80)
    }
    tick()
  }

  function handleAdd() {
    // 1. Build set title (append version label if modified)
    const now = new Date()
    const dd = String(now.getDate()).padStart(2, '0')
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const yy = String(now.getFullYear()).slice(2)
    const setTitle = isDefault ? set.title : `${set.title} v: ${dd}-${mm}-${yy}`

    // 2. Active items only (qty > 0)
    const activeItems = items.filter(i => i.qty > 0)

    // 3. Save to ss_envelopes
    const envCat = CAT_TO_ENV[set.category] || 'other'
    const envEntry = {
      id: set.id,
      source: SRC_TO_ENV[set.source] || 'custom',
      name: setTitle,
      items: activeItems.length,
      amount: totalMonthly != null ? Math.round(totalMonthly) : (set.amount || 0),
      type: 'depreciation',
      period: 'амортизация',
    }
    try {
      const envData = JSON.parse(localStorage.getItem('ss_envelopes') || '{}')
      const catList = envData[envCat] || []
      // Remove previous entry for same set id (re-add replaces)
      envData[envCat] = [...catList.filter(e => e.id !== set.id), envEntry]
      localStorage.setItem('ss_envelopes', JSON.stringify(envData))
    } catch {}

    // 4. Save to ss_inventory_extra
    const groupId = CAT_TO_GROUP[set.category] || 'g1'
    const ts = Date.now()
    const today = now.toISOString().slice(0, 10)

    const invItems = isConsumable
      // Расходники: каждая позиция — consumable с суточным расходом
      ? activeItems.map((item, idx) => {
          let unit = item.unit || 'шт'
          let rawQty = item.qty * scale  // количество за один период закупки

          // Переводим крупные единицы в мелкие для наглядного отображения
          if (unit === 'кг') { rawQty = rawQty * 1000; unit = 'г' }
          else if (unit === 'л') { rawQty = rawQty * 1000; unit = 'мл' }

          const qty = Math.round(rawQty)
          // Суточный расход = кол-во за период / дней в периоде
          // item.period — в годах (1/12 = месяц, 2/12 = 2 месяца)
          const daysInPeriod = item.period * 12 * 30
          const dailyUse = parseFloat((qty / daysInPeriod).toFixed(2))
          const price = Math.round(item.basePrice * item.qty * scale)  // стоимость за период

          return {
            id: `inv_${set.id}_${item.id}_${ts + idx * 1000}`,
            name: item.name,
            type: 'consumable',
            price,
            qty,
            dailyUse,
            unit,
            lastBought: today,
            set: setTitle,
            setId: set.id,
            groupId,
            paused: true,   // замороженный — пользователь активирует вручную
            isExtra: true,
          }
        })
      // Вещи: одна карточка с массивом дат покупок
      : activeItems.map((item, idx) => {
          const count = Math.max(1, Math.round(item.qty * scale))
          return {
            id: `inv_${set.id}_${item.id}_${ts + idx * 1000}`,
            name: item.name,
            type: 'wear',
            qty: count,
            price: Math.round(item.basePrice * scale),
            wearLifeWeeks: Math.round(item.period * 52),
            purchases: Array.from({ length: count }, () => ({ bought: false, purchaseDate: null })),
            set: setTitle,
            setId: set.id,
            groupId,
            paused: true,
            isExtra: true,
          }
        })
    try {
      const invData = JSON.parse(localStorage.getItem('ss_inventory_extra') || '[]')
      // Remove previous items from same set (re-add replaces)
      const filtered = invData.filter(e => e.setId !== set.id)
      localStorage.setItem('ss_inventory_extra', JSON.stringify([...filtered, ...invItems]))
    } catch {}

    setAdded(true)
    if (addToastTimerRef.current) clearTimeout(addToastTimerRef.current)
    setAddToast(true)
    addToastTimerRef.current = setTimeout(() => setAddToast(false), 5000)
  }

  function handleRemove() {
    // Удаляем только замороженные (paused) позиции этого набора
    try {
      const invData = JSON.parse(localStorage.getItem('ss_inventory_extra') || '[]')
      const filtered = invData.filter(e => !(e.setId === id && e.paused))
      localStorage.setItem('ss_inventory_extra', JSON.stringify(filtered))
    } catch {}
    // Удаляем запись из ss_envelopes
    try {
      const envData = JSON.parse(localStorage.getItem('ss_envelopes') || '{}')
      Object.keys(envData).forEach(cat => {
        envData[cat] = envData[cat].filter(e => e.id !== id)
      })
      localStorage.setItem('ss_envelopes', JSON.stringify(envData))
    } catch {}
    setAdded(false)
  }

  function handleReset() {
    setItems(defaultItems.map(i => ({ ...i })))
    setScaleRaw(1.0)
    setEditMode(false)
  }

  // Item edit handlers
  function chQty(itemId, delta) {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
  }
  function chPrice(itemId, v) {
    const n = parseFloat(v)
    if (!isNaN(n) && n >= 0) {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, basePrice: n / scale } : i))
    }
  }
  function chPeriod(itemId, v) {
    const n = parseFloat(v)
    if (!isNaN(n) && n > 0) {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, period: n } : i))
    }
  }

  if (!set) return (
    <PublicLayout>
      <main className="sd-main">
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">Набор не найден</div>
          <button className="btn-sm" style={{ marginTop: 8 }} onClick={() => navigate('/catalog')}>← Каталог</button>
        </div>
      </main>
    </PublicLayout>
  )

  const tableItems   = items.length > 0 ? items : null
  const totalMonthly = tableItems
    ? tableItems.reduce((s, i) => s + itemMonthly(i, scale), 0)
    : null
  const totalPrice = tableItems
    ? tableItems.reduce((s, i) => s + Math.round(i.basePrice * scale * i.qty), 0)
    : null

  const color    = set.color || '#4E8268'
  const srcLabel = { ss: 'SmartSpend', community: 'Сообщество', own: 'Мой набор' }[set.source] || 'SmartSpend'
  const catLabel = CATEGORY_LABELS[set.category] || null

  const parseViews = v => {
    if (!v) return 0
    const s = String(v).trim()
    if (s.endsWith('k')) return parseFloat(s) * 1000
    return parseInt(s) || 0
  }

  const authorArticles = detail?.authorArticles || []
  const recArticles    = detail?.recArticles    || []
  const comments       = detail?.comments       || []

  const allArticles = useMemo(() => [
    ...authorArticles.map(a => ({ ...a, isAuthor: true })),
    ...recArticles.map(a => ({ ...a, isAuthor: false })),
  ], [authorArticles, recArticles])

  const sortedArticles = useMemo(() => {
    if (artSort === 'popular')
      return [...allArticles].sort((a, b) => parseViews(b.views) - parseViews(a.views))
    return allArticles
  }, [allArticles, artSort])

  const SHOW_ART = 4
  const SHOW_CMT = 2

  const sortedComments = [...comments].sort(
    cmtSort === 'popular' ? (a, b) => b.likes - a.likes : () => 0
  )

  return (
    <PublicLayout>
      <main className="sd-main">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-item" onClick={() => navigate('/catalog')}>Наборы</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          {catLabel && <>
            <span className="breadcrumb-item" onClick={() => navigate(`/catalog?cat=${set.category}`)}>{catLabel}</span>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </>}
          <span className="breadcrumb-current">{set.title}</span>
          <HelpButton seenKey="ss_spl_setdetail" onOpen={() => setShowSpotlight(true)} />
        </div>

        {/* ── HERO CARD ── */}
        <div id="sp-sd-hero" className="hero-card">
          <div className="hero-body">
            <div className="hero-title">{set.title}</div>
            <div className="hero-desc">{set.desc}</div>

            {/* Meta + actions row */}
            <div className="art-meta-row">
              {set.added && <span className="fa-time">{fmtDate(set.added)}</span>}
              {set.users != null && (
                <><div className="art-meta-sep" />
                <div className="fa-action-stat">
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                  {fmtNum(set.users)}
                </div></>
              )}
              <LikeBtn liked={liked} count={(catalog?.likes || 0) + (liked ? 1 : 0)} onToggle={toggleLike} />
              {comments.length > 0 && (
                <div className="fa-action-stat">
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  {comments.length}
                </div>
              )}
              <DislikeBtn disliked={disliked} onToggle={toggleDislike} />
              <BookmarkBtn bookmarked={bookmarked} onToggle={() => setBookmarked(b => !b)} />
              {!isDefault && (
                <span className="sd-modified-badge">
                  <svg width="9" height="9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  Под меня
                </span>
              )}
              <div className="f-spacer" />
              <AddInventoryBtn added={added} onAdd={handleAdd} onRemove={handleRemove} />
            </div>
          </div>

          {/* Author block at bottom of hero */}
          {detail?.author && (
            <div className="hero-author">
              <div className="author-avatar" style={{ background: `linear-gradient(135deg, ${color}, #B8A0C8)`, cursor: 'pointer' }}
                onClick={() => navigate('/author/' + (set.source || 'ss'), { state: {
                  name: detail.author.name, ini: detail.author.initials,
                  handle: detail.author.handle || ('@' + detail.author.name.toLowerCase().replace(/\s+/g, '_')),
                  bio: detail.author.bio, color,
                  followers: set.users ? set.users.toLocaleString('ru') : '—',
                  articles: detail.authorArticles?.length ?? 0, sets: 1, following: false,
                }})}>
                {detail.author.initials}
              </div>
              <div className="author-info" style={{ cursor: 'pointer' }}
                onClick={() => navigate('/author/' + (set.source || 'ss'), { state: {
                  name: detail.author.name, ini: detail.author.initials,
                  handle: detail.author.handle || ('@' + detail.author.name.toLowerCase().replace(/\s+/g, '_')),
                  bio: detail.author.bio, color,
                  followers: set.users ? set.users.toLocaleString('ru') : '—',
                  articles: detail.authorArticles?.length ?? 0, sets: 1, following: false,
                }})}>
                <div className="author-name">{detail.author.name}</div>
                {detail.author.bio && <div className="author-bio">{detail.author.bio}</div>}
              </div>
              <FollowBtn following={following} onToggle={() => setFollowing(f => !f)} />
            </div>
          )}
        </div>

        {/* ── ITEMS SECTION CARD ── */}
        {tableItems ? (
          <div id="sp-sd-items" className="sd-section-card">
            {/* Section header */}
            <div className="sd-section-header">
              <div className="sd-section-title">
                Состав набора
                <span className="sd-section-count">{tableItems.length} позиций</span>
              </div>
              <div className="sd-section-actions">
                {!isDefault && (
                  <button className="sd-btn-sm" onClick={handleReset}>
                    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                    </svg>
                    Сбросить
                  </button>
                )}
                <button className={`sd-btn-sm${editMode ? ' active' : ''}`}
                  onClick={() => setEditMode(m => !m)}>
                  {editMode ? (
                    <><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Готово</>
                  ) : (
                    <><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg> Редактировать</>
                  )}
                </button>
              </div>
            </div>

            {/* Scale stepper — visible only in edit mode */}
            {editMode && (
              <div className="sd-scale-row">
                <div>
                  <div className="sd-scale-title">Масштаб набора</div>
                  <div className="sd-scale-desc">{isConsumable ? 'База: 1 человек / месяц' : 'База: мужчина, размер M–L'}</div>
                </div>
                <div className="sd-scale-right">
                  <span className="sd-scale-val">×{scale.toFixed(2)}</span>
                  <div className="sd-scale-stepper">
                    <button className="sd-scale-btn"
                      onMouseDown={() => startScale(-1)} onMouseUp={stopScale}
                      onMouseLeave={stopScale} onTouchStart={() => startScale(-1)} onTouchEnd={stopScale}>−</button>
                    <button className="sd-scale-btn"
                      onMouseDown={() => startScale(1)} onMouseUp={stopScale}
                      onMouseLeave={stopScale} onTouchStart={() => startScale(1)} onTouchEnd={stopScale}>+</button>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <table className="sd-items-table">
              <thead>
                <tr>
                  <th>Позиция</th>
                  <th>Кол-во</th>
                  <th>Цена</th>
                  <th>{isConsumable ? 'Расход / мес' : 'Срок службы'}</th>
                  <th>₽/мес</th>
                </tr>
              </thead>
              <tbody>
                {tableItems.map(item => {
                  const effectivePrice = item.basePrice * scale
                  const monthly = itemMonthly(item, scale)
                  const periodYears = item.period
                  const periodStr = (periodYears % 1 === 0) ? periodYears + '\u00a0лет' : (periodYears * 12) + '\u00a0мес'

                  if (editMode) {
                    return (
                      <tr key={`${item.id}-e-${scale}`}>
                        <td>
                          <div className="sd-item-name">{item.name}</div>
                          {item.note && <div className="sd-item-note">{item.note}</div>}
                        </td>
                        <td>
                          <div className="sd-qty-ctrl">
                            <button className="sd-qty-btn" onClick={() => chQty(item.id, -1)}>−</button>
                            <span className="sd-qty-n">{item.qty}</span>
                            <button className="sd-qty-btn" onClick={() => chQty(item.id, +1)}>+</button>
                          </div>
                        </td>
                        <td>
                          <input className="sd-inline-input" type="number"
                            defaultValue={Math.round(effectivePrice)} min="0" step="100"
                            onBlur={e => chPrice(item.id, e.target.value)}
                            style={{ width: 80 }} />
                        </td>
                        <td>
                          <div className="sd-period-row">
                            <input className="sd-inline-input" type="number"
                              defaultValue={item.period} min="0.25" step="0.5"
                              onBlur={e => chPeriod(item.id, e.target.value)}
                              style={{ width: 60 }} />
                            <span className="sd-period-unit">лет</span>
                          </div>
                        </td>
                        <td><span className="sd-mono-accent">{Math.round(monthly).toLocaleString('ru')}&thinsp;₽</span></td>
                      </tr>
                    )
                  }
                  const scaledQty = parseFloat((item.qty * scale).toFixed(2))
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="sd-item-name">{item.name}</div>
                        {item.note && <div className="sd-item-note">{item.note}</div>}
                      </td>
                      <td><span className="sd-mono-val">{scaledQty}&thinsp;{item.unit}</span></td>
                      <td><span className="sd-mono-val">{Math.round(effectivePrice).toLocaleString('ru')}&thinsp;₽</span></td>
                      <td>
                        {isConsumable
                          ? <span className="sd-mono-val" style={{ color: 'var(--text-2)' }}>{scaledQty}&thinsp;{item.unit}/мес</span>
                          : <span className="amort-chip">{periodStr}</span>
                        }
                      </td>
                      <td><span className="sd-mono-accent">{Math.round(monthly).toLocaleString('ru')}&thinsp;₽</span></td>
                    </tr>
                  )
                })}
                <tr id="sp-sd-calc" className="sd-total-row">
                  <td colSpan={4}>
                    Итого в месяц
                    {scale !== 1.0 && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 400, color: 'var(--accent-green)', marginLeft: 6 }}>
                        (×{scale.toFixed(2).replace(/\.?0+$/, '')})
                      </span>
                    )}
                  </td>
                  <td className="sd-total-amt">{fmtRub(totalMonthly)}</td>
                </tr>
                {totalPrice != null && (
                  <tr className="sd-total-row" style={{ opacity: 0.7 }}>
                    <td colSpan={4}>Общая стоимость</td>
                    <td className="sd-total-amt">{fmtRub(totalPrice)}</td>
                  </tr>
                )}
              </tbody>
            </table>

          </div>
        ) : (
          /* Simple items list for sets without rich data */
          <div className="sd-section-card">
            <div className="sd-section-header">
              <div className="sd-section-title">
                Состав набора
                <span className="sd-section-count">{(set.items || []).length + (set.more || 0)} позиций</span>
              </div>
            </div>
            <div className="sd-simple-list">
              {(set.items || []).map((name, i) => (
                <div key={i} className="sd-simple-row">{name}</div>
              ))}
              {set.more > 0 && (
                <div className="sd-simple-row sd-simple-more">+{set.more} позиций</div>
              )}
            </div>
            <div className="sd-items-footer">
              <span className="sd-items-amount">{(set.amount || 0).toLocaleString('ru')}&thinsp;₽</span>
              <span className="sd-items-period">{set.amountLabel}</span>
            </div>
          </div>
        )}

        {/* ── ABOUT CARD ── */}
        {detail?.about && (
          <div className="content-card">
            <div className="content-body">
              <h2>{detail.about.title}</h2>
              {detail.about.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        )}

        {/* ── ARTICLES ── */}
        {allArticles.length > 0 && (
          <div className="sd-section-card">
            <div className="sd-section-header">
              <div className="sd-section-title">
                Статьи по теме
                <span className="sd-section-count">{allArticles.length}</span>
              </div>
              <div className="sd-csort">
                {[['author', 'От автора'], ['popular', 'Популярные']].map(([k, l]) => (
                  <button key={k} className={`sd-sort-btn${artSort === k ? ' active' : ''}`}
                    onClick={() => setArtSort(k)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="sd-articles-list">
              {(artExpanded ? sortedArticles : sortedArticles.slice(0, SHOW_ART)).map((a, i) => {
                const authorName = a.isAuthor ? (detail?.author?.name || 'SmartSpend') : (a.source || 'Сообщество')
                const avatarBg   = a.isAuthor ? color : '#8B7B6B'
                const avatarText = a.isAuthor
                  ? (detail?.author?.initials || 'SS')
                  : (a.source?.[0]?.toUpperCase() || 'С')
                return (
                  <div key={i} className="sd-article-card" onClick={() => navigate('/article/a1')}>
                    <div className="sd-art-avatar" style={{ background: avatarBg }}>{avatarText}</div>
                    <div className="sd-art-body">
                      <div className="sd-art-meta-row">
                        <span className="sd-art-author">{authorName}</span>
                        <span className="sd-art-views">
                          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                          {a.views}
                        </span>
                      </div>
                      <div className="sd-art-title">{a.title}</div>
                    </div>
                    <ArrIcon />
                  </div>
                )
              })}
            </div>
            {allArticles.length > SHOW_ART && (
              <div className="sd-show-more-row">
                <button className={`sd-btn-show${artExpanded ? ' open' : ''}`}
                  onClick={() => setArtExpanded(o => !o)}>
                  {artExpanded ? 'Скрыть' : `Показать все (${allArticles.length})`}
                  <svg className="sd-chev" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── COMMENTS ── */}
        {comments.length > 0 && (
          <div className="sd-section-card">
            <div className="sd-section-header">
              <div className="sd-section-title">
                Комментарии
                <span className="sd-section-count">{comments.length}</span>
              </div>
            </div>
            <div className="sd-comments-subheader">
              <div className="sd-csort">
                {[['popular', 'Популярные'], ['new', 'Новые']].map(([k, l]) => (
                  <button key={k} className={`sd-sort-btn${cmtSort === k ? ' active' : ''}`}
                    onClick={() => setCmtSort(k)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="sd-comments-list">
              {(cmtExpanded ? sortedComments : sortedComments.slice(0, SHOW_CMT)).map((c, i) => (
                <div key={i} className="sd-comment-item">
                  <div className="sd-c-avatar">{c.ini}</div>
                  <div className="sd-c-body">
                    <div className="sd-c-header">
                      <span className="sd-c-name">{c.name}</span>
                      <span className="sd-c-date">{c.date}</span>
                    </div>
                    <div className="sd-c-text">{c.text}</div>
                    <div className="sd-c-actions">
                      <button className={`sd-c-like${likes[i] ? ' liked' : ''}`} onClick={() => {
                        setLikes(p => ({ ...p, [i]: !p[i] }))
                        if (!likes[i]) setDislikes(p => ({ ...p, [i]: false }))
                      }}>
                        <svg width="12" height="12" fill={likes[i] ? 'currentColor' : 'none'} stroke="currentColor"
                          viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                        </svg>
                        {c.likes + (likes[i] ? 1 : 0)}
                      </button>
                      <button className={`sd-c-like sd-c-dislike${dislikes[i] ? ' disliked' : ''}`} onClick={() => {
                        setDislikes(p => ({ ...p, [i]: !p[i] }))
                        if (!dislikes[i]) setLikes(p => ({ ...p, [i]: false }))
                      }}>
                        <svg width="12" height="12" fill={dislikes[i] ? 'currentColor' : 'none'} stroke="currentColor"
                          viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                          <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                        </svg>
                        {(c.dislikes || 0) + (dislikes[i] ? 1 : 0)}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {comments.length > SHOW_CMT && (
              <div className="sd-show-more-row">
                <button className={`sd-btn-show${cmtExpanded ? ' open' : ''}`}
                  onClick={() => setCmtExpanded(o => !o)}>
                  {cmtExpanded ? 'Скрыть' : `Показать все комментарии (${comments.length})`}
                  <svg className="sd-chev" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
                </button>
              </div>
            )}
            <div className="comments-input">
              <div style={{ position: 'relative' }}>
                <button className="c-emoji-btn" onClick={() => setShowCmtEmoji(p => !p)} title="Эмодзи">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                </button>
                {showCmtEmoji && (
                  <EmojiPicker
                    onPick={emoji => setCmtText(t => t + emoji)}
                    onClose={() => setShowCmtEmoji(false)}
                  />
                )}
              </div>
              <input className="c-input" placeholder="Написать комментарий…"
                value={cmtText} onChange={e => setCmtText(e.target.value)} />
              <button className="c-submit">Отправить</button>
            </div>
          </div>
        )}

        {/* Add-to-profile toast */}
        <div className={`sd-add-toast${addToast ? ' show' : ''}`}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Добавлено в профиль — позиции в инвентаре</span>
          <button className="sd-toast-link" onClick={() => { setAddToast(false); navigate('/inventory') }}>
            Перейти в инвентарь →
          </button>
        </div>

      {showSpotlight && <SpotlightTour steps={SD_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
      </main>
    </PublicLayout>
  )
}


function DocIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
}
function ArrIcon() {
  return <svg className="sd-article-arr" width="13" height="13" fill="none" stroke="currentColor"
    viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
}
function TrashIcon() {
  return <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
}
