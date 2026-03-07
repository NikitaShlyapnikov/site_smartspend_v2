import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useApp } from '../context/AppContext'

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle-wrap">
      <input className="toggle-input" type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
    </label>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { dark, toggleTheme } = useApp()
  const [notifs, setNotifs] = useState({ newSets: true, articles: true, reminders: false, weekly: true })

  function logout() {
    localStorage.removeItem('ss_auth')
    navigate('/', { replace: true })
  }

  return (
    <Layout>
      <main className="settings-main">
        <div>
          <div className="page-title">Настройки</div>
          <div className="page-subtitle">Управление приложением и уведомлениями</div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Внешний вид</div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Тёмная тема</div>
              <div className="settings-row-desc">Переключить оформление приложения</div>
            </div>
            <Toggle checked={dark} onChange={toggleTheme} />
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Уведомления</div>
          {[
            { key: 'newSets', label: 'Новые наборы', desc: 'Когда добавляются новые наборы в каталог' },
            { key: 'articles', label: 'Статьи от авторов', desc: 'Когда выходят новые статьи' },
            { key: 'reminders', label: 'Напоминания', desc: 'Напоминания обновить инвентарь' },
            { key: 'weekly', label: 'Еженедельный дайджест', desc: 'Краткая сводка за неделю' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="settings-row">
              <div>
                <div className="settings-row-label">{label}</div>
                <div className="settings-row-desc">{desc}</div>
              </div>
              <Toggle checked={notifs[key]} onChange={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} />
            </div>
          ))}
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Аккаунт</div>
          <div className="settings-link-row" onClick={() => navigate('/account')}>
            <div>
              <div className="settings-row-label">Аккаунт и безопасность</div>
              <div className="settings-row-desc">Имя, пароль, двухфакторная аутентификация</div>
            </div>
            <svg className="settings-link-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        <div className="settings-section settings-danger-zone">
          <div className="settings-section-title">Опасная зона</div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Выйти из аккаунта</div>
              <div className="settings-row-desc">Выход на всех устройствах</div>
            </div>
            <button className="btn-danger" onClick={logout}>Выйти</button>
          </div>
        </div>
      </main>
    </Layout>
  )
}
