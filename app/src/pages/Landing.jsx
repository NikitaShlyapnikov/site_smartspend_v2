import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

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
    if (step < QUIZ_STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      setDone(true)
    }
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
              <div className="quiz-result-desc">
                SmartSpend поможет вам тратить осознанно и достигать финансовых целей
              </div>
              <button className="quiz-result-btn" onClick={handleFinish}>
                Войти в приложение →
              </button>
            </div>
          ) : (
            <>
              <div className="quiz-q">{current.q}</div>
              {current.name ? (
                <input
                  className="quiz-name-input"
                  placeholder="Ваше имя"
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && next()}
                  autoFocus
                />
              ) : (
                <div className="quiz-options">
                  {current.options.map((opt, i) => (
                    <button
                      key={i}
                      className={`quiz-option${selected === i ? ' selected' : ''}`}
                      onClick={() => { setSelected(i); }}
                    >
                      {opt}
                    </button>
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

export default function Landing() {
  const navigate = useNavigate()
  const { setUsername } = useApp()
  const [quizOpen, setQuizOpen] = useState(false)

  useEffect(() => {
    document.body.classList.remove('app-body', 'sidebar-collapsed')
    document.body.classList.add('landing-body')
    return () => document.body.classList.remove('landing-body')
  }, [])

  useEffect(() => {
    if (localStorage.getItem('ss_auth') === 'true') {
      navigate('/feed', { replace: true })
    }
  }, [navigate])

  function handleFinish(name) {
    localStorage.setItem('ss_auth', 'true')
    localStorage.setItem('ss_username', name)
    setUsername(name)
    navigate('/feed', { replace: true })
  }

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
          <button className="nav-btn-ghost" onClick={() => setQuizOpen(true)}>Войти</button>
          <button className="nav-btn-primary" onClick={() => setQuizOpen(true)}>Начать бесплатно</button>
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
          <button className="btn-hero-primary" onClick={() => setQuizOpen(true)}>
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

      <QuizModal open={quizOpen} onClose={() => setQuizOpen(false)} onFinish={handleFinish} />
    </>
  )
}
