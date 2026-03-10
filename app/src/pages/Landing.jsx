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

  const LogoMark = () => (
    <div className="landing-logo-mark">
      <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
        <rect x="2" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
        <rect x="9" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.5"/>
        <rect x="2" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.5"/>
        <rect x="9" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
      </svg>
    </div>
  )

  return (
    <>
      {/* NAV */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <div className="landing-logo">
            <LogoMark />
            <span>SmartSpend</span>
          </div>
          <div className="landing-nav-links">
            <a className="landing-nav-link" href="#landing-how">Как это работает</a>
            <a className="landing-nav-link" href="#landing-features">Инструменты</a>
            <a className="landing-nav-link" href="#landing-scenario">Сценарий</a>
          </div>
          <div className="landing-nav-actions">
            <button className="nav-btn-ghost" onClick={openLogin}>Войти</button>
            <button className="nav-btn-primary" onClick={openRegister}>Начать бесплатно</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="landing-hero-section">
        <div className="landing-hero-bg" />
        <div className="landing-container">
          <div className="landing-hero-inner">
            <div className="landing-hero-left">
              <div className="landing-hero-tag">Осознанное потребление</div>
              <h1 className="landing-h1">Зарплата пришла —<br/>и сразу <em>ушла?</em></h1>
              <p className="landing-hero-sub">SmartSpend покажет, куда уходят деньги, и научит тратить так, чтобы капитал рос — без жертв и без боли.</p>
              <div className="landing-hero-actions-row">
                <button className="landing-btn-primary" onClick={openRegister}>Начать бесплатно →</button>
                <button className="landing-btn-ghost" onClick={() => setQuizOpen(true)}>Пройти тест (2 мин)</button>
              </div>
              <div className="landing-hero-stats">
                <div><div className="landing-stat-num">1 200+</div><div className="landing-stat-label">Пользователей</div></div>
                <div><div className="landing-stat-num">50+</div><div className="landing-stat-label">Готовых наборов</div></div>
                <div><div className="landing-stat-num">11</div><div className="landing-stat-label">Категорий жизни</div></div>
              </div>
            </div>
            <div className="landing-hero-mockup">
              <div className="landing-mockup-window">
                <div className="landing-mockup-topbar">
                  <div className="landing-mockup-dot" /><div className="landing-mockup-dot" /><div className="landing-mockup-dot" />
                  <span className="landing-mockup-title">SmartSpend / Профиль</span>
                </div>
                <div className="landing-mockup-body">
                  <div className="landing-mk-balance">
                    <div className="landing-mk-balance-label">Капитал</div>
                    <div className="landing-mk-balance-num">186 400 ₽</div>
                    <div className="landing-mk-balance-row">
                      <span className="landing-mk-tag landing-mk-tag-green">↑ +4.2% за месяц</span>
                      <span className="landing-mk-tag landing-mk-tag-neutral">EmoSpend: 8 200 ₽</span>
                    </div>
                  </div>
                  <div className="landing-mk-envelopes">
                    <div className="landing-mk-env-row">
                      <div className="landing-mk-env-icon"><svg viewBox="0 0 12 12" fill="none" stroke="#6A9E84" strokeWidth="1.5" strokeLinecap="round"><path d="M1 3h10M1 6h6M1 9h4"/></svg></div>
                      <span className="landing-mk-env-name">Smart-база</span>
                      <div className="landing-mk-env-right"><div className="landing-mk-env-amount">22 000 ₽</div><div className="landing-mk-env-sub">из 22 000 ₽</div></div>
                    </div>
                    <div className="landing-mk-progress"><div className="landing-mk-progress-fill" style={{ width: '100%' }} /></div>
                    <div className="landing-mk-env-row">
                      <div className="landing-mk-env-icon"><svg viewBox="0 0 12 12" fill="none" stroke="#6A9E84" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5v2.5l2 1"/></svg></div>
                      <span className="landing-mk-env-name">Инвестиционное ядро</span>
                      <div className="landing-mk-env-right"><div className="landing-mk-env-amount">40 000 ₽</div><div className="landing-mk-env-sub">накоплено</div></div>
                    </div>
                    <div className="landing-mk-progress"><div className="landing-mk-progress-fill" style={{ width: '72%' }} /></div>
                  </div>
                  <div className="landing-mk-inventory">
                    <div className="landing-mk-inv-item landing-mk-inv-urgent"><div className="landing-mk-inv-name">Протеин</div><div className="landing-mk-inv-days">2 дня</div></div>
                    <div className="landing-mk-inv-item"><div className="landing-mk-inv-name">Шампунь</div><div className="landing-mk-inv-days">8 дней</div></div>
                    <div className="landing-mk-inv-item"><div className="landing-mk-inv-name">Кроссовки</div><div className="landing-mk-inv-days">42 дня</div></div>
                  </div>
                </div>
              </div>
              <div className="landing-mockup-badge">
                <div className="landing-badge-icon"><svg viewBox="0 0 14 14" fill="none" stroke="#6A9E84" strokeWidth="1.5" strokeLinecap="round"><polyline points="2,9 5,5 8,7 12,3"/></svg></div>
                <div><div className="landing-badge-label">Пассивный доход</div><div className="landing-badge-val">4 400 ₽/мес</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN */}
      <section className="landing-section-wrap">
        <div className="landing-container">
          <div className="landing-pain-block">
            <div className="landing-section-label">Три боли, которые мы решаем</div>
            <h2 className="landing-h2">Почему деньги не накапливаются,<br/>даже когда их хватает</h2>
            <div className="landing-pain-grid">
              <div className="landing-pain-card">
                <div className="landing-pain-icon"><svg viewBox="0 0 16 16" fill="none" stroke="#6A9E84" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.5M8 11h.01"/></svg></div>
                <h3>Усталость от выбора</h3>
                <p>Вы часами сравниваете товары, читаете отзывы и всё равно сомневаетесь. Бесконечный выбор сжигает энергию, которая нужна для настоящих решений.</p>
              </div>
              <div className="landing-pain-card">
                <div className="landing-pain-icon"><svg viewBox="0 0 16 16" fill="none" stroke="#6A9E84" strokeWidth="1.5" strokeLinecap="round"><polyline points="2,12 6,7 9,9 14,4"/><polyline points="11,4 14,4 14,7"/></svg></div>
                <h3>Инфляция образа жизни</h3>
                <p>Зарплата выросла — и расходы выросли. Автоматически. Незаметно. Через год оказывается, что денег по-прежнему «впритък».</p>
              </div>
              <div className="landing-pain-card">
                <div className="landing-pain-icon"><svg viewBox="0 0 16 16" fill="none" stroke="#6A9E84" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2z"/><path d="M8 6v3M8 11h.01"/></svg></div>
                <h3>Финансовая тревожность</h3>
                <p>Смутное ощущение, что «что-то не так», но непонятно что. SmartSpend превращает эту туманную тревогу в чёткие цифры.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOR WHOM */}
      <section className="landing-section-wrap">
        <div className="landing-container">
          <div className="landing-section-label">Для кого</div>
          <h2 className="landing-h2">Узнайте себя</h2>
          <p className="landing-subhead">Если хоть одна фраза звучит знакомо — SmartSpend для вас.</p>
          <div className="landing-fw-list">
            <div className="landing-fw-item">
              <div className="landing-fw-num">01</div>
              <div className="landing-fw-quote">«Трачу нормально, но к концу месяца всегда ноль»</div>
              <div className="landing-fw-answer">Вы не транжира. Просто нет системы. SmartSpend покажет, где спрятаны утечки.</div>
            </div>
            <div className="landing-fw-item">
              <div className="landing-fw-num">02</div>
              <div className="landing-fw-quote">«Хочу копить, но не знаю с чего начать»</div>
              <div className="landing-fw-answer">Копить — это навык, а не воля. Мы дадим готовый алгоритм: Smart-база, ядро, EmoSpend.</div>
            </div>
            <div className="landing-fw-item">
              <div className="landing-fw-num">03</div>
              <div className="landing-fw-quote">«Покупаю одно и то же снова и снова — и это раздражает»</div>
              <div className="landing-fw-answer">Инвентарь и умные наборы возьмут это на себя. Просто получайте уведомление вовремя.</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="landing-how" className="landing-section-wrap">
        <div className="landing-container">
          <div className="landing-section-label">Как это работает</div>
          <h2 className="landing-h2">Три шага до финансового порядка</h2>
          <div className="landing-steps">
            <div className="landing-step">
              <div className="landing-step-num">01</div>
              <h3>Выберите наборы</h3>
              <p>50+ готовых наборов: еда, одежда, косметика, техника. Каждый рассчитан по принципу «максимум пользы — минимум затрат».</p>
              <span className="landing-step-result">→ Не нужно думать, что покупать</span>
            </div>
            <div className="landing-step">
              <div className="landing-step-num">02</div>
              <h3>Добавьте в инвентарь</h3>
              <p>SmartSpend запустит таймеры. Система знает срок службы каждой вещи и предупредит заранее — не когда уже плохо, а когда самое время.</p>
              <span className="landing-step-result">→ Покупки перестают быть срочными</span>
            </div>
            <div className="landing-step">
              <div className="landing-step-num">03</div>
              <h3>Копилка растёт сама</h3>
              <p>Всё, что сэкономлено — направляется в инвестиционное ядро. Со временем пассивный доход начинает оплачивать ваши удовольствия.</p>
              <span className="landing-step-result">→ Богатеете, не меняя образ жизни</span>
            </div>
          </div>
          <div className="landing-mid-cta">
            <div><h3>Готовы попробовать?</h3><p>Регистрация занимает меньше минуты. Карта не нужна.</p></div>
            <button className="landing-btn-primary" onClick={openRegister}>Начать бесплатно →</button>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="landing-section-wrap">
        <div className="landing-container">
          <div className="landing-philosophy">
            <div className="landing-phil-left">
              <div className="landing-section-label">Философия SmartSpend</div>
              <h2 className="landing-h2">Богатство — это не <em>«много»</em>, а <em>«достаточно»</em></h2>
              <p>Мы не учим экономить на всём. Мы помогаем найти точку достаточности — уровень жизни, при котором вы счастливы, и при этом капитал продолжает расти.</p>
            </div>
            <div className="landing-phil-quotes">
              <div className="landing-phil-quote">Трать на жизнь из дохода, а на мечту — из прибыли</div>
              <div className="landing-phil-quote">Сила системы — в предсказуемости расходов и доходов</div>
              <div className="landing-phil-quote">Вечное богатство — это капитал, который невозможно потратить</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="landing-features" className="landing-section-wrap">
        <div className="landing-container">
          <div className="landing-section-label">Инструменты</div>
          <h2 className="landing-h2">Что делает SmartSpend</h2>
          <p className="landing-subhead">Четыре инструмента, которые работают вместе как единая система.</p>
          <div className="landing-feat-grid">
            <div className="landing-feat-card">
              <div className="landing-feat-icon"><svg viewBox="0 0 18 18" fill="none" stroke="#6A9E84" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="14" height="14" rx="3"/><path d="M6 9h6M6 12h4M6 6h6"/></svg></div>
              <h3>Инвентарь вещей</h3>
              <p>Отслеживайте срок службы продуктов, косметики, одежды и техники. Больше не нужно держать это в голове — система помнит за вас.</p>
              <span className="landing-feat-tag">↑ Меньше просрочки и ненужных покупок</span>
            </div>
            <div className="landing-feat-card">
              <div className="landing-feat-icon"><svg viewBox="0 0 18 18" fill="none" stroke="#6A9E84" strokeWidth="1.5" strokeLinecap="round"><path d="M4 5h10M4 9h7M4 13h5"/><circle cx="14" cy="13" r="2.5"/><path d="M13.3 13l.7.7 1.5-1.5"/></svg></div>
              <h3>Умный список покупок</h3>
              <p>Список обновляется автоматически на основе инвентаря. Сортировка по приоритету — сначала то, что нужно срочно.</p>
              <span className="landing-feat-tag">↑ Нулевой умственный ресурс на рутину</span>
            </div>
            <div className="landing-feat-card">
              <div className="landing-feat-icon"><svg viewBox="0 0 18 18" fill="none" stroke="#6A9E84" strokeWidth="1.5" strokeLinecap="round"><polyline points="2,13 6,8 9,10 13,5 16,7"/><path d="M2 16h14"/></svg></div>
              <h3>Копилка (Smart-ядро)</h3>
              <p>Финансовый советник, который анализирует доходы и расходы, ведёт накопительные конверты и показывает путь к точке финансовой безопасности.</p>
              <span className="landing-feat-tag">↑ Капитал растёт предсказуемо</span>
            </div>
            <div className="landing-feat-card">
              <div className="landing-feat-icon"><svg viewBox="0 0 18 18" fill="none" stroke="#6A9E84" strokeWidth="1.5" strokeLinecap="round"><path d="M9 2a7 7 0 1 0 0 14A7 7 0 0 0 9 2z"/><path d="M9 6v3.5l2.5 1.5"/></svg></div>
              <h3>База знаний</h3>
              <p>Статьи об осознанном потреблении, финансовой грамотности и рациональном гедонизме — от экспертов, не от копирайтеров.</p>
              <span className="landing-feat-tag">↑ Понимаете систему, а не просто следуете</span>
            </div>
          </div>
        </div>
      </section>

      {/* SCENARIO */}
      <section id="landing-scenario" className="landing-section-wrap" style={{ paddingTop: 24 }}>
        <div className="landing-container">
          <div className="landing-scenario-card">
            <div className="landing-section-label">Реальный сценарий</div>
            <h2 className="landing-h2">Что будет, если начать сегодня</h2>
            <p className="landing-subhead" style={{ marginBottom: 0 }}>Сценарий А: 18 лет, зарплата 80 000 ₽. 40 000 ₽ — в ядро, 22 000 ₽ — Smart-база.</p>
            <div className="landing-timeline">
              <div className="landing-timeline-item">
                <div className="landing-t-period">Через 1 год</div>
                <div><div className="landing-t-capital">530 000 ₽</div><div className="landing-t-income">Пассивный доход: ~4 400 ₽ / мес</div><span className="landing-t-status">✅ Система запущена</span></div>
              </div>
              <div className="landing-timeline-item">
                <div className="landing-t-period">Через 5 лет</div>
                <div><div className="landing-t-capital">3 100 000 ₽</div><div className="landing-t-income">Пассивный доход: ~26 000 ₽ / мес — покрывает Smart-базу</div><span className="landing-t-status">🎯 Safety Point</span></div>
              </div>
              <div className="landing-timeline-item">
                <div className="landing-t-period">Через 10 лет</div>
                <div><div className="landing-t-capital">8 000 000 ₽</div><div className="landing-t-income">Пассивный доход: ~65 000 ₽ / мес — EmoSpend в 3× больше базы</div><span className="landing-t-status">🚀 Independence Day</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="landing-section-wrap" style={{ paddingTop: 24 }}>
        <div className="landing-container">
          <div className="landing-cta-section">
            <h2 className="landing-h2">Начните сегодня — следующая зарплата уже <em>под контролем</em></h2>
            <p className="landing-subhead" style={{ textAlign: 'center', margin: '0 auto 28px' }}>Бесплатно. Без карты. Без обязательств.</p>
            <button className="landing-btn-primary" onClick={openRegister}>Начать бесплатно →</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer-new">
        <div className="landing-container landing-footer-container">
          <div className="landing-footer-left">
            <div className="landing-logo">
              <LogoMark />
              <span>SmartSpend</span>
            </div>
            <p>© 2025 SmartSpend. Все права защищены.</p>
          </div>
          <div className="landing-footer-center">
            <a href="#">Политика конфиденциальности</a>
            <a href="#">Пользовательское соглашение</a>
          </div>
          <div className="landing-footer-right">
            <a href="#" className="landing-social-link" aria-label="Telegram">
              <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </a>
            <a href="#" className="landing-social-link" aria-label="VK">
              <svg viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/></svg>
            </a>
            <a href="#" className="landing-social-link" aria-label="YouTube">
              <svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M10 10l5 3-5 3v-6z"/></svg>
            </a>
          </div>
        </div>
      </footer>

      <QuizModal open={quizOpen} onClose={() => setQuizOpen(false)} onFinish={handleAuth} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuth={handleAuth} defaultTab={authTab} />
    </>
  )
}
