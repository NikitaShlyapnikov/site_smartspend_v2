import { useState, useRef, useCallback } from 'react'
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
  { targetId: 'sp-inv-summary', btnId: null,          title: 'Сводка статусов',  desc: 'Карточки показывают сколько позиций требует внимания. Нажми на карточку — лента отфильтруется по статусу.' },
  { targetId: 'sp-inv-groups',  btnId: 'sp-inv-edit', title: 'Список инвентаря', desc: 'Позиции сгруппированы по статусу. Нажми на строку — откроется панель деталей справа. Кнопка «Редактировать» позволяет добавлять новые позиции.' },
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
    pct = Math.min(100, Math.round((1 - remaining / item.qty) * 100))

    const daysHint = daysLeft > 0 ? ` (~\u00a0${daysLeft}\u00a0дн.)` : ''
    const r = (unit === 'г' || unit === 'мл') ? Math.round(remaining) : parseFloat(remaining.toFixed(1))
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
    if (Array.isArray(item.purchases)) {
      const boughtList = item.purchases.filter(p => p.bought && p.purchaseDate)
      const total = item.purchases.length

      if (boughtList.length === 0) {
        pct = 0; status = 'ok'
        remainderText = `${total} шт — ни одна не куплена`
        ringNum = '—'; ringUnit = ''
        monthlyBlock = null
      } else {
        const oldestDate = boughtList.map(p => p.purchaseDate).sort()[0]
        const weeksUsed = Math.floor(daysSince(oldestDate) / 7)
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
          remainderText = weeksLeft > 0 ? `осталось ${weeksLeft}\u00a0нед. до замены` : 'требует замены'
          if (weeksLeft === 0) { ringNum = '0'; ringUnit = 'нед' }
          else if (weeksLeft < 52) { ringNum = String(weeksLeft); ringUnit = 'нед' }
          else { ringNum = String(Math.floor(weeksLeft / 52)); ringUnit = 'лет' }
          if (pct >= 85) status = 'urgent'
          else if (pct >= 60) status = 'soon'
          else status = 'ok'
        }
      }
    } else {
      const purchaseDate = override !== null ? override : item.purchaseDate
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
        remainderText = weeksLeft > 0 ? `осталось ${weeksLeft}\u00a0нед. до замены` : 'требует замены'
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

function ItemRow({ item, info, override, selected, editMode, onSelect, onDelete }) {
  const paused = !!item.paused
  const { pct, status } = info

  let residualText = null
  let timeText = null

  if (item.type === 'consumable') {
    const ov = override !== null ? Math.max(0, override) : Math.max(0, item.qty - daysSince(item.lastBought) * item.dailyUse)
    const pricePerUnit = item.qty > 0 ? item.price / item.qty : 0
    residualText = `${Math.round(ov * pricePerUnit).toLocaleString('ru')} ₽`
    const daysLeft = item.dailyUse > 0 ? Math.round(ov / item.dailyUse) : 0
    if (daysLeft <= 0) timeText = 'закончилось'
    else if (daysLeft < 7) timeText = `${daysLeft} дн.`
    else if (daysLeft < 30) timeText = `${Math.floor(daysLeft / 7)} нед.`
    else timeText = `${Math.floor(daysLeft / 30)} мес.`
  } else {
    if (Array.isArray(item.purchases)) {
      const total = item.purchases.length
      const boughtList = item.purchases.filter(p => p.bought && p.purchaseDate)
      if (boughtList.length > 0) {
        const oldestDate = boughtList.map(p => p.purchaseDate).sort()[0]
        const wu = Math.floor(daysSince(oldestDate) / 7)
        const pctUsed = Math.min(1, wu / item.wearLifeWeeks)
        const rv = boughtList.length * Math.max(0, Math.round(item.price * (1 - pctUsed)))
        residualText = `${rv.toLocaleString('ru')} ₽`
        const weeksLeft = Math.max(0, item.wearLifeWeeks - wu)
        if (status === 'overexploit') timeText = `+${wu - item.wearLifeWeeks} нед.`
        else if (weeksLeft === 0) timeText = 'замена'
        else if (weeksLeft < 52) timeText = `${weeksLeft} нед.`
        else timeText = `${Math.floor(weeksLeft / 52)} лет`
      } else {
        residualText = '—'
        timeText = `${total} шт`
      }
    } else {
      const pd = override !== null ? override : item.purchaseDate
      if (pd) {
        const wu = Math.floor(daysSince(pd) / 7)
        const rv = Math.max(0, Math.round(item.price * (1 - wu / item.wearLifeWeeks)))
        residualText = `${rv.toLocaleString('ru')} ₽`
        const weeksLeft = Math.max(0, item.wearLifeWeeks - wu)
        if (status === 'overexploit') timeText = `+${wu - item.wearLifeWeeks} нед.`
        else if (weeksLeft === 0) timeText = 'замена'
        else if (weeksLeft < 52) timeText = `${weeksLeft} нед.`
        else timeText = `${Math.floor(weeksLeft / 52)} лет`
      } else {
        residualText = `${item.price.toLocaleString('ru')} ₽`
        timeText = `${item.wearLifeWeeks} нед.`
      }
    }
  }

  const barPct = paused ? 50 : (status === 'overexploit' ? 100 : Math.min(100, pct))
  const barStatus = paused ? 'paused' : status

  return (
    <div
      className={`irow${selected ? ' irow--selected' : ''}${paused ? ' irow--paused' : ''}`}
      onClick={onSelect}
    >
      <span className="irow-name">{item.name}</span>
      <div className="irow-bar-wrap">
        <div className="irow-bar">
          <div className={`irow-bar-fill irow-bar-fill--${barStatus}`} style={{ width: `${barPct}%` }} />
        </div>
        <span className="irow-pct">{paused ? '—' : `${pct}%`}</span>
      </div>
      <span className={`irow-time irow-time--${barStatus}`}>{timeText || '—'}</span>
      <span className="irow-residual">{residualText || '—'}</span>
      {editMode && (
        <button className="irow-delete" onClick={e => { e.stopPropagation(); onDelete() }} title="Удалить">
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ── ITEM DETAIL ────────────────────────────────────────────────────────────────

function ItemDetail({ item, info, group, override, editMode, onOverrideChange, onStepStop, onDelete, onUnlink, onLinkSet, onLaunch, notes, onNotesChange, onUpdateItem, onClose }) {
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
  const [localNoteEdit, setLocalNoteEdit] = useState(false)
  const [photoDeleteMode, setPhotoDeleteMode] = useState(false)

  function startEditParams(e) {
    e.stopPropagation()
    const today = new Date().toISOString().slice(0, 10)
    setParamForm({
      name: item.name,
      price: String(item.price || ''),
      qty: String(item.qty || ''),
      dailyUse: String(item.dailyUse || ''),
      unit: item.unit || 'г',
      wearLifeWeeks: String(item.wearLifeWeeks || ''),
      purchaseDate: Array.isArray(item.purchases) ? null : (item.purchaseDate || today),
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
  const barPct = paused ? 50 : (status === 'overexploit' ? 100 : Math.min(100, pct))
  const barStatus = paused ? 'paused' : status

  // Timeline for wear items
  let timeline = null
  if (item.type !== 'consumable' && !paused) {
    let purchaseDateForTimeline = null
    if (Array.isArray(item.purchases)) {
      const boughtList = item.purchases.filter(p => p.bought && p.purchaseDate)
      if (boughtList.length > 0) {
        purchaseDateForTimeline = boughtList.map(p => p.purchaseDate).sort()[0]
      }
    } else {
      purchaseDateForTimeline = override !== null ? override : item.purchaseDate
    }

    if (purchaseDateForTimeline && item.wearLifeWeeks) {
      const purchaseMs = new Date(purchaseDateForTimeline).getTime()
      const totalMs = item.wearLifeWeeks * 7 * 86400000
      const nowMs = Date.now()
      const elapsed = nowMs - purchaseMs
      const fillPct = Math.min(100, Math.max(0, (elapsed / totalMs) * 100))
      const nowPct = Math.min(100, (elapsed / totalMs) * 100)

      const replaceDateMs = purchaseMs + totalMs
      const replaceDate = new Date(replaceDateMs)
      const purchaseDateObj = new Date(purchaseDateForTimeline)

      const fmtDate = d => {
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const yy = String(d.getFullYear()).slice(-2)
        return `${dd}.${mm}.${yy}`
      }

      timeline = (
        <div className="ipanel-timeline">
          <div className="ipanel-timeline-bar-wrap">
            <div className="ipanel-timeline-track">
              <div className={`ipanel-timeline-fill ipanel-timeline-fill--${status}`} style={{ width: `${fillPct}%` }} />
              {nowPct < 100 && (
                <div className="ipanel-timeline-now" style={{ left: `${nowPct}%` }}>
                  <div className="ipanel-timeline-now-line" />
                  <div className="ipanel-timeline-now-label">сейчас</div>
                </div>
              )}
            </div>
          </div>
          <div className="ipanel-timeline-labels">
            <span className="ipanel-timeline-label">{fmtDate(purchaseDateObj)}</span>
            <span className="ipanel-timeline-label">{fmtDate(replaceDate)}</span>
          </div>
        </div>
      )
    }
  }

  // Details grid
  let details = null
  if (item.type === 'consumable') {
    const monthlyQty = Math.round(item.dailyUse * 30)
    const monthlyBudget = Math.round((item.price / item.qty) * monthlyQty)
    const pricePerUnit = (item.price / item.qty).toFixed(2)
    const dailyCost = Math.round(item.dailyUse * item.price / item.qty)
    details = (
      <>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Расход/день</div>
          <div className="inv-detail-val mono">{(unit === 'г' || unit === 'мл') ? Math.round(item.dailyUse || 0) : parseFloat((item.dailyUse || 0).toFixed(2))}&thinsp;{unit}</div>
        </div>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Стоимость/день</div>
          <div className="inv-detail-val mono">{dailyCost}&thinsp;руб.</div>
        </div>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Потребность/мес.</div>
          <div className="inv-detail-val mono">{monthlyQty}&thinsp;{unit}</div>
        </div>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Бюджет/мес.</div>
          <div className="inv-detail-val mono">{monthlyBudget.toLocaleString('ru')}&thinsp;руб.</div>
        </div>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Цена за {unit}</div>
          <div className="inv-detail-val mono">{pricePerUnit}&thinsp;руб.</div>
        </div>
      </>
    )
  } else if (Array.isArray(item.purchases)) {
    const total = item.purchases.length
    const boughtList = item.purchases.filter(p => p.bought && p.purchaseDate)
    const totalPrice = item.price * total
    const lifeYears = (item.wearLifeWeeks / 52).toFixed(1).replace('.0', '')

    let residualVal = 0
    if (boughtList.length > 0) {
      const oldestDate = boughtList.map(p => p.purchaseDate).sort()[0]
      const weeksUsed = Math.floor(daysSince(oldestDate) / 7)
      const pctUsed = Math.min(1, weeksUsed / item.wearLifeWeeks)
      residualVal = boughtList.length * Math.max(0, Math.round(item.price * (1 - pctUsed)))
    }

    const monthlyAmort = Math.round((totalPrice / item.wearLifeWeeks) * 4.33)
    const dailyCost = Math.round(totalPrice / (item.wearLifeWeeks * 7))

    details = (
      <>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Цена за шт.</div>
          <div className="inv-detail-val mono">{item.price.toLocaleString('ru')}&thinsp;руб.</div>
        </div>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Итого ({total}&thinsp;шт.)</div>
          <div className="inv-detail-val mono">{totalPrice.toLocaleString('ru')}&thinsp;руб.</div>
        </div>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Стоимость/день</div>
          <div className="inv-detail-val mono">{dailyCost}&thinsp;руб.</div>
        </div>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Срок эксплуатации</div>
          <div className="inv-detail-val">{item.wearLifeWeeks}&thinsp;нед. ({lifeYears}&thinsp;г.)</div>
        </div>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Остаточная стоимость</div>
          <div className="inv-detail-val mono">{residualVal.toLocaleString('ru')}&thinsp;руб.</div>
        </div>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Бюджет/мес.</div>
          <div className="inv-detail-val mono">{monthlyAmort.toLocaleString('ru')}&thinsp;руб.</div>
        </div>
      </>
    )
  } else {
    const purchaseDate = override !== null ? override : item.purchaseDate
    const weeksUsed = purchaseDate ? Math.floor(daysSince(purchaseDate) / 7) : 0
    const residualVal = Math.max(0, Math.round(item.price * (1 - weeksUsed / item.wearLifeWeeks)))
    const monthlyAmort = Math.round((item.price / item.wearLifeWeeks) * 4.33)
    const dailyCost = Math.round(item.price / (item.wearLifeWeeks * 7))
    const lifeYears = (item.wearLifeWeeks / 52).toFixed(1).replace('.0', '')
    details = (
      <>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Стоимость</div>
          <div className="inv-detail-val mono">{(item.price || 0).toLocaleString('ru')}&thinsp;руб.</div>
        </div>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Стоимость/день</div>
          <div className="inv-detail-val mono">{dailyCost}&thinsp;руб.</div>
        </div>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Срок эксплуатации</div>
          <div className="inv-detail-val">{item.wearLifeWeeks}&thinsp;нед. ({lifeYears}&thinsp;г.)</div>
        </div>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Остаточная стоимость</div>
          <div className="inv-detail-val mono">{residualVal.toLocaleString('ru')}&thinsp;руб.</div>
        </div>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Бюджет/мес.</div>
          <div className="inv-detail-val mono">{monthlyAmort.toLocaleString('ru')}&thinsp;руб.</div>
        </div>
      </>
    )
  }

  const statusLabel = paused ? 'На паузе'
    : status === 'urgent' ? 'Срочно'
    : status === 'soon' ? 'Скоро'
    : status === 'overexploit' ? 'Переэксплуатация'
    : 'Норма'

  return (
    <div className="ipanel">
      {/* Photo first */}
      {photos.length > 0 && (
        <div className="ipanel-photo-top" onClick={e => openLightbox(0, e)}>
          <img src={photos[0].url} alt={photos[0].name} className="ipanel-photo-top-img" />
          {photos.length > 1 && <span className="ipanel-photo-top-count">+{photos.length - 1}</span>}
        </div>
      )}

      {/* Header */}
      <div className="ipanel-header">
        <div className="ipanel-header-info">
          <div className="ipanel-title">{item.name}</div>
          <div className="ipanel-header-meta">
            <span className={`ipanel-status-badge ipanel-status-badge--${paused ? 'paused' : status}`}>
              {statusLabel}
            </span>
            {group && <span className="ipanel-cat-badge">{group.name}</span>}
            {item.set && <span className="ipanel-set-badge">{item.set}</span>}
          </div>
        </div>
        <button className="ipanel-close" onClick={onClose} title="Закрыть">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="ipanel-progress-wrap">
        <div className="ipanel-progress-bar">
          <div className={`ipanel-progress-fill ipanel-progress-fill--${barStatus}`} style={{ width: `${barPct}%` }} />
        </div>
        <span className="ipanel-progress-pct">{paused ? '—' : `${pct}%`}</span>
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

      {/* Timeline */}
      {timeline}

      {/* Monthly block */}
      {monthlyBlock && (
        <div className="inv-monthly">
          <div className="inv-monthly-header">
            {monthlyBlock.type === 'overexploit' ? 'Переэксплуатация' : 'Этот месяц'}
          </div>
          {monthlyBlock.type === 'deficit' && (
            <div className="inv-monthly-body deficit">
              <span className="inv-monthly-val deficit">{monthlyBlock.deficitRub.toLocaleString('ru')}&thinsp;руб.</span>
              <span className="inv-monthly-sub">нужно пополнить на <strong>{monthlyBlock.deficitAmt}</strong></span>
            </div>
          )}
          {monthlyBlock.type === 'surplus' && (
            <div className="inv-monthly-body surplus">
              <span className="inv-monthly-val surplus">{monthlyBlock.surplusRub.toLocaleString('ru')}&thinsp;руб.</span>
              <span className="inv-monthly-sub">хватит ещё на <strong>+{monthlyBlock.surplusDays}&thinsp;дн.</strong> после конца месяца</span>
            </div>
          )}
          {monthlyBlock.type === 'overexploit' && (
            <div className="inv-monthly-body overexploit">
              <span className="inv-monthly-val overexploit">+{monthlyBlock.bonusIncome.toLocaleString('ru')}&thinsp;руб.</span>
              <span className="inv-monthly-sub">бонусный доход за <strong>{monthlyBlock.weeksOver}&thinsp;нед. сверх нормы</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Details grid */}
      <div className="inv-detail-row">{details}</div>

      {/* Stepper / Date picker */}
      {!Array.isArray(item.purchases) && (
        <div className="inv-stepper-wrap">
          {item.type === 'consumable' ? (
            <>
              <div className="inv-field-lbl">Текущий остаток ({unit})</div>
              <div className="inv-stepper">
                <button className="stepper-btn"
                  onMouseDown={() => startStep(-1)} onMouseUp={stopStep}
                  onMouseLeave={stopStep} onTouchStart={() => startStep(-1)} onTouchEnd={stopStep}>−</button>
                <input
                  className="stepper-val" type="number" value={stepperVal}
                  onChange={e => onOverrideChange(Math.max(0, parseInt(e.target.value) || 0))}
                  onBlur={() => onStepStop?.()}
                />
                <span className="stepper-unit">{unit}</span>
                <button className="stepper-btn"
                  onMouseDown={() => startStep(1)} onMouseUp={stopStep}
                  onMouseLeave={stopStep} onTouchStart={() => startStep(1)} onTouchEnd={stopStep}>+</button>
              </div>
            </>
          ) : (
            <>
              <div className="inv-field-lbl">Дата покупки</div>
              <input
                className="inv-date-input" type="date"
                value={typeof stepperVal === 'string' ? stepperVal : item.purchaseDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => onOverrideChange(e.target.value)}
                onBlur={() => onStepStop?.()}
              />
            </>
          )}
        </div>
      )}

      {/* Multi-purchase list */}
      {Array.isArray(item.purchases) && (() => {
        const today = new Date().toISOString().slice(0, 10)
        const needsReplace = (p) => p.bought && p.purchaseDate &&
          Math.floor(daysSince(p.purchaseDate) / 7) >= item.wearLifeWeeks
        const weeksLeftFor = (p) => p.bought && p.purchaseDate
          ? Math.max(0, item.wearLifeWeeks - Math.floor(daysSince(p.purchaseDate) / 7))
          : null

        function handlePurchaseToggle(i, checked) {
          const next = item.purchases.map((p, idx) => idx !== i ? p : {
            ...p, bought: checked, purchaseDate: checked ? (p.purchaseDate || today) : null
          })
          onUpdateItem({ ...item, purchases: next })
        }
        function handlePurchaseDate(i, date) {
          const next = item.purchases.map((p, idx) => idx !== i ? p : { ...p, purchaseDate: date })
          onUpdateItem({ ...item, purchases: next })
        }

        return (
          <div className="inv-purchases-wrap">
            <div className="inv-purchases-label">
              <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Даты покупок ({item.purchases.filter(p => p.bought).length} / {item.purchases.length} куплено)
            </div>
            <div className="inv-purchases-list">
              {item.purchases.map((p, i) => {
                const wl = weeksLeftFor(p)
                const expired = needsReplace(p)
                return (
                  <div key={i} className={`inv-purchase-row${expired ? ' expired' : (p.bought && wl !== null && wl <= Math.ceil(item.wearLifeWeeks * 0.1) ? ' soon' : '')}`}>
                    <span className="inv-purchase-num">{i + 1}</span>
                    <label className="inv-purchase-check">
                      <input type="checkbox" checked={!!p.bought}
                        onChange={e => handlePurchaseToggle(i, e.target.checked)} />
                      <span>{p.bought ? 'Куплено' : 'Не куплено'}</span>
                    </label>
                    <input
                      type="date"
                      className={`inv-purchase-date${!p.bought ? ' disabled' : ''}`}
                      disabled={!p.bought}
                      value={p.purchaseDate || ''}
                      max={today}
                      onChange={e => handlePurchaseDate(i, e.target.value)}
                    />
                    {p.bought && wl !== null && (
                      <span className={`inv-purchase-hint${expired ? ' expired' : ''}`}>
                        {expired ? `+${Math.abs(wl)} нед` : `${wl} нед`}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Edit params button / form */}
      {editMode && !hasSet && !isEditingParams && (
        <div style={{ padding: '4px 0 8px' }}>
          <button className="inv-edit-params-btn" onClick={startEditParams}>
            <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Редактировать параметры
          </button>
        </div>
      )}

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
                {!Array.isArray(item.purchases) && (
                  <div className="inv-add-form-field">
                    <div className="inv-add-form-lbl">Дата покупки</div>
                    <input className="inv-add-form-input" type="date" value={paramForm.purchaseDate || ''}
                      onChange={e => setPF('purchaseDate')(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
                  </div>
                )}
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

      {/* Notes section */}
      {!editMode && !localNoteEdit && !notes.text && !(notes.photos && notes.photos.length > 0) ? (
        <div className="inv-notes-placeholder" onClick={() => setLocalNoteEdit(true)}>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          Добавить заметку...
        </div>
      ) : (
        <div className="inv-notes-section">
          <div className="inv-notes-label">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            Заметки
            {!editMode && !localNoteEdit && (
              <button className="inv-notes-edit-btn" onClick={e => { e.stopPropagation(); setLocalNoteEdit(true); setPhotoDeleteMode(false) }}>
                <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Редактировать
              </button>
            )}
            {localNoteEdit && !editMode && (
              <button className="inv-notes-done-btn" onClick={e => { e.stopPropagation(); setLocalNoteEdit(false); setPhotoDeleteMode(false) }}>
                <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Готово
              </button>
            )}
          </div>
          {(editMode || localNoteEdit) ? (
            <>
              <textarea
                className="inv-notes-textarea"
                placeholder="Добавьте заметку..."
                value={notes.text || ''}
                onChange={e => onNotesChange({ ...notes, text: e.target.value })}
              />
              <div className="inv-notes-photo-actions">
                <button className="inv-notes-add-photo-btn" onClick={e => { e.stopPropagation(); notePhotoInputRef.current?.click() }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Добавить фото
                </button>
                {(notes.photos || []).length > 0 && (
                  <button
                    className={`inv-notes-delete-photo-btn${photoDeleteMode ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); setPhotoDeleteMode(m => !m) }}
                  >
                    {photoDeleteMode ? (
                      <>
                        <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                        Готово
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                        </svg>
                        Удалить фото
                      </>
                    )}
                  </button>
                )}
              </div>
              {(notes.photos || []).length > 0 && (
                <div className="inv-notes-photo-row">
                  {(notes.photos || []).map((p, i) => (
                    <div key={i} className="inv-notes-thumb-wrap" onClick={e => !photoDeleteMode && openLightbox(i, e)}>
                      <img src={p.url} alt={p.name} className="inv-notes-thumb" style={{ opacity: photoDeleteMode ? 0.6 : 1 }} />
                      {photoDeleteMode && (
                        <button className="inv-notes-thumb-remove" onClick={e => { e.stopPropagation(); onNotesChange({ ...notes, photos: notes.photos.filter((_, j) => j !== i) }) }}>
                          <svg width="9" height="9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <input ref={notePhotoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoAdd} />
            </>
          ) : (
            <>
              {notes.text && <div className="inv-notes-text">{notes.text}</div>}
              {notes.photos && notes.photos.length > 0 && (
                <div className="inv-notes-photo-row">
                  {notes.photos.map((p, i) => (
                    <div key={i} className="inv-notes-thumb-wrap" onClick={e => openLightbox(i, e)}>
                      <img src={p.url} alt={p.name} className="inv-notes-thumb" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Set row */}
      <div className="inv-set-row">
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          strokeWidth="2" style={{ opacity: 0.4, flexShrink: 0 }}>
          <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        {hasSet ? (
          <>
            <span style={{ color: 'var(--text-3)' }}>Набор:</span>
            <Link to={`/set/${item.setId}`} state={{ fromProfile: true }} className="inv-set-link">
              {item.set}
              <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </Link>
            {editMode && (
              <button className="inv-unlink-btn" onClick={onUnlink}>
                Отвязать
              </button>
            )}
          </>
        ) : (
          <>
            <span className="inv-personal-badge">Личное</span>
            <button className="inv-link-btn" onClick={onLinkSet}>
              <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
              Привязать к набору
            </button>
          </>
        )}
      </div>

      {/* Edit mode delete button */}
      {editMode && (
        <div style={{ padding: '4px 0 8px' }}>
          <button className="inv-item-delete-full" onClick={onDelete}>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
            Удалить позицию
          </button>
        </div>
      )}

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

function ShoppingList({ items, infoMap, groups, overrides, categoryFilter, setFilter, onClose }) {
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

  if (items.filter(i => !i.paused && infoMap[i.id]?.filterStatus === 'urgent').length === 0) return null

  return (
    <div className="inv-shopping-list">
      <div className="inv-shopping-header">
        <span className="inv-shopping-title">Список покупок</span>
        <div className="inv-shopping-period-toggle">
          <button className={`inv-shopping-period-btn${period === 'week' ? ' active' : ''}`} onClick={() => setPeriod('week')}>Неделя</button>
          <button className={`inv-shopping-period-btn${period === 'month' ? ' active' : ''}`} onClick={() => setPeriod('month')}>Месяц</button>
        </div>
        <span className="inv-shopping-total">~{grandTotal.toLocaleString('ru')}&thinsp;₽</span>
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
              <span className="inv-shopping-group-total">~{groupTotal.toLocaleString('ru')}&thinsp;₽</span>
            </div>
            {g.rows.map(item => {
              const action = getAction(item)
              return (
                <div key={item.id} className="inv-shopping-row">
                  <span className="inv-shopping-item-name">{item.name}</span>
                  <span className="inv-shopping-item-qty">{action?.qty || '—'}</span>
                  <span className="inv-shopping-item-cost">~{(action?.cost || 0).toLocaleString('ru')}&thinsp;₽</span>
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

function AddItemForm({ groupId, groupSetCategories, groupPersonalSets, onAdd, onCancel }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    name: '', type: 'consumable', price: '', qty: '', dailyUse: '', unit: 'г',
    wearLifeWeeks: '', purchaseDate: today, setId: '', wearQty: '1',
  })
  const set = k => v => setForm(p => ({ ...p, [k]: v }))
  const groupSets = (groupPersonalSets || []).filter(s => groupSetCategories?.includes(s.catId))

  function handleSubmit() {
    if (!form.name.trim() || !form.price) return
    const data = { ...form }
    if (form.type === 'wear') {
      const count = Math.max(1, parseInt(form.wearQty) || 1)
      if (count > 1) {
        data.purchases = Array.from({ length: count }, () => ({ bought: false, purchaseDate: null }))
        data.purchaseDate = null
      }
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
          <input className="inv-add-form-input" type="number" value={form.price}
            onChange={e => set('price')(e.target.value)} placeholder="0" />
        </div>

        {form.type === 'consumable' ? (
          <>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Объём / масса</div>
              <input className="inv-add-form-input" type="number" value={form.qty}
                onChange={e => set('qty')(e.target.value)} placeholder="500" />
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
              <div className="inv-add-form-lbl">Расход в день</div>
              <input className="inv-add-form-input" type="number" value={form.dailyUse}
                onChange={e => set('dailyUse')(e.target.value)} placeholder="10" step="0.1" />
            </div>
          </>
        ) : (
          <>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Срок службы, нед.</div>
              <input className="inv-add-form-input" type="number" value={form.wearLifeWeeks}
                onChange={e => set('wearLifeWeeks')(e.target.value)} placeholder="52" />
            </div>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Дата покупки</div>
              <input className="inv-add-form-input" type="date" value={form.purchaseDate}
                onChange={e => set('purchaseDate')(e.target.value)} max={today} />
            </div>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Количество, шт.</div>
              <input className="inv-add-form-input" type="number" value={form.wearQty}
                onChange={e => set('wearQty')(e.target.value)} placeholder="1" min="1" />
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
  const [editMode, setEditMode] = useState(false)
  const [showSpotlight, setShowSpotlight] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [unlinkConfirm, setUnlinkConfirm] = useState(null)
  const [linkToSetItem, setLinkToSetItem] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addFormGroupId, setAddFormGroupId] = useState(null)
  const nextIdRef = useRef(1000)

  const [itemGroups, setItemGroups] = useState(() => {
    const map = {}
    const base = inventoryGroups.flatMap(g => g.items.map(i => ({ ...i, groupId: g.id })))
    const extra = loadExtraItems().map(i => ({ ...i, isExtra: true }))
    ;[...base, ...extra].forEach(item => {
      if (item.paused) { map[item.id] = 'paused'; return }
      const ov = item.type === 'consumable'
        ? Math.max(0, Math.round(item.qty - daysSince(item.lastBought) * item.dailyUse))
        : item.purchaseDate
      const info = getItemInfo(item, ov)
      map[item.id] = info.filterStatus
    })
    return map
  })

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

  const consumableVal = items.filter(i => i.type === 'consumable').reduce((s, item) => {
    const ov = overrides[item.id]
    const rem = ov !== null ? Math.max(0, ov) : Math.max(0, item.qty - daysSince(item.lastBought) * item.dailyUse)
    return s + (item.qty > 0 ? (rem / item.qty) * item.price : 0)
  }, 0)
  const wearVal = items.filter(i => i.type === 'wear').reduce((s, item) => {
    if (Array.isArray(item.purchases)) {
      const boughtList = item.purchases.filter(p => p.bought && p.purchaseDate)
      if (boughtList.length === 0) return s
      const oldestDate = boughtList.map(p => p.purchaseDate).sort()[0]
      const wu = Math.floor(daysSince(oldestDate) / 7)
      const pctUsed = Math.min(1, wu / item.wearLifeWeeks)
      return s + boughtList.length * Math.max(0, Math.round(item.price * (1 - pctUsed)))
    }
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
    { key: 'urgent',  label: 'Критично', items: applyFilters(items.filter(i => itemGroups[i.id] === 'urgent')) },
    { key: 'soon',    label: 'Следи',    items: applyFilters(items.filter(i => itemGroups[i.id] === 'soon')) },
    { key: 'ok',      label: 'Норма',    items: applyFilters(items.filter(i => itemGroups[i.id] === 'ok')) },
    { key: 'paused',  label: 'На паузе', items: applyFilters(items.filter(i => itemGroups[i.id] === 'paused')) },
  ].filter(sg => {
    if (statusFilter && sg.key !== statusFilter) return false
    if (editMode) return true
    return sg.items.length > 0
  })

  const selectedItem = selectedItemId ? items.find(i => i.id === selectedItemId) : null
  const selectedGroup = selectedItem ? ALL_GROUPS.find(g => g.id === selectedItem.groupId) : null

  // Handlers
  function doDelete(id) {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id)
      syncExtra(next)
      return next
    })
    setItemGroups(prev => { const next = { ...prev }; delete next[id]; return next })
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
    if (launchedItem) {
      const ov = overrides[id] ?? null
      const info = getItemInfo({ ...launchedItem, paused: false }, ov)
      setItemGroups(prev => ({ ...prev, [id]: info.filterStatus }))
    }
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
      if (Array.isArray(form.purchases)) {
        Object.assign(base, {
          wearLifeWeeks: Number(form.wearLifeWeeks) || 52,
          purchases: form.purchases,
          qty: form.purchases.length,
        })
      } else {
        Object.assign(base, {
          wearLifeWeeks: Number(form.wearLifeWeeks) || 52,
          purchaseDate: form.purchaseDate || new Date().toISOString().slice(0, 10),
        })
        setOverrides(p => ({ ...p, [id]: base.purchaseDate }))
      }
    }
    setItems(prev => {
      const next = [...prev, base]
      syncExtra(next)
      return next
    })
    const newOv = base.type === 'consumable'
      ? (Number(form.qty) || 100)
      : (Array.isArray(form.purchases) ? null : (base.purchaseDate || null))
    const newInfo = getItemInfo(base, newOv)
    setItemGroups(prev => ({ ...prev, [id]: newInfo.filterStatus }))
    setShowAddForm(false)
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
        if (form.purchases !== undefined) {
          const updated = { ...i, ...form }
          if (updated.isExtra) syncExtra([...prev.filter(x => x.id !== id), updated])
          return updated
        }
        const updated = { ...i, name: form.name?.trim() || i.name, price: Number(form.price) || 0 }
        if (i.type === 'consumable') {
          return { ...updated, qty: Number(form.qty) || 100, dailyUse: Number(form.dailyUse) || 1, unit: form.unit || 'г' }
        } else {
          const base = { ...updated, wearLifeWeeks: Number(form.wearLifeWeeks) || 52 }
          if (!Array.isArray(i.purchases) && form.purchaseDate) {
            return { ...base, purchaseDate: form.purchaseDate }
          }
          return base
        }
      })
      syncExtra(next)
      return next
    })
    const currentItem = items.find(i => i.id === id)
    if (currentItem?.type === 'wear' && !Array.isArray(currentItem.purchases) && form.purchaseDate) {
      setOverrides(p => ({ ...p, [id]: form.purchaseDate }))
    }
  }

  function toggleEditMode() {
    setEditMode(m => !m)
    if (editMode) {
      setShowAddForm(false)
      setAddFormGroupId(null)
    }
  }

  const addFormGroup = addFormGroupId ? ALL_GROUPS.find(g => g.id === addFormGroupId) : null

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
          <div style={{ display: 'flex', gap: 8 }}>
            <button id="sp-inv-edit" className={`btn-edit-mode${editMode ? ' active' : ''}`} onClick={toggleEditMode}>
              {editMode ? (
                <>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Готово
                </>
              ) : (
                <>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Редактировать
                </>
              )}
            </button>
          </div>
        </div>

        {/* Summary chips */}
        <div id="sp-inv-summary" className="inv-chips-row">
          {[
            { key: 'urgent', label: 'срочно',   count: urgentItems.length, sub: urgentCost > 0 ? `~${urgentCost.toLocaleString('ru')} ₽` : null },
            { key: 'soon',   label: 'скоро',    count: soonItems.length,   sub: null },
            { key: 'ok',     label: 'в норме',  count: okItems.length,     sub: null },
            { key: 'paused', label: 'на паузе', count: pausedItems.length, sub: null },
          ].map(({ key, label, count, sub }) => (
            <button
              key={key}
              className={`inv-chip inv-chip--${key}${statusFilter === key ? ' active' : ''}${count === 0 ? ' empty' : ''}`}
              onClick={() => setStatusFilter(f => f === key ? null : key)}
            >
              <span className="inv-chip-count">{count}</span>
              <span className="inv-chip-label">{label}</span>
              {sub && <span className="inv-chip-sub">{sub}</span>}
              {statusFilter === key && (
                <svg className="inv-chip-close" width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              )}
            </button>
          ))}
          {(statusFilter || categoryFilter || setFilter) && (
            <button className="inv-chip-reset" onClick={() => { setStatusFilter(null); setCategoryFilter(null); setSetFilter(null) }}>
              <svg width="9" height="9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Сбросить
            </button>
          )}
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

        {/* Shopping list */}
        {statusFilter === 'urgent' && (
          <ShoppingList items={items} infoMap={infoMap} groups={ALL_GROUPS} overrides={overrides} categoryFilter={categoryFilter} setFilter={setFilter} onClose={() => setStatusFilter(null)} />
        )}

        {/* Add form in edit mode */}
        {editMode && (
          <div className="inv-add-section">
            {!showAddForm ? (
              <button className="inv-add-toggle" onClick={() => setShowAddForm(true)}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Добавить позицию
              </button>
            ) : (
              <div className="inv-add-inline">
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
                    <button className="inv-add-cancel" onClick={() => { setShowAddForm(false); setAddFormGroupId(null) }}>Отмена</button>
                  </div>
                ) : (
                  <div>
                    <div className="inv-add-group-back">
                      <button className="inv-add-group-back-btn" onClick={() => setAddFormGroupId(null)}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                        Категория: {addFormGroup?.name}
                      </button>
                    </div>
                    <AddItemForm
                      groupId={addFormGroupId}
                      groupSetCategories={addFormGroup?.setCategories}
                      groupPersonalSets={personalSets}
                      onAdd={doAddItem}
                      onCancel={() => { setShowAddForm(false); setAddFormGroupId(null) }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Split layout */}
        <div id="sp-inv-groups" className={`inv-split${selectedItem ? ' inv-split--has-panel' : ''}`}>
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
                        group={group}
                        override={overrides[item.id] ?? null}
                        selected={selectedItemId === item.id}
                        editMode={editMode}
                        onSelect={() => setSelectedItemId(id => id === item.id ? null : item.id)}
                        onDelete={() => setDeleteConfirm({ id: item.id, name: item.name, set: item.set })}
                      />
                    )
                  })}
                  {sg.items.length === 0 && (
                    <div className="inv-group-empty">Нет позиций с таким статусом</div>
                  )}
                </div>
              </div>
            ))}

            {STATUS_GROUPS.length === 0 && !editMode && (
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

            {!editMode && items.length === 0 && (
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
                  <button className="inv-cold-btn-secondary" onClick={() => setEditMode(true)}>Добавить вручную</button>
                </div>
              </div>
            )}

            {/* Value summary */}
            {items.length > 0 && (
              <div className="inv-value-card">
                <div className="inv-value-main">
                  <div className="inv-value-lbl">стоимость инвентаря</div>
                  <div className="inv-value-val">{totalValue.toLocaleString('ru')}&thinsp;₽</div>
                </div>
                <div className="inv-value-breakdown">
                  <div className="inv-value-item">
                    <span className="inv-value-item-val">{Math.round(consumableVal).toLocaleString('ru')}&thinsp;₽</span>
                    <span className="inv-value-item-lbl">расходники</span>
                  </div>
                  <div className="inv-value-item">
                    <span className="inv-value-item-val">{wearVal.toLocaleString('ru')}&thinsp;₽</span>
                    <span className="inv-value-item-lbl">вещи</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: detail panel */}
          {selectedItem && (
            <div className="inv-panel-col">
              <ItemDetail
                key={selectedItem.id}
                item={selectedItem}
                info={infoMap[selectedItem.id]}
                group={selectedGroup}
                override={overrides[selectedItem.id] ?? null}
                editMode={editMode}
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
                onClose={() => setSelectedItemId(null)}
              />
            </div>
          )}
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
