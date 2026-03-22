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

const NAV_ITEMS = [
  {
    to: '/profile', label: 'Профиль',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    to: '/inventory', label: 'Инвентарь',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  },
  {
    to: '/feed', label: 'Лента',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7"/></svg>,
  },
  {
    to: '/catalog', label: 'Каталог',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>,
  },
  {
    to: '/promo', label: 'Промо',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>,
  },
]

export default function MobileNav() {
  const { username } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const initials = username.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const [unreadCount, setUnreadCount] = useState(getUnreadCount)

  useEffect(() => {
    const handler = () => setUnreadCount(getUnreadCount())
    window.addEventListener('notif-update', handler)
    window.addEventListener('storage', handler)
    return () => { window.removeEventListener('notif-update', handler); window.removeEventListener('storage', handler) }
  }, [])

  return (
    <>
      {/* Top bar */}
      <div className="mobile-top-bar">
        <div className="mobile-top-logo">
          <div className="mobile-logo-mark">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
              <rect x="2" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="9" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.5"/>
              <rect x="2" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.5"/>
              <rect x="9" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <span className="mobile-logo-text">SmartSpend</span>
        </div>
        <div className="mobile-top-actions">
          <button className="mobile-top-btn" onClick={() => navigate('/notifications')} title="Уведомления" style={{ position: 'relative' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            {unreadCount > 0 && <span className="mobile-notif-dot" />}
          </button>
          <button className="mobile-top-btn" onClick={() => navigate('/settings')} title="Настройки">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
          <div className="mobile-avatar" onClick={() => navigate('/account')} title="Аккаунт">{initials}</div>
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="mobile-bottom-nav">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className={`mobile-nav-item${location.pathname === item.to ? ' active' : ''}`}
          >
            <span className="mobile-nav-icon" style={{ position: 'relative' }}>
              {item.icon}
              {item.id === 'notifications' && unreadCount > 0 && (
                <span className="mobile-notif-dot" />
              )}
            </span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
