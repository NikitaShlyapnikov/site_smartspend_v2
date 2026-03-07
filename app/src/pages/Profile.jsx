import Layout from '../components/Layout'
import { useApp } from '../context/AppContext'
import { userData } from '../data/mock'

export default function Profile() {
  const { username } = useApp()
  const initials = username.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <Layout>
      <main className="profile-main">
        <div className="profile-capital-card">
          <div>
            <div className="profile-avatar">{initials}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="profile-name">{username}</div>
            <div className="profile-plan">{userData.plan}</div>
            <div className="profile-capital">{userData.capital.toLocaleString('ru')} ₽</div>
            <div className="profile-capital-label">общий капитал</div>
            <div className="profile-stats">
              <div className="profile-stat-item">
                <div className="profile-stat-value">{userData.stats.sets}</div>
                <div className="profile-stat-label">наборов</div>
              </div>
              <div className="profile-stat-item">
                <div className="profile-stat-value">{userData.stats.articles}</div>
                <div className="profile-stat-label">статей</div>
              </div>
              <div className="profile-stat-item">
                <div className="profile-stat-value">{userData.stats.followers}</div>
                <div className="profile-stat-label">подписчиков</div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-title">Бюджетные конверты</div>
          <div className="budget-envelopes" style={{ padding: '12px 20px 20px' }}>
            {userData.budgets.map((b, i) => (
              <div key={i} className="envelope-card">
                <div className="envelope-name">{b.name}</div>
                <div className="envelope-amount">{b.spent.toLocaleString('ru')} ₽</div>
                <div className="envelope-limit">из {b.limit.toLocaleString('ru')} ₽</div>
                <div className="envelope-bar">
                  <div className="envelope-bar-fill" style={{ width: `${Math.min(100, (b.spent / b.limit) * 100)}%`, background: b.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-title">Достижения</div>
          <div className="achievements-grid">
            {userData.achievements.map(a => (
              <div key={a.id} className={`achievement-item${a.earned ? '' : ' achievement-locked'}`}>
                <div className={`achievement-icon${a.earned ? ' earned' : ''}`}>{a.icon}</div>
                <div className="achievement-name">{a.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-title">Информация</div>
          {[
            ['Имя', username],
            ['Тарифный план', 'Базовый'],
            ['Дата регистрации', 'янв 2025'],
            ['Наборов в инвентаре', '6'],
          ].map(([label, value]) => (
            <div key={label} className="profile-row">
              <div className="profile-row-label">{label}</div>
              <div className="profile-row-value">{value}</div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  )
}
