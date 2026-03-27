import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

function IconYandex() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M2.04 12c0-5.523 4.476-10 10-10 5.522 0 10 4.477 10 10s-4.478 10-10 10c-5.524 0-10-4.477-10-10z" fill="#FC3F1D"/>
      <path d="M13.32 7.666h-.924c-1.694 0-2.585.858-2.585 2.123 0 1.43.616 2.1 1.881 2.959l1.045.704-3.003 4.487H7.49l2.695-4.014c-1.55-1.111-2.42-2.19-2.42-4.015 0-2.288 1.595-3.85 4.62-3.85h3.003v11.868H13.32V7.666z" fill="#fff"/>
    </svg>
  )
}

function IconVK() {
  return (
    <svg width="18" height="18" viewBox="0 0 1024 1024" fill="none">
      <path d="M179.929 32h664.142C925.767 32 992 98.23 992 179.929v664.142C992 925.767 925.767 992 844.071 992H179.929C98.23 992 32 925.767 32 844.071V179.929C32 98.23 98.23 32 179.929 32z" fill="#4c75a3"/>
      <path d="M503.946 704.029h39.269s11.859-1.307 17.922-7.831c5.573-5.997 5.395-17.25 5.395-17.25s-.768-52.692 23.683-60.451c24.113-7.648 55.07 50.924 87.879 73.448 24.812 17.039 43.667 13.31 43.667 13.31l87.739-1.226s45.895-2.832 24.132-38.918c-1.781-2.947-12.678-26.693-65.238-75.479-55.019-51.063-47.643-42.802 18.627-131.129 40.359-53.79 56.49-86.628 51.449-100.691-5.003-13.4-34.69-9.86-34.69-9.86l-98.785.611s-7.329-.997-12.757 2.251c-5.309 3.176-8.717 10.598-8.717 10.598s-15.641 41.622-36.486 77.025c-43.988 74.693-61.58 78.647-68.77 74.002-16.729-10.811-12.549-43.422-12.549-66.596 0-72.389 10.98-102.57-21.381-110.383-10.737-2.591-18.647-4.305-46.11-4.585-35.25-.358-65.078.109-81.971 8.384-11.239 5.504-19.91 17.765-14.626 18.471 6.531.87 21.314 4.99 29.152 15.656 10.126 13.777 9.772 44.703 9.772 44.703s5.818 85.212-13.585 95.794c-13.314 7.26-31.581-7.56-70.799-75.327-20.09-34.711-35.264-73.085-35.264-73.085s-2.922-7.169-8.141-11.007c-6.33-4.65-15.174-6.124-15.174-6.124l-93.876.613s-14.089.393-19.267 6.522c-4.606 5.455-.368 16.724-.368 16.724s73.49 171.942 156.711 258.591c76.315 79.454 162.957 74.24 162.957 74.24z" fill="#fff"/>
    </svg>
  )
}

function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}

// Shared AuthModal — can be used standalone or as overlay
export default function AuthModal({ open, onClose, onAuth, defaultTab = 'login', dismissable = true }) {
  const [tab, setTab] = useState(defaultTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [passVisible, setPassVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState(null)
  const [emailError, setEmailError] = useState('')

  useEffect(() => {
    if (open) setTab(defaultTab)
  }, [open, defaultTab])

  function autoLogin(userName) {
    setTimeout(() => {
      setLoading(false)
      setLoadingProvider(null)
      onAuth(userName)
    }, 700)
  }

  function handleSocial(provider) {
    setLoadingProvider(provider)
    autoLogin('Пользователь')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { setEmailError('Введите email'); return }
    if (!email.includes('@')) { setEmailError('Некорректный email'); return }
    setEmailError('')
    setLoading(true)
    const userName = tab === 'register' ? (name.trim() || email.split('@')[0]) : email.split('@')[0]
    autoLogin(userName)
  }

  function handleClose() {
    if (!dismissable || loading || loadingProvider) return
    setEmail(''); setPassword(''); setName(''); setEmailError(''); setPassVisible(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="auth-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="auth-modal">
        {dismissable && (
          <button className="auth-close" onClick={handleClose} disabled={loading || !!loadingProvider}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}

        <div className="auth-logo-row">
          <div className="auth-logo-mark">
            <svg viewBox="0 0 80 80" fill="none" width="28" height="28">
              <rect width="80" height="80" rx="18" fill="var(--logo-bg)"/>
              <rect x="14" y="14" width="52" height="52" rx="10" fill="var(--logo-fg)"/>
            </svg>
          </div>
          <span className="auth-logo-text">SmartSpend</span>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Войти</button>
          <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Регистрация</button>
        </div>

        <div className="auth-title">{tab === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}</div>
        <div className="auth-subtitle">
          {tab === 'login' ? 'Войдите, чтобы продолжить' : 'Зарегистрируйтесь бесплатно'}
        </div>

        <div className="auth-socials">
          <button className={`auth-social-btn yandex${loadingProvider === 'yandex' ? ' loading' : ''}`}
            onClick={() => handleSocial('yandex')} disabled={!!loadingProvider || loading}>
            <span className="auth-social-icon"><IconYandex /></span>
            <span>{loadingProvider === 'yandex' ? 'Подключение...' : (tab === 'login' ? 'Войти через Яндекс ID' : 'Яндекс ID')}</span>
          </button>
          <button className={`auth-social-btn vk${loadingProvider === 'vk' ? ' loading' : ''}`}
            onClick={() => handleSocial('vk')} disabled={!!loadingProvider || loading}>
            <span className="auth-social-icon"><IconVK /></span>
            <span>{loadingProvider === 'vk' ? 'Подключение...' : (tab === 'login' ? 'Войти через VK (Max)' : 'VK (Max)')}</span>
          </button>
        </div>

        <div className="auth-divider"><span>или</span></div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {tab === 'register' && (
            <div className="auth-field">
              <label className="auth-label">Имя</label>
              <input className="auth-input" type="text" placeholder="Как вас зовут?"
                value={name} onChange={e => setName(e.target.value)}
                disabled={loading || !!loadingProvider} autoComplete="name" />
            </div>
          )}
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input className={`auth-input${emailError ? ' error' : ''}`} type="email"
              placeholder="your@email.com" value={email}
              onChange={e => { setEmail(e.target.value); setEmailError('') }}
              disabled={loading || !!loadingProvider} autoComplete="email" />
            {emailError && <div className="auth-field-error">{emailError}</div>}
          </div>
          <div className="auth-field">
            <label className="auth-label">Пароль</label>
            <div className="auth-pass-wrap">
              <input className="auth-input" type={passVisible ? 'text' : 'password'}
                placeholder={tab === 'register' ? 'Минимум 8 символов' : 'Введите пароль'}
                value={password} onChange={e => setPassword(e.target.value)}
                disabled={loading || !!loadingProvider}
                autoComplete={tab === 'register' ? 'new-password' : 'current-password'} />
              <button type="button" className="auth-pass-toggle" onClick={() => setPassVisible(v => !v)} tabIndex={-1}>
                {passVisible ? (
                  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          {tab === 'login' && (
            <div className="auth-forgot">
              <button type="button" className="auth-forgot-link">Забыли пароль?</button>
            </div>
          )}
          <button type="submit" className={`auth-submit${loading ? ' loading' : ''}`}
            disabled={loading || !!loadingProvider}>
            {loading ? <span className="auth-spinner" /> : (
              <><IconMail />{tab === 'login' ? 'Войти по email' : 'Зарегистрироваться'}</>
            )}
          </button>
        </form>

        <div className="auth-switch">
          {tab === 'login' ? (
            <>Нет аккаунта?&nbsp;<button className="auth-switch-btn" onClick={() => setTab('register')}>Зарегистрироваться</button></>
          ) : (
            <>Уже есть аккаунт?&nbsp;<button className="auth-switch-btn" onClick={() => setTab('login')}>Войти</button></>
          )}
        </div>

        <div className="auth-legal">
          Нажимая кнопку, вы соглашаетесь с{' '}
          <button className="auth-legal-link">условиями использования</button> и{' '}
          <button className="auth-legal-link">политикой конфиденциальности</button>
        </div>
      </div>
    </div>
  )
}

// Hook for auth actions in guest-accessible pages
export function useAuthModal() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('login')
  const { setUsername } = useApp()
  const navigate = useNavigate()

  function requireAuth(action) {
    const authed = localStorage.getItem('ss_auth') === 'true'
    if (authed) { action?.(); return true }
    setTab('login')
    setOpen(true)
    return false
  }

  function openLogin() { setTab('login'); setOpen(true) }
  function openRegister() { setTab('register'); setOpen(true) }

  function handleAuth(name) {
    localStorage.setItem('ss_auth', 'true')
    localStorage.setItem('ss_username', name)
    setUsername(name)
    setOpen(false)
    navigate(0) // refresh current page to pick up auth state
  }

  const modal = (
    <AuthModal open={open} onClose={() => setOpen(false)} onAuth={handleAuth}
      defaultTab={tab} dismissable={true} />
  )

  return { modal, requireAuth, openLogin, openRegister }
}
