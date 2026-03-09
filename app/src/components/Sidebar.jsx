import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { notifications as ALL_NOTIFS } from '../data/mock'

function getUnreadCount() {
  try {
    const read = new Set(JSON.parse(localStorage.getItem('ss_notif_read') || '[]'))
    return ALL_NOTIFS.filter(n => n.unread && !read.has(n.id)).length
  } catch { return 0 }
}

const navItems = [
  {
    to: '/profile',
    id: 'profile',
    label: 'Профиль',
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
    ),
  },
  {
    to: '/inventory',
    id: 'inventory',
    label: 'Инвентарь',
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
      </svg>
    ),
  },
  {
    to: '/feed',
    id: 'feed',
    label: 'Лента',
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"/>
      </svg>
    ),
  },
  {
    to: '/catalog',
    id: 'catalog',
    label: 'Каталог наборов',
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
      </svg>
    ),
  },
]

const bottomNavItems = [
  {
    to: '/notifications',
    id: 'notifications',
    label: 'Уведомления',
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
      </svg>
    ),
  },
  {
    to: '/settings',
    id: 'settings',
    label: 'Настройки',
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const { dark, collapsed, username, toggleTheme, toggleSidebar } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(getUnreadCount)

  useEffect(() => {
    const handler = () => setUnreadCount(getUnreadCount())
    window.addEventListener('notif-update', handler)
    window.addEventListener('storage', handler)
    return () => { window.removeEventListener('notif-update', handler); window.removeEventListener('storage', handler) }
  }, [])

  const initials = username.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside>
      <div className="logo">
        <div className="logo-mark">
          <svg viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
            <rect x="9" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.5"/>
            <rect x="2" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.5"/>
            <rect x="9" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
          </svg>
        </div>
        <span className="logo-text">SmartSpend</span>
        <button className="sidebar-toggle" onClick={toggleSidebar} title="Свернуть">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>
          </svg>
        </button>
      </div>

      <nav>
        {navItems.map(item => (
          <Link
            key={item.id}
            to={item.to}
            className={`nav-item${location.pathname === item.to ? ' active' : ''}`}
          >
            {item.icon}
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}

        <div className="nav-divider" />

        {bottomNavItems.map(item => (
          <Link
            key={item.id}
            to={item.to}
            className={`nav-item${location.pathname === item.to ? ' active' : ''}`}
          >
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              {item.icon}
              {item.id === 'notifications' && unreadCount > 0 && collapsed && (
                <span className="nav-notif-dot" />
              )}
            </span>
            <span className="nav-label">
              {item.label}
              {item.id === 'notifications' && unreadCount > 0 && !collapsed && (
                <span className="nav-notif-badge">{unreadCount}</span>
              )}
            </span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="theme-toggle" onClick={toggleTheme}>
          {dark ? (
            <svg className="nav-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg className="nav-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          )}
          <span className="nav-label theme-label">{dark ? 'Светлая тема' : 'Тёмная тема'}</span>
        </button>

        <div
          className="sidebar-user"
          style={{ cursor: 'pointer', borderRadius: 10, transition: 'background 0.12s' }}
          onClick={() => navigate('/account')}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
          onMouseLeave={e => e.currentTarget.style.background = ''}
          title="Аккаунт и безопасность"
        >
          <div className="avatar-sm">{initials}</div>
          <div className="nav-label-block">
            <div className="sidebar-user-name">{username}</div>
            <div className="sidebar-user-plan">Базовый план</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
