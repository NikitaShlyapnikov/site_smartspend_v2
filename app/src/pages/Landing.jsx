import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'

// ── Quiz ──────────────────────────────────────────────────────────────────────

const QUIZ_STEPS = [
  {
    q: 'Как часто вы покупаете вещи импульсивно?',
    options: ['Почти никогда', 'Иногда, пару раз в месяц', 'Часто, почти каждую неделю', 'Постоянно, не могу остановиться'],
  },
  {
    q: 'Ведёте ли вы учёт расходов?',
    options: ['Да, регулярно', 'Иногда записываю', 'Нет, но хочу начать', 'Никогда не думал об этом'],
  },
  {
    q: 'Какая категория расходов самая проблемная?',
    options: ['Еда и рестораны', 'Одежда и шопинг', 'Развлечения и подписки', 'Техника и гаджеты'],
  },
  { q: 'Как вас зовут?', name: true },
]

function QuizModal({ open, onClose, onFinish }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [nameVal, setNameVal] = useState('')
  const [done, setDone] = useState(false)

  const current = QUIZ_STEPS[step]
  const progress = ((step + 1) / QUIZ_STEPS.length) * 100

  function next() {
    if (current.name) {
      if (!nameVal.trim()) return
      setAnswers([...answers, nameVal.trim()])
    } else {
      if (selected === null) return
      setAnswers([...answers, selected])
      setSelected(null)
    }
    if (step < QUIZ_STEPS.length - 1) setStep(s => s + 1)
    else setDone(true)
  }

  function skip() {
    if (step < QUIZ_STEPS.length - 1) setStep(s => s + 1)
    else setDone(true)
  }

  function handleFinish() {
    const name = answers[answers.length - 1] || nameVal.trim() || 'Никита Орлов'
    onFinish(name)
  }

  function handleClose() {
    setStep(0); setAnswers([]); setSelected(null); setNameVal(''); setDone(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className={`quiz-overlay${open ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="quiz-modal">
        <div className="quiz-progress-bar" style={{ width: `${progress}%` }} />
        <div className="quiz-inner">
          {done ? (
            <div className="quiz-result">
              <div className="quiz-result-icon">🎉</div>
              <div className="quiz-result-title">Вы готовы!</div>
              <div className="quiz-result-desc">SmartSpend поможет вам тратить осознанно и достигать финансовых целей</div>
              <button className="quiz-result-btn" onClick={handleFinish}>Войти в приложение →</button>
            </div>
          ) : (
            <>
              <div className="quiz-q">{current.q}</div>
              {current.name ? (
                <input className="quiz-name-input" placeholder="Ваше имя" value={nameVal}
                  onChange={e => setNameVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && next()} autoFocus />
              ) : (
                <div className="quiz-options">
                  {current.options.map((opt, i) => (
                    <button key={i} className={`quiz-option${selected === i ? ' selected' : ''}`}
                      onClick={() => setSelected(i)}>{opt}</button>
                  ))}
                </div>
              )}
              <div className="quiz-actions">
                <button className="quiz-btn-skip" onClick={skip}>Пропустить</button>
                <button className="quiz-btn-next" onClick={next}>
                  {step < QUIZ_STEPS.length - 1 ? 'Далее →' : 'Завершить'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Auth Modal ────────────────────────────────────────────────────────────────

function IconYandex() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#FC3F1D"/>
      <path d="M13.32 5H11.4C9.12 5 7.8 6.18 7.8 8.06c0 1.68.72 2.62 2.22 3.62L8.1 19h2.4l1.8-5.1h.72L14.82 19h2.4l-2.1-5.68c1.32-.98 2.04-2.02 2.04-3.66 0-3-1.86-4.66-3.84-4.66zm-.3 7.08h-.66V7.02h.66c1.32 0 2.04.84 2.04 2.52 0 1.62-.72 2.54-2.04 2.54z" fill="white"/>
    </svg>
  )
}

function IconVK() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#0077FF"/>
      <path d="M12.5 16.5h1.2s.37-.04.56-.25c.17-.19.17-.55.17-.55s-.02-1.68.75-1.93c.76-.24 1.73 1.62 2.76 2.34.78.53 1.37.41 1.37.41l2.75-.04s1.44-.09.76-1.23c-.06-.09-.41-.87-2.13-2.46-1.8-1.66-1.55-1.39.6-4.27 1.3-1.73 1.82-2.79 1.66-3.24-.15-.43-1.08-.32-1.08-.32l-3.1.02s-.23-.03-.4.07c-.17.1-.27.33-.27.33s-.5 1.33-1.17 2.47c-1.41 2.4-1.97 2.52-2.2 2.37-.53-.35-.4-1.4-.4-2.14 0-2.32.35-3.28-.68-3.54-.34-.08-.59-.14-1.46-.14-1.12 0-2.06.01-2.6.27-.36.17-.63.56-.46.58.2.03.67.13.91.48.31.45.3 1.45.3 1.45s.18 2.74-.42 3.07c-.41.22-.97-.23-2.18-2.4-.65-1.12-1.14-2.36-1.14-2.36s-.09-.22-.26-.34c-.2-.14-.48-.19-.48-.19L3.1 7.5s-.46.01-.63.21c-.15.18-.01.55-.01.55s2.4 5.62 5.12 8.45c2.49 2.6 5.32 2.43 5.32 2.43l.5-.05z" fill="white"/>
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

  function autoLogin(userName) {
    setTimeout(() => {
      setLoading(false)
      setLoadingProvider(null)
      onAuth(userName)
    }, 700)
  }

  function handleSocial(provider) {
    setLoadingProvider(provider)
    const mockName = provider === 'yandex' ? 'Никита Орлов' : 'Никита Орлов'
    autoLogin(mockName)
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
    if (loading || loadingProvider) return
    setEmail(''); setPassword(''); setName(''); setEmailError(''); setPassVisible(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="auth-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="auth-modal">

        {/* Header */}
        <button className="auth-close" onClick={handleClose} disabled={loading || !!loadingProvider}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
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

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Войти</button>
          <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Регистрация</button>
        </div>

        <div className="auth-title">
          {tab === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}
        </div>
        <div className="auth-subtitle">
          {tab === 'login'
            ? 'Войдите, чтобы продолжить'
            : 'Зарегистрируйтесь бесплатно'}
        </div>

        {/* Social buttons */}
        <div className="auth-socials">
          <button
            className={`auth-social-btn yandex${loadingProvider === 'yandex' ? ' loading' : ''}`}
            onClick={() => handleSocial('yandex')}
            disabled={!!loadingProvider || loading}
          >
            <span className="auth-social-icon"><IconYandex /></span>
            <span>{loadingProvider === 'yandex' ? 'Подключение...' : (tab === 'login' ? 'Войти через Яндекс ID' : 'Яндекс ID')}</span>
          </button>
          <button
            className={`auth-social-btn vk${loadingProvider === 'vk' ? ' loading' : ''}`}
            onClick={() => handleSocial('vk')}
            disabled={!!loadingProvider || loading}
          >
            <span className="auth-social-icon"><IconVK /></span>
            <span>{loadingProvider === 'vk' ? 'Подключение...' : (tab === 'login' ? 'Войти через VK (Max)' : 'VK (Max)')}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="auth-divider"><span>или</span></div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {tab === 'register' && (
            <div className="auth-field">
              <label className="auth-label">Имя</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Как вас зовут?"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loading || !!loadingProvider}
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className={`auth-input${emailError ? ' error' : ''}`}
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError('') }}
              disabled={loading || !!loadingProvider}
              autoComplete="email"
            />
            {emailError && <div className="auth-field-error">{emailError}</div>}
          </div>

          <div className="auth-field">
            <label className="auth-label">Пароль</label>
            <div className="auth-pass-wrap">
              <input
                className="auth-input"
                type={passVisible ? 'text' : 'password'}
                placeholder={tab === 'register' ? 'Минимум 8 символов' : 'Введите пароль'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading || !!loadingProvider}
                autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
              />
              <button type="button" className="auth-pass-toggle" onClick={() => setPassVisible(v => !v)}
                tabIndex={-1}>
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

          <button
            type="submit"
            className={`auth-submit${loading ? ' loading' : ''}`}
            disabled={loading || !!loadingProvider}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : (
              <>
                <IconMail />
                {tab === 'login' ? 'Войти по email' : 'Зарегистрироваться'}
              </>
            )}
          </button>
        </form>

        {/* Switch tab */}
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
  const [quizOpen, setQuizOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState('login')

  useEffect(() => {
    document.body.classList.remove('app-body', 'sidebar-collapsed')
    document.body.classList.add('landing-body')
    return () => document.body.classList.remove('landing-body')
  }, [])

  useEffect(() => {
    if (localStorage.getItem('ss_auth') === 'true') {
      navigate('/feed', { replace: true })
      return
    }
    // Auto-open auth if redirected from protected page
    if (searchParams.get('auth') === '1') {
      setAuthTab('login')
      setAuthOpen(true)
    }
  }, [navigate, searchParams])

  function handleAuth(name) {
    localStorage.setItem('ss_auth', 'true')
    localStorage.setItem('ss_username', name)
    setUsername(name)
    navigate('/feed', { replace: true })
  }

  function openLogin() { setAuthTab('login'); setAuthOpen(true) }
  function openRegister() { setAuthTab('register'); setAuthOpen(true) }

  return (
    <>
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="landing-logo-mark">
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
              <rect x="2" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="9" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.5"/>
              <rect x="2" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.5"/>
              <rect x="9" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
            </svg>
          </div>
          SmartSpend
        </div>
        <div className="landing-nav-actions">
          <button className="nav-btn-ghost" onClick={openLogin}>Войти</button>
          <button className="nav-btn-primary" onClick={openRegister}>Начать бесплатно</button>
        </div>
      </nav>

      <div className="landing-hero">
        <div className="hero-eyebrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          Осознанное потребление
        </div>
        <h1 className="hero-title">
          Тратьте деньги на<br/>
          <span className="hero-title-accent">то, что важно</span>
        </h1>
        <p className="hero-subtitle">
          SmartSpend помогает планировать покупки, вести инвентарь вещей и следовать проверенным наборам от сообщества.
        </p>
        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={openRegister}>
            Начать бесплатно →
          </button>
          <button className="btn-hero-secondary" onClick={() => setQuizOpen(true)}>
            Пройти тест
          </button>
        </div>
      </div>

      <div className="landing-section">
        <div className="section-eyebrow">Возможности</div>
        <h2 className="section-title">Всё для осознанных трат</h2>
        <p className="section-subtitle">Наборы вещей, инвентарь, лента контента — всё в одном месте</p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="20" height="20" fill="none" stroke="#4E8268" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            <div className="feature-title">Каталог наборов</div>
            <div className="feature-desc">Готовые списки необходимых вещей от SmartSpend и сообщества. Выбирайте, адаптируйте, добавляйте в инвентарь.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="20" height="20" fill="none" stroke="#4E8268" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <div className="feature-title">Личный инвентарь</div>
            <div className="feature-desc">Отслеживайте что уже есть, что планируете купить, что в вишлисте. Полная картина вашего имущества.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="20" height="20" fill="none" stroke="#4E8268" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7"/>
              </svg>
            </div>
            <div className="feature-title">Лента контента</div>
            <div className="feature-desc">Статьи и наборы от авторов сообщества. Учитесь у других, делитесь своим опытом осознанных покупок.</div>
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        <div className="landing-footer-logo">
          <div className="landing-logo-mark" style={{ width: 24, height: 24, borderRadius: 6 }}>
            <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
              <rect x="2" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="9" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.5"/>
              <rect x="2" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.5"/>
              <rect x="9" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
            </svg>
          </div>
          SmartSpend
        </div>
        <div className="landing-footer-copy">© 2025 SmartSpend. Осознанное потребление.</div>
      </footer>

      <QuizModal open={quizOpen} onClose={() => setQuizOpen(false)} onFinish={handleAuth} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuth={handleAuth} defaultTab={authTab} />
    </>
  )
}
