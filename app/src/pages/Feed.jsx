import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { feedItems } from '../data/mock'

const TABS = [
  { id: 'all', label: 'Все' },
  { id: 'sets', label: 'Наборы' },
  { id: 'articles', label: 'Статьи' },
]

const CATEGORIES = [
  { id: 'all', label: 'Все' },
  { id: 'food', label: 'Еда и продукты' },
  { id: 'clothes', label: 'Одежда' },
  { id: 'home', label: 'Дом и техника' },
  { id: 'health', label: 'Здоровье и уход' },
  { id: 'transport', label: 'Авто и транспорт' },
  { id: 'leisure', label: 'Досуг и подписки' },
]

function SetCard({ item, onClick }) {
  return (
    <div className="card" onClick={() => onClick(item)}>
      <div className="set-accent" style={{ background: item.color }} />
      <div className="set-body">
        <div className="set-top">
          <div className="set-left">
            <div className="set-badges">
              <span className={`source-badge ${item.source}`}>{item.source === 'ss' ? 'SmartSpend' : item.source === 'community' ? 'Сообщество' : 'Моё'}</span>
              <span className={`${item.badge === 'base' ? 'base-badge' : 'extra-badge'}`}>{item.badge === 'base' ? 'Базовый' : 'Расширенный'}</span>
            </div>
            <div className="set-title">{item.title}</div>
            <div className="set-desc">{item.desc}</div>
          </div>
          <div className="set-amount-block">
            <div className="set-amount">{item.amount.toLocaleString('ru')} ₽</div>
            <div className="set-amount-label">{item.amountLabel}</div>
          </div>
        </div>
        <div className="set-items">
          {item.items.slice(0, 5).map((t, i) => <span key={i} className="set-item-tag">{t}</span>)}
          {item.items.length > 5 && <span className="set-item-more">+{item.items.length - 5}</span>}
        </div>
      </div>
      <div className="set-footer">
        <span className="meta-item">
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          {item.views.toLocaleString('ru')}
        </span>
        <span className="meta-item">
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
          {item.saves}
        </span>
        <span className="meta-time" style={{ marginLeft: 'auto' }}>{item.time}</span>
      </div>
    </div>
  )
}

function ArticleCard({ item, onClick }) {
  const [liked, setLiked] = useState(false)
  return (
    <div className="card" onClick={() => onClick(item)}>
      <div className="article-body">
        <div className="article-header">
          <div className="article-header-top">
            <div className="author-avatar-sm" style={{ background: item.authorColor }}>{item.authorInitials}</div>
            <span className="author-name-inline">{item.author}</span>
            <span className="article-time-chip">{item.time}</span>
          </div>
          <div className="article-title">{item.title}</div>
        </div>
        <div className="article-preview">{item.preview}</div>
        {item.setLink && (
          <div className="set-link">
            <div className="set-dot" style={{ background: item.setLink.color }} />
            <span className="set-link-label">Набор: {item.setLink.title}</span>
          </div>
        )}
      </div>
      <div className="article-footer">
        <span className="a-stat">
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          {item.views.toLocaleString('ru')}
        </span>
        <span className="a-stat">
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {item.readTime}
        </span>
        <span className="f-spacer" />
        <button
          className={`liked-btn${liked ? ' liked' : ''}`}
          onClick={e => { e.stopPropagation(); setLiked(l => !l) }}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {item.likes + (liked ? 1 : 0)}
        </button>
      </div>
    </div>
  )
}

export default function Feed() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [cat, setCat] = useState('all')

  const filtered = feedItems.filter(item => {
    if (tab === 'sets' && item.type !== 'set') return false
    if (tab === 'articles' && item.type !== 'article') return false
    if (cat !== 'all' && item.category !== cat) return false
    return true
  })

  function handleItemClick(item) {
    if (item.type === 'set') navigate(`/set/${item.id}`)
    else navigate(`/article/${item.id}`)
  }

  return (
    <Layout>
      <main className="feed-main">
        <div className="page-header">
          <div className="page-title">Лента</div>
          <div className="page-subtitle">Новые наборы и статьи от авторов</div>
        </div>

        <div className="filters-sticky">
          <div className="filters-block">
            <div className="filters-row1">
              <div className="tab-group">
                {TABS.map(t => (
                  <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="cats-scroll">
              {CATEGORIES.map(c => (
                <button key={c.id} className={`cat-pill${cat === c.id ? ' active' : ''}`} onClick={() => setCat(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="feed-scroll">
          <div className="feed-list">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <div className="empty-title">Ничего не найдено</div>
                <div className="empty-desc">Попробуйте изменить фильтры</div>
              </div>
            ) : filtered.map(item =>
              item.type === 'set'
                ? <SetCard key={item.id} item={item} onClick={handleItemClick} />
                : <ArticleCard key={item.id} item={item} onClick={handleItemClick} />
            )}
          </div>
        </div>
      </main>
    </Layout>
  )
}
