import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { companies } from '../data/mock'

const CATEGORY_ORDER = [
  'food', 'cafe', 'transport', 'home', 'clothes',
  'leisure', 'health', 'education', 'travel', 'other',
]

function loadSelected() {
  try { return new Set(JSON.parse(localStorage.getItem('ss_companies') || '[]')) }
  catch { return new Set() }
}

function saveSelected(set) {
  localStorage.setItem('ss_companies', JSON.stringify([...set]))
}

// ── COMPANY LOGO ──────────────────────────────────────────────────────────────

function CompanyLogo({ company, selected, onToggle }) {
  return (
    <button
      className={`cpicker-company${selected ? ' selected' : ''}`}
      onClick={() => onToggle(company.id)}
    >
      <div className="cpicker-logo" style={{ background: company.color }}>
        {company.abbr}
      </div>
      <span className="cpicker-name">{company.name}</span>
      {selected && (
        <div className="cpicker-check">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )}
    </button>
  )
}

// ── WIZARD STEP ───────────────────────────────────────────────────────────────

function WizardStep({ catKey, selected, onToggle }) {
  const cat = companies[catKey]
  if (!cat) return null
  return (
    <div className="cpicker-step">
      <div className="cpicker-step-label">Категория</div>
      <div className="cpicker-step-title">{cat.label}</div>
      <div className="cpicker-step-hint">Выберите компании, чьи акции и купоны хотите видеть в ленте</div>
      <div className="cpicker-grid">
        {cat.list.map(c => (
          <CompanyLogo
            key={c.id}
            company={c}
            selected={selected.has(c.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
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

  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState(loadSelected)

  const totalSteps = CATEGORY_ORDER.length
  const isLastStep = step === totalSteps - 1
  const isSummary = step === totalSteps

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

  function finish() {
    saveSelected(selected)
    localStorage.setItem('ss_promo_setup', '1')
    navigate('/feed', { state: { promo: true } })
  }

  const progress = Math.round((step / totalSteps) * 100)

  return (
    <div className="cpicker-page">
      <div className="cpicker-container">

        {/* Header */}
        <div className="cpicker-header">
          <button className="cpicker-back-btn" onClick={goBack} aria-label="Назад">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="cpicker-header-title">
            {isEdit ? 'Изменить компании' : 'Подбор компаний'}
          </div>
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
    </div>
  )
}
