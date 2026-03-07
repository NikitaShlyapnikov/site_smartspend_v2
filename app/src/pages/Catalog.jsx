import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { catalogSets } from '../data/mock'

const CATEGORIES = [
  { id: 'all', label: 'Все', count: 6 },
  { id: 'clothes', label: 'Одежда', count: 1 },
  { id: 'food', label: 'Еда', count: 1 },
  { id: 'home', label: 'Дом', count: 1 },
  { id: 'transport', label: 'Транспорт', count: 1 },
  { id: 'health', label: 'Здоровье', count: 1 },
  { id: 'leisure', label: 'Досуг', count: 1 },
]

export default function Catalog() {
  const navigate = useNavigate()
  const [cat, setCat] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  const filtered = catalogSets.filter(s => {
    if (cat !== 'all' && s.category !== cat) return false
    if (typeFilter !== 'all' && s.type !== typeFilter) return false
    if (sourceFilter !== 'all' && s.source !== sourceFilter) return false
    return true
  })

  return (
    <Layout>
      <main className="catalog-main">
        <div className="catalog-page-header">
          <div>
            <div className="page-title">Каталог наборов</div>
            <div className="page-subtitle">Готовые списки вещей от SmartSpend и сообщества</div>
          </div>
          <button className="btn-create" onClick={() => navigate('/create-set')}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Создать набор
          </button>
        </div>

        <div className="filters-block">
          <div className="cats-scroll">
            {CATEGORIES.map(c => (
              <button key={c.id} className={`cat-btn${cat === c.id ? ' active' : ''}`} onClick={() => setCat(c.id)}>
                {c.label}
                <span className="cat-count">{c.count}</span>
              </button>
            ))}
          </div>
          <div className="filters-row2">
            <div className="seg-ctrl">
              {[['all', 'Все типы'], ['base', 'Базовый'], ['extra', 'Расширенный']].map(([id, label]) => (
                <button key={id} className={`seg-btn${typeFilter === id ? ' active' : ''}`} onClick={() => setTypeFilter(id)}>{label}</button>
              ))}
            </div>
            <div className="seg-ctrl">
              {[['all', 'Все'], ['ss', 'SmartSpend'], ['community', 'Сообщество'], ['own', 'Мои']].map(([id, label]) => (
                <button key={id} className={`seg-btn${sourceFilter === id ? ' active' : ''}`} onClick={() => setSourceFilter(id)}>{label}</button>
              ))}
            </div>
            <span className="filters-spacer" />
            <span className="results-count">{filtered.length} наборов</span>
          </div>
        </div>

        <div className="catalog-grid">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-title">Наборы не найдены</div>
              <div className="empty-state-desc">Попробуйте изменить фильтры или создайте свой набор</div>
            </div>
          ) : filtered.map(set => (
            <div key={set.id} className="catalog-card" onClick={() => navigate(`/set/${set.id}`)}>
              <div className="card-accent-bar" style={{ background: set.color }} />
              <div className="card-body">
                <div className="card-badges">
                  <span className={`source-badge ${set.source}`}>
                    {set.source === 'ss' ? 'SmartSpend' : set.source === 'community' ? 'Сообщество' : 'Моё'}
                  </span>
                  <span className={set.type === 'base' ? 'base-badge' : 'extra-badge'}>
                    {set.type === 'base' ? 'Базовый' : 'Расширенный'}
                  </span>
                </div>
                <div className="card-title">{set.title}</div>
                <div className="card-desc">{set.desc}</div>
                <div className="card-items">
                  {set.items.slice(0, 4).map((t, i) => <span key={i} className="card-item-tag">{t}</span>)}
                  {set.items.length > 4 && <span className="card-item-more">+{set.items.length - 4}</span>}
                </div>
              </div>
              <div className="card-footer">
                <div className="card-amount-left">
                  <div className="card-amount">{set.amount.toLocaleString('ru')} ₽</div>
                  <div className="card-amount-label">{set.amountLabel}</div>
                </div>
                <div className="card-meta-right">
                  {set.private ? (
                    <div className="private-label">
                      <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      Приватный
                    </div>
                  ) : (
                    <div className="users-count">
                      <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                      {set.users.toLocaleString('ru')}
                    </div>
                  )}
                  <div className="card-date">{set.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  )
}
