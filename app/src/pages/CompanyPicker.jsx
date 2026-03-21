import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { companies, promoItems } from '../data/mock'
import Layout from '../components/Layout'

const CATEGORY_ORDER = [
  'food', 'cafe', 'transport', 'home', 'clothes',
  'leisure', 'health', 'education', 'travel', 'other',
]
const HOLD_MS = 500

function loadSelected() {
  try { return new Set(JSON.parse(localStorage.getItem('ss_companies') || '[]')) }
  catch { return new Set() }
}
function saveSelected(set) {
  localStorage.setItem('ss_companies', JSON.stringify([...set]))
}

// ── PROMO TYPE META ────────────────────────────────────────────────────────────

const TYPE_META = {
  coupons: {
    label: 'Купоны',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    ),
  },
  events: {
    label: 'Акции',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  broadcast: {
    label: 'Рассылка',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
}

// ── COMPANY INFO SHEET ─────────────────────────────────────────────────────────

function CompanyInfoSheet({ company, selected, onToggle, onClose }) {
  const sample = promoItems.find(p => p.companyId === company.id && p.type !== 'broadcast')
    || promoItems.find(p => p.companyId === company.id)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div className="info-sheet-overlay" onPointerDown={onClose}>
      <div className="info-sheet" onPointerDown={e => e.stopPropagation()}>
        <button className="info-sheet-close" onClick={onClose} aria-label="Закрыть">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/>
          </svg>
        </button>

        <div className="info-sheet-header">
          <div className="info-sheet-logo" style={{ background: company.color }}>
            {company.abbr}
          </div>
          <div>
            <div className="info-sheet-name">{company.name}</div>
            {company.promoTypes?.length > 0 && (
              <div className="info-sheet-types">
                {company.promoTypes.map(t => (
                  <span key={t} className={`info-sheet-type info-sheet-type--${t}`}>
                    {TYPE_META[t]?.icon}
                    {TYPE_META[t]?.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {company.desc && (
          <p className="info-sheet-desc">{company.desc}</p>
        )}

        {sample && (
          <div className="info-sheet-sample">
            <div className="info-sheet-sample-label">Пример акции</div>
            <div className="info-sheet-sample-title">{sample.title}</div>
            {sample.expires && (
              <div className="info-sheet-sample-expires">до {sample.expires}</div>
            )}
          </div>
        )}

        <button
          className={`info-sheet-action${selected ? ' info-sheet-action--remove' : ''}`}
          onClick={() => { onToggle(company.id); onClose() }}
        >
          {selected ? 'Убрать из списка' : '+ Добавить в список'}
        </button>
      </div>
    </div>
  )
}

// ── COMPANY CARD ──────────────────────────────────────────────────────────────

function CompanyCard({ company, selected, onToggle, onInfo }) {
  const [holding, setHolding] = useState(false)
  const [bouncing, setBouncing] = useState(false)
  const [floats, setFloats] = useState([])
  const holdTimer = useRef(null)
  const firedRef  = useRef(false)
  const startPos  = useRef(null)

  function clearAll() {
    clearTimeout(holdTimer.current)
  }

  function handlePointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    firedRef.current = false
    startPos.current = { x: e.clientX, y: e.clientY }
    setHolding(true)
    holdTimer.current = setTimeout(() => {
      firedRef.current = true
      setHolding(false)
      if (navigator.vibrate) navigator.vibrate(30)
      onInfo(company)
    }, HOLD_MS)
  }

  function handlePointerMove(e) {
    if (!startPos.current) return
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    if (Math.sqrt(dx * dx + dy * dy) > 8) {
      clearAll()
      setHolding(false)
    }
  }

  function handlePointerUp() {
    clearAll()
    setHolding(false)
  }

  function handlePointerCancel() {
    clearAll()
    setHolding(false)
  }

  function handleClick() {
    if (firedRef.current) { firedRef.current = false; return }
    const wasSelected = selected
    onToggle(company.id)
    setBouncing(true)
    const id = Date.now() + Math.random()
    setFloats(f => [...f, { id, wasSelected, types: company.promoTypes || [] }])
    setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 950)
  }

  return (
    <button
      className={`cpicker-company${selected ? ' selected' : ''}${holding ? ' holding' : ''}${bouncing ? ' bouncing' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
      onAnimationEnd={e => { if (e.animationName === 'cardBounce') setBouncing(false) }}
      style={{ touchAction: 'none' }}
    >
      <div className="cpicker-logo" style={{ background: company.color }}>
        {company.abbr}
      </div>
      <span className="cpicker-name">{company.name}</span>

      {selected && (
        <div className="cpicker-check">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" className="cpicker-check-path"/>
          </svg>
        </div>
      )}

      {floats.map(f => (
        <div key={f.id} className="cpicker-float">
          {f.wasSelected
            ? <span className="cpicker-float-tag cpicker-float-tag--remove">убрано</span>
            : f.types.map(t => (
                <span key={t} className={`cpicker-float-tag cpicker-float-tag--${t}`}>
                  {TYPE_META[t]?.label}
                </span>
              ))
          }
        </div>
      ))}
    </button>
  )
}

// ── WIZARD STEP ───────────────────────────────────────────────────────────────

function WizardStep({ catKey, selected, onToggle, onInfo, onReset }) {
  const cat = companies[catKey]
  if (!cat) return null
  return (
    <div className="cpicker-step">
      <div className="cpicker-step-label">Категория</div>
      <div className="cpicker-step-title">{cat.label}</div>
      <div className="cpicker-step-hint">
        Нажмите чтобы выбрать · удержите чтобы узнать подробнее
      </div>
      <div className="cpicker-grid">
        {cat.list.map(c => (
          <CompanyCard
            key={c.id}
            company={c}
            selected={selected.has(c.id)}
            onToggle={onToggle}
            onInfo={onInfo}
          />
        ))}
      </div>
      {selected.size > 0 && (
        <div className="cpicker-reset-row">
          <span>Выбрано {selected.size} {cNoun(selected.size)}</span>
          <button className="cpicker-reset-btn" onClick={onReset}>Сбросить всё</button>
        </div>
      )}
    </div>
  )
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────

function Summary({ selected, onFinish, onBack }) {
  const allCompanies = CATEGORY_ORDER.flatMap(k => companies[k]?.list || [])
  const selectedCompanies = allCompanies.filter(c => selected.has(c.id))

  const byCat = CATEGORY_ORDER.map(k => ({
    key: k,
    label: companies[k]?.label,
    list: (companies[k]?.list || []).filter(c => selected.has(c.id)),
  })).filter(g => g.list.length > 0)

  return (
    <div className="cpicker-summary">
      <div className="cpicker-summary-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <div className="cpicker-summary-title">Готово!</div>
      <div className="cpicker-summary-desc">
        Выбрано <strong>{selectedCompanies.length}</strong> {cNoun(selectedCompanies.length)} из{' '}
        {CATEGORY_ORDER.reduce((n, k) => n + (companies[k]?.list.length || 0), 0)} доступных
      </div>

      {byCat.length > 0 ? (
        <div className="cpicker-summary-cats">
          {byCat.map(g => (
            <div key={g.key} className="cpicker-summary-cat">
              <div className="cpicker-summary-cat-label">{g.label}</div>
              <div className="cpicker-summary-cat-list">
                {g.list.map(c => (
                  <div key={c.id} className="cpicker-summary-chip">
                    <span className="cpicker-summary-dot" style={{ background: c.color }} />
                    {c.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cpicker-summary-empty">
          Вы не выбрали ни одной компании. Промо-лента будет пустой — вы сможете изменить выбор позже.
        </div>
      )}

      <div className="cpicker-actions">
        <button className="cpicker-btn-back" onClick={onBack}>Назад</button>
        <button className="cpicker-btn-next" onClick={onFinish}>В ленту</button>
      </div>
    </div>
  )
}

function cNoun(n) {
  const m = n % 10, c = n % 100
  if (c >= 11 && c <= 14) return 'компаний'
  if (m === 1) return 'компания'
  if (m >= 2 && m <= 4) return 'компании'
  return 'компаний'
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function CompanyPicker() {
  const navigate = useNavigate()
  const location = useLocation()
  const isEdit = location.state?.edit === true

  const [step, setStep]         = useState(0)
  const [selected, setSelected] = useState(loadSelected)
  const [infoCompany, setInfoCompany] = useState(null)

  const totalSteps = CATEGORY_ORDER.length
  const isLastStep = step === totalSteps - 1
  const isSummary  = step === totalSteps

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function goNext() {
    if (isLastStep) { setStep(totalSteps); return }
    setStep(s => s + 1)
  }

  function goBack() {
    if (step === 0) { navigate(-1); return }
    if (isSummary) { setStep(totalSteps - 1); return }
    setStep(s => s - 1)
  }

  function resetAll() {
    setSelected(new Set())
  }

  function finish() {
    saveSelected(selected)
    localStorage.setItem('ss_promo_setup', '1')
    navigate('/feed', { state: { promo: true } })
  }

  const progress = Math.round((step / totalSteps) * 100)

  return (
    <Layout>
      <main className="cpicker-main">
        <div className="cpicker-container">

          {/* Breadcrumbs + step counter */}
          <div className="cpicker-breadcrumb-row">
            <nav className="breadcrumb">
              <span className="breadcrumb-item" onClick={() => navigate('/feed')}>Лента</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <span className="breadcrumb-current">
                {isEdit ? 'Изменить компании' : 'Подбор компаний'}
              </span>
            </nav>
            {!isSummary && (
              <div className="cpicker-step-counter">{step + 1} / {totalSteps}</div>
            )}
          </div>

          {/* Progress bar */}
          {!isSummary && (
            <div className="cpicker-progress-wrap">
              <div className="cpicker-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          )}

          {/* Content */}
          <div className="cpicker-content">
            {isSummary ? (
              <Summary selected={selected} onFinish={finish} onBack={goBack} />
            ) : (
              <>
                <WizardStep
                  catKey={CATEGORY_ORDER[step]}
                  selected={selected}
                  onToggle={toggle}
                  onInfo={setInfoCompany}
                  onReset={resetAll}
                />
                <div className="cpicker-actions">
                  <button className="cpicker-btn-skip" onClick={goNext}>
                    {isLastStep ? 'Пропустить' : 'Пропустить шаг'}
                  </button>
                  <button className="cpicker-btn-next" onClick={goNext}>
                    {isLastStep ? 'Готово' : 'Далее'}
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </main>

      {/* Info sheet */}
      {infoCompany && (
        <CompanyInfoSheet
          company={infoCompany}
          selected={selected.has(infoCompany.id)}
          onToggle={toggle}
          onClose={() => setInfoCompany(null)}
        />
      )}
    </Layout>
  )
}
