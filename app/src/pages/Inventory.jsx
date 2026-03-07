import { useState } from 'react'
import Layout from '../components/Layout'
import { inventoryItems } from '../data/mock'

const STATUS_LABELS = { owned: 'Есть', planning: 'Планирую', wishlist: 'Вишлист' }

export default function Inventory() {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? inventoryItems : inventoryItems.filter(i => i.status === filter)

  const total = inventoryItems.filter(i => i.status === 'owned').reduce((s, i) => s + i.amount, 0)
  const planning = inventoryItems.filter(i => i.status === 'planning').reduce((s, i) => s + i.amount, 0)

  return (
    <Layout>
      <main className="inventory-main">
        <div>
          <div className="page-title">Инвентарь</div>
          <div className="page-subtitle">Ваши вещи, планы и желания</div>
        </div>

        <div className="inv-stats">
          <div className="inv-stat-card">
            <div className="inv-stat-label">Всего куплено</div>
            <div className="inv-stat-value">{total.toLocaleString('ru')} ₽</div>
          </div>
          <div className="inv-stat-card">
            <div className="inv-stat-label">Планирую потратить</div>
            <div className="inv-stat-value">{planning.toLocaleString('ru')} ₽</div>
          </div>
          <div className="inv-stat-card">
            <div className="inv-stat-label">Позиций всего</div>
            <div className="inv-stat-value">{inventoryItems.length}</div>
          </div>
        </div>

        <div className="tab-group" style={{ alignSelf: 'flex-start' }}>
          {[['all', 'Все'], ['owned', 'Есть'], ['planning', 'Планирую'], ['wishlist', 'Вишлист']].map(([id, label]) => (
            <button key={id} className={`tab-btn${filter === id ? ' active' : ''}`} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>

        <div className="inventory-grid">
          {filtered.map(item => (
            <div key={item.id} className="inv-card">
              <div className="inv-card-header">
                <div className="inv-card-left">
                  <div className="inv-card-title">{item.title}</div>
                  <div className="inv-card-set">{item.set}</div>
                </div>
                <span className={`inv-status-badge ${item.status}`}>{STATUS_LABELS[item.status]}</span>
              </div>
              <div>
                <div className="inv-amount">{item.amount.toLocaleString('ru')} ₽</div>
                <div className="inv-amount-label">{item.amountLabel}</div>
              </div>
              {item.progress > 0 && item.progress < 100 && (
                <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${item.progress}%`, height: '100%', background: 'var(--accent-green)', borderRadius: 2 }} />
                </div>
              )}
              <div className="inv-card-footer">
                {item.date && <span className="inv-meta">{item.date}</span>}
              </div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  )
}
