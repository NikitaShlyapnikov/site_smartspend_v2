import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { catalogSets } from '../data/mock'

const CATEGORIES = [
  { id: 'all',       label: 'Все' },
  { id: 'food',      label: 'Питание' },
  { id: 'clothes',   label: 'Одежда' },
  { id: 'home',      label: 'Дом' },
  { id: 'health',    label: 'Здоровье' },
  { id: 'transport', label: 'Транспорт' },
  { id: 'leisure',   label: 'Досуг' },
  { id: 'gifts',     label: 'Подарки' },
]

const VALID_CATS = CATEGORIES.map(c => c.id)

function fmtUsers(n) {
  if (n === null || n === undefined) return null
  if (n >= 10000) return Math.round(n / 1000) + 'k'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return String(n)
}

export default function Catalog() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initCat = VALID_CATS.includes(searchParams.get('cat')) ? searchParams.get('cat') : 'all'

  const [cat, setCat]           = useState(initCat)
  const [typeFilter, setType]   = useState('all')
  const [sourceFilter, setSrc]  = useState('all')
  const [sortFilter, setSort]   = useState('popular')

  // Counts per category (across all source/type filters)
  const catCounts = {}
  CATEGORIES.forEach(c => {
    catCounts[c.id] = c.id === 'all'
      ? catalogSets.length
      : catalogSets.filter(s => s.category === c.id).length
  })

  // Filter + sort
  let filtered = catalogSets.filter(s => {
    if (cat !== 'all' && s.category !== cat) return false
    if (typeFilter !== 'all' && s.type !== typeFilter) return false
    if (sourceFilter !== 'all' && s.source !== sourceFilter) return false
    return true
  })

  filtered = [...filtered].sort(
    sortFilter === 'newest'
      ? (a, b) => new Date(b.added) - new Date(a.added)
      : (a, b) => (b.users || 0) - (a.users || 0)
  )

  const fmtDate = iso => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

  return (
    <Layout>
      <main className="catalog-main">
        {/* Header */}
        <div className="catalog-page-header">
          <div>
            <div className="page-title">Каталог наборов</div>
            <div className="page-subtitle">Готовые наборы товаров от SmartSpend и сообщества</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-block">
          {/* Row 1: categories */}
          <div className="cats-scroll">
            {CATEGORIES.map(c => (
              <button key={c.id} className={`cat-btn${cat === c.id ? ' active' : ''}`} onClick={() => setCat(c.id)}>
                {c.label}
                <span className="cat-count">{catCounts[c.id]}</span>
              </button>
            ))}
          </div>

          {/* Row 2: type · source · sort · count */}
          <div className="filters-row2">
            {/* Тип */}
            <div className="seg-ctrl">
              {[['all', 'Все'], ['base', 'Основа'], ['extra', 'Дополнение']].map(([id, label]) => (
                <button key={id} className={`seg-btn${typeFilter === id ? ' active' : ''}`}
                  onClick={() => setType(id)}>{label}</button>
              ))}
            </div>
            {/* Источник */}
            <div className="seg-ctrl">
              {[['all', 'Все источники'], ['ss', 'SmartSpend'], ['community', 'Сообщество'], ['own', 'Мои']].map(([id, label]) => (
                <button key={id} className={`seg-btn${sourceFilter === id ? ' active' : ''}`}
                  onClick={() => setSrc(id)}>{label}</button>
              ))}
            </div>

            <span className="filters-spacer" />

            {/* Сортировка */}
            <span className="sort-label">Сортировка:</span>
            <div className="seg-ctrl">
              {[['popular', 'По популярности'], ['newest', 'Сначала новые']].map(([id, label]) => (
                <button key={id} className={`seg-btn${sortFilter === id ? ' active' : ''}`}
                  onClick={() => setSort(id)}>{label}</button>
              ))}
            </div>

            <span className="results-count">{filtered.length} {noun(filtered.length)}</span>
          </div>
        </div>

        {/* Grid */}
        <div className="catalog-grid">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-title">Наборов не найдено</div>
              <div className="empty-state-desc">Попробуйте изменить фильтры</div>
            </div>
          ) : filtered.map(set => (
            <div key={set.id} className="catalog-card" onClick={() => navigate(`/set/${set.id}`)}>
              <div className="card-accent-bar" style={{ background: set.color }} />
              <div className="card-body">
                <div className="card-badges">
                  <span className={`source-badge ${set.source}`}>
                    {set.source === 'ss' ? 'SmartSpend' : set.source === 'community' ? 'Сообщество' : 'Мой набор'}
                  </span>
                  <span className={set.type === 'base' ? 'base-badge' : 'extra-badge'}>
                    {set.type === 'base' ? 'Основа' : 'Дополнение'}
                  </span>
                </div>
                <div>
                  <div className="card-title">{set.title}</div>
                  <div className="card-desc">{set.desc}</div>
                </div>
                <div className="card-items">
                  {set.items.slice(0, 4).map((t, i) => <span key={i} className="card-item-tag">{t}</span>)}
                  {(set.more > 0 || set.items.length > 4) && (
                    <span className="card-item-more">+{set.more || set.items.length - 4}</span>
                  )}
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
                      <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                      Приватный
                    </div>
                  ) : (
                    <div className="users-count">
                      <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                      {fmtUsers(set.users)}
                    </div>
                  )}
                  {set.articles > 0 && (
                    <div className="articles-count">
                      <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      {set.articles}
                    </div>
                  )}
                  <div className="card-date">{fmtDate(set.added)}</div>
                </div>
              </div>
            </div>
          ))}

          {/* "Мои" hint card */}
          {sourceFilter === 'own' && (
            <div className="my-sets-hint" onClick={() => navigate('/create-set')}>
              <div className="my-sets-hint-icon">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
              <div>
                <div className="my-sets-hint-title">Создать свой набор</div>
                <div className="my-sets-hint-desc">Подберите товары под свои нужды и добавьте в конверт</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  )
}

function noun(n) {
  const m = n % 10, c = n % 100
  if (m === 1 && c !== 11) return 'набор'
  if (m >= 2 && m <= 4 && (c < 10 || c >= 20)) return 'набора'
  return 'наборов'
}
