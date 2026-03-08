import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { inventoryGroups } from '../data/mock'

// ── HELPERS ──────────────────────────────────────────────────────────────────

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

function Ring({ pct, ringNum, ringUnit, status }) {
  const r = 17
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const cls = status === 'urgent' ? 'ring-urgent'
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

function InventoryItem({ item, open, onToggle, override, onOverrideChange }) {
  const info = getItemInfo(item, override)
  const { pct, status, remainderText, ringNum, ringUnit, monthlyBlock } = info
  const unit = item.type === 'consumable' ? (item.unit || 'г') : 'нед'
  const remCls = status !== 'ok' ? ` ${status}` : ''

  const fillCls = status === 'urgent' ? 'fill-urgent'
    : status === 'soon' ? 'fill-soon'
    : status === 'overexploit' ? 'fill-overexploit'
    : 'fill-ok'

  // Type-specific details
  let details = null
  if (item.type === 'consumable') {
    const monthlyQty = Math.round(item.dailyUse * 30)
    const monthlyBudget = Math.round((item.price / item.qty) * monthlyQty)
    const pricePerUnit = (item.price / item.qty).toFixed(2)
    details = (
      <>
        <div className="inv-detail">
          <div className="inv-detail-lbl">Расход/день</div>
          <div className="inv-detail-val mono">{item.dailyUse}&thinsp;{unit}</div>
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

  // Current stepper value for consumable
  const stepperVal = override !== null
    ? (item.type === 'consumable' ? Math.max(0, Math.round(override)) : override)
    : (item.type === 'consumable'
        ? Math.max(0, Math.round(item.qty - daysSince(item.lastBought) * item.dailyUse))
        : item.purchaseDate)

  return (
    <div className={`inv-item status-${status}${open ? ' open' : ''}`}>
      <div className="inv-item-main" onClick={onToggle}>
        <Ring pct={pct} ringNum={ringNum} ringUnit={ringUnit} status={status} />
        <div className="inv-info">
          <div className="inv-name">{item.name}</div>
          <div className={`inv-remainder${remCls}`}>{remainderText}</div>
        </div>
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

        {/* Progress bar */}
        {open && (
          <div className="inv-progress-wrap">
            <div className="inv-progress-header">
              <span>{item.type === 'consumable' ? 'Израсходовано' : 'Износ'}</span>
              <span>{pct}%</span>
            </div>
            <div className="inv-progress-bar">
              <div className={`inv-progress-fill ${fillCls}`} style={{ width: `${pct}%` }} />
            </div>
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
                      onClick={() => onOverrideChange(Math.max(0, stepperVal - 1))}>−</button>
                    <input
                      className="stepper-val"
                      type="number"
                      value={stepperVal}
                      onChange={e => onOverrideChange(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                    <span className="stepper-unit">{unit}</span>
                    <button className="stepper-btn"
                      onClick={() => onOverrideChange(stepperVal + 1)}>+</button>
                  </div>
                  <button className="btn-replenish"
                    onClick={() => onOverrideChange(item.qty)}>
                    <svg width="13" height="13" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24" strokeWidth="2.5"><path d="M12 20V4m-7 7l7-7 7 7" /></svg>
                    Пополнить
                  </button>
                </>
              ) : (
                <>
                  <div className="inv-field-lbl">Дата покупки</div>
                  <input
                    className="inv-date-input"
                    type="date"
                    value={typeof stepperVal === 'string' ? stepperVal : item.purchaseDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={e => onOverrideChange(e.target.value)}
                  />
                  <button className="btn-replenish btn-reset-wear"
                    onClick={() => onOverrideChange(new Date().toISOString().slice(0, 10))}>
                    Сбросить износ
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Set row — bottom */}
        {open && item.set && (
          <div className="inv-set-row">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              strokeWidth="2" style={{ opacity: 0.4, flexShrink: 0 }}>
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Набор:</span>
            {item.setId ? (
              <Link to={`/set/${item.setId}`} className="inv-set-link"
                onClick={e => e.stopPropagation()}>
                {item.set}
                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </Link>
            ) : (
              <strong>{item.set}</strong>
            )}
          </div>
        )}

        {/* Action bar */}
        {open && (
          <div className="inv-action-bar">
            {(status === 'urgent' || status === 'overexploit') && (
              <button className="inv-act-btn urgent">
                {status === 'overexploit' ? 'Заменить' : '🛒 Купить срочно'}
              </button>
            )}
            <button className="inv-act-btn">Изменить</button>
            <button className="inv-act-btn delete">Удалить</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function Inventory() {
  const navigate = useNavigate()
  const [openItem, setOpenItem] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)
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

  const allItems = inventoryGroups.flatMap(g => g.items)

  // Compute info for all items
  const infoMap = {}
  allItems.forEach(item => { infoMap[item.id] = getItemInfo(item, overrides[item.id] ?? null) })

  const urgentItems = allItems.filter(i => infoMap[i.id].filterStatus === 'urgent')
  const soonItems = allItems.filter(i => infoMap[i.id].filterStatus === 'soon')
  const urgentCost = urgentItems.reduce((s, i) => {
    if (i.type === 'consumable') {
      const mb = infoMap[i.id].monthlyBlock
      return s + (mb?.type === 'deficit' ? mb.deficitRub : 0)
    }
    return s + i.price
  }, 0)

  // Inventory value: consumable (current stock value) + wear (residual value)
  const consumableVal = allItems
    .filter(i => i.type === 'consumable')
    .reduce((s, item) => {
      const ov = overrides[item.id]
      const remaining = ov !== null ? Math.max(0, ov) : Math.max(0, item.qty - daysSince(item.lastBought) * item.dailyUse)
      return s + (item.qty > 0 ? (remaining / item.qty) * item.price : 0)
    }, 0)
  const wearVal = allItems
    .filter(i => i.type === 'wear')
    .reduce((s, item) => {
      const purchaseDate = overrides[item.id] ?? item.purchaseDate
      const weeksUsed = Math.floor(daysSince(purchaseDate) / 7)
      return s + Math.max(0, Math.round(item.price * (1 - weeksUsed / item.wearLifeWeeks)))
    }, 0)
  const totalValue = Math.round(consumableVal + wearVal)

  const filteredGroups = inventoryGroups.map(g => ({
    ...g,
    items: statusFilter ? g.items.filter(i => infoMap[i.id].filterStatus === statusFilter) : g.items,
  })).filter(g => g.items.length > 0)

  return (
    <Layout>
      <main className="inventory-main">
        <div className="inv-page-header">
          <div>
            <div className="page-title">Инвентарь</div>
            <div className="page-subtitle">{allItems.length} позиций</div>
          </div>
          <button className="btn-primary-action" onClick={() => navigate('/catalog')}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Добавить
          </button>
        </div>

        {/* Summary row */}
        <div className="inv-summary-row">
          <div
            className={`inv-urgent-card${statusFilter === 'urgent' ? ' active-filter' : ''}`}
            onClick={() => setStatusFilter(f => f === 'urgent' ? null : 'urgent')}
          >
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

          <div
            className={`inv-soon-card${statusFilter === 'soon' ? ' active-filter' : ''}`}
            onClick={() => setStatusFilter(f => f === 'soon' ? null : 'soon')}
          >
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

        <div className="inv-groups">
          {filteredGroups.map(group => (
            <div key={group.id} className="inv-section-card">
              <div className="inv-cat-header">
                <div className="inv-cat-bar" style={{ background: group.color }} />
                <div className="inv-cat-name">{group.name}</div>
                {group.items.some(i => infoMap[i.id].filterStatus === 'urgent') && (
                  <span className="inv-cat-urgent">Срочно</span>
                )}
                <span className="inv-cat-count">{group.items.length} поз.</span>
              </div>
              <div className="inv-section-items">
                {group.items.map(item => (
                  <InventoryItem
                    key={item.id}
                    item={item}
                    open={openItem === item.id}
                    onToggle={() => setOpenItem(prev => prev === item.id ? null : item.id)}
                    override={overrides[item.id] ?? null}
                    onOverrideChange={v => setOverrides(prev => ({ ...prev, [item.id]: v }))}
                  />
                ))}
              </div>
            </div>
          ))}

          {filteredGroups.length === 0 && (
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
    </Layout>
  )
}
