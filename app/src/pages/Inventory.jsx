import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { inventoryGroups } from '../data/mock'

function Ring({ val, max, unit, status }) {
  const r = 17
  const circ = 2 * Math.PI * r
  const pct = Math.min(1, val / max)
  const dash = pct * circ
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
        <span className="ring-num">{val}</span>
        <span className="ring-unit">{unit}</span>
      </div>
    </div>
  )
}

function Stepper({ value, unit, onChange }) {
  return (
    <div className="inv-stepper">
      <button className="stepper-btn" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
      <input
        className="stepper-val"
        type="number"
        value={value}
        onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
      />
      <span className="stepper-unit">{unit}</span>
      <button className="stepper-btn" onClick={() => onChange(value + 1)}>+</button>
    </div>
  )
}

function InventoryItem({ item, open, onToggle, stepVal, onStepChange }) {
  const pct = Math.min(1, item.ringVal / item.ringMax)
  const fillCls = item.status === 'urgent' ? 'fill-urgent'
    : item.status === 'soon' ? 'fill-soon'
    : item.status === 'overexploit' ? 'fill-overexploit'
    : 'fill-ok'
  const remCls = item.status === 'urgent' ? ' urgent'
    : item.status === 'soon' ? ' soon'
    : item.status === 'overexploit' ? ' overexploit'
    : ''

  return (
    <div className={`inv-item status-${item.status}${open ? ' open' : ''}`}>
      <div className="inv-item-main" onClick={onToggle}>
        <Ring val={item.ringVal} max={item.ringMax} unit={item.ringUnit} status={item.status} />
        <div className="inv-info">
          <div className="inv-name">{item.name}</div>
          <div className={`inv-remainder${remCls}`}>{item.remainder}</div>
          <div className="inv-date">{item.date}</div>
        </div>
        <svg className={`inv-chevron${open ? ' open' : ''}`} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      <div className={`inv-expanded${open ? ' open' : ''}`}>
        {/* Set row */}
        {item.set && (
          <div className="inv-set-row">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Из набора <strong>{item.set}</strong>
            {item.setId && (
              <Link to={`/set/${item.setId}`} className="inv-set-link">
                Открыть →
              </Link>
            )}
          </div>
        )}

        {/* Overexploit monthly block */}
        {item.status === 'overexploit' && (
          <div className="inv-monthly">
            <div className="inv-monthly-header">Ежемесячные расходы</div>
            <div className="inv-monthly-body overexploit">
              <span className="inv-monthly-val overexploit">{item.amount.toLocaleString('ru')} ₽</span>
              <span className="inv-monthly-sub">переэксплуатация — замена необходима</span>
            </div>
          </div>
        )}

        {/* Urgent monthly hint */}
        {item.status === 'urgent' && item.type === 'consumable' && (
          <div className="inv-monthly">
            <div className="inv-monthly-header">Запас</div>
            <div className="inv-monthly-body urgent">
              <span className="inv-monthly-val urgent">{stepVal} {item.ringUnit}</span>
              <span className="inv-monthly-sub">срочно требует пополнения</span>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="inv-progress-wrap">
          <div className="inv-progress-header">
            <span>{item.type === 'consumable' ? 'Осталось запасов' : 'Состояние (ресурс)'}</span>
            <span>{Math.round(pct * 100)}%</span>
          </div>
          <div className="inv-progress-bar">
            <div className={`inv-progress-fill ${fillCls}`} style={{ width: `${pct * 100}%` }} />
          </div>
        </div>

        {/* Body: details + stepper */}
        <div className="inv-body">
          <div className="inv-detail-row">
            <div className="inv-detail">
              <div className="inv-detail-lbl">Стоимость</div>
              <div className="inv-detail-val mono">{item.amount.toLocaleString('ru')} ₽</div>
            </div>
            <div className="inv-detail">
              <div className="inv-detail-lbl">Тип</div>
              <div className="inv-detail-val">{item.type === 'consumable' ? 'Расходник' : 'Износ'}</div>
            </div>
            <div className="inv-detail">
              <div className="inv-detail-lbl">Дата</div>
              <div className="inv-detail-val">{item.date}</div>
            </div>
          </div>
          <div className="inv-stepper-wrap">
            <Stepper value={stepVal} unit={item.ringUnit} onChange={onStepChange} />
            {item.type === 'consumable' ? (
              <button className="btn-replenish" onClick={() => onStepChange(item.ringMax)}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M12 20V4m-7 7l7-7 7 7" /></svg>
                Пополнить
              </button>
            ) : (
              <button className="btn-replenish btn-reset-wear" onClick={() => onStepChange(item.ringMax)}>
                Сбросить износ
              </button>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="inv-action-bar">
          {(item.status === 'urgent' || item.status === 'overexploit') && (
            <button className="inv-act-btn urgent">
              {item.status === 'overexploit' ? 'Заменить' : '🛒 Купить срочно'}
            </button>
          )}
          <button className="inv-act-btn">Изменить</button>
          <button className="inv-act-btn delete">Удалить</button>
        </div>
      </div>
    </div>
  )
}

export default function Inventory() {
  const navigate = useNavigate()
  const [openItem, setOpenItem] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)
  const [stepValues, setStepValues] = useState(() => {
    const map = {}
    inventoryGroups.forEach(g => g.items.forEach(i => { map[i.id] = i.ringVal }))
    return map
  })

  const allItems = inventoryGroups.flatMap(g => g.items)
  const urgentItems = allItems.filter(i => i.status === 'urgent')
  const soonItems = allItems.filter(i => i.status === 'soon')
  const totalValue = allItems.reduce((s, i) => s + i.amount, 0)
  const urgentCost = urgentItems.reduce((s, i) => s + i.amount, 0)

  const filteredGroups = inventoryGroups.map(g => ({
    ...g,
    items: statusFilter ? g.items.filter(i => i.status === statusFilter) : g.items,
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

        {/* Summary row: urgent + soon on top, value card full-width below */}
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
            <div className="inv-urgent-lbl">Срочно</div>
            <div className="inv-urgent-hint">нужна замена прямо сейчас</div>
            {urgentCost > 0 && <div className="inv-urgent-cost">{urgentCost.toLocaleString('ru')} ₽</div>}
          </div>

          <div
            className={`inv-soon-card${statusFilter === 'soon' ? ' active-filter' : ''}`}
            onClick={() => setStatusFilter(f => f === 'soon' ? null : 'soon')}
          >
            <div className="inv-soon-lbl">Скоро заканчивается</div>
            <div className="inv-soon-val">{soonItems.length}</div>
            <div className="inv-soon-hint">позиций</div>
          </div>

          <div className="inv-value-card">
            <div className="inv-value-main">
              <div className="inv-value-lbl">Общая стоимость</div>
              <div className="inv-value-val">{totalValue.toLocaleString('ru')} ₽</div>
            </div>
            <div className="inv-value-breakdown">
              <div className="inv-value-item">
                <span className="inv-value-item-val">{allItems.length}</span>
                <span className="inv-value-item-lbl">позиций</span>
              </div>
              <div className="inv-value-item">
                <span className="inv-value-item-val">{inventoryGroups.length}</span>
                <span className="inv-value-item-lbl">категорий</span>
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
                {group.items.some(i => i.status === 'urgent') && (
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
                    stepVal={stepValues[item.id] ?? item.ringVal}
                    onStepChange={v => setStepValues(prev => ({ ...prev, [item.id]: v }))}
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
