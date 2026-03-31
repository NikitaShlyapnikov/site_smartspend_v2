import { useState, useRef, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import CommentItem from '../components/CommentAuthorChip'
import PublicLayout from '../components/PublicLayout'
import { useApp } from '../context/AppContext'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'
import { setDetails, catalogSets } from '../data/mock'
import ReactionPill from '../components/ReactionPill'
import EmojiPickerPopup from '../components/EmojiPickerPopup'

const SD_SPOTLIGHT = [
  { targetId: 'sp-sd-hero',  btnId: 'sp-sd-add',   title: 'Карточка набора',      desc: 'Здесь — название, описание и ключевые показатели набора. Кнопка «Использовать» добавит позиции в твой инвентарь.' },
  { targetId: 'sp-sd-items', btnId: null,           title: 'Состав набора',        desc: 'Список позиций. Нажми «Изменить набор» — появится масштаб, позволяющий адаптировать набор под свои нужды (например, ×2 для двух человек).' },
  { targetId: 'sp-sd-calc',  btnId: null,           title: 'Как считается сумма?', desc: 'Вещи: цена × кол-во ÷ (срок_лет × 12) = ₽/мес — это ежемесячная амортизация. Расходники: стоимость партии ÷ месяцев между закупками = ₽/мес. «Общая стоимость» — итого за одну закупку.' },
]

const SD_PERSONAL_SPOTLIGHT = [
  { targetId: 'sp-sd-hero',         btnId: null, title: 'Личный набор',         desc: 'Это твой личный набор. Здесь нет публичных оценок и комментариев — только твои данные. Ставь на паузу или удаляй набор через кнопки слева.' },
  { targetId: 'sp-sd-items',        btnId: null, title: 'Состав и редактирование', desc: 'Нажми «Редактировать», чтобы изменить количество позиций в граммах и мл, скорректировать цены или сроки службы.' },
  { targetId: 'sp-sd-personal-arts', btnId: null, title: 'Статьи к набору',     desc: 'Прикрепляй статьи, которые вдохновили этот набор: свои или из ленты. Нажми «Написать», чтобы создать новую.' },
  { targetId: 'sp-sd-personal-notes', btnId: null, title: 'Заметки',            desc: 'Записывай мысли, наблюдения или напоминания прямо в карточке набора — они сохраняются только у тебя.' },
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

function ArticleAuthorBubble({ name, ini, color }) {
  const [showCard, setShowCard] = useState(false)
  const [showSheet, setShowSheet] = useState(false)
  const [popPos, setPopPos] = useState(null)
  const ref = useRef(null)
  const showTimer = useRef(null)
  const hideTimer = useRef(null)
  const isTouch = () => window.matchMedia('(hover: none)').matches

  function open() {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      setPopPos({ top: r.bottom + 8, left: r.left })
    }
    setShowCard(true)
  }
  function onEnter() {
    if (isTouch()) return
    clearTimeout(hideTimer.current)
    showTimer.current = setTimeout(open, 300)
  }
  function onLeave() {
    if (isTouch()) return
    clearTimeout(showTimer.current)
    hideTimer.current = setTimeout(() => setShowCard(false), 180)
  }
  function handleClick(e) {
    e.stopPropagation()
    if (isTouch()) { setShowSheet(true); return }
    open()
  }

  return (
    <>
      <div
        ref={ref}
        className="sd-art-author-avatar"
        style={{ background: color }}
        title={name}
        onClick={handleClick}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >{ini}</div>
      {showCard && popPos && createPortal(
        <div className="author-popover" style={{ position: 'fixed', top: popPos.top, left: popPos.left, zIndex: 300 }}
          onClick={e => e.stopPropagation()}
          onMouseEnter={() => clearTimeout(hideTimer.current)}
          onMouseLeave={onLeave}
        >
          <div className="ap-top">
            <div className="ap-avatar" style={{ background: color }}>{ini}</div>
          </div>
          <div className="ap-name" style={{ cursor: 'default' }}>{name}</div>
          <div className="ap-meta">Автор статей в этом наборе</div>
        </div>,
        document.body
      )}
      {showSheet && createPortal(
        <>
          <div className="abs-backdrop" onClick={() => setShowSheet(false)} />
          <div className="author-bottom-sheet">
            <div className="abs-handle" />
            <div className="ap-top">
              <div className="ap-avatar" style={{ background: color }}>{ini}</div>
            </div>
            <div className="ap-name" style={{ cursor: 'default' }}>{name}</div>
            <div className="ap-meta">Автор статей в этом наборе</div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}

function SetAuthorChip({ author, authorSlug, navigate, color, date }) {
  const [showCard, setShowCard] = useState(false)
  const [showSheet, setShowSheet] = useState(false)
  const [popPos, setPopPos] = useState(null)
  const chipRef = useRef(null)
  const showTimer = useRef(null)
  const hideTimer = useRef(null)
  const isTouch = () => window.matchMedia('(hover: none)').matches

  function handleClick(e) {
    e.stopPropagation()
    if (isTouch()) { setShowSheet(true); return }
    navigate('/author/' + authorSlug, { state: {
      name: author.name, ini: author.initials,
      handle: author.handle || ('@' + author.name.toLowerCase().replace(/\s+/g, '_')),
      bio: author.bio, color,
    }})
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
      <button ref={chipRef} className="author-chip" onClick={handleClick}>
        <div className="author-avatar-sm" style={{ background: color }}>{author.initials}</div>
        <span className="author-chip-meta">
          <span className="author-name-inline">{author.name}</span>
          {date && <span className="author-chip-date">{date}</span>}
        </span>
      </button>
      {showCard && popPos && createPortal(
        <div className="author-popover" style={{ position: 'fixed', top: popPos.top, left: popPos.left, zIndex: 300 }}
          onClick={e => e.stopPropagation()}
          onMouseEnter={() => clearTimeout(hideTimer.current)}
          onMouseLeave={onLeave}
        >
          <div className="ap-top">
            <div className="ap-avatar" style={{ background: color }}>{author.initials}</div>
          </div>
          <button className="ap-name" onClick={handleClick}>{author.name}</button>
          {author.bio && <p className="ap-desc">{author.bio}</p>}
        </div>,
        document.body
      )}
      {showSheet && createPortal(
        <>
          <div className="abs-backdrop" onClick={() => setShowSheet(false)} />
          <div className="author-bottom-sheet">
            <div className="abs-handle" />
            <div className="ap-top">
              <div className="ap-avatar" style={{ background: color }}>{author.initials}</div>
            </div>
            <div className="ap-name" style={{ cursor: 'default' }}>{author.name}</div>
            {author.bio && <div className="ap-meta">{author.bio}</div>}
          </div>
        </>,
        document.body
      )}
    </span>
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
            В профиле
          </>
        ) : (
          <>
            <svg className="sd-inv-icon" width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v13M7 10l5 5 5-5"/>
              <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/>
            </svg>
            Использовать
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
  const location = useLocation()
  const { collapsed } = useApp()
  const sidebarOffset = collapsed ? 28 : 120  // half of 56px or 240px

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
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`ss_set_notes_${id}`) || '[]') } catch { return [] }
  })
  const [noteText, setNoteText] = useState('')
  const [myArticles, setMyArticles] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`ss_set_articles_${id}`) || '[]') } catch { return [] }
  })
  const [pauseToast, setPauseToast] = useState(false)
  const pauseToastTimerRef = useRef(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [envPaused, setEnvPaused] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem('ss_envelopes') || '{}')
      for (const list of Object.values(data)) {
        const entry = list.find(e => e.id === id)
        if (entry) return !!entry.paused
      }
    } catch {}
    return false
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
  const [showPersonalSpotlight, setShowPersonalSpotlight] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [editMode, setEditMode]   = useState(false)
  const [scale, setScaleRaw]      = useState(1.0)
  const [artSort, setArtSort]     = useState('author')
  const [artExpanded, setArtExpanded] = useState(false)
  const [cmtExpanded, setCmtExpanded] = useState(false)
  const [cmtSort, setCmtSort]     = useState('popular')
  const [cmtText, setCmtText]     = useState('')
  const [likes, setLikes]         = useState({})
  const [dislikes, setDislikes]   = useState({})
  const [bookmarked, setBookmarked] = useState(false)
  const [addToast, setAddToast] = useState(false)
  const addToastTimerRef = useRef(null)
  const [cmtToast, setCmtToast] = useState(false)

  function handleSubmitCmt(e) {
    e.preventDefault()
    if (!cmtText.trim()) return
    setCmtText('')
    setCmtToast(true)
    setTimeout(() => setCmtToast(false), 2200)
  }
  function addNote(e) {
    e.preventDefault()
    if (!noteText.trim()) return
    const note = { id: Date.now(), text: noteText.trim(), createdAt: new Date().toLocaleDateString('ru') }
    const next = [note, ...notes]
    setNotes(next)
    try { localStorage.setItem(`ss_set_notes_${id}`, JSON.stringify(next)) } catch {}
    setNoteText('')
  }
  function deleteNote(noteId) {
    const next = notes.filter(n => n.id !== noteId)
    setNotes(next)
    try { localStorage.setItem(`ss_set_notes_${id}`, JSON.stringify(next)) } catch {}
  }
  function toggleEnvPause() {
    const next = !envPaused
    try {
      const data = JSON.parse(localStorage.getItem('ss_envelopes') || '{}')
      for (const cat of Object.keys(data)) {
        data[cat] = data[cat].map(e => e.id === id ? { ...e, paused: next } : e)
      }
      localStorage.setItem('ss_envelopes', JSON.stringify(data))
      const invData = JSON.parse(localStorage.getItem('ss_inventory_extra') || '[]')
      localStorage.setItem('ss_inventory_extra', JSON.stringify(invData.map(i => i.setId === id ? { ...i, paused: next } : i)))
    } catch {}
    setEnvPaused(next)
    if (next) {
      if (pauseToastTimerRef.current) clearTimeout(pauseToastTimerRef.current)
      setPauseToast(true)
      pauseToastTimerRef.current = setTimeout(() => setPauseToast(false), 5000)
    }
  }
  function removeFromProfile() {
    try {
      const data = JSON.parse(localStorage.getItem('ss_envelopes') || '{}')
      for (const cat of Object.keys(data)) { data[cat] = data[cat].filter(e => e.id !== id) }
      localStorage.setItem('ss_envelopes', JSON.stringify(data))
      const invData = JSON.parse(localStorage.getItem('ss_inventory_extra') || '[]')
      localStorage.setItem('ss_inventory_extra', JSON.stringify(invData.filter(i => !(i.setId === id && i.paused))))
    } catch {}
    navigate('/profile')
  }
  const [reactions, setReactions] = useState([{ emoji: '🔥', count: 8 }, { emoji: '💡', count: 5 }, { emoji: '👏', count: 3 }])
  const [myReactions, setMyReactions] = useState(new Set())
  const [showReactPicker, setShowReactPicker] = useState(false)
  const [justAdded, setJustAdded] = useState(null)

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
      desc: set.desc || '',
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

  function handleReset() {
    setItems(defaultItems.map(i => ({ ...i })))
    setScaleRaw(1.0)
    setEditMode(false)
  }

  // Item edit handlers
  function chQty(itemId, delta) {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
  }
  // Personal edit: qty shown in g/ml, changes baked into item.qty
  function chQtyPersonal(itemId, dir, unit) {
    const step = (unit === 'кг' || unit === 'л') ? 10 : 1
    setItems(prev => prev.map(i => {
      if (i.id !== itemId) return i
      const factor = (i.unit === 'кг' || i.unit === 'л') ? 1000 : 1
      const currentDisplay = i.qty * factor
      const newDisplay = Math.max(0, currentDisplay + dir * step)
      return { ...i, qty: Math.round(newDisplay / factor * 1000) / 1000 }
    }))
  }
  function chPrice(itemId, v) {
    const n = parseFloat(v)
    if (!isNaN(n) && n >= 0) {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, basePrice: n } : i))
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

  const isPersonal = location.state?.fromProfile === true
  const fromCatalog = isPersonal && (set?.source === 'ss' || set?.source === 'community')

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

  const uniqueArticleAuthors = useMemo(() => {
    const seen = new Set()
    const result = []
    allArticles.forEach(a => {
      const ini = a.isAuthor ? (detail?.author?.initials || 'SS') : (a.ini || a.author?.[0]?.toUpperCase() || 'С')
      if (!seen.has(ini)) {
        seen.add(ini)
        result.push({
          name:  a.isAuthor ? (detail?.author?.name || 'SmartSpend') : (a.author || 'Сообщество'),
          ini,
          color: a.isAuthor ? color : '#8B7B6B',
        })
      }
    })
    return result
  }, [allArticles, detail, color])

  const SHOW_ART = 9
  const SHOW_CMT = 2

  const sortedComments = [...comments].sort(
    cmtSort === 'popular' ? (a, b) => b.likes - a.likes : () => 0
  )

  return (
    <PublicLayout>
      <main className="sd-main">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          {isPersonal ? (
            <>
              <span className="breadcrumb-item" onClick={() => navigate('/profile')}>Профиль</span>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              {catLabel && <>
                <span className="breadcrumb-item">{catLabel}</span>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </>}
            </>
          ) : (
            <>
              <span className="breadcrumb-item" onClick={() => navigate('/catalog')}>Наборы</span>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              {catLabel && <>
                <span className="breadcrumb-item" onClick={() => navigate(`/catalog?cat=${set.category}`)}>{catLabel}</span>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </>}
            </>
          )}
          <span className="breadcrumb-current">{set.title}</span>
          {isPersonal
            ? <HelpButton seenKey="ss_spl_setdetail_personal" onOpen={() => setShowPersonalSpotlight(true)} />
            : <HelpButton seenKey="ss_spl_setdetail" onOpen={() => setShowSpotlight(true)} />
          }
        </div>

        {/* ── UNIFIED CARD: hero + items + about + meta ── */}
        <div id="sp-sd-hero" className="hero-card">
          <div className="hero-body">
            <div className="hero-body-main">
              <div className="hero-title">{set.title}</div>
              <div className="hero-desc">{set.desc}</div>
            </div>
            {!isPersonal && (
              <div className="hero-body-actions">
                <AddInventoryBtn added={added} onAdd={handleAdd} onRemove={handleRemove} />
              </div>
            )}
          </div>

          {/* Items section */}
          {tableItems ? (
            <>
              <div id="sp-sd-items" className="sd-section-header">
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
                    onClick={() => {
                      if (isPersonal && scale !== 1.0) {
                        setItems(prev => prev.map(i => ({ ...i, qty: Math.round(i.qty * scale * 1000) / 1000 })))
                        setScaleRaw(1.0)
                      }
                      setEditMode(m => !m)
                    }}>
                    {editMode ? (
                      <><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Готово</>
                    ) : (
                      isPersonal ? 'Редактировать' : 'Изменить набор'
                    )}
                  </button>
                </div>
              </div>
              {editMode && (
                <div className="sd-scale-row">
                  <div>
                    <div className="sd-scale-title">Масштаб набора</div>
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
                    const monthly = itemMonthly(item, scale)
                    const periodYears = item.period
                    const periodStr = (periodYears % 1 === 0) ? periodYears + '\u00a0лет' : (periodYears * 12) + '\u00a0мес'
                    const rawScaled = item.qty * scale
                    const displayQty = parseFloat(rawScaled.toFixed(2))
                    const displayUnit = item.unit
                    if (editMode) {
                      const editDisplayQty = isPersonal
                        ? (item.unit === 'кг' || item.unit === 'л') ? Math.round(item.qty * 1000) : item.qty
                        : item.qty
                      const editDisplayUnit = isPersonal
                        ? item.unit === 'кг' ? 'г' : item.unit === 'л' ? 'мл' : item.unit
                        : item.unit
                      return (
                        <tr key={`${item.id}-e-${scale}`}>
                          <td><div className="sd-item-name">{item.name}</div></td>
                          <td>
                            <div className="sd-qty-ctrl">
                              {isPersonal ? (
                                <>
                                  <button className="sd-qty-btn" onClick={() => chQtyPersonal(item.id, -1, item.unit)}>−</button>
                                  <span className="sd-qty-n">{editDisplayQty.toLocaleString('ru')}&thinsp;{editDisplayUnit}</span>
                                  <button className="sd-qty-btn" onClick={() => chQtyPersonal(item.id, +1, item.unit)}>+</button>
                                </>
                              ) : (
                                <>
                                  <button className="sd-qty-btn" onClick={() => chQty(item.id, -1)}>−</button>
                                  <span className="sd-qty-n">{item.qty}&thinsp;{item.unit}</span>
                                  <button className="sd-qty-btn" onClick={() => chQty(item.id, +1)}>+</button>
                                </>
                              )}
                            </div>
                          </td>
                          <td>
                            <input className="sd-inline-input" type="number"
                              defaultValue={Math.round(item.basePrice)} min="0" step="100"
                              onBlur={e => chPrice(item.id, e.target.value)}
                              style={{ width: 80 }} />
                          </td>
                          <td>
                            <div className="sd-period-row">
                              <input className="sd-inline-input" type="number"
                                defaultValue={isConsumable ? item.period * 12 : item.period}
                                min={isConsumable ? 1 : 0.25}
                                step={isConsumable ? 1 : 0.5}
                                onBlur={e => chPeriod(item.id, isConsumable ? parseFloat(e.target.value) / 12 : e.target.value)}
                                style={{ width: 60 }} />
                              <span className="sd-period-unit">{isConsumable ? 'мес' : 'лет'}</span>
                            </div>
                          </td>
                          <td><span className="sd-mono-accent">{Math.round(monthly).toLocaleString('ru')}&thinsp;₽</span></td>
                        </tr>
                      )
                    }
                    return (
                      <tr key={item.id}>
                        <td><div className="sd-item-name">{item.name}</div></td>
                        <td><span className="sd-mono-val">{displayQty.toLocaleString('ru')}&thinsp;{displayUnit}</span></td>
                        <td><span className="sd-mono-val">{Math.round(item.basePrice).toLocaleString('ru')}&thinsp;₽</span></td>
                        <td>
                          {isConsumable
                            ? <span className="sd-mono-val" style={{ color: 'var(--text-2)' }}>{displayQty.toLocaleString('ru')}&thinsp;{displayUnit}/мес</span>
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
            </>
          ) : (
            <>
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
            </>
          )}

          {/* Detailed description — collapsible */}
          {detail?.about && (
            <div className="sd-about-wrap">
              <div className={`content-body sd-about-body${showAbout ? '' : ' sd-about-collapsed'}`}>
                <h2>{detail.about.title}</h2>
                {detail.about.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              </div>
              {!showAbout && (
                <div className="sd-about-fade">
                  <button className="sd-about-expand" onClick={() => setShowAbout(true)}>Развернуть</button>
                </div>
              )}
            </div>
          )}

          {/* Meta + actions row */}
          <div className="art-meta-row">
            {!isPersonal && detail?.author && (
              <SetAuthorChip
                author={detail.author}
                authorSlug={set.source || 'ss'}
                navigate={navigate}
                color={`linear-gradient(135deg, ${color}, #B8A0C8)`}
                date={set.added ? fmtDate(set.added) : null}
              />
            )}
            {!isPersonal && detail?.author && <div className="art-meta-sep" />}
            {isPersonal && (
              <div className="sd-personal-actions">
                <button
                  className={`sd-personal-state${envPaused ? ' paused' : ''}`}
                  onClick={toggleEnvPause}
                  title={envPaused ? 'Запустить набор' : 'Поставить на паузу'}
                >
                  {envPaused ? (
                    <><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Запустить</>
                  ) : (
                    <><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> На паузу</>
                  )}
                </button>
                <button className="sd-personal-delete" onClick={() => { setDeleteConfirmText(''); setShowDeleteModal(true) }} title="Удалить набор из профиля">
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            )}
            {!isPersonal && set.users != null && (
              <><div className="art-meta-sep" />
              <div className="fa-action-stat">
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
                {fmtNum(set.users)}
              </div></>
            )}
            {!isPersonal && <LikeBtn liked={liked} count={(catalog?.likes || 0) + (liked ? 1 : 0)} onToggle={toggleLike} />}
            {!isPersonal && comments.length > 0 && (
              <div className="fa-action-stat fa-action-stat--link"
                onClick={() => document.getElementById('sd-comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {comments.length}
              </div>
            )}
            {!isPersonal && allArticles.length > 0 && (
              <div className="fa-action-stat fa-action-stat--link"
                onClick={() => document.getElementById('sd-articles-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                {allArticles.length}
              </div>
            )}
            {!isPersonal && <DislikeBtn disliked={disliked} onToggle={toggleDislike} />}
            {!isPersonal && <BookmarkBtn bookmarked={bookmarked} onToggle={() => setBookmarked(b => !b)} />}
          </div>
        </div>

        {/* ── PARENT SET CARD (personal only) ── */}
        {fromCatalog && (
          <div className="sd-parent-card" onClick={() => navigate(`/set/${id}?public=1`)}>
            <div className="sd-parent-card-left">
              <div className="sd-parent-card-label">Связанный набор</div>
              <div className="sd-parent-card-name">{set.title}</div>
            </div>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        )}

        {/* ── ARTICLES (public) / ARTICLES+NOTES (personal) ── */}
        {isPersonal ? (
          <>
          {/* Personal articles first */}
          <div id="sp-sd-personal-arts" className="sd-section-card">
            <div className="sd-section-header">
              <div className="sd-section-title">
                Статьи
                {myArticles.length > 0 && <span className="sd-section-count">{myArticles.length}</span>}
              </div>
              <button className="sd-btn-sm" onClick={() => navigate('/create-article')}>
                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Написать
              </button>
            </div>
            {myArticles.length === 0 ? (
              <div className="sd-notes-empty">
                <div className="sd-notes-empty-text">Нет прикреплённых статей. Напишите статью или прикрепите из ленты.</div>
              </div>
            ) : (
              <div className="sd-articles-list">
                {myArticles.map((a, i) => (
                  <div key={i} className="sd-article-card" onClick={() => navigate('/article/' + (a.id || 'a1'))}>
                    <div className="sd-art-avatar" style={{ background: '#8B7B6B' }}>{a.ini || '?'}</div>
                    <div className="sd-art-body">
                      <div className="sd-art-meta-row">
                        <span className="sd-art-author">{a.author}</span>
                      </div>
                      <div className="sd-art-title">{a.title}</div>
                    </div>
                    <ArrIcon />
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Notes second */}
          <div id="sp-sd-personal-notes" className="sd-section-card">
            <div className="sd-section-header">
              <div className="sd-section-title">
                Заметки
                {notes.length > 0 && <span className="sd-section-count">{notes.length}</span>}
              </div>
            </div>
            {notes.length === 0 && (
              <div className="sd-notes-empty">
                <div className="sd-notes-empty-text">Заметок пока нет. Добавьте мысли, наблюдения или прикрепите статьи из ленты.</div>
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
              <input
                className="sd-note-input"
                placeholder="Добавить заметку…"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
              <button type="submit" className="sd-note-submit" disabled={!noteText.trim()}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>

          </>
        ) : allArticles.length > 0 && (
          <div id="sd-articles-section" className="sd-section-card">
            <div className="sd-section-header">
              <div className="sd-section-title">Дополнения</div>
            </div>

            {/* Authors row */}
            {uniqueArticleAuthors.length > 0 && (
              <div className="sd-art-authors-row">
                <span className="sd-art-authors-label">Авторы</span>
                {uniqueArticleAuthors.map((a, i) => (
                  <ArticleAuthorBubble key={i} name={a.name} ini={a.ini} color={a.color} />
                ))}
              </div>
            )}

            {/* Articles grid */}
            <div className="sd-articles-grid">
              {(artExpanded ? sortedArticles : sortedArticles.slice(0, SHOW_ART)).map((a, i) => (
                <div key={i} className="sd-art-grid-card" onClick={() => navigate('/article/a1')}>
                  <div className="sd-art-grid-title">{a.title}</div>
                  {a.preview && <div className="sd-art-grid-preview">{a.preview}</div>}
                </div>
              ))}
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
        {!isPersonal && comments.length > 0 && (
          <div id="sd-comments-section" className="sd-section-card">
            {/* Single unified header row */}
            <div className="sd-comments-header-row">
              <span className="sd-section-title">Комментарии</span>
              <span className="sd-comments-header-spacer" />
              {reactions.map(r => (
                <ReactionPill key={r.emoji} emoji={r.emoji} count={r.count}
                  active={myReactions.has(r.emoji)} onToggle={toggleReaction}
                  autoAnimate={justAdded === r.emoji} />
              ))}
              {reactions.length < 6 && (
                <div style={{ position: 'relative' }}>
                  <button className="ar-add-btn" onClick={() => setShowReactPicker(p => !p)} title="Добавить реакцию">
                    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                    </svg>
                  </button>
                  {showReactPicker && (
                    <EmojiPickerPopup
                      onPick={emoji => { toggleReaction(emoji); setJustAdded(emoji); setTimeout(() => setJustAdded(null), 700); setShowReactPicker(false) }}
                      onClose={() => setShowReactPicker(false)}
                    />
                  )}
                </div>
              )}
              <span className="sd-comments-header-spacer" />
              <div className="sd-csort" style={{ flexShrink: 0 }}>
                {[['popular', 'Популярные'], ['new', 'Новые']].map(([k, l]) => (
                  <button key={k} className={`sd-sort-btn${cmtSort === k ? ' active' : ''}`}
                    onClick={() => setCmtSort(k)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="sd-comments-list">
              {(cmtExpanded ? sortedComments : sortedComments.slice(0, SHOW_CMT)).map((c, i) => (
                <div key={i} className="sd-comment-item">
                  <CommentItem name={c.name} ini={c.ini} navigate={navigate} avatarClass="sd-c-avatar" nameClass="sd-c-name sd-c-name--link" date={c.date}>
                    <div className="sd-c-text">{c.text}</div>
                    <div className="sd-c-actions">
                      <button className={`sd-c-like${likes[i] ? ' liked' : ''}`} onClick={() => {
                        setLikes(p => ({ ...p, [i]: !p[i] }))
                        if (!likes[i]) setDislikes(p => ({ ...p, [i]: false }))
                      }}>
                        <svg width="12" height="12" fill={likes[i] ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                        </svg>
                        {c.likes + (likes[i] ? 1 : 0)}
                      </button>
                      <button className={`sd-c-like sd-c-dislike${dislikes[i] ? ' disliked' : ''}`} onClick={() => {
                        setDislikes(p => ({ ...p, [i]: !p[i] }))
                        if (!dislikes[i]) setLikes(p => ({ ...p, [i]: false }))
                      }}>
                        <svg width="12" height="12" fill={dislikes[i] ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                          <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                        </svg>
                        {(c.dislikes || 0) + (dislikes[i] ? 1 : 0)}
                      </button>
                    </div>
                  </CommentItem>
                </div>
              ))}
            </div>
            {!cmtExpanded && comments.length > SHOW_CMT && (
              <div className="sd-show-more-row">
                <button className="sd-btn-show" onClick={() => setCmtExpanded(true)}>
                  Показать все комментарии ({comments.length})
                  <svg className="sd-chev" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
                </button>
              </div>
            )}
            <form className="comments-input" onSubmit={handleSubmitCmt}>
              <input className="c-input" placeholder="Написать комментарий…"
                value={cmtText} onChange={e => setCmtText(e.target.value)} />
              <button type="submit" className="c-submit">Отправить</button>
            </form>
          </div>
        )}

        {/* Add-to-profile toast */}
        <div className={`sd-add-toast${addToast ? ' show' : ''}`} style={{ left: `calc(50% + ${sidebarOffset}px)` }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Добавлено в профиль — позиции в инвентаре</span>
          <button className="sd-toast-link" onClick={() => { setAddToast(false); navigate('/inventory') }}>
            Перейти в инвентарь →
          </button>
        </div>

        <div className={`toast${cmtToast ? ' show' : ''}`} style={{ left: `calc(50% + ${sidebarOffset}px)` }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Комментарий отправлен
        </div>

        {/* Pause toast */}
        <div className={`sd-pause-toast${pauseToast ? ' show' : ''}`} style={{ left: `calc(50% + ${sidebarOffset}px)` }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, opacity: 0.8 }}>
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
          <div className="sd-pause-toast-body">
            <div className="sd-pause-toast-title">Набор поставлен на паузу</div>
            <div className="sd-pause-toast-desc">Все позиции этого набора в инвентаре переведены в режим паузы и не учитываются в расходах до момента запуска.</div>
          </div>
          <button className="sd-pause-toast-close" onClick={() => setPauseToast(false)}>✕</button>
        </div>

        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <div className="sd-delete-overlay" onClick={e => e.target === e.currentTarget && setShowDeleteModal(false)}>
            <div className="sd-delete-modal">
              <div className="sd-delete-modal-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </div>
              <div className="sd-delete-modal-title">Удалить набор из профиля?</div>
              <div className="sd-delete-modal-desc">
                Набор и все связанные позиции инвентаря будут удалены из профиля. Это действие нельзя отменить.
              </div>
              <div className="sd-delete-modal-confirm-label">
                Введите название набора для подтверждения:
                <span className="sd-delete-modal-name">«{set.title}»</span>
              </div>
              <input
                className="sd-delete-modal-input"
                placeholder={set.title}
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                autoFocus
              />
              <div className="sd-delete-modal-actions">
                <button className="sd-delete-modal-cancel" onClick={() => setShowDeleteModal(false)}>Отмена</button>
                <button
                  className="sd-delete-modal-confirm"
                  disabled={deleteConfirmText !== set.title}
                  onClick={() => { setShowDeleteModal(false); removeFromProfile() }}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}

      {showSpotlight && <SpotlightTour steps={SD_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
      {showPersonalSpotlight && <SpotlightTour steps={SD_PERSONAL_SPOTLIGHT} onClose={() => setShowPersonalSpotlight(false)} />}
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
