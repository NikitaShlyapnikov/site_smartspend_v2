import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useApp } from '../context/AppContext'
import { userData, catalogSets, articles } from '../data/mock'

const TABS = [
  { id: 'overview', label: 'Обзор' },
  { id: 'sets', label: 'Наборы' },
  { id: 'articles', label: 'Статьи' },
  { id: 'achievements', label: 'Достижения' },
]

function BudgetRow({ b }) {
  const pct = Math.min(100, (b.spent / b.limit) * 100)
  const over = b.spent > b.limit
  return (
    <div className="profile-budget-row">
      <div className="profile-budget-left">
        <div className="profile-budget-dot" style={{ background: b.color }} />
        <div className="profile-budget-name">{b.name}</div>
      </div>
      <div className="profile-budget-right">
        <div className="profile-budget-bar">
          <div className="profile-budget-bar-fill" style={{ width: `${pct}%`, background: over ? '#B85555' : b.color }} />
        </div>
        <div className={`profile-budget-vals${over ? ' over' : ''}`}>
          <span className="profile-budget-spent">{b.spent.toLocaleString('ru')} ₽</span>
          <span className="profile-budget-limit">/ {b.limit.toLocaleString('ru')} ₽</span>
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { username } = useApp()
  const [tab, setTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState(userData.bio)

  const initials = username.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const mySets = catalogSets.filter(s => s.source === 'own').concat(catalogSets.slice(0, 2))

  return (
    <Layout>
      <main className="profile-main">
        {/* Шапка профиля */}
        <div className="profile-header-card">
          <div className="profile-header-top">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">{initials}</div>
            </div>
            <div className="profile-header-info">
              <div className="profile-username">{username}</div>
              <div className="profile-nickname">{userData.nickname}</div>
              {editing ? (
                <textarea
                  className="profile-bio-input"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={2}
                  autoFocus
                />
              ) : (
                <div className="profile-bio">{bio}</div>
              )}
              <div className="profile-meta-row">
                <span className="profile-meta-item">
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  с {userData.joined}
                </span>
                <span className="profile-meta-item">
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  {userData.stats.followers} подписчиков
                </span>
              </div>
            </div>
            <div className="profile-header-actions">
              {editing ? (
                <>
                  <button className="btn-sm-green" onClick={() => setEditing(false)}>Сохранить</button>
                  <button className="btn-sm" onClick={() => setEditing(false)}>Отмена</button>
                </>
              ) : (
                <button className="btn-sm" onClick={() => setEditing(true)}>Редактировать</button>
              )}
            </div>
          </div>

          <div className="profile-stats-row">
            <div className="profile-stat">
              <div className="profile-stat-val">{userData.stats.sets}</div>
              <div className="profile-stat-lbl">наборов</div>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat">
              <div className="profile-stat-val">{userData.stats.articles}</div>
              <div className="profile-stat-lbl">статей</div>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat">
              <div className="profile-stat-val">{userData.capital.toLocaleString('ru')} ₽</div>
              <div className="profile-stat-lbl">общий капитал</div>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat">
              <div className="profile-stat-val">{userData.stats.followers}</div>
              <div className="profile-stat-lbl">подписчиков</div>
            </div>
          </div>
        </div>

        {/* Табы */}
        <div className="profile-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`profile-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Обзор */}
        {tab === 'overview' && (
          <div className="profile-tab-content">
            <div className="profile-section-card">
              <div className="profile-section-title">Бюджетные конверты</div>
              <div className="profile-budgets">
                {userData.budgets.map((b, i) => <BudgetRow key={i} b={b} />)}
              </div>
            </div>

            <div className="profile-section-card">
              <div className="profile-section-title">Информация</div>
              {[
                ['Тарифный план', userData.plan],
                ['Дата регистрации', userData.joined],
                ['Наборов в инвентаре', userData.stats.sets],
                ['Опубликовано статей', userData.stats.articles],
              ].map(([label, value]) => (
                <div key={label} className="profile-info-row">
                  <div className="profile-info-label">{label}</div>
                  <div className="profile-info-value">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Наборы */}
        {tab === 'sets' && (
          <div className="profile-tab-content">
            <div className="profile-sets-grid">
              {mySets.map(set => (
                <div key={set.id} className="profile-set-card" onClick={() => navigate(`/set/${set.id}`)}>
                  <div className="profile-set-accent" style={{ background: set.color }} />
                  <div className="profile-set-body">
                    <div className="profile-set-title">{set.title}</div>
                    <div className="profile-set-desc">{set.desc}</div>
                    <div className="profile-set-amount">{set.amount.toLocaleString('ru')} ₽</div>
                  </div>
                </div>
              ))}
              <div className="profile-set-card profile-set-card-add" onClick={() => navigate('/create-set')}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Создать набор</span>
              </div>
            </div>
          </div>
        )}

        {/* Статьи */}
        {tab === 'articles' && (
          <div className="profile-tab-content">
            {articles.map(a => (
              <div key={a.id} className="profile-article-row" onClick={() => navigate(`/article/${a.id}`)}>
                <div className="profile-article-info">
                  <div className="profile-article-title">{a.title}</div>
                  <div className="profile-article-meta">{a.date} · {a.readTime} · {a.views.toLocaleString('ru')} просм.</div>
                </div>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            ))}
            <div className="profile-article-row profile-article-add" onClick={() => navigate('/create-article')}>
              <div className="profile-article-info">
                <div className="profile-article-title" style={{ color: 'var(--accent-green)' }}>+ Написать статью</div>
              </div>
            </div>
          </div>
        )}

        {/* Достижения */}
        {tab === 'achievements' && (
          <div className="profile-tab-content">
            <div className="profile-section-card">
              <div className="profile-section-title">Мои достижения</div>
              <div className="achievements-grid">
                {userData.achievements.map(a => (
                  <div key={a.id} className={`achievement-item${a.earned ? '' : ' achievement-locked'}`}>
                    <div className={`achievement-icon${a.earned ? ' earned' : ''}`}>{a.icon}</div>
                    <div className="achievement-name">{a.name}</div>
                    {!a.earned && <div className="achievement-locked-label">Заблокировано</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </Layout>
  )
}
