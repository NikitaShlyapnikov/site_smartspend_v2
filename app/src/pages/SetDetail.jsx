import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { setDetails, catalogSets } from '../data/mock'

export default function SetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const set = setDetails[id] || catalogSets.find(s => s.id === id)

  if (!set) {
    return (
      <Layout>
        <main className="set-detail-main">
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">Набор не найден</div>
            <button className="btn-cancel" onClick={() => navigate('/catalog')}>← Каталог</button>
          </div>
        </main>
      </Layout>
    )
  }

  const items = set.items || []
  const hasDetailItems = Array.isArray(items) && items.length > 0 && typeof items[0] === 'object'

  return (
    <Layout>
      <main className="set-detail-main">
        <div className="set-detail-header">
          <div className="set-detail-accent" style={{ background: set.color }} />
          <div className="set-detail-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <span className={`source-badge ${set.source}`}>
                {set.source === 'ss' ? 'SmartSpend' : set.source === 'community' ? 'Сообщество' : 'Моё'}
              </span>
              <span className={set.type === 'base' ? 'base-badge' : 'extra-badge'}>
                {set.type === 'base' ? 'Базовый' : 'Расширенный'}
              </span>
            </div>
            <div className="set-detail-title">{set.title}</div>
            <div className="set-detail-desc">{set.desc}</div>
            <div className="set-detail-meta">
              <div className="set-detail-meta-item">
                <div className="set-detail-meta-label">Стоимость</div>
                <div className="set-detail-meta-value">{set.amount?.toLocaleString('ru')} ₽</div>
              </div>
              {set.users !== undefined && (
                <div className="set-detail-meta-item">
                  <div className="set-detail-meta-label">Пользователей</div>
                  <div className="set-detail-meta-value">{set.users?.toLocaleString('ru')}</div>
                </div>
              )}
              {set.date && (
                <div className="set-detail-meta-item">
                  <div className="set-detail-meta-label">Добавлен</div>
                  <div className="set-detail-meta-value">{set.date}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="set-items-list">
          <div className="set-items-list-title">Состав набора</div>
          {hasDetailItems ? (
            items.map(item => (
              <div key={item.id} className="set-item-row">
                <div>
                  <div className="set-item-name">{item.name}</div>
                  {item.desc && <div className="set-item-desc-small">{item.desc}</div>}
                </div>
                <div>
                  <div className="set-item-amount">{item.amount?.toLocaleString('ru')} ₽</div>
                  {item.period && <div className="set-item-period">{item.period}</div>}
                </div>
              </div>
            ))
          ) : (
            items.map((name, i) => (
              <div key={i} className="set-item-row">
                <div className="set-item-name">{name}</div>
              </div>
            ))
          )}
        </div>

        <button className="btn-add-inventory" onClick={() => navigate('/inventory')}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Добавить в инвентарь
        </button>
      </main>
    </Layout>
  )
}
