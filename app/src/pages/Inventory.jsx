import { useState, useRef, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'
import { inventoryGroups } from '../data/mock'

function loadPersonalSets() {
  try {
    const env = JSON.parse(localStorage.getItem('ss_envelopes') || '{}')
    return Object.entries(env).flatMap(([catId, sets]) =>
      (sets || []).map(s => ({ ...s, catId }))
    )
  } catch { return [] }
}

const INV_SPOTLIGHT = [
  { targetId: 'sp-inv-groups', title: 'Список инвентаря', desc: 'Позиции сгруппированы по статусу. Нажми на строку — откроется панель деталей справа.' },
]

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const ALL_GROUPS = [
  { id: 'g1', name: 'Одежда и Обувь',       color: '#B8A0C8', setCategories: ['clothes'] },
  { id: 'g2', name: 'Еда и Супермаркеты',   color: '#8DBFA8', setCategories: ['food'] },
  { id: 'g3', name: 'Дом и Техника',        color: '#9EA8C0', setCategories: ['home'] },
  { id: 'g4', name: 'Красота и Здоровье',   color: '#C4B0C0', setCategories: ['health'] },
  { id: 'g5', name: 'Авто и Транспорт',     color: '#8AAFC8', setCategories: ['transport'] },
  { id: 'g6', name: 'Развлечения и Хобби',  color: '#C8A8A0', setCategories: ['leisure'] },
  { id: 'g7', name: 'Образование и Дети',   color: '#A8C0B0', setCategories: ['education'] },
  { id: 'g8', name: 'Прочие расходы',       color: '#B0A898', setCategories: ['other'] },
]

// ── HELPERS ───────────────────────────────────────────────────────────────────

function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

function getItemInfo(item, override = null) {
  let pct, status, remainderText, ringNum, ringUnit, monthlyBlock = null

  if (item.type === 'consumable') {
    const unit = item.unit || 'г'
    const remaining = override !== null
      ? Math.max(0, override)
      : Math.max(0, item.qty - daysSince(item.lastBought) * item.dailyUse)

    const daysLeft = item.dailyUse > 0 ? Math.round(remaining / item.dailyUse) : 0
    pct = Math.max(0, Math.min(100, Math.round((1 - remaining / item.qty) * 100)))

    const r = (unit === 'г' || unit === 'мл') ? Math.round(remaining) : parseFloat(remaining.toFixed(1))
    let daysHint = ''
    if (daysLeft > 0) {
      if (daysLeft < 7) {
        const d = daysLeft; const f = d === 1 ? 'день' : d < 5 ? 'дня' : 'дней'
        daysHint = ` (${d}\u00a0${f})`
      } else if (daysLeft < 30) {
        const w = Math.floor(daysLeft / 7); const f = w === 1 ? 'неделя' : w < 5 ? 'недели' : 'недель'
        daysHint = ` (${w}\u00a0${f})`
      } else {
        const m = Math.floor(daysLeft / 30); const f = m === 1 ? 'месяц' : m < 5 ? 'месяца' : 'месяцев'
        daysHint = ` (${m}\u00a0${f})`
      }
    }
    remainderText = r > 0 ? `осталось ${r}\u00a0${unit}${daysHint}` : 'закончилось'

    if (daysLeft <= 0) { ringNum = '0'; ringUnit = 'дн' }
    else if (daysLeft < 7) { ringNum = String(daysLeft); ringUnit = 'дн' }
    else if (daysLeft < 30) { ringNum = String(Math.floor(daysLeft / 7)); ringUnit = 'нед' }
    else { ringNum = String(Math.floor(daysLeft / 30)); ringUnit = 'мес' }

    const monthlyNeed = item.dailyUse * 30
    const deficit = monthlyNeed - remaining
    const pricePerUnit = item.price / item.qty
    if (deficit > 0) {
      const deficitRub = Math.round(deficit * pricePerUnit)
      const deficitAmt = (unit === 'г' || unit === 'мл')
        ? `${Math.round(deficit)}\u00a0${unit}`
        : `${parseFloat(deficit.toFixed(1))}\u00a0${unit}`
      monthlyBlock = { type: 'deficit', deficitAmt, deficitRub }
    } else {
      const surplusDays = Math.round(-deficit / item.dailyUse)
      const surplusRub = Math.round(-deficit * pricePerUnit)
      monthlyBlock = { type: 'surplus', surplusDays, surplusRub }
    }

    if (pct >= 85) status = 'urgent'
    else if (pct >= 60) status = 'soon'
    else status = 'ok'

  } else {
    const purchaseDate = override !== null ? override : item.purchaseDate
    if (!purchaseDate) {
      pct = 0; status = 'urgent'
      remainderText = 'дата не указана'
      ringNum = '—'; ringUnit = ''
    } else {
      const weeksUsed = Math.floor(daysSince(purchaseDate) / 7)
      const overExploit = weeksUsed > item.wearLifeWeeks
      const weeksLeft = Math.max(0, item.wearLifeWeeks - weeksUsed)
      const weeksOver = weeksUsed - item.wearLifeWeeks
      pct = Math.min(100, Math.round((weeksUsed / item.wearLifeWeeks) * 100))

      if (overExploit) {
        remainderText = `+${weeksOver}\u00a0нед. сверх нормы`
        ringNum = '+' + weeksOver; ringUnit = 'нед'
        const bonusIncome = Math.round((item.price / item.wearLifeWeeks) * weeksOver)
        monthlyBlock = { type: 'overexploit', weeksOver, bonusIncome }
        status = 'overexploit'
      } else {
        const daysLeft = Math.max(0, item.wearLifeWeeks * 7 - Math.floor(daysSince(purchaseDate)))
        if (daysLeft === 0) remainderText = 'требует замены'
        else if (daysLeft <= 7) remainderText = `осталось ${daysLeft}\u00a0дн. до замены`
        else if (weeksLeft <= 4) remainderText = `осталось ${weeksLeft}\u00a0нед. до замены`
        else if (weeksLeft < 52) remainderText = `осталось ${Math.round(daysLeft / 30)}\u00a0мес. до замены`
        else remainderText = `осталось ${Math.floor(weeksLeft / 52)}\u00a0г. до замены`
        if (weeksLeft === 0) { ringNum = '0'; ringUnit = 'нед' }
        else if (weeksLeft < 52) { ringNum = String(weeksLeft); ringUnit = 'нед' }
        else { ringNum = String(Math.floor(weeksLeft / 52)); ringUnit = 'лет' }
        if (pct >= 90) status = 'urgent'
        else if (pct >= 75) status = 'soon'
        else status = 'ok'
      }
    }
  }

  const filterStatus = status === 'overexploit' ? 'urgent' : status
  return { pct, status, filterStatus, remainderText, ringNum, ringUnit, monthlyBlock }
}

function getStepSize(elapsed) {
  if (elapsed < 800) return 1
  if (elapsed < 1800) return 10
  if (elapsed < 3000) return 100
  return 1000
}

// ── STATUS DOT ────────────────────────────────────────────────────────────────

function StatusDot({ status, paused }) {
  const s = paused ? 'paused' : status
  return <span className={`irow-dot irow-dot--${s}`} />
}

// ── ITEM ROW ──────────────────────────────────────────────────────────────────

const EmptyIcon = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

function ItemRow({ item, info, override, costPeriod = 'week', selected, onSelect }) {
  const paused = !!item.paused
  const { pct, status } = info

  let timeContent = null
  let costContent = null

  if (item.type === 'consumable') {
    const ov = override !== null ? Math.max(0, override) : Math.max(0, item.qty - daysSince(item.lastBought) * item.dailyUse)
    const dailyCost = item.qty > 0 ? item.dailyUse * item.price / item.qty : 0
    const cost = Math.round(dailyCost * (costPeriod === 'month' ? 30 : 7))
    const periodLabel = costPeriod === 'month' ? '/мес' : '/нед'
    const daysLeft = item.dailyUse > 0 ? Math.round(ov / item.dailyUse) : 0

    if (daysLeft <= 0) {
      timeContent = <EmptyIcon />
    } else if (daysLeft < 7) {
      timeContent = `${daysLeft} дн.`
    } else if (daysLeft < 30) {
      timeContent = `${Math.floor(daysLeft / 7)} нед.`
    } else {
      timeContent = `${Math.floor(daysLeft / 30)} мес.`
    }

    costContent = <span className="irow-price">₽{cost.toLocaleString('ru')}{periodLabel}</span>
  } else {
    const priceText = `₽${(item.price || 0).toLocaleString('ru')}`
    costContent = <span className="irow-price">{priceText}</span>

    {
      const pd = override !== null ? override : item.purchaseDate
      if (pd) {
        const wu = Math.floor(daysSince(pd) / 7)
        const weeksLeft = Math.max(0, item.wearLifeWeeks - wu)
        const daysLeft = Math.max(0, item.wearLifeWeeks * 7 - Math.floor(daysSince(pd)))
        if (status === 'overexploit') timeContent = `+${wu - item.wearLifeWeeks} нед.`
        else if (weeksLeft === 0) timeContent = <EmptyIcon />
        else if (daysLeft <= 7) timeContent = `${daysLeft} дн.`
        else if (weeksLeft <= 4) timeContent = `${weeksLeft} нед.`
        else if (weeksLeft < 52) timeContent = `${Math.round(daysLeft / 30)} мес.`
        else timeContent = `${Math.floor(weeksLeft / 52)} г.`
      } else {
        const wl = item.wearLifeWeeks || 0
        if (wl < 5) timeContent = `${wl} нед.`
        else if (wl < 52) timeContent = `${Math.round(wl / 4.33)} мес.`
        else timeContent = `${Math.floor(wl / 52)} г.`
      }
    }
  }

  const noPurchaseDate = item.type !== 'consumable' && !(override !== null ? override : item.purchaseDate)
  const remainPct = paused ? 50 : noPurchaseDate ? 0 : (status === 'overexploit' ? 0 : Math.max(0, Math.min(100, 100 - pct)))
  const barStatus = paused ? 'paused' : status

  return (
    <div
      className={`irow${selected ? ' irow--selected' : ''}${paused ? ' irow--paused' : ''}`}
      onClick={onSelect}
    >
      <span className="irow-name">{item.name}</span>
      <div className="irow-bar-wrap">
        <div className="irow-bar">
          <div className={`irow-bar-fill irow-bar-fill--${barStatus}`} style={{ width: `${remainPct}%` }} />
        </div>
        <span className="irow-pct">{paused ? '—' : `${remainPct}%`}</span>
      </div>
      <span className={`irow-time irow-time--${barStatus}`}>{timeContent || '—'}</span>
      {costContent}
    </div>
  )
}

function formatNoteDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const todayStr = new Date().toISOString().slice(0, 10)
  const yStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateStr === todayStr) return 'сегодня'
  if (dateStr === yStr) return 'вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

// ── ITEM DETAIL ────────────────────────────────────────────────────────────────

function ItemDetail({ item, info, group, override, costPeriod, onCostPeriodChange, onOverrideChange, onStepStop, onDelete, onUnlink, onLinkSet, onLaunch, notes, onNotesChange, onUpdateItem, onClose, onFilterByCategory, onFilterBySet }) {
  const paused = !!item.paused
  const { pct, status, remainderText, monthlyBlock } = info
  const unit = item.type === 'consumable' ? (item.unit || 'г') : 'нед'

  const stepTimerRef = useRef(null)
  const stepHoldRef = useRef(0)
  const stepValRef = useRef(null)
  const notePhotoInputRef = useRef(null)
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const [isEditingParams, setIsEditingParams] = useState(false)
  const [paramForm, setParamForm] = useState(null)
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState(null)
  const [previewPhotoIdx, setPreviewPhotoIdx] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [menuOpen])

  useEffect(() => {
    if (confirmDeletePhoto === null) return
    function dismiss() { setConfirmDeletePhoto(null) }
    document.addEventListener('click', dismiss)
    return () => document.removeEventListener('click', dismiss)
  }, [confirmDeletePhoto])

  const todayStr = new Date().toISOString().slice(0, 10)
  const noteEntries = notes.entries || []
  const [todayNoteText, setTodayNoteText] = useState(() => {
    const e = (notes.entries || []).find(e => e.date === todayStr)
    return e ? e.text : ''
  })

  useEffect(() => {
    const e = (notes.entries || []).find(e => e.date === todayStr)
    setTodayNoteText(e ? e.text : '')
    setPreviewPhotoIdx(0)
  }, [item.id]) // eslint-disable-line

  function handleTodayNoteChange(text) {
    setTodayNoteText(text)
    const other = (notes.entries || []).filter(e => e.date !== todayStr)
    const updated = text.trim()
      ? [...other, { date: todayStr, text }].sort((a, b) => a.date.localeCompare(b.date))
      : other
    onNotesChange({ ...notes, entries: updated })
  }

  function startEditParams(e) {
    e?.stopPropagation()
    const today = new Date().toISOString().slice(0, 10)
    setParamForm({
      name: item.name,
      price: String(item.price || ''),
      qty: String(item.qty || ''),
      dailyUse: String(item.dailyUse || ''),
      unit: item.unit || 'г',
      wearLifeWeeks: String(item.wearLifeWeeks || ''),
      purchaseDate: item.purchaseDate || today,
    })
    setIsEditingParams(true)
  }

  function saveParams(e) {
    e.stopPropagation()
    if (!paramForm.name.trim() || !paramForm.price) return
    onUpdateItem(paramForm)
    setIsEditingParams(false)
  }

  function cancelEditParams(e) {
    e.stopPropagation()
    setIsEditingParams(false)
  }

  const setPF = k => v => setParamForm(p => ({ ...p, [k]: v }))

  const photos = notes.photos || []
  const lbTotal = photos.length

  function openLightbox(i, e) { e.stopPropagation(); setLightboxIdx(i) }
  function closeLightbox(e) { e?.stopPropagation(); setLightboxIdx(null) }
  function lbPrev(e) { e.stopPropagation(); setLightboxIdx(i => (i - 1 + lbTotal) % lbTotal) }
  function lbNext(e) { e.stopPropagation(); setLightboxIdx(i => (i + 1) % lbTotal) }

  function handlePhotoAdd(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        onNotesChange({ ...notes, photos: [...(notes.photos || []), { url: ev.target.result, name: file.name }] })
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function stopStep() {
    if (stepTimerRef.current) { clearTimeout(stepTimerRef.current); stepTimerRef.current = null }
    onStepStop?.()
  }

  const stepperVal = override !== null
    ? (item.type === 'consumable' ? Math.max(0, Math.round(override)) : override)
    : (item.type === 'consumable'
        ? Math.max(0, Math.round(item.qty - daysSince(item.lastBought) * item.dailyUse))
        : item.purchaseDate)

  function startStep(dir) {
    stopStep()
    stepHoldRef.current = Date.now()
    stepValRef.current = stepperVal
    function tick() {
      const elapsed = Date.now() - stepHoldRef.current
      const step = getStepSize(elapsed)
      stepValRef.current = Math.max(0, stepValRef.current + dir * step)
      onOverrideChange(stepValRef.current)
      stepTimerRef.current = setTimeout(tick, elapsed < 500 ? 400 : 80)
    }
    tick()
  }

  const hasSet = item.set && item.setId

  // Consumable display values
  let consumableVals = null
  if (item.type === 'consumable') {
    const monthlyQty = Math.round((item.dailyUse || 0) * 30)
    const monthlyBudget = item.qty > 0 ? Math.round((item.price / item.qty) * monthlyQty) : 0
    const rawPPU = item.qty > 0 ? item.price / item.qty : 0
    const pricePerUnit = rawPPU.toFixed(2)
    const bulkUnit = unit === 'г' ? 'кг' : unit === 'мл' ? 'л' : null
    const pricePerBulk = bulkUnit ? (rawPPU * 1000).toLocaleString('ru', { maximumFractionDigits: 0 }) : null
    const currentQty = typeof stepperVal === 'number' ? stepperVal : (item.qty || 0)
    const daysLeft = (item.dailyUse || 0) > 0 ? Math.round(currentQty / item.dailyUse) : 0
    consumableVals = { monthlyQty, monthlyBudget, pricePerUnit, pricePerBulk, bulkUnit, daysLeft }
  }

  // Wear item display values
  let wearVals = null
  if (item.type !== 'consumable') {
    const pd = override !== null ? override : item.purchaseDate
    const weeksUsed = (pd && item.wearLifeWeeks) ? Math.floor(daysSince(pd) / 7) : 0
    const residualVal = Math.max(0, Math.round(item.price * (1 - weeksUsed / (item.wearLifeWeeks || 1))))
    const residualPct = Math.max(0, Math.round((1 - weeksUsed / item.wearLifeWeeks) * 100))
    const monthlyAmort = Math.round((item.price / item.wearLifeWeeks) * 4.33)
    const lifeYears = item.wearLifeWeeks ? (item.wearLifeWeeks / 52).toFixed(1).replace('.0', '') : '0'
    wearVals = { residualVal, residualPct, monthlyAmort, lifeYears }
  }

  return (
    <div className="ipanel">
      {/* Photo */}
      {photos.length > 0 && (
        <div className="ipanel-photo-top" onClick={e => {
          if (photos.length <= 1) return
          const rect = e.currentTarget.getBoundingClientRect()
          const x = e.clientX - rect.left
          if (x < rect.width / 2) {
            setPreviewPhotoIdx(i => (i - 1 + photos.length) % photos.length)
          } else {
            setPreviewPhotoIdx(i => (i + 1) % photos.length)
          }
        }}>
          <img src={photos[Math.min(previewPhotoIdx, photos.length - 1)].url} alt="" className="ipanel-photo-top-img" />
          <button className="ipanel-photo-expand" onClick={e => openLightbox(previewPhotoIdx, e)} title="Развернуть">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </button>
          {photos.length > 1 && (
            <div className="ipanel-photo-dots" onClick={e => e.stopPropagation()}>
              {photos.map((_, i) => (
                <button
                  key={i}
                  className={`ipanel-photo-dot${i === previewPhotoIdx ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setPreviewPhotoIdx(i) }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header: title + menu + close */}
      <div className="ipanel-header">
        <div className="ipanel-title">{item.name}</div>
        <div className="ipanel-menu-wrap" ref={menuRef}>
          <button className="ipanel-menu-btn" onClick={() => setMenuOpen(o => !o)} title="Действия">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="ipanel-menu-dropdown">
              {!hasSet && (
                <button className="ipanel-menu-item" onClick={() => { setMenuOpen(false); startEditParams() }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Редактировать параметры
                </button>
              )}
              {hasSet ? (
                <button className="ipanel-menu-item" onClick={() => { setMenuOpen(false); onUnlink() }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                    <line x1="2" y1="2" x2="22" y2="22"/>
                  </svg>
                  Открепить от набора
                </button>
              ) : (
                <button className="ipanel-menu-item" onClick={() => { setMenuOpen(false); onLinkSet() }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                  </svg>
                  Прикрепить к набору
                </button>
              )}
              <div className="ipanel-menu-divider" />
              <button className="ipanel-menu-item ipanel-menu-item--danger" onClick={() => { setMenuOpen(false); onDelete() }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
                Удалить позицию
              </button>
            </div>
          )}
        </div>
        <button className="ipanel-close" onClick={onClose} title="Закрыть">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Meta: status + category + set */}
      <div className="ipanel-meta">
        {group && (
          <button className="ipanel-cat-badge ipanel-filter-btn" onClick={() => onFilterByCategory?.(item.groupId)}>
            {group.name}
          </button>
        )}
        {hasSet ? (
          <button className="ipanel-set-badge-link ipanel-filter-btn" onClick={() => { onFilterByCategory?.(item.groupId); onFilterBySet?.(item.set) }}>
            {item.set}
          </button>
        ) : (
          <span className="inv-personal-badge">Личное</span>
        )}
      </div>

      {/* Remainder text */}
      <div className={`ipanel-remainder ipanel-remainder--${paused ? 'paused' : status}`}>
        {paused ? 'на паузе' : remainderText}
        {paused && (
          <button className="inv-launch-btn" style={{ marginLeft: 8 }} onClick={onLaunch}>
            <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Запустить
          </button>
        )}
      </div>

      {/* Wear items layout */}
      {item.type !== 'consumable' && wearVals && (
        <div className="ipanel-wear-section">
          <div className="ipanel-wear-top-row">
            <div className="ipanel-wear-date-cell">
              <div className="ipanel-cell-lbl">Дата покупки</div>
              <input
                className="ipanel-date-input" type="date"
                value={typeof stepperVal === 'string' ? stepperVal : item.purchaseDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => onOverrideChange(e.target.value)}
                onBlur={() => onStepStop?.()}
              />
            </div>
            <div className="ipanel-wear-life-cell">
              <div className="ipanel-cell-lbl">Срок использования</div>
              <div className="ipanel-cell-val">{item.wearLifeWeeks}&thinsp;нед. ({wearVals.lifeYears}&thinsp;г.)</div>
            </div>
          </div>
          <div className="ipanel-wear-rows">
            <div className="ipanel-wear-row">
              <span className="ipanel-wear-row-lbl">Стоимость</span>
              <span className="ipanel-wear-row-val mono">₽{(item.price || 0).toLocaleString('ru')}</span>
            </div>
            <div className="ipanel-wear-row">
              <span className="ipanel-wear-row-lbl">Остаточная стоимость <span className="inv-detail-pct">{wearVals.residualPct}%</span></span>
              <span className="ipanel-wear-row-val mono">₽{wearVals.residualVal.toLocaleString('ru')}</span>
            </div>
            <div className="ipanel-wear-row">
              <span className="ipanel-wear-row-lbl">Стоимость/мес.</span>
              <span className="ipanel-wear-row-val mono">₽{wearVals.monthlyAmort.toLocaleString('ru')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Consumable section */}
      {item.type === 'consumable' && consumableVals && (
        <div className="ipanel-consumable-section">
          <div className="ipanel-stepper-block">
            <div className="ipanel-cell-lbl">ОСТАТОК, {{ 'г': 'грамм', 'мл': 'миллилитр', 'шт': 'штук', 'кап': 'капель', 'рул': 'рулон' }[unit] || unit}</div>
            <div className="ipanel-stepper">
              <button className="ipanel-stepper-btn"
                onMouseDown={() => startStep(-1)} onMouseUp={stopStep}
                onMouseLeave={stopStep} onTouchStart={() => startStep(-1)} onTouchEnd={stopStep}>−</button>
              <input
                className="ipanel-stepper-input" type="number" value={stepperVal}
                onChange={e => onOverrideChange(Math.max(0, parseInt(e.target.value) || 0))}
                onBlur={() => onStepStop?.()}
              />
              <span className="ipanel-stepper-unit">{unit}</span>
              <button className="ipanel-stepper-btn"
                onMouseDown={() => startStep(1)} onMouseUp={stopStep}
                onMouseLeave={stopStep} onTouchStart={() => startStep(1)} onTouchEnd={stopStep}>+</button>
            </div>
          </div>
          <div className="ipanel-wear-rows">
            <div className="ipanel-wear-row">
              <span className="ipanel-wear-row-lbl">Потребность/мес.</span>
              <span className="ipanel-wear-row-val mono">{consumableVals.monthlyQty}&thinsp;{unit}</span>
            </div>
            <div className="ipanel-wear-row">
              <span className="ipanel-wear-row-lbl">Стоимость/мес.</span>
              <span className="ipanel-wear-row-val mono">₽{consumableVals.monthlyBudget.toLocaleString('ru')}</span>
            </div>
            <div className="ipanel-wear-row">
              <span className="ipanel-wear-row-lbl">Цена за {unit}</span>
              <span className="ipanel-wear-row-val mono">
                ₽{consumableVals.pricePerUnit}
                {consumableVals.pricePerBulk && (
                  <span className="ipanel-wear-row-sub">₽{consumableVals.pricePerBulk}/{consumableVals.bulkUnit}</span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}


      {/* Edit params button / form */}

      {isEditingParams && paramForm && (
        <div className="inv-add-form" style={{ margin: '0 0 12px' }}>
          <div className="inv-add-form-title">Редактировать параметры</div>
          <div className="inv-add-form-grid">
            <div className="inv-add-form-field" style={{ gridColumn: '1/-1' }}>
              <div className="inv-add-form-lbl">Название</div>
              <input className="inv-add-form-input" value={paramForm.name}
                onChange={e => setPF('name')(e.target.value)} placeholder="Название" />
            </div>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Цена, руб.</div>
              <input className="inv-add-form-input" type="number" value={paramForm.price}
                onChange={e => setPF('price')(e.target.value)} placeholder="0" />
            </div>

            {item.type === 'consumable' ? (
              <>
                <div className="inv-add-form-field">
                  <div className="inv-add-form-lbl">Объём / масса</div>
                  <input className="inv-add-form-input" type="number" value={paramForm.qty}
                    onChange={e => setPF('qty')(e.target.value)} placeholder="500" />
                </div>
                <div className="inv-add-form-field">
                  <div className="inv-add-form-lbl">Единица</div>
                  <select className="inv-add-form-select" value={paramForm.unit} onChange={e => setPF('unit')(e.target.value)}>
                    <option value="г">г</option>
                    <option value="мл">мл</option>
                    <option value="шт">шт</option>
                    <option value="кап">кап</option>
                    <option value="рул">рул</option>
                  </select>
                </div>
                <div className="inv-add-form-field">
                  <div className="inv-add-form-lbl">Расход в день</div>
                  <input className="inv-add-form-input" type="number" value={paramForm.dailyUse}
                    onChange={e => setPF('dailyUse')(e.target.value)} placeholder="10" step="0.1" />
                </div>
              </>
            ) : (
              <>
                <div className="inv-add-form-field">
                  <div className="inv-add-form-lbl">Срок службы, нед.</div>
                  <input className="inv-add-form-input" type="number" value={paramForm.wearLifeWeeks}
                    onChange={e => setPF('wearLifeWeeks')(e.target.value)} placeholder="52" />
                </div>
                <div className="inv-add-form-field">
                  <div className="inv-add-form-lbl">Дата покупки</div>
                  <input className="inv-add-form-input" type="date" value={paramForm.purchaseDate || ''}
                    onChange={e => setPF('purchaseDate')(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
                </div>
              </>
            )}
          </div>
          <div className="inv-add-form-actions">
            <button className="inv-add-cancel" onClick={cancelEditParams}>Отмена</button>
            <button className="inv-add-submit" onClick={saveParams}
              disabled={!paramForm.name.trim() || !paramForm.price}>Сохранить</button>
          </div>
        </div>
      )}

      {/* Divider before notes */}
      <div className="ipanel-divider" />

      {/* Notes section — always visible */}
      <div className="inv-notes-section">
        <div className="inv-notes-label">Заметки</div>
        {noteEntries.filter(e => e.date !== todayStr).map((entry, i) => (
          <div key={i} className="inv-notes-entry">
            <div className="inv-notes-entry-date">{formatNoteDate(entry.date)}</div>
            <div className="inv-notes-entry-text">{entry.text}</div>
          </div>
        ))}
        {todayNoteText && (
          <div className="inv-notes-entry-date">{formatNoteDate(todayStr)}</div>
        )}
        <textarea
          className="inv-notes-textarea"
          placeholder="Добавьте заметку..."
          value={todayNoteText}
          onChange={e => handleTodayNoteChange(e.target.value)}
        />
        <div className="inv-notes-photos-row">
          <button
            className="inv-notes-photo-add-tile"
            onClick={e => { e.stopPropagation(); notePhotoInputRef.current?.click() }}
            title="Добавить фото"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          {(notes.photos || []).map((p, i) => (
            <div
              key={i}
              className={`inv-notes-thumb-wrap${confirmDeletePhoto === i ? ' pending-delete' : ''}`}
              onClick={e => {
                e.stopPropagation()
                if (confirmDeletePhoto === i) {
                  setConfirmDeletePhoto(null)
                } else {
                  setConfirmDeletePhoto(i)
                }
              }}
            >
              <img src={p.url} alt={p.name} className="inv-notes-thumb" />
              {confirmDeletePhoto === i && (
                <button className="inv-notes-thumb-remove" onClick={e => { e.stopPropagation(); onNotesChange({ ...notes, photos: notes.photos.filter((_, j) => j !== i) }); setConfirmDeletePhoto(null) }}>
                  <svg width="9" height="9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <input ref={notePhotoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoAdd} />
      </div>


      {/* Lightbox */}
      {lightboxIdx !== null && lbTotal > 0 && (
        <div className="inv-lightbox-overlay" onClick={closeLightbox}>
          <button className="inv-lightbox-close" onClick={closeLightbox}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          {lbTotal > 1 && (
            <button className="inv-lightbox-nav prev" onClick={lbPrev}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}
          <div className="inv-lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={photos[lightboxIdx].url} alt={photos[lightboxIdx].name} className="inv-lightbox-img" />
            {lbTotal > 1 && (
              <div className="inv-lightbox-counter">{lightboxIdx + 1} / {lbTotal}</div>
            )}
          </div>
          {lbTotal > 1 && (
            <button className="inv-lightbox-nav next" onClick={lbNext}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── SHOPPING LIST ──────────────────────────────────────────────────────────────

function ShoppingList({ items, infoMap, groups, overrides, categoryFilter, setFilter, onClose, emptySlot }) {
  const [period, setPeriod] = useState('month')

  const baseItems = items.filter(i => {
    if (i.paused) return false
    if (categoryFilter && i.groupId !== categoryFilter) return false
    if (setFilter) {
      if (setFilter === '__personal__' ? i.set : i.set !== setFilter) return false
    }
    if (period === 'month') return infoMap[i.id]?.filterStatus === 'urgent'
    return true
  })

  function getAction(item) {
    if (item.type === 'wear') {
      if (infoMap[item.id]?.filterStatus !== 'urgent') return null
      return { qty: '1 шт', cost: item.price || 0 }
    }
    if (item.type !== 'consumable') return null
    const unit = item.unit || 'г'
    const override = overrides?.[item.id] ?? null
    const remaining = override !== null
      ? Math.max(0, override)
      : Math.max(0, item.qty - daysSince(item.lastBought) * item.dailyUse)
    const pricePerUnit = item.qty > 0 ? (item.price || 0) / item.qty : 0
    const days = period === 'week' ? 7 : 30
    const need = item.dailyUse * days
    const deficit = need - remaining
    if (deficit <= 0) return null
    const amt = (unit === 'г' || unit === 'мл')
      ? `${Math.round(deficit)}\u00a0${unit}`
      : `${parseFloat(deficit.toFixed(1))}\u00a0${unit}`
    return { qty: amt, cost: Math.round(deficit * pricePerUnit) }
  }

  const grouped = groups
    .map(g => ({ ...g, rows: baseItems.filter(i => i.groupId === g.id && getAction(i)) }))
    .filter(g => g.rows.length > 0)

  const grandTotal = grouped.reduce((s, g) => s + g.rows.reduce((ss, i) => ss + (getAction(i)?.cost || 0), 0), 0)

  if (items.filter(i => !i.paused && infoMap[i.id]?.filterStatus === 'urgent').length === 0) return emptySlot ?? null

  return (
    <div className="inv-shopping-list">
      <div className="inv-shopping-header">
        <span className="inv-shopping-title">Список покупок</span>
        <div className="inv-shopping-period-toggle">
          <button className={`inv-shopping-period-btn${period === 'week' ? ' active' : ''}`} onClick={() => setPeriod('week')}>Неделя</button>
          <button className={`inv-shopping-period-btn${period === 'month' ? ' active' : ''}`} onClick={() => setPeriod('month')}>Месяц</button>
        </div>
        <span className="inv-shopping-total">~₽{grandTotal.toLocaleString('ru')}</span>
      </div>
      {grouped.length === 0 ? (
        <div className="inv-shopping-empty">
          {period === 'week' ? 'На эту неделю всё есть в запасе' : 'Нет срочных покупок'}
        </div>
      ) : grouped.map(g => {
        const groupTotal = g.rows.reduce((s, i) => s + (getAction(i)?.cost || 0), 0)
        return (
          <div key={g.id} className="inv-shopping-group">
            <div className="inv-shopping-group-header">
              <span className="inv-shopping-group-name">{g.name}</span>
              <span className="inv-shopping-group-total">~₽{groupTotal.toLocaleString('ru')}</span>
            </div>
            {g.rows.map(item => {
              const action = getAction(item)
              return (
                <div key={item.id} className="inv-shopping-row">
                  <span className="inv-shopping-item-name">{item.name}</span>
                  <span className="inv-shopping-item-cost">
                    {action?.qty && <span className="inv-shopping-item-qty">{action.qty}</span>}
                    ~₽{(action?.cost || 0).toLocaleString('ru')}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ── ADD ITEM FORM ──────────────────────────────────────────────────────────────

function formatPrice(raw) {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('ru')
}

function AddItemForm({ groupId, groupSetCategories, groupPersonalSets, onAdd, onCancel }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    name: '', type: 'consumable', price: '', qty: '', dailyUse: '', dailyUseUnit: 'day',
    unit: 'г', lifeAmount: '', lifeUnit: 'weeks', purchaseDate: today, setId: '',
  })
  const [priceDisplay, setPriceDisplay] = useState('')
  const set = k => v => setForm(p => ({ ...p, [k]: v }))
  const groupSets = (groupPersonalSets || []).filter(s => groupSetCategories?.includes(s.catId))

  function handlePriceChange(raw) {
    const digits = raw.replace(/\D/g, '')
    const clamped = Math.min(99999999, Number(digits) || 0)
    setPriceDisplay(digits ? clamped.toLocaleString('ru') : '')
    set('price')(String(clamped || ''))
  }

  function toWeeks(amount, unit) {
    const n = parseFloat(amount) || 0
    if (unit === 'days') return n / 7
    if (unit === 'weeks') return n
    if (unit === 'months') return n * 4.33
    if (unit === 'years') return n * 52
    return n
  }

  function toDailyUse(amount, unit) {
    const n = parseFloat(amount) || 0
    if (unit === 'day') return n
    if (unit === 'week') return n / 7
    if (unit === 'month') return n / 30
    return n
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.price) return
    const data = { ...form, price: form.price }
    if (form.type === 'wear') {
      data.wearLifeWeeks = Math.round(toWeeks(form.lifeAmount, form.lifeUnit)) || 52
    } else {
      data.dailyUse = toDailyUse(form.dailyUse, form.dailyUseUnit)
    }
    onAdd(groupId, data)
  }

  return (
    <div className="inv-add-form">
      <div className="inv-add-form-title">Новая позиция</div>
      <div className="inv-add-form-grid">
        <div className="inv-add-form-field" style={{ gridColumn: '1/-1' }}>
          <div className="inv-add-form-lbl">Название</div>
          <input className="inv-add-form-input" value={form.name}
            onChange={e => set('name')(e.target.value)} placeholder="Например: Оливковое масло" />
        </div>
        <div className="inv-add-form-field">
          <div className="inv-add-form-lbl">Тип</div>
          <select className="inv-add-form-select" value={form.type} onChange={e => set('type')(e.target.value)}>
            <option value="consumable">Расходник</option>
            <option value="wear">Вещь (износ)</option>
          </select>
        </div>
        <div className="inv-add-form-field">
          <div className="inv-add-form-lbl">Цена, руб.</div>
          <input className="inv-add-form-input" value={priceDisplay}
            onChange={e => handlePriceChange(e.target.value)} placeholder="0" inputMode="numeric" />
        </div>

        {form.type === 'consumable' ? (
          <>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Объём / масса</div>
              <input className="inv-add-form-input" type="number" value={form.qty}
                onChange={e => set('qty')(Math.min(999999, Number(e.target.value) || 0) || '')} placeholder="500" max="999999" />
            </div>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Единица</div>
              <select className="inv-add-form-select" value={form.unit} onChange={e => set('unit')(e.target.value)}>
                <option value="г">г</option>
                <option value="мл">мл</option>
                <option value="шт">шт</option>
                <option value="кап">кап</option>
                <option value="рул">рул</option>
              </select>
            </div>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Расход</div>
              <input className="inv-add-form-input" type="number" value={form.dailyUse}
                onChange={e => set('dailyUse')(Math.min(999999, Number(e.target.value) || 0) || '')} placeholder="10" step="0.1" max="999999" />
            </div>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Период расхода</div>
              <select className="inv-add-form-select" value={form.dailyUseUnit} onChange={e => set('dailyUseUnit')(e.target.value)}>
                <option value="day">в день</option>
                <option value="week">в неделю</option>
                <option value="month">в месяц</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Срок службы</div>
              <input className="inv-add-form-input" type="number" value={form.lifeAmount}
                onChange={e => set('lifeAmount')(Math.min(999999, Number(e.target.value) || 0) || '')} placeholder="1" max="999999" />
            </div>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Единица срока</div>
              <select className="inv-add-form-select" value={form.lifeUnit} onChange={e => set('lifeUnit')(e.target.value)}>
                <option value="days">дней</option>
                <option value="weeks">недель</option>
                <option value="months">месяцев</option>
                <option value="years">лет</option>
              </select>
            </div>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Дата покупки</div>
              <input className="inv-add-form-input" type="date" value={form.purchaseDate}
                onChange={e => set('purchaseDate')(e.target.value)} max={today} />
            </div>
          </>
        )}

        {groupSets.length > 0 && (
          <div className="inv-add-form-field" style={{ gridColumn: '1/-1' }}>
            <div className="inv-add-form-lbl">Привязать к набору (необязательно)</div>
            <select className="inv-add-form-select" value={form.setId} onChange={e => set('setId')(e.target.value)}>
              <option value="">Личное — без набора</option>
              {groupSets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="inv-add-form-actions">
        <button className="inv-add-cancel" onClick={onCancel}>Отмена</button>
        <button className="inv-add-submit" onClick={handleSubmit}
          disabled={!form.name.trim() || !form.price}>Добавить</button>
      </div>
    </div>
  )
}

// ── PERSISTENCE ────────────────────────────────────────────────────────────────

function loadExtraItems() {
  try { return JSON.parse(localStorage.getItem('ss_inventory_extra') || '[]') } catch { return [] }
}
function syncExtra(nextItems) {
  try {
    const extra = nextItems.filter(i => i.isExtra)
    localStorage.setItem('ss_inventory_extra', JSON.stringify(extra))
  } catch {}
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function Inventory() {
  const [items, setItems] = useState(() => {
    const base = inventoryGroups.flatMap(g => g.items.map(item => ({ ...item, groupId: g.id })))
    const extra = loadExtraItems().map(i => ({ ...i, isExtra: true }))
    return [...base, ...extra]
  })
  const [personalSets] = useState(() => loadPersonalSets())
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [setFilter, setSetFilter] = useState(null)
  const [showSpotlight, setShowSpotlight] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [unlinkConfirm, setUnlinkConfirm] = useState(null)
  const [linkToSetItem, setLinkToSetItem] = useState(null)
  const [addFormGroupId, setAddFormGroupId] = useState(null)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const nextIdRef = useRef(
    Math.max(1000, ...loadExtraItems().map(i => parseInt(i.id?.slice(1) || '0') + 1))
  )

  const [overrides, setOverrides] = useState(() => {
    const map = {}
    inventoryGroups.forEach(g => g.items.forEach(item => {
      if (item.type === 'consumable') {
        map[item.id] = Math.max(0, Math.round(item.qty - daysSince(item.lastBought) * item.dailyUse))
      } else {
        map[item.id] = item.purchaseDate
      }
    }))
    loadExtraItems().forEach(item => {
      map[item.id] = item.type === 'consumable' ? 0 : item.purchaseDate
    })
    return map
  })

  const [filterOverrides, setFilterOverrides] = useState(() => {
    const map = {}
    inventoryGroups.forEach(g => g.items.forEach(item => {
      if (item.type === 'consumable') {
        map[item.id] = Math.max(0, Math.round(item.qty - daysSince(item.lastBought) * item.dailyUse))
      } else {
        map[item.id] = item.purchaseDate
      }
    }))
    loadExtraItems().forEach(item => {
      map[item.id] = item.type === 'consumable' ? 0 : item.purchaseDate
    })
    return map
  })
  const [costPeriods, setCostPeriods] = useState({})
  const overridesRef = useRef(overrides)
  overridesRef.current = overrides
  const filterDebounceRef = useRef(null)

  const infoMap = {}
  items.forEach(item => { infoMap[item.id] = getItemInfo(item, overrides[item.id] ?? null) })

  const filterInfoMap = {}
  items.forEach(item => { filterInfoMap[item.id] = getItemInfo(item, filterOverrides[item.id] ?? null) })

  const urgentItems = items.filter(i => !i.paused && infoMap[i.id].filterStatus === 'urgent')
  const soonItems   = items.filter(i => !i.paused && infoMap[i.id].filterStatus === 'soon')
  const okItems     = items.filter(i => !i.paused && infoMap[i.id].filterStatus === 'ok')
  const pausedItems = items.filter(i => i.paused)

  const urgentCost = urgentItems.reduce((s, i) => {
    if (i.type === 'consumable') {
      const mb = infoMap[i.id].monthlyBlock
      return s + (mb?.type === 'deficit' ? mb.deficitRub : 0)
    }
    return s + i.price
  }, 0)

  const valueItems = categoryFilter ? items.filter(i => i.groupId === categoryFilter) : items
  const consumableVal = valueItems.filter(i => i.type === 'consumable').reduce((s, item) => {
    const ov = overrides[item.id]
    const rem = ov !== null ? Math.max(0, ov) : Math.max(0, item.qty - daysSince(item.lastBought) * item.dailyUse)
    return s + (item.qty > 0 ? (rem / item.qty) * item.price : 0)
  }, 0)
  const wearVal = valueItems.filter(i => i.type === 'wear').reduce((s, item) => {
    const pd = overrides[item.id] ?? item.purchaseDate
    if (!pd) return s
    const wu = Math.floor(daysSince(pd) / 7)
    return s + Math.max(0, Math.round(item.price * (1 - wu / item.wearLifeWeeks)))
  }, 0)
  const totalValue = Math.round(consumableVal + wearVal)

  const setsInCategory = categoryFilter
    ? [
        ...new Set(items.filter(i => i.groupId === categoryFilter && i.set).map(i => i.set)),
        ...(items.some(i => i.groupId === categoryFilter && !i.set) ? ['__personal__'] : []),
      ]
    : []

  // Build flat list filtered by status, category, set
  function applyFilters(list) {
    return list.filter(i => {
      if (categoryFilter && i.groupId !== categoryFilter) return false
      if (setFilter) {
        if (setFilter === '__personal__' ? !!i.set : i.set !== setFilter) return false
      }
      return true
    })
  }

  const STATUS_GROUPS = [
    { key: 'urgent',  label: 'Ожидает покупки',     items: applyFilters(items.filter(i => !i.paused && infoMap[i.id]?.filterStatus === 'urgent')) },
    { key: 'soon',    label: 'Скоро потребуется',   items: applyFilters(items.filter(i => !i.paused && infoMap[i.id]?.filterStatus === 'soon')) },
    { key: 'ok',      label: 'Норма',               items: applyFilters(items.filter(i => !i.paused && infoMap[i.id]?.filterStatus === 'ok')) },
    { key: 'paused',  label: 'Ожидает активации',   items: applyFilters(items.filter(i => i.paused)) },
  ].filter(sg => {
    if (statusFilter && sg.key !== statusFilter) return false
    return sg.items.length > 0
  })

  const selectedItem = selectedItemId ? items.find(i => i.id === selectedItemId) : null
  const selectedGroup = selectedItem ? ALL_GROUPS.find(g => g.id === selectedItem.groupId) : null

  const flatList = STATUS_GROUPS.flatMap(sg => sg.items)

  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      e.preventDefault()
      if (flatList.length === 0) return
      const idx = selectedItemId ? flatList.findIndex(i => i.id === selectedItemId) : -1
      const next = e.key === 'ArrowDown'
        ? (idx < flatList.length - 1 ? idx + 1 : 0)
        : (idx > 0 ? idx - 1 : flatList.length - 1)
      setSelectedItemId(flatList[next].id)
      setShowAddPanel(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [flatList, selectedItemId]) // eslint-disable-line

  // Handlers
  function doDelete(id) {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id)
      syncExtra(next)
      return next
    })
    if (selectedItemId === id) setSelectedItemId(null)
    setDeleteConfirm(null)
  }


  function doUnlink(id) {
    setItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, set: null, setId: null } : i)
      syncExtra(next)
      return next
    })
    setUnlinkConfirm(null)
  }

  function doLaunch(id) {
    setItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, paused: false } : i)
      syncExtra(next)
      return next
    })
    const launchedItem = items.find(i => i.id === id)
  }

  function doLinkSet(itemId, pickedSet) {
    setItems(prev => prev.map(i => i.id === itemId
      ? { ...i, set: pickedSet.name, setId: pickedSet.id }
      : i))
    setLinkToSetItem(null)
  }

  function doAddItem(groupId, form) {
    const id = 'i' + nextIdRef.current++
    const pickedSet = form.setId ? personalSets.find(s => s.id === form.setId) : null
    const base = {
      id, name: form.name.trim(), type: form.type, groupId,
      price: Number(form.price) || 0,
      set: pickedSet?.name || null, setId: pickedSet?.id || null,
      isExtra: true,
    }
    if (form.type === 'consumable') {
      Object.assign(base, {
        qty: Number(form.qty) || 100,
        dailyUse: Number(form.dailyUse) || 1,
        unit: form.unit || 'г',
        lastBought: new Date().toISOString().slice(0, 10),
      })
      setOverrides(p => ({ ...p, [id]: Number(form.qty) || 100 }))
    } else {
      Object.assign(base, {
        wearLifeWeeks: Number(form.wearLifeWeeks) || 52,
        purchaseDate: form.purchaseDate || new Date().toISOString().slice(0, 10),
      })
      setOverrides(p => ({ ...p, [id]: base.purchaseDate }))
    }
    setItems(prev => {
      const next = [...prev, base]
      syncExtra(next)
      return next
    })
    const newOv = base.type === 'consumable'
      ? (Number(form.qty) || 100)
      : (base.purchaseDate || null)
    setAddFormGroupId(null)
  }

  function doNotesChange(id, notes) {
    setItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, notes } : i)
      syncExtra(next)
      return next
    })
  }

  function doUpdateItem(id, form) {
    setItems(prev => {
      const next = prev.map(i => {
        if (i.id !== id) return i
        const updated = { ...i, name: form.name?.trim() || i.name, price: Number(form.price) || 0 }
        if (i.type === 'consumable') {
          return { ...updated, qty: Number(form.qty) || 100, dailyUse: Number(form.dailyUse) || 1, unit: form.unit || 'г' }
        } else {
          const base = { ...updated, wearLifeWeeks: Number(form.wearLifeWeeks) || 52 }
          return form.purchaseDate ? { ...base, purchaseDate: form.purchaseDate } : base
        }
      })
      syncExtra(next)
      return next
    })
    const currentItem = items.find(i => i.id === id)
    if (currentItem?.type === 'wear' && form.purchaseDate) {
      setOverrides(p => ({ ...p, [id]: form.purchaseDate }))
    }
  }


  return (
    <Layout>
      <main className="inventory-main">
        {/* Header */}
        <div className="inv-page-header">
          <div>
            <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              Инвентарь
              <HelpButton seenKey="ss_spl_inv" onOpen={() => setShowSpotlight(true)} />
            </div>
            <div className="page-subtitle">{items.length} позиций</div>
          </div>
        </div>

        {/* Category + Set filters */}
        <div className="inv-filters-row">
          <div className="inv-filter-group">
            <span className="inv-filter-label">Категория</span>
            <div className="inv-filter-chips">
              {ALL_GROUPS.filter(g => items.some(i => i.groupId === g.id)).map(g => (
                <button
                  key={g.id}
                  className={`inv-filter-chip${categoryFilter === g.id ? ' active' : ''}`}
                  onClick={() => {
                    if (categoryFilter === g.id) { setCategoryFilter(null); setSetFilter(null) }
                    else { setCategoryFilter(g.id); setSetFilter(null) }
                  }}
                >
                  {g.name}
                  {categoryFilter === g.id && (
                    <svg width="9" height="9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
          {categoryFilter && setsInCategory.length > 0 && (
            <div className="inv-filter-group">
              <span className="inv-filter-label">Набор</span>
              <div className="inv-filter-chips">
                {setsInCategory.map(s => (
                  <button
                    key={s}
                    className={`inv-filter-chip inv-filter-chip--set${setFilter === s ? ' active' : ''}`}
                    onClick={() => setSetFilter(f => f === s ? null : s)}
                  >
                    {s === '__personal__' ? 'Личное' : s}
                    {setFilter === s && (
                      <svg width="9" height="9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>


        {/* Split layout */}
        <div id="sp-inv-groups" className="inv-split">
          {/* Left: flat list */}
          <div className="inv-list-col">
            {STATUS_GROUPS.map(sg => (
              <div key={sg.key} className="inv-status-group">
                <div className={`inv-status-group-header inv-status-group-header--${sg.key}`}>
                  <span className={`inv-status-group-dot inv-status-group-dot--${sg.key}`} />
                  <span className="inv-status-group-label">{sg.label}</span>
                  <span className="inv-status-group-count">{sg.items.length}</span>
                </div>
                <div className="inv-status-group-items">
                  {sg.items.map(item => {
                    const group = ALL_GROUPS.find(g => g.id === item.groupId)
                    return (
                      <ItemRow
                        key={item.id}
                        item={item}
                        info={infoMap[item.id]}
                        override={overrides[item.id] ?? null}
                        costPeriod={costPeriods[item.id] ?? 'week'}
                        selected={selectedItemId === item.id}
                        onSelect={() => setSelectedItemId(id => id === item.id ? null : item.id)}
                      />
                    )
                  })}
                  {sg.items.length === 0 && (
                    <div className="inv-group-empty">Нет позиций с таким статусом</div>
                  )}
                </div>
              </div>
            ))}

            {STATUS_GROUPS.length === 0 && (
              <div className="inv-empty-state">
                <div className="inv-empty-icon">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                </div>
                <div className="inv-empty-title">Нет позиций с таким статусом</div>
                <div className="inv-empty-sub">Попробуйте сбросить фильтр</div>
                <button className="inv-empty-reset" onClick={() => setStatusFilter(null)}>Показать все</button>
              </div>
            )}

            {items.length === 0 && (
              <div className="inv-cold-start">
                <div className="inv-cold-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect x="8" y="6" width="26" height="32" rx="4" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5"/>
                    <rect x="14" y="14" width="14" height="2" rx="1" fill="var(--border)"/>
                    <rect x="14" y="19" width="10" height="2" rx="1" fill="var(--border)"/>
                    <rect x="14" y="24" width="12" height="2" rx="1" fill="var(--border)"/>
                    <circle cx="37" cy="37" r="9" fill="var(--bg)" stroke="var(--border)" strokeWidth="1.5"/>
                    <path d="M37 33v4l2.5 2.5" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="inv-cold-title">Инвентарь пуст</div>
                <div className="inv-cold-desc">Добавьте готовый набор из каталога или внесите позиции вручную</div>
                <div className="inv-cold-actions">
                  <Link to="/catalog" className="inv-cold-btn-primary">Найти набор в каталоге</Link>
                  <button className="inv-cold-btn-secondary" onClick={() => { setShowAddPanel(true) }}>Добавить вручную</button>
                </div>
              </div>
            )}

            {/* Add item button */}
            <button
              className={`whisper-add-cta${showAddPanel ? ' whisper-add-cta--active' : ''}`}
              onClick={() => { setShowAddPanel(p => !p); setSelectedItemId(null); setAddFormGroupId(null) }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Добавить позицию
            </button>

            {/* Value summary */}
            {items.length > 0 && (
              <div className="inv-value-card">
                <div className="inv-value-main">
                  <div className="inv-value-lbl">стоимость инвентаря</div>
                  <div className="inv-value-val">₽{totalValue.toLocaleString('ru')}</div>
                </div>
                <div className="inv-value-breakdown">
                  <div className="inv-value-item">
                    <span className="inv-value-item-val">₽{Math.round(consumableVal).toLocaleString('ru')}</span>
                    <span className="inv-value-item-lbl">расходники</span>
                  </div>
                  <div className="inv-value-item">
                    <span className="inv-value-item-val">₽{wearVal.toLocaleString('ru')}</span>
                    <span className="inv-value-item-lbl">вещи</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: detail panel — always rendered */}
          <div className="inv-panel-col">
            {showAddPanel ? (
              <div className="inv-add-panel">
                <div className="inv-add-panel-header">
                  <span className="inv-add-panel-title">Новая позиция</span>
                  <button className="ipanel-close" onClick={() => { setShowAddPanel(false); setAddFormGroupId(null) }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                {!addFormGroupId ? (
                  <div className="inv-add-group-chooser">
                    <div className="inv-add-group-chooser-title">Выберите категорию</div>
                    <div className="inv-add-group-list">
                      {ALL_GROUPS.map(g => (
                        <button key={g.id} className="inv-add-group-btn" onClick={() => setAddFormGroupId(g.id)}>
                          <span className="inv-add-group-dot" style={{ background: g.color }} />
                          {g.name}
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', color: 'var(--text-3)' }}>
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="inv-add-group-back">
                      <button className="inv-add-group-back-btn" onClick={() => setAddFormGroupId(null)}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                        Категория: {ALL_GROUPS.find(g => g.id === addFormGroupId)?.name}
                      </button>
                    </div>
                    <AddItemForm
                      groupId={addFormGroupId}
                      groupSetCategories={ALL_GROUPS.find(g => g.id === addFormGroupId)?.setCategories}
                      groupPersonalSets={personalSets}
                      onAdd={(gid, form) => { doAddItem(gid, form); setShowAddPanel(false); setAddFormGroupId(null) }}
                      onCancel={() => { setShowAddPanel(false); setAddFormGroupId(null) }}
                    />
                  </div>
                )}
              </div>
            ) : selectedItem ? (
              <ItemDetail
                key={selectedItem.id}
                item={selectedItem}
                info={infoMap[selectedItem.id]}
                group={selectedGroup}
                override={overrides[selectedItem.id] ?? null}
                onOverrideChange={v => {
                  const iid = selectedItem.id
                  setOverrides(prev => ({ ...prev, [iid]: v }))
                  if (!statusFilter) {
                    setFilterOverrides(prev => ({ ...prev, [iid]: v }))
                  }
                }}
                onStepStop={() => {
                  if (!statusFilter) return
                  if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current)
                  filterDebounceRef.current = setTimeout(() => {
                    setFilterOverrides({ ...overridesRef.current })
                  }, 3000)
                }}
                onDelete={() => setDeleteConfirm({ id: selectedItem.id, name: selectedItem.name, set: selectedItem.set })}
                onUnlink={() => setUnlinkConfirm({ id: selectedItem.id, name: selectedItem.name, set: selectedItem.set })}
                onLinkSet={() => setLinkToSetItem(selectedItem.id)}
                onLaunch={() => doLaunch(selectedItem.id)}
                notes={selectedItem.notes || { text: '', photos: [] }}
                onNotesChange={n => doNotesChange(selectedItem.id, n)}
                onUpdateItem={form => doUpdateItem(selectedItem.id, form)}
                costPeriod={costPeriods[selectedItem.id] ?? 'week'}
                onCostPeriodChange={p => setCostPeriods(prev => ({ ...prev, [selectedItem.id]: p }))}
                onClose={() => setSelectedItemId(null)}
                onFilterByCategory={gid => { setCategoryFilter(gid); setSetFilter(null) }}
                onFilterBySet={s => setSetFilter(s)}
              />
            ) : (
              <ShoppingList
                items={items}
                infoMap={infoMap}
                groups={ALL_GROUPS}
                overrides={overrides}
                categoryFilter={categoryFilter}
                setFilter={setFilter}
                onClose={() => setStatusFilter(null)}
                emptySlot={(
                  <div className="inv-panel-empty">
                    <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                    <span>Список покупок пуст</span>
                  </div>
                )}
              />
            )}
          </div>
        </div>
      </main>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="inv-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="inv-modal" onClick={e => e.stopPropagation()}>
            <div className="inv-modal-title">Удалить позицию?</div>
            <div className="inv-modal-body">
              Удаление <strong>«{deleteConfirm.name}»</strong> приведёт к созданию новой версии набора
              {deleteConfirm.set && <> <strong>«{deleteConfirm.set}»</strong></>} без этого ингредиента.
              Все параметры будут пересчитаны.
            </div>
            <div className="inv-modal-actions">
              <button className="inv-modal-btn" onClick={() => setDeleteConfirm(null)}>Отмена</button>
              <button className="inv-modal-btn danger" onClick={() => doDelete(deleteConfirm.id)}>Удалить</button>
            </div>
          </div>
        </div>
      )}

      {/* Unlink confirmation modal */}
      {unlinkConfirm && (
        <div className="inv-modal-overlay" onClick={() => setUnlinkConfirm(null)}>
          <div className="inv-modal" onClick={e => e.stopPropagation()}>
            <div className="inv-modal-title">Отвязать от набора?</div>
            <div className="inv-modal-body">
              Отвязка <strong>«{unlinkConfirm.name}»</strong> от набора
              <strong> «{unlinkConfirm.set}»</strong> приведёт к созданию новой версии набора без этого ингредиента.
              Позиция перейдёт в раздел <strong>«Личное»</strong>.
            </div>
            <div className="inv-modal-actions">
              <button className="inv-modal-btn" onClick={() => setUnlinkConfirm(null)}>Отмена</button>
              <button className="inv-modal-btn danger" onClick={() => doUnlink(unlinkConfirm.id)}>Отвязать</button>
            </div>
          </div>
        </div>
      )}

      {/* Set picker modal */}
      {linkToSetItem && (() => {
        const linkItem = items.find(i => i.id === linkToSetItem)
        const linkGroup = linkItem ? ALL_GROUPS.find(g => g.id === linkItem.groupId) : null
        const pickerSets = linkGroup
          ? personalSets.filter(s => linkGroup.setCategories.includes(s.catId))
          : personalSets
        return (
          <div className="inv-modal-overlay" onClick={() => setLinkToSetItem(null)}>
            <div className="inv-modal" onClick={e => e.stopPropagation()}>
              <div className="inv-modal-title">Привязать к набору</div>
              <div className="inv-set-picker-list">
                {pickerSets.length === 0 && (
                  <div style={{ padding: '12px 0', color: 'var(--text-3)', fontSize: 13 }}>
                    Нет личных наборов в этой категории.<br/>Добавьте наборы в профиле.
                  </div>
                )}
                {pickerSets.map(s => (
                  <button key={s.id} className="inv-set-picker-item" onClick={() => doLinkSet(linkToSetItem, s)}>
                    <div className="inv-set-picker-dot" style={{ background: '#4E8268' }} />
                    <div className="inv-set-picker-name">{s.name}</div>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-3)' }}>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                ))}
              </div>
              <div className="inv-modal-actions" style={{ marginTop: 16 }}>
                <button className="inv-modal-btn" onClick={() => setLinkToSetItem(null)}>Отмена</button>
              </div>
            </div>
          </div>
        )
      })()}

      {showSpotlight && <SpotlightTour steps={INV_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
    </Layout>
  )
}
