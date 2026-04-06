import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { loadFullUserData, loadEmptyUserData, FULL_USER, EMPTY_USER } from '../data/demoUsers'

// ── Auth Modal icons ──────────────────────────────────────────────────────────

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

// ── Auth Modal ────────────────────────────────────────────────────────────────

function AuthModal({ open, onClose, onAuth, defaultTab }) {
  const [tab, setTab] = useState(defaultTab || 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [passVisible, setPassVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState(null)
  const [emailError, setEmailError] = useState('')

  useEffect(() => {
    if (open) setTab(defaultTab || 'login')
  }, [open, defaultTab])

  function autoLogin(userName, userType = 'default') {
    setTimeout(() => {
      setLoading(false)
      setLoadingProvider(null)
      onAuth(userName, userType)
    }, 700)
  }

  function handleSocial(provider) {
    setLoadingProvider(provider)
    autoLogin(FULL_USER.username, 'full')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { setEmailError('Введите email'); return }
    if (!email.includes('@')) { setEmailError('Некорректный email'); return }
    setEmailError('')
    setLoading(true)
    const lower = email.trim().toLowerCase()
    if (lower === 'empty@user.ru') {
      autoLogin(EMPTY_USER.username, 'empty')
    } else if (lower === 'full@user.ru') {
      autoLogin(FULL_USER.username, 'full')
    } else {
      const userName = tab === 'register' ? (name.trim() || email.split('@')[0]) : email.split('@')[0]
      autoLogin(userName, 'default')
    }
  }

  function handleClose() {
    if (loading || loadingProvider) return
    setEmail(''); setPassword(''); setName(''); setEmailError(''); setPassVisible(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="auth-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="auth-modal">
        <button className="auth-close" onClick={handleClose} disabled={loading || !!loadingProvider}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="auth-logo-row">
          <div className="auth-logo-mark">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
              <rect x="2" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="9" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.5"/>
              <rect x="2" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.5"/>
              <rect x="9" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <span className="auth-logo-text">SmartSpend</span>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Войти</button>
          <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Регистрация</button>
        </div>

        <div className="auth-title">{tab === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}</div>
        <div className="auth-subtitle">{tab === 'login' ? 'Войдите, чтобы продолжить' : 'Зарегистрируйтесь бесплатно'}</div>

        <div className="auth-demo-hint">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div className="auth-demo-hint-body">
            <div className="auth-demo-hint-title">Демо-режим</div>
            <div className="auth-demo-hint-text">
              <code>empty@user.ru</code> — пустой профиль<br />
              <code>full@user.ru</code> — заполненный профиль
            </div>
          </div>
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
              <input className="auth-input" type="text" placeholder="Как вас зовут?" value={name}
                onChange={e => setName(e.target.value)} disabled={loading || !!loadingProvider} autoComplete="name" />
            </div>
          )}
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input className={`auth-input${emailError ? ' error' : ''}`} type="email" placeholder="your@email.com"
              value={email} onChange={e => { setEmail(e.target.value); setEmailError('') }}
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
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
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
          <button type="submit" className={`auth-submit${loading ? ' loading' : ''}`} disabled={loading || !!loadingProvider}>
            {loading ? <span className="auth-spinner" /> : <><IconMail />{tab === 'login' ? 'Войти по email' : 'Зарегистрироваться'}</>}
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
          Нажимая кнопку, вы соглашаетесь с <button className="auth-legal-link">условиями использования</button> и <button className="auth-legal-link">политикой конфиденциальности</button>
        </div>
      </div>
    </div>
  )
}

// ── Landing page ──────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate()
  const { setUsername } = useApp()
  const [searchParams] = useSearchParams()
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  const [planInflation, setPlanInflation] = useState(0)
  const [cookieAccepted, setCookieAccepted] = useState(() => !!localStorage.getItem('ss_cookie_ok'))

  // Hero cube rotation
  const cubeIdx = useRef(0)
  const [cubeSlide, setCubeSlide] = useState(0)
  const CUBE_PHRASES = [
    { brand: true },
    { text: 'Планируй\nпокупки' },
    { text: 'Выбирай\nлучшее' },
    { text: 'Плати\nменьше' },
    { text: 'Собери\nбазу знаний' },
  ]

  useEffect(() => {
    document.body.classList.remove('app-body', 'sidebar-collapsed')
    document.body.classList.add('landing-body')
    return () => document.body.classList.remove('landing-body')
  }, [])

  useEffect(() => {
    if (localStorage.getItem('ss_auth') === 'true') {
      navigate('/profile', { replace: true })
      return
    }
    if (searchParams.get('auth') === '1') {
      setAuthTab('login')
      setAuthOpen(true)
    }
  }, [navigate, searchParams])

  useEffect(() => {
    const t = setInterval(() => {
      cubeIdx.current = (cubeIdx.current + 1) % CUBE_PHRASES.length
      setCubeSlide(cubeIdx.current)
    }, 2600)
    return () => clearInterval(t)
  }, []) // eslint-disable-line

  function handleAuth(name, userType = 'default') {
    localStorage.setItem('ss_auth', 'true')
    localStorage.setItem('ss_username', name)
    localStorage.setItem('ss_user_type', userType)
    if (userType === 'full') loadFullUserData()
    else loadEmptyUserData()
    setUsername(name)
    navigate('/feed', { replace: true })
  }

  function openLogin() { setAuthTab('login'); setAuthOpen(true) }
  function openRegister() { setAuthTab('register'); setAuthOpen(true) }

  const cur = CUBE_PHRASES[cubeSlide]

  return (
    <>
      {/* ── HERO ── */}
      <section className="ld-hero">
        <div className="ld-container ld-hero-inner">
          <div className="ld-hero-text">
            <h1 className="ld-h1">Твои деньги<br/>заслуживают<br/><em>системы</em></h1>
            <p className="ld-hero-sub">Большинство людей не знают, сколько потратят в следующем месяце. SmartSpend знает.</p>
            <p className="ld-hero-label">SmartSpend — Система планирования расходов</p>
            <div className="ld-hero-actions">
              <button className="landing-btn-primary" onClick={openRegister}>Начать →</button>
              <button className="landing-btn-ghost" onClick={openLogin}>Войти</button>
            </div>
          </div>
          <div className="ld-hero-visual">
            <div className="ld-cube-wrap">
              <div className="ld-cube-frame">
                <div className="ld-cube-screen">
                  {cur.brand ? (
                    <div key={cubeSlide} className="ld-cube-brand">SMART<br/>SPEND</div>
                  ) : cur.smile ? (
                    <div key={cubeSlide} className="ld-cube-smile">
                      <svg width="110" height="110" viewBox="0 0 80 80" fill="none">
                        <path d="M26 36 Q29 32 32 36" stroke="var(--text)" strokeWidth="3" strokeLinecap="round" fill="none"/>
                        <path d="M48 36 Q51 32 54 36" stroke="var(--text)" strokeWidth="3" strokeLinecap="round" fill="none"/>
                        <path d="M30 48 Q40 58 50 48" stroke="var(--text)" strokeWidth="3" strokeLinecap="round" fill="none"/>
                      </svg>
                      <div className="ld-cube-smile-text">Начни сегодня</div>
                    </div>
                  ) : (
                    <div key={cubeSlide} className="ld-cube-phrase">{cur.text.split('\n')[0]}<br/><em>{cur.text.split('\n')[1]}</em></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <div id="ld-features">

        {/* 1. Инвентарь (Рид) */}
        <section className="ld-section">
          <div className="ld-container">
            <div className="ld-feature">
              <div className="ld-feature-text">
                <div className="ld-section-label">Инвентарь</div>
                <h2 className="ld-h2">МЫ СМОТРИМ <span className="ld-h2-pill">ВПЕРЁД, НЕ НАЗАД</span></h2>
                <div className="ld-quote-block">
                  <div className="ld-quote-text">«Рациональный человек принимает решения, глядя только вперёд. То, что вы потратили вчера, уже ушло, и это не должно влиять на то, стоит ли вам тратить завтра.»</div>
                  <div className="ld-quote-author">
                    <img className="ld-quote-avatar" src="/authors/reed.png" alt="Джон Т. Рид"/>
                    <div><div className="ld-quote-name">Джон Т. Рид</div><div className="ld-quote-role">Автор книг по инвестициям и финансовой независимости</div></div>
                  </div>
                </div>
                <p className="ld-feature-desc">Приложения по учёту финансов показывают прошлое — мы показываем будущее. SmartSpend не спрашивает куда делись деньги. Он показывает, <strong>сколько потратишь в следующем месяце</strong> — ещё до первой покупки. Инвентарь следит за сроком службы вещей и предупреждает заранее: зубная щётка ожидает обновления, кроссовки — через 3 месяца. Ноль сюрпризов.</p>
              </div>
              <div className="ld-mockup ld-mockup--tilt-right">
                <div className="ld-mockup-topbar">
                  <div className="ld-mockup-dots"><span/><span/><span/></div>
                  <span className="ld-mockup-title">Инвентарь · 9 200 ₽/мес</span>
                </div>
                <div className="ld-mockup-body">
                  <div className="ld-mk-inv-group">
                    <div className="ld-mk-inv-group-lbl">Ожидает покупки</div>
                    <div className="ld-mk-inv-item ld-mk-inv-urgent"><span>Зубная щётка</span><span className="ld-mk-inv-date">сегодня</span><span className="ld-mk-inv-price">250 ₽</span></div>
                    <div className="ld-mk-inv-item ld-mk-inv-soon"><span>Дезодорант</span><span className="ld-mk-inv-date">3 дня</span><span className="ld-mk-inv-price">300 ₽</span></div>
                    <div className="ld-mk-inv-item ld-mk-inv-soon"><span>Крем для лица</span><span className="ld-mk-inv-date">7 дней</span><span className="ld-mk-inv-price">600 ₽</span></div>
                  </div>
                  <div className="ld-mk-inv-group">
                    <div className="ld-mk-inv-group-lbl">Планируется</div>
                    <div className="ld-mk-inv-item ld-mk-inv-ok"><span>Толстовка</span><span className="ld-mk-inv-date">2 мес</span><span className="ld-mk-inv-price">4 000 ₽</span></div>
                    <div className="ld-mk-inv-item ld-mk-inv-ok"><span>Кроссовки</span><span className="ld-mk-inv-date">3 мес</span><span className="ld-mk-inv-price">6 000 ₽</span></div>
                    <div className="ld-mk-inv-item ld-mk-inv-ok"><span>Музыка</span><span className="ld-mk-inv-date">1 мес</span><span className="ld-mk-inv-price">399 ₽</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Наборы (Канеман) */}
        <section className="ld-section ld-section--alt">
          <div className="ld-container">
            <div className="ld-feature ld-feature--reverse">
              <div className="ld-feature-text">
                <div className="ld-section-label">Инвентарь и Наборы</div>
                <h2 className="ld-h2"><span className="ld-h2-pill">ПЛАНИРУЙ ПОКУПКИ</span> НА ГОДЫ ВПЕРЁД</h2>
                <div className="ld-quote-block">
                  <div className="ld-quote-text">«Когда вы устали или голодны, вы не просто принимаете плохие решения — вы позволяете своей интуитивной системе диктовать правила, потому что самоконтроль требует огромных усилий.»</div>
                  <div className="ld-quote-author">
                    <img className="ld-quote-avatar" src="/authors/kaneman.png" alt="Даниэль Канеман"/>
                    <div><div className="ld-quote-name">Даниэль Канеман</div><div className="ld-quote-role">Нобелевский лауреат по экономике · «Думай медленно, решай быстро»</div></div>
                  </div>
                </div>
                <p className="ld-feature-desc">Принимай решения о покупках <strong>заранее — когда сыт, спокоен и рационален.</strong> Тогда не придётся решать в моменте: усталость, голод и стресс всегда толкают к импульсивному выбору. Наборы — это твои решения, принятые в спокойный день: подобранные товары, рассчитанные сроки, зафиксированный бюджет. Долгосрочный план защищает от сиюминутных ошибок.</p>
              </div>
              <div className="ld-mockup ld-mockup--tilt-left">
                <div className="ld-mockup-topbar">
                  <div className="ld-mockup-dots"><span/><span/><span/></div>
                  <span className="ld-mockup-title">Набор · Рабочее место 2026</span>
                </div>
                <div className="ld-mockup-body">
                  <div className="ld-mk-hero">
                    <div className="ld-mk-hero-tag">Гаджеты и техника</div>
                    <div className="ld-mk-hero-title">Рабочее место 2026</div>
                    <div className="ld-mk-stats">
                      <div className="ld-mk-stat"><div className="ld-mk-stat-val">106 000 ₽</div><div className="ld-mk-stat-lbl">Бюджет</div></div>
                      <div className="ld-mk-stat"><div className="ld-mk-stat-val" style={{color:'var(--accent-green)'}}>1 169 ₽/мес</div><div className="ld-mk-stat-lbl">Амортизация</div></div>
                    </div>
                  </div>
                  <div className="ld-mk-items">
                    <div className="ld-mk-item"><span>MacBook Air M2</span><span className="ld-mk-item-term">84 мес</span><span className="ld-mk-item-price">80 000 ₽</span><span className="ld-mk-item-amort">952 ₽/мес</span></div>
                    <div className="ld-mk-item"><span>Монитор 27"</span><span className="ld-mk-item-term">120 мес</span><span className="ld-mk-item-price">18 000 ₽</span><span className="ld-mk-item-amort">150 ₽/мес</span></div>
                    <div className="ld-mk-item"><span>Клавиатура + мышь</span><span className="ld-mk-item-term">120 мес</span><span className="ld-mk-item-price">5 000 ₽</span><span className="ld-mk-item-amort">42 ₽/мес</span></div>
                    <div className="ld-mk-item"><span>Кронштейн (экран + ноут)</span><span className="ld-mk-item-term">120 мес</span><span className="ld-mk-item-price">3 000 ₽</span><span className="ld-mk-item-amort">25 ₽/мес</span></div>
                  </div>
                  <div className="ld-mk-articles">
                    <div className="ld-mk-art">MacBook M2 или M3: стоит ли переплачивать в 2026?</div>
                    <div className="ld-mk-art">Мониторы до 20 000 ₽: полный разбор</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Конверты (Талер) */}
        <section className="ld-section">
          <div className="ld-container">
            <div className="ld-feature">
              <div className="ld-feature-text">
                <div className="ld-section-label">Профиль · Конверты</div>
                <h2 className="ld-h2"><span className="ld-h2-pill">РАЗЛОЖИ ДЕНЬГИ</span> ПО КОНВЕРТАМ</h2>
                <div className="ld-quote-block">
                  <div className="ld-quote-text">«Наш мозг раскладывает деньги по «виртуальным конвертам». Вы можете жалеть 100 рублей на платную парковку (конверт «текущие расходы»), но легко потратить 5000 рублей на ужин в ресторане (конверт «развлечения»).»</div>
                  <div className="ld-quote-author">
                    <img className="ld-quote-avatar" src="/authors/taler.png" alt="Ричард Талер"/>
                    <div><div className="ld-quote-name">Ричард Талер</div><div className="ld-quote-role">Нобелевский лауреат по экономике · Теория ментального учёта</div></div>
                  </div>
                </div>
                <p className="ld-feature-desc">Распредели доход по <strong>Конвертам</strong> один раз в начале месяца — и больше не думай о деньгах. Видно сколько осталось на еду, на досуг, на транспорт. Когда конверт пустой — стоп. Вопрос «куда делись деньги?» просто перестаёт существовать.</p>
              </div>
              <div className="ld-mockup ld-mockup--tilt-right">
                <div className="ld-mockup-topbar">
                  <div className="ld-mockup-dots"><span/><span/><span/></div>
                  <span className="ld-mockup-title">Профиль · Конверты</span>
                </div>
                <div className="ld-mockup-body">
                  <div className="ld-mk-income">
                    <div className="ld-mk-income-row"><span style={{fontWeight:600}}>Доступно в этом месяце</span><span style={{fontWeight:700,color:'var(--accent-green)'}}>+42 000 ₽</span></div>
                    <div className="ld-mk-bar-track"><div className="ld-mk-bar-fill" style={{width:'30%'}}></div></div>
                    <div className="ld-mk-income-row" style={{fontSize:'10px',opacity:0.6,marginTop:4}}><span>Доход: 60 000 ₽</span><span>Конверты: 18 000 ₽</span></div>
                  </div>
                  <div className="ld-mk-envs">
                    <div className="ld-mk-env ld-mk-env--expanded">
                      <div className="ld-mk-env-name">
                        <div>Еда и Супермаркеты</div>
                        <div className="ld-mk-env-sub">осталось 18 дней</div>
                        <div className="ld-mk-env-sets">
                          <div className="ld-mk-env-set-card"><span className="ld-mk-env-set-name">Северная диета</span><span className="ld-mk-env-set-meta">14 поз.</span><span className="ld-mk-env-set-amt">11 000 ₽/мес</span></div>
                          <div className="ld-mk-env-set-card"><span className="ld-mk-env-set-name">Вкусняшки и снеки</span><span className="ld-mk-env-set-meta">4 поз.</span><span className="ld-mk-env-set-amt">3 000 ₽/мес</span></div>
                        </div>
                      </div>
                      <div className="ld-mk-env-amt" style={{color:'#5E9478'}}>14 000 ₽<div className="ld-mk-env-sub">/мес</div></div>
                    </div>
                    <div className="ld-mk-env"><div className="ld-mk-env-name"><div>Одежда и Обувь</div><div className="ld-mk-env-sub">в норме</div></div><div className="ld-mk-env-amt" style={{color:'#4E8268'}}>3 000 ₽<div className="ld-mk-env-sub">/мес</div></div></div>
                    <div className="ld-mk-env"><div className="ld-mk-env-name"><div>Дом и Техника</div><div className="ld-mk-env-sub">7 дней до покупки</div></div><div className="ld-mk-env-amt" style={{color:'#B08840'}}>2 000 ₽<div className="ld-mk-env-sub">/мес</div></div></div>
                    <div className="ld-mk-env"><div className="ld-mk-env-name"><div>Красота и Здоровье</div><div className="ld-mk-env-sub">скоро закончится</div></div><div className="ld-mk-env-amt" style={{color:'#B85555'}}>2 000 ₽<div className="ld-mk-env-sub">/мес</div></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. EmoSpend */}
        <section className="ld-section ld-section--alt">
          <div className="ld-container">
            <div className="ld-feature ld-feature--reverse">
              <div className="ld-feature-text">
                <div className="ld-section-label">Профиль · EmoSpend</div>
                <h2 className="ld-h2"><span className="ld-h2-pill">БАЛУЙ СЕБЯ</span> — БЕЗ ВИНЫ</h2>
                <div className="ld-quote-block">
                  <div className="ld-quote-text">«Мы покупаем новую вещь (телефон, машину), ожидая долгого счастья. Но наш уровень радости возвращается к базовому очень быстро.»</div>
                  <div className="ld-quote-author">
                    <div><div className="ld-quote-name">Гедонистическая адаптация</div><div className="ld-quote-role">Психологический феномен · Брикман и Кэмпбелл, 1971</div></div>
                  </div>
                </div>
                <p className="ld-feature-desc">Импульсивные покупки — не слабость характера. Это физиология. Поэтому в SmartSpend есть <strong>EmoSpend</strong> — выделенный бюджет на эмоциональные радости вне всяких наборов и конвертов. Трать на что хочешь, без чувства вины: деньги на это уже отложены. И чем больше растёт твой капитал — тем больше растёт EmoSpend.</p>
              </div>
              <div className="ld-mockup ld-mockup--tilt-left">
                <div className="ld-mockup-topbar">
                  <div className="ld-mockup-dots"><span/><span/><span/></div>
                  <span className="ld-mockup-title">Профиль · EmoSpend</span>
                </div>
                <div className="ld-mockup-body">
                  <div className="ld-mk-emo-header">
                    <div className="ld-mk-emo-title">EmoSpend</div>
                    <div className="ld-mk-emo-sub">4% от капитала · ежегодный рост</div>
                  </div>
                  <div className="ld-mk-emo-rows">
                    <div className="ld-mk-emo-row ld-mk-emo-row--header">
                      <span>Год</span><span>в месяц</span><span style={{textAlign:'right'}}>в год</span>
                    </div>
                    <div className="ld-mk-emo-row"><span className="ld-mk-emo-year">2026</span><span>621 ₽</span><span className="ld-mk-emo-val">7 452 ₽</span></div>
                    <div className="ld-mk-emo-row"><span className="ld-mk-emo-year">2027</span><span>3 733 ₽</span><span className="ld-mk-emo-val">44 796 ₽</span></div>
                    <div className="ld-mk-emo-row"><span className="ld-mk-emo-year">2028</span><span>6 846 ₽</span><span className="ld-mk-emo-val">82 152 ₽</span></div>
                    <div className="ld-mk-emo-row"><span className="ld-mk-emo-year">2031</span><span>16 182 ₽</span><span className="ld-mk-emo-val">194 184 ₽</span></div>
                    <div className="ld-mk-emo-row ld-mk-emo-row--future"><span className="ld-mk-emo-year">2036</span><span>31 743 ₽</span><span className="ld-mk-emo-val">380 916 ₽</span></div>
                  </div>
                  <div className="ld-mk-emo-note">Чем больше капитал — тем выше EmoSpend</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Лента (Беккер) */}
        <section className="ld-section">
          <div className="ld-container">
            <div className="ld-feature">
              <div className="ld-feature-text">
                <div className="ld-section-label">Лента · Каталог</div>
                <h2 className="ld-h2"><span className="ld-h2-pill">УЧИСЬ</span> НА ГОТОВЫХ ПРОТОКОЛАХ</h2>
                <div className="ld-quote-block">
                  <div className="ld-quote-text">«Экономический подход не предполагает, что люди не совершают ошибок. Он предполагает, что люди делают лучший выбор из доступных им знаний.»</div>
                  <div className="ld-quote-author">
                    <img className="ld-quote-avatar" src="/authors/beker.png" alt="Гэри Беккер"/>
                    <div><div className="ld-quote-name">Гэри Беккер</div><div className="ld-quote-role">Нобелевский лауреат по экономике · Теория человеческого капитала</div></div>
                  </div>
                </div>
                <p className="ld-feature-desc">Не начинай с нуля. В <strong>Ленте и Каталоге</strong> — готовые наборы и статьи от сообщества: питание, техника, здоровье, одежда. Кто-то уже потратил годы на то, чтобы разобраться — возьми их протокол и адаптируй под себя за один клик.</p>
              </div>
              <div className="ld-mockup ld-mockup--tilt-right">
                <div className="ld-mockup-topbar">
                  <div className="ld-mockup-dots"><span/><span/><span/></div>
                  <span className="ld-mockup-title">Лента</span>
                </div>
                <div className="ld-mockup-body">
                  <div className="ld-mk-chips">
                    <div className="ld-mk-chip ld-mk-chip--active">Все</div>
                    <div className="ld-mk-chip">Питание</div>
                    <div className="ld-mk-chip">Гаджеты</div>
                    <div className="ld-mk-chip">Здоровье</div>
                  </div>
                  <div className="ld-mk-feed">
                    <div className="ld-mk-feed-item">
                      <div className="ld-mk-feed-meta">
                        <div className="ld-mk-avatar" style={{background:'#5E7A6A'}}>АК</div>
                        <span className="ld-mk-feed-author">Алексей К.</span>
                        <span className="ld-mk-feed-date">2 дня назад</span>
                        <span className="ld-mk-feed-tag">Питание</span>
                      </div>
                      <div className="ld-mk-feed-title">Северная диета: 11 000 ₽ в месяц на всё</div>
                      <div className="ld-mk-feed-preview">Как есть рыбу, крупы и овощи, не переплачивать и чувствовать себя хорошо — протокол за 3 года.</div>
                      <div className="ld-mk-feed-actions"><span>♥ 124</span><span>18 отв.</span></div>
                    </div>
                    <div className="ld-mk-feed-item">
                      <div className="ld-mk-feed-meta">
                        <div className="ld-mk-avatar" style={{background:'#7A5E8A'}}>МП</div>
                        <span className="ld-mk-feed-author">Мария П.</span>
                        <span className="ld-mk-feed-date">5 дней назад</span>
                        <span className="ld-mk-feed-tag">Гаджеты</span>
                      </div>
                      <div className="ld-mk-feed-title">Смартфон до 30 000 ₽: что брать в 2026</div>
                      <div className="ld-mk-feed-preview">Сравнила восстановленные флагманы 2022 года и новые телефоны среднего сегмента — итоговая таблица по камере, батарее и стоимости владения.</div>
                      <div className="ld-mk-feed-actions"><span>♥ 89</span><span>31 отв.</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Вклады/Карты/Промо (Мангер) */}
        <section className="ld-section ld-section--alt">
          <div className="ld-container">
            <div className="ld-feature ld-feature--reverse">
              <div className="ld-feature-text">
                <div className="ld-section-label">Вклады · Карты · Промо</div>
                <h2 className="ld-h2"><span className="ld-h2-pill">СЭКОНОМИЛ</span> — ЗНАЧИТ ЗАРАБОТАЛ</h2>
                <div className="ld-quote-block">
                  <div className="ld-quote-text">«Первые 100 000 долларов — это сущий ад, но вы обязаны это сделать. Мне плевать, как вы это сделаете: будете ли вы ходить везде пешком или питаться по купонам. Найдите способ получить в руки эти деньги.»</div>
                  <div className="ld-quote-author">
                    <img className="ld-quote-avatar" src="/authors/manger.png" alt="Чарльз Мангер"/>
                    <div><div className="ld-quote-name">Чарльз Мангер</div><div className="ld-quote-role">Инвестор · Партнёр Уоррена Баффета · Berkshire Hathaway</div></div>
                  </div>
                </div>
                <p className="ld-feature-desc">Вклад под 5% вместо 15% — это <strong>10 000 ₽ в год мимо</strong> с каждых 100 000 рублей. Карта без кешбэка — ещё <strong>1 500 ₽ в месяц</strong> мимо. Купоны и скидки, которые проходят незамеченными — <strong>ещё 3 000 ₽ в месяц</strong>. Мы собрали всё в одном месте: лучшие ставки по вкладам, карты с кешбэком под твои расходы и купоны от сообщества. Каждый сэкономленный рубль — это уже заработанный рубль.</p>
              </div>
              <div className="ld-mockup ld-mockup--tilt-left ld-winstack-outer">
              <div className="ld-winstack">
                {/* Окно 1 — Вклады (верх, задний план) */}
                <div className="ld-winstack-win ld-winstack-win--1">
                  <div className="ld-winstack-bar">
                    <div className="ld-mockup-dots"><span/><span/><span/></div>
                    <span className="ld-mockup-title">Вклады · ставки по срокам</span>
                  </div>
                  <div className="ld-winstack-body">
                    <div className="ld-mk-dep-chart">
                      <div className="ld-mk-bars">
                        <div className="ld-mk-bar" style={{height:'36px'}}><div className="ld-mk-bar-lbl">19%</div></div>
                        <div className="ld-mk-bar" style={{height:'50px'}}><div className="ld-mk-bar-lbl">21%</div></div>
                        <div className="ld-mk-bar" style={{height:'44px'}}><div className="ld-mk-bar-lbl">20%</div></div>
                        <div className="ld-mk-bar" style={{height:'40px'}}><div className="ld-mk-bar-lbl">19%</div></div>
                        <div className="ld-mk-bar" style={{height:'32px'}}><div className="ld-mk-bar-lbl">18%</div></div>
                      </div>
                      <div className="ld-mk-bar-labels">
                        {['1 мес','3 мес','6 мес','1 год','2 года'].map(l => <span key={l}>{l}</span>)}
                      </div>
                    </div>
                    <div className="ld-wk-dep-card">
                      <div className="ld-wk-dep-dot" style={{background:'#4E8268'}}/>
                      <div className="ld-wk-dep-info"><div className="ld-wk-dep-name">Вклад · 3 мес · выплата в конце</div><div className="ld-wk-dep-sub">от 10 000 ₽</div></div>
                      <div className="ld-wk-dep-right"><div className="ld-wk-rate">21%</div><div className="ld-wk-dep-sub">+13 125 ₽/год</div></div>
                    </div>
                    <div className="ld-wk-dep-card">
                      <div className="ld-wk-dep-dot" style={{background:'#5E7A9A'}}/>
                      <div className="ld-wk-dep-info"><div className="ld-wk-dep-name">Вклад · 1 год · выплата ежемесячно</div><div className="ld-wk-dep-sub">от 50 000 ₽</div></div>
                      <div className="ld-wk-dep-right"><div className="ld-wk-rate">19%</div><div className="ld-wk-dep-sub">+11 875 ₽/год</div></div>
                    </div>
                  </div>
                </div>

                {/* Окно 2 — Карты (середина) */}
                <div className="ld-winstack-win ld-winstack-win--2">
                  <div className="ld-winstack-bar">
                    <div className="ld-mockup-dots"><span/><span/><span/></div>
                    <span className="ld-mockup-title">Банковские карты</span>
                  </div>
                  <div className="ld-winstack-body">
                    <div className="ld-wk-dep-card">
                      <div className="ld-wk-dep-dot" style={{background:'#7B5EA7'}}/>
                      <div className="ld-wk-dep-info"><div className="ld-wk-dep-name">Дебетовая · кешбэк на продукты</div><div className="ld-wk-dep-sub">до 2 500 ₽/мес</div></div>
                      <div className="ld-wk-dep-right"><div className="ld-wk-rate">5%</div><div className="ld-wk-dep-sub">кешбэк</div></div>
                    </div>
                    <div className="ld-wk-dep-card">
                      <div className="ld-wk-dep-dot" style={{background:'#B08840'}}/>
                      <div className="ld-wk-dep-info"><div className="ld-wk-dep-name">Кредитная · кешбэк повсюду</div><div className="ld-wk-dep-sub">льготный период 120 дней</div></div>
                      <div className="ld-wk-dep-right"><div className="ld-wk-rate">3%</div><div className="ld-wk-dep-sub">кешбэк</div></div>
                    </div>
                  </div>
                </div>

                {/* Окно 3 — Промо (низ, передний план) */}
                <div className="ld-winstack-win ld-winstack-win--3">
                  <div className="ld-winstack-bar">
                    <div className="ld-mockup-dots"><span/><span/><span/></div>
                    <span className="ld-mockup-title">Промо · Купоны</span>
                  </div>
                  <div className="ld-winstack-body">
                    <div className="ld-wk-promo"><div className="ld-wk-promo-cat">Супермаркеты</div><div className="ld-wk-promo-desc">Скидка на первый заказ</div><div className="ld-wk-badge" style={{background:'#B08840'}}>−15%</div></div>
                    <div className="ld-wk-promo"><div className="ld-wk-promo-cat">Аптеки</div><div className="ld-wk-promo-desc">На весь ассортимент</div><div className="ld-wk-badge" style={{background:'#5E9478'}}>−30%</div></div>
                    <div className="ld-wk-promo"><div className="ld-wk-promo-cat">Одежда и обувь</div><div className="ld-wk-promo-desc">Промокод на новую коллекцию</div><div className="ld-wk-badge" style={{background:'#7B5EA7'}}>−20%</div></div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Баффет — планирование */}
        <section className="ld-section">
          <div className="ld-container">
            <div className="ld-feature">
              <div className="ld-feature-text">
                <div className="ld-section-label">Планирование · 10 лет</div>
                <h2 className="ld-h2"><span className="ld-h2-pill">ЕСТЬ ПЛАН</span> — ДЕРЖИСЬ ПЛАНА</h2>
                <div className="ld-quote-block">
                  <div className="ld-quote-text">«Никто не любит богатеть медленно. Но это единственный путь, доступный каждому.»</div>
                  <div className="ld-quote-author">
                    <img className="ld-quote-avatar" src="/authors/bafet.png" alt="Уоррен Баффет"/>
                    <div><div className="ld-quote-name">Уоррен Баффет</div><div className="ld-quote-role">Инвестор · Berkshire Hathaway · Состояние $150 млрд</div></div>
                  </div>
                </div>
                <p className="ld-feature-desc">Большинство людей переоценивают, что сделают за год, и недооценивают, что сделают за десять. SmartSpend показывает не только текущий бюджет — но и <strong>прогноз роста капитала на 10 лет вперёд</strong>. Цифра мотивирует сильнее любых советов.</p>
              </div>
              <div className="ld-mockup ld-mockup--tilt-right">
                <div className="ld-mockup-topbar">
                  <div className="ld-mockup-dots"><span/><span/><span/></div>
                  <span className="ld-mockup-title">Планирование · прогноз капитала</span>
                </div>
                <div className="ld-mockup-body">
                  <div className="ld-mk-plan-capital">
                    <div className="ld-mk-plan-lbl">Текущий капитал</div>
                    <div className="ld-mk-plan-amt">186 400 ₽</div>
                  </div>
                  <div className="ld-mk-plan-inf-btns">
                    {[0, 5, 15].map(r => (
                      <button key={r} className={`ld-mk-plan-inf-btn${planInflation === r ? ' active' : ''}`} onClick={() => setPlanInflation(r)}>
                        инфляция {r}%
                      </button>
                    ))}
                  </div>
                  <div className="ld-mk-plan-rows">
                    {(() => {
                      const rows = [
                        { year: '2027', nominal: 1120048, yrs: 1 },
                        { year: '2028', nominal: 2053696, yrs: 2 },
                        { year: '2029', nominal: 2987344, yrs: 3 },
                        { year: '2031', nominal: 4854640, yrs: 5 },
                        { year: '2033', nominal: 6721936, yrs: 7 },
                        { year: '2036', nominal: 9522880, yrs: 10 },
                      ]
                      const adj = (nom, yrs) => Math.round(nom * Math.pow(1 + planInflation / 100, yrs))
                      const maxVal = adj(9522880, 10)
                      return rows.map(r => {
                        const val = adj(r.nominal, r.yrs)
                        const pct = Math.round(val / maxVal * 100)
                        return (
                          <div key={r.year} className="ld-mk-plan-row">
                            <span className="ld-mk-plan-year">{r.year}</span>
                            <div className="ld-mk-plan-track"><div className="ld-mk-plan-fill" style={{width:`${pct}%`}}/></div>
                            <span className="ld-mk-plan-val">{val.toLocaleString('ru-RU')} ₽</span>
                          </div>
                        )
                      })
                    })()}
                  </div>
                  <div className="ld-mk-plan-note">
                    {planInflation === 0 ? 'Предел накоплений — через 21 год · 19.8 млн ₽' : `При инфляции ${planInflation}% — зарплаты и ставки по вкладам растут вместе с ценами`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>{/* /features */}

      {/* ── TWO PATHS ── */}
      <section id="ld-paths" className="ld-section ld-section--alt">
        <div className="ld-container">
          <div className="ld-section-head">
            <div className="ld-section-label">С чего всё начинается</div>
            <h2 className="ld-h2">Выбери <span className="ld-h2-pill">свой путь</span></h2>
          </div>
          <div className="ld-paths-grid">
            <div className="ld-path-card ld-path-good">
              <div className="ld-path-head">
                <div className="ld-path-title">SmartSpend</div>
              </div>
              <div className="ld-path-items">
                <div className="ld-path-item"><strong>Системный инвентарь.</strong> Ты точно знаешь, что есть, что скоро закончится — покупки спланированы заранее.</div>
                <div className="ld-path-item"><strong>Умный выбор.</strong> Вещь за 5 000 ₽ на 5 лет выгоднее вещи за 2 000 ₽ на год. Считаешь стоимость владения.</div>
                <div className="ld-path-item"><strong>Готовые протоколы.</strong> Не изобретаешь велосипед — берёшь наборы по питанию, гаджетам, здоровью.</div>
                <div className="ld-path-item"><strong>Конверты.</strong> Деньги распределены. В любой момент видно, сколько осталось — нет «куда делись деньги?»</div>
                <div className="ld-path-item"><strong>И место для радостей.</strong> Бюджет на импульсивные покупки выделен заранее — наслаждайся без вины.</div>
              </div>
              <div className="ld-path-result ld-path-result--good">Капитал за 10 лет</div>
            </div>
            <div className="ld-path-card ld-path-bad">
              <div className="ld-path-head">
                <div className="ld-path-title">Обычный путь</div>
              </div>
              <div className="ld-path-items">
                <div className="ld-path-item"><strong>Дофаминовая петля.</strong> Покупка ради короткой радости. Через неделю снова хочется что-то новее и дороже.</div>
                <div className="ld-path-item"><strong>Инфляция потребления.</strong> Зарплата выросла — расходы выросли быстрее. Свободных денег по-прежнему нет.</div>
                <div className="ld-path-item"><strong>Хаос в расходах.</strong> Сломался зуб или холодильник — нет подушки, снова в долги.</div>
                <div className="ld-path-item"><strong>Двойные покупки.</strong> Купил похожее, потому что забыл, что уже есть. Переплатил — не сравнил.</div>
                <div className="ld-path-item"><strong>«Потом разберусь».</strong> Вклад под 5%, хотя рядом есть под 21%. Карта без кешбэка — 2 000 ₽ в месяц мимо.</div>
              </div>
              <div className="ld-path-result ld-path-result--bad">Капитал за 30 лет</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="ld-cta" className="ld-cta">
        <div className="ld-cta-inner">
          <div className="ld-section-label" style={{color:'var(--accent-green)'}}>Начни прямо сейчас</div>
          <h2 className="ld-cta-title">Хватит считать прошлое — начни управлять будущим</h2>
          <p className="ld-cta-sub">Подбери компании, создай инвентарь, распредели бюджет по конвертам.</p>
          <button className="landing-btn-primary" onClick={openRegister}>Начать →</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer-new">
        <div className="landing-container landing-footer-container">
          <div className="landing-footer-left">
            <div className="landing-logo">
              <div className="landing-logo-mark">
                <svg viewBox="0 0 80 80" fill="none" width="28" height="28">
                  <rect width="80" height="80" rx="18" fill="var(--logo-bg)"/>
                  <rect x="14" y="14" width="52" height="52" rx="10" fill="var(--logo-fg)"/>
                </svg>
              </div>
              <span>SmartSpend</span>
            </div>
            <p>© 2026 SmartSpend. Все права защищены.</p>
          </div>
          <div className="landing-footer-center">
            <a href="#/privacy">Политика конфиденциальности</a>
            <a href="#/terms">Пользовательское соглашение</a>
          </div>

        </div>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuth={handleAuth} defaultTab={authTab} />

      {/* ── COOKIE BANNER ── */}
      {!cookieAccepted && (
        <div className="cookie-banner">
          <p className="cookie-text">Мы используем куки для аналитики и улучшения сервиса. <a href="#/privacy" className="cookie-link">Подробнее</a></p>
          <div className="cookie-actions">
            <button className="cookie-btn cookie-btn--accept" onClick={() => { localStorage.setItem('ss_cookie_ok', '1'); setCookieAccepted(true) }}>Принять</button>
            <button className="cookie-btn cookie-btn--decline" onClick={() => setCookieAccepted(true)}>Отклонить</button>
          </div>
        </div>
      )}
    </>
  )
}
