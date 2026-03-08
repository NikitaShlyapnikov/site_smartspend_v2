import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { setDetails, catalogSets } from '../data/mock'

export default function SetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [addedToInventory, setAddedToInventory] = useState(false)

  const set = setDetails[id] || catalogSets.find(s => s.id === id)

  if (!set) {
    return (
      <Layout>
        <main className="set-detail-main">
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">Набор не найден</div>
            <button className="btn-sm" style={{ marginTop: 8 }} onClick={() => navigate('/catalog')}>← Каталог</button>
          </div>
        </main>
      </Layout>
    )
  }

  const items = set.items || []
  const hasDetailItems = items.length > 0 && typeof items[0] === 'object'
  const totalAmount = hasDetailItems
    ? items.reduce((s, i) => s + (i.amount || 0), 0)
    : set.amount

  return (
    <Layout>
      <main className="set-detail-main">
        {/* Хлебные крошки */}
        <div className="breadcrumb">
          <span className="breadcrumb-item" onClick={() => navigate('/catalog')}>Каталог</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="breadcrumb-item breadcrumb-current">{set.title}</span>
        </div>

        {/* Герой */}
        <div className="sd-hero">
          <div className="sd-hero-bar" style={{ background: set.color }} />
          <div className="sd-hero-body">
            <div className="sd-hero-badges">
              <span className={`source-badge ${set.source}`}>
                {set.source === 'ss' ? 'SmartSpend' : set.source === 'community' ? 'Сообщество' : 'Моё'}
              </span>
              <span className={set.type === 'base' ? 'base-badge' : 'extra-badge'}>
                {set.type === 'base' ? 'Базовый' : 'Расширенный'}
              </span>
              {set.category && <span className="cat-badge">{set.category}</span>}
            </div>
            <h1 className="sd-title">{set.title}</h1>
            <p className="sd-desc">{set.desc}</p>

            <div className="sd-meta-row">
              <div className="sd-meta-item">
                <div className="sd-meta-label">Стоимость</div>
                <div className="sd-meta-val">{totalAmount?.toLocaleString('ru')} ₽</div>
                {set.amountLabel && <div className="sd-meta-hint">{set.amountLabel}</div>}
              </div>
              {set.users !== undefined && (
                <div className="sd-meta-item">
                  <div className="sd-meta-label">Используют</div>
                  <div className="sd-meta-val">{set.users?.toLocaleString('ru')}</div>
                  <div className="sd-meta-hint">пользователей</div>
                </div>
              )}
              {set.articles !== undefined && (
                <div className="sd-meta-item">
                  <div className="sd-meta-label">Статей</div>
                  <div className="sd-meta-val">{set.articles}</div>
                  <div className="sd-meta-hint">в ленте</div>
                </div>
              )}
              {set.date && (
                <div className="sd-meta-item">
                  <div className="sd-meta-label">Добавлен</div>
                  <div className="sd-meta-val">{set.date}</div>
                </div>
              )}
            </div>

            <div className="sd-actions">
              <button
                className={`sd-btn-primary${addedToInventory ? ' added' : ''}`}
                onClick={() => { setAddedToInventory(true); setTimeout(() => navigate('/inventory'), 600) }}
              >
                {addedToInventory ? (
                  <>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    Добавлено
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    В инвентарь
                  </>
                )}
              </button>
              <button
                className={`sd-btn-secondary${saved ? ' saved' : ''}`}
                onClick={() => setSaved(s => !s)}
              >
                <svg width="14" height="14" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                </svg>
                {saved ? 'Сохранено' : 'Сохранить'}
              </button>
              <button className="sd-btn-ghost" onClick={() => navigate(`/create-set`)}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Адаптировать
              </button>
            </div>
          </div>
        </div>

        {/* Состав набора */}
        <div className="sd-items-card">
          <div className="sd-items-header">
            <div className="sd-items-title">Состав набора</div>
            <span className="sd-items-count">{items.length} позиций</span>
          </div>
          <div className="sd-items-list">
            {hasDetailItems ? items.map(item => (
              <div key={item.id} className="sd-item-row">
                <div className="sd-item-left">
                  <div className="sd-item-name">{item.name}</div>
                  {item.desc && <div className="sd-item-desc">{item.desc}</div>}
                </div>
                <div className="sd-item-right">
                  <div className="sd-item-amount">{item.amount?.toLocaleString('ru')} ₽</div>
                  {item.period && <div className="sd-item-period">{item.period}</div>}
                </div>
              </div>
            )) : items.map((name, i) => (
              <div key={i} className="sd-item-row">
                <div className="sd-item-name">{name}</div>
              </div>
            ))}
          </div>
          {hasDetailItems && (
            <div className="sd-items-total">
              <div className="sd-items-total-label">Итого</div>
              <div className="sd-items-total-val">{totalAmount?.toLocaleString('ru')} ₽</div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  )
}
