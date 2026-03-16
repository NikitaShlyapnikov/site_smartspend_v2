import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Layout from './Layout'
import { useAuthModal } from './AuthModal'

// For pages visible to guests (Catalog, SetDetail, Article)
// — if authed: shows full app layout with sidebar
// — if guest: shows minimal top nav with Войти / Создать аккаунт
export default function PublicLayout({ children }) {
  const authed = localStorage.getItem('ss_auth') === 'true'

  if (authed) return <Layout>{children}</Layout>
  return <GuestShell>{children}</GuestShell>
}

function GuestShell({ children }) {
  const navigate = useNavigate()
  const { modal, openLogin, openRegister } = useAuthModal()

  useEffect(() => {
    document.body.classList.remove('landing-body', 'sidebar-collapsed')
    document.body.classList.add('app-body')
    return () => document.body.classList.remove('app-body')
  }, [])

  return (
    <>
      <header className="guest-nav">
        <div className="guest-nav-inner">
          <button className="guest-nav-logo" onClick={() => navigate('/')}>
            <div className="guest-logo-mark">
              <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                <rect x="2" y="2" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.9"/>
                <rect x="9" y="2" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.5"/>
                <rect x="2" y="9" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.5"/>
                <rect x="9" y="9" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.9"/>
              </svg>
            </div>
            <span className="guest-nav-brand">SmartSpend</span>
          </button>
          <nav className="guest-nav-links">
            <button className="guest-nav-link" onClick={() => navigate('/catalog')}>Каталог</button>
          </nav>
          <div className="guest-nav-actions">
            <button className="guest-btn-ghost" onClick={openLogin}>Войти</button>
            <button className="guest-btn-primary" onClick={openRegister}>Создать аккаунт</button>
          </div>
        </div>
      </header>
      <main className="guest-content">
        {children}
      </main>
      {modal}
    </>
  )
}
