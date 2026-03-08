import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

function InventoryItem({ item, open, onToggle }) {
  return (
    <div className={`inv-item status-${item.status}${open ? ' open' : ''}`}>
      <div className="inv-item-main" onClick={onToggle}>
        <Ring val={item.ringVal} max={item.ringMax} unit={item.ringUnit} status={item.status} />
        <div className="inv-info">
          <div className="inv-name">{item.name}</div>
          <div className={`inv-remainder${item.status === 'urgent' ? ' urgent' : item.status === 'soon' ? ' soon' : item.status === 'overexploit' ? ' overexploit' : ''}`}>
            {item.remainder}
          </div>
          <div className="inv-date">{item.date}</div>
        </div>
        <div className="inv-item-right">
          <div className="inv-amount-val">{item.amount.toLocaleString('ru')} ₽</div>
          <div className="inv-amount-lbl">{item.amountLabel}</div>
        </div>
        <svg className={`inv-chevron${open ? ' open' : ''}`} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {open && (
        <div className="inv-inline-form">
          <div className="inv-form-row">
            <div className="inv-form-field">
              <label className="inv-form-label">Название</label>
              <input className="inv-input" defaultValue={item.name} />
            </div>
            <div className="inv-form-field">
              <label className="inv-form-label">Стоимость, ₽</label>
              <input className="inv-input" type="number" defaultValue={item.amount} />
            </div>
          </div>
          <div className="inv-form-row">
            <div className="inv-form-field">
              <label className="inv-form-label">Тип</label>
              <select className="inv-input" defaultValue={item.type}>
                <option value="wear">Износ</option>
                <option value="consumable">Расходник</option>
              </select>
            </div>
            <div className="inv-form-field">
              <label className="inv-form-label">{item.type === 'consumable' ? 'Запас (дн.)' : 'Ресурс (%)'}</label>
              <input className="inv-input" type="number" defaultValue={item.ringVal} />
            </div>
          </div>
          <div className="inv-form-actions">
            <button className="inv-btn-save" onClick={onToggle}>Сохранить</button>
            <button className="inv-btn-cancel" onClick={onToggle}>Отмена</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Inventory() {
  const navigate = useNavigate()
  const [openItem, setOpenItem] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)

  const allItems = inventoryGroups.flatMap(g => g.items)
  const urgentItems = allItems.filter(i => i.status === 'urgent')
  const soonItems = allItems.filter(i => i.status === 'soon')
  const totalValue = allItems.reduce((s, i) => s + i.amount, 0)

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
            <div className="page-subtitle">Отслеживайте состояние вещей и расходников</div>
          </div>
          <button className="btn-primary-action" onClick={() => navigate('/catalog')}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Добавить
          </button>
        </div>

        <div className="inv-summary-row">
          <div className="inv-value-card">
            <div className="inv-value-lbl">Общая стоимость</div>
            <div className="inv-value-val">{totalValue.toLocaleString('ru')} ₽</div>
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
          </div>

          <div
            className={`inv-soon-card${statusFilter === 'soon' ? ' active-filter' : ''}`}
            onClick={() => setStatusFilter(f => f === 'soon' ? null : 'soon')}
          >
            <div className="inv-soon-lbl">Скоро</div>
            <div className="inv-soon-val">{soonItems.length}</div>
            <div className="inv-soon-hint">позиций заканчивается</div>
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
                  />
                ))}
              </div>
            </div>
          ))}

          {filteredGroups.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <div className="empty-title">Нет позиций с таким статусом</div>
              <button className="btn-sm" style={{ marginTop: 8 }} onClick={() => setStatusFilter(null)}>Показать все</button>
            </div>
          )}
        </div>
      </main>
    </Layout>
  )
}
