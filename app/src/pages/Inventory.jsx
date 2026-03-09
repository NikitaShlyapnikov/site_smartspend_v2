import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { inventoryGroups, catalogSets } from '../data/mock'

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const ALL_GROUPS = [
  { id: 'g1', name: 'Одежда', color: '#4E8268', setCategories: ['clothes'] },
  { id: 'g2', name: 'Питание', color: '#8268A0', setCategories: ['food'] },
  { id: 'g3', name: 'Техника', color: '#6888A0', setCategories: ['home'] },
  { id: 'g4', name: 'Гигиена и уход', color: '#A08268', setCategories: ['health'] },
  { id: 'g5', name: 'Здоровье', color: '#A06870', setCategories: ['health'] },
  { id: 'g6', name: 'Дом', color: '#688870', setCategories: ['home'] },
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

    if (pct >= 90) status = 'urgent'
    else if (pct >= 70) status = 'soon'
    else status = 'ok'

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
      else if (pct >= 70) status = 'soon'
      else status = 'ok'
    }
  }

  const filterStatus = status === 'overexploit' ? 'urgent' : status
  return { pct, status, filterStatus, remainderText, ringNum, ringUnit, monthlyBlock }
}

// ── COMPONENTS ────────────────────────────────────────────────────────────────

function Ring({ pct, ringNum, ringUnit, status, paused }) {
  const r = 17
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const cls = paused ? 'ring-paused'
    : status === 'urgent' ? 'ring-urgent'
    : status === 'soon' ? 'ring-soon'
    : status === 'overexploit' ? 'ring-overexploit'
    : 'ring-ok'
  return (
    <div className={`ring-wrap ${cls}`}>
      <svg viewBox="0 0 44 44" width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
        <circle className="ring-bg" cx="22" cy="22" r={r} />
        <circle className="ring-fg" cx="22" cy="22" r={r} strokeDasharray={`${dash} ${circ}`} strokeDashoffset="0" />
      </svg>
      <div className="ring-label">
        <span className="ring-num">{ringNum}</span>
        <span className="ring-unit">{ringUnit}</span>
      </div>
    </div>
  )
}

function getStepSize(elapsed) {
  if (elapsed < 800) return 1
  if (elapsed < 1800) return 10
  if (elapsed < 3000) return 100
  return 1000
}

function InventoryItem({ item, open, onToggle, override, onOverrideChange, editMode, onDelete, onUnlink, onLinkSet, onLaunch }) {
  const paused = !!item.paused
  const info = getItemInfo(item, override)
  const { pct, status, remainderText, ringNum, ringUnit, monthlyBlock } = info
  const unit = item.type === 'consumable' ? (item.unit || 'г') : 'нед'
  const remCls = paused ? '' : (status !== 'ok' ? ` ${status}` : '')

  const stepTimerRef = useRef(null)
  const stepHoldRef = useRef(0)
  const stepValRef = useRef(null)

  function stopStep() {
    if (stepTimerRef.current) { clearTimeout(stepTimerRef.current); stepTimerRef.current = null }
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

  // Type-specific details
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
          <div className="inv-detail-val mono">{item.dailyUse}&thinsp;{unit}</div>
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
  } else {
    const purchaseDate = override !== null ? override : item.purchaseDate
    const weeksUsed = Math.floor(daysSince(purchaseDate) / 7)
    const residualVal = Math.max(0, Math.round(item.price * (1 - weeksUsed / item.wearLifeWeeks)))
    const monthlyAmort = Math.round((item.price / item.wearLifeWeeks) * 4.33)
    const dailyCost = Math.round(item.price / (item.wearLifeWeeks * 7))
    const lifeYears = (item.wearLifeWeeks / 52).toFixed(1).replace('.0', '')
    details = (
      <>
        {item.expectedPrice && (
          <div className="inv-detail">
            <div className="inv-detail-lbl">Плановая стоимость</div>
            <div className="inv-detail-val mono">{item.expectedPrice.toLocaleString('ru')}&thinsp;руб.</div>
          </div>
        )}
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

  const hasSet = item.set && item.setId

  return (
    <div className={`inv-item status-${paused ? 'ok' : status}${open ? ' open' : ''}`}>
      <div className="inv-item-main" onClick={onToggle}>
        <Ring pct={paused ? 50 : pct} ringNum={paused ? '⏸' : ringNum} ringUnit={paused ? '' : ringUnit} status={status} paused={paused} />
        <div className="inv-info">
          <div className="inv-name">{item.name}</div>
          {paused ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="inv-remainder" style={{ color: '#5B8FD4' }}>пауза · набор удалён</span>
              <button className="inv-launch-btn" onClick={e => { e.stopPropagation(); onLaunch() }}>
                <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Запустить
              </button>
            </div>
          ) : (
            <div className={`inv-remainder${remCls}`}>{remainderText}</div>
          )}
        </div>
        {editMode && (
          <button className="inv-item-delete" onClick={e => { e.stopPropagation(); onDelete() }} title="Удалить">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        <svg className="inv-chevron" width="14" height="14" fill="none" stroke="currentColor"
          viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.22s' }}>
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <div className={`inv-expanded${open ? ' open' : ''}`}>
        {/* Monthly block */}
        {open && monthlyBlock && (
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

        {/* Body: details + stepper/date */}
        {open && (
          <div className="inv-body">
            <div className="inv-detail-row">{details}</div>
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
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Set row — bottom */}
        {open && (
          <div className="inv-set-row">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              strokeWidth="2" style={{ opacity: 0.4, flexShrink: 0 }}>
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {hasSet ? (
              <>
                <span style={{ color: 'var(--text-3)' }}>Набор:</span>
                <Link to={`/set/${item.setId}`} className="inv-set-link" onClick={e => e.stopPropagation()}>
                  {item.set}
                  <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </Link>
                {editMode && (
                  <button className="inv-unlink-btn" onClick={e => { e.stopPropagation(); onUnlink() }}>
                    Отвязать
                  </button>
                )}
              </>
            ) : (
              <>
                <span style={{ color: 'var(--text-3)' }}>Личное</span>
                <button className="inv-link-btn" onClick={e => { e.stopPropagation(); onLinkSet() }}>
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
        )}
      </div>
    </div>
  )
}

function AddItemForm({ groupId, groupSetCategories, onAdd, onCancel }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    name: '', type: 'consumable', price: '', qty: '', dailyUse: '', unit: 'г',
    wearLifeWeeks: '', purchaseDate: today, expectedPrice: '', setId: '',
  })
  const set = k => v => setForm(p => ({ ...p, [k]: v }))
  const groupSets = catalogSets.filter(s => groupSetCategories?.includes(s.category))

  function handleSubmit() {
    if (!form.name.trim() || !form.price) return
    onAdd(groupId, form)
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
              <div className="inv-add-form-lbl">Плановая цена, руб.</div>
              <input className="inv-add-form-input" type="number" value={form.expectedPrice}
                onChange={e => set('expectedPrice')(e.target.value)} placeholder="необязательно" />
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
              {groupSets.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
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

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function Inventory() {
  // Mutable flat items state
  const [items, setItems] = useState(() =>
    inventoryGroups.flatMap(g => g.items.map(item => ({ ...item, groupId: g.id })))
  )
  const [openItem, setOpenItem] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)   // {id, name, set}
  const [unlinkConfirm, setUnlinkConfirm] = useState(null)   // {id, name, set}
  const [linkToSetItem, setLinkToSetItem] = useState(null)   // item id
  const [addFormGroup, setAddFormGroup] = useState(null)     // group id
  const nextIdRef = useRef(1000)

  const [overrides, setOverrides] = useState(() => {
    const map = {}
    inventoryGroups.forEach(g => g.items.forEach(item => {
      if (item.type === 'consumable') {
        map[item.id] = Math.max(0, Math.round(item.qty - daysSince(item.lastBought) * item.dailyUse))
      } else {
        map[item.id] = item.purchaseDate
      }
    }))
    return map
  })

  // Compute info for all items
  const infoMap = {}
  items.forEach(item => { infoMap[item.id] = getItemInfo(item, overrides[item.id] ?? null) })

  const urgentItems = items.filter(i => !i.paused && infoMap[i.id].filterStatus === 'urgent')
  const soonItems   = items.filter(i => !i.paused && infoMap[i.id].filterStatus === 'soon')
  const urgentCost  = urgentItems.reduce((s, i) => {
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
    const pd = overrides[item.id] ?? item.purchaseDate
    const wu = Math.floor(daysSince(pd) / 7)
    return s + Math.max(0, Math.round(item.price * (1 - wu / item.wearLifeWeeks)))
  }, 0)
  const totalValue = Math.round(consumableVal + wearVal)

  // Groups to show
  const visibleGroups = editMode
    ? ALL_GROUPS
    : ALL_GROUPS.filter(g => {
        const gi = items.filter(i => i.groupId === g.id)
        return statusFilter ? gi.some(i => infoMap[i.id]?.filterStatus === statusFilter) : gi.length > 0
      })

  // Handlers
  function doDelete(id) {
    setItems(prev => prev.filter(i => i.id !== id))
    if (openItem === id) setOpenItem(null)
    setDeleteConfirm(null)
  }

  function doUnlink(id) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, set: null, setId: null } : i))
    setUnlinkConfirm(null)
  }

  function doLaunch(id) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, paused: false } : i))
  }

  function doLinkSet(itemId, pickedSet) {
    setItems(prev => prev.map(i => i.id === itemId
      ? { ...i, set: pickedSet.title, setId: pickedSet.id }
      : i))
    setLinkToSetItem(null)
  }

  function doAddItem(groupId, form) {
    const id = 'i' + nextIdRef.current++
    const pickedSet = form.setId ? catalogSets.find(s => s.id === form.setId) : null
    const base = {
      id, name: form.name.trim(), type: form.type, groupId,
      price: Number(form.price) || 0,
      set: pickedSet?.title || null, setId: pickedSet?.id || null,
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
        expectedPrice: form.expectedPrice ? Number(form.expectedPrice) : undefined,
      })
      setOverrides(p => ({ ...p, [id]: base.purchaseDate }))
    }
    setItems(prev => [...prev, base])
    setAddFormGroup(null)
  }

  function toggleEditMode() {
    setEditMode(m => !m)
    if (editMode) setAddFormGroup(null)
  }

  return (
    <Layout>
      <main className="inventory-main">
        {/* Header */}
        <div className="inv-page-header">
          <div>
            <div className="page-title">Инвентарь</div>
            <div className="page-subtitle">{items.length} позиций</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn-edit-mode${editMode ? ' active' : ''}`} onClick={toggleEditMode}>
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

        {/* Summary row */}
        <div className="inv-summary-row">
          <div className={`inv-urgent-card${statusFilter === 'urgent' ? ' active-filter' : ''}`}
            onClick={() => setStatusFilter(f => f === 'urgent' ? null : 'urgent')}>
            <div className="inv-urgent-top">
              <div className="inv-urgent-num">{urgentItems.length}</div>
              <div className="inv-urgent-icon">
                <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
            </div>
            <div>
              <div className="inv-urgent-lbl">нужно купить сейчас</div>
              {urgentCost > 0 && <div className="inv-urgent-cost">{urgentCost.toLocaleString('ru')}&thinsp;руб.</div>}
              <div className="inv-urgent-hint">{statusFilter === 'urgent' ? 'нажмите чтобы сбросить' : 'нажмите для фильтра'}</div>
            </div>
          </div>

          <div className={`inv-soon-card${statusFilter === 'soon' ? ' active-filter' : ''}`}
            onClick={() => setStatusFilter(f => f === 'soon' ? null : 'soon')}>
            <div className="inv-soon-val">{soonItems.length}</div>
            <div className="inv-soon-lbl">заканчиваются скоро</div>
            <div className="inv-soon-hint">{statusFilter === 'soon' ? 'нажмите чтобы сбросить' : 'нажмите для фильтра'}</div>
          </div>

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
        </div>

        {statusFilter && (
          <div className="inv-filter-active">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>Фильтр: {statusFilter === 'urgent' ? 'Срочно' : 'Скоро'}</span>
            <button className="inv-filter-clear" onClick={() => setStatusFilter(null)}>
              <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Сбросить
            </button>
          </div>
        )}

        {/* Groups */}
        <div className="inv-groups">
          {visibleGroups.map(group => {
            const groupItems = items.filter(i => i.groupId === group.id)
            const displayItems = statusFilter
              ? groupItems.filter(i => infoMap[i.id]?.filterStatus === statusFilter)
              : groupItems
            const hasUrgent = displayItems.some(i => infoMap[i.id]?.filterStatus === 'urgent')

            return (
              <div key={group.id} className="inv-section-card">
                <div className="inv-cat-header">
                  <div className="inv-cat-bar" style={{ background: group.color }} />
                  <div className="inv-cat-name">{group.name}</div>
                  {hasUrgent && <span className="inv-cat-urgent">Срочно</span>}
                  <span className="inv-cat-count">{groupItems.length} поз.</span>
                </div>

                <div className="inv-section-items">
                  {displayItems.map(item => (
                    <InventoryItem
                      key={item.id}
                      item={item}
                      open={openItem === item.id}
                      onToggle={() => setOpenItem(prev => prev === item.id ? null : item.id)}
                      override={overrides[item.id] ?? null}
                      onOverrideChange={v => setOverrides(prev => ({ ...prev, [item.id]: v }))}
                      editMode={editMode}
                      onDelete={() => setDeleteConfirm({ id: item.id, name: item.name, set: item.set })}
                      onUnlink={() => setUnlinkConfirm({ id: item.id, name: item.name, set: item.set })}
                      onLinkSet={() => setLinkToSetItem(item.id)}
                      onLaunch={() => doLaunch(item.id)}
                    />
                  ))}

                  {displayItems.length === 0 && (
                    <div className="inv-group-empty">
                      {editMode ? 'Нет позиций — добавьте первую' : 'Нет позиций с таким статусом'}
                    </div>
                  )}
                </div>

                {editMode && (
                  addFormGroup === group.id
                    ? <AddItemForm groupId={group.id} groupSetCategories={group.setCategories} onAdd={doAddItem} onCancel={() => setAddFormGroup(null)} />
                    : (
                      <button className="inv-add-toggle" onClick={() => {
                        setAddFormGroup(group.id)
                      }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Добавить позицию
                      </button>
                    )
                )}
              </div>
            )
          })}

          {!editMode && visibleGroups.length === 0 && statusFilter && (
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
          ? catalogSets.filter(s => linkGroup.setCategories.includes(s.category))
          : catalogSets
        return (
        <div className="inv-modal-overlay" onClick={() => setLinkToSetItem(null)}>
          <div className="inv-modal" onClick={e => e.stopPropagation()}>
            <div className="inv-modal-title">Привязать к набору</div>
            <div className="inv-set-picker-list">
              {pickerSets.map(s => (
                <button key={s.id} className="inv-set-picker-item" onClick={() => doLinkSet(linkToSetItem, s)}>
                  <div className="inv-set-picker-dot" style={{ background: s.color }} />
                  <div className="inv-set-picker-name">{s.title}</div>
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
    </Layout>
  )
}
