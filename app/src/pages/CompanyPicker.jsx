import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { companies, promoItems } from '../data/mock'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'

const CPICKER_SPOTLIGHT = [
  { targetId: 'sp-cpicker-step',     title: 'Выберите компании',  desc: 'Нажмите на компанию в списке — добавите в выбранные. Справа сразу отображается карточка с описанием, типами акций и примером предложения.' },
  { targetId: 'sp-cpicker-progress', title: 'Категории',          desc: '10 категорий компаний: еда, кафе, транспорт, техника и другие. Выбирайте из каждой сколько нужно — или пропускайте целые категории.' },
  { targetId: 'sp-cpicker-actions',  title: 'Навигация',          desc: '«Далее» переходит к следующей категории, «Назад» — возврат. «Завершить» сохраняет выбор и возвращает в профиль.' },
]

const CATEGORY_ORDER = [
  'food', 'cafe', 'transport', 'home', 'clothes',
  'leisure', 'health', 'education', 'travel', 'other',
]

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

function loadSelected() {
  try { return new Set(JSON.parse(localStorage.getItem('ss_companies') || '[]')) }
  catch { return new Set() }
}
function saveSelected(set) {
  localStorage.setItem('ss_companies', JSON.stringify([...set]))
}
function cNoun(n) {
  const m = n % 10, c = n % 100
  if (c >= 11 && c <= 14) return 'компаний'
  if (m === 1) return 'компания'
  if (m >= 2 && m <= 4) return 'компании'
  return 'компаний'
}

// ── COMPANY ROW ────────────────────────────────────────────────────────────────

function CompanyRow({ company, selected, active, onToggle, onActivate }) {
  return (
    <div
      className={`cpicker-row${selected ? ' selected' : ''}${active ? ' active' : ''}`}
      onClick={() => onToggle(company.id)}
      onMouseEnter={() => onActivate(company.id)}
    >
      <div className="cpicker-row-logo" style={{ background: company.color }}>{company.abbr}</div>
      <span className="cpicker-row-name">{company.name}</span>
      {selected && (
        <div className="cpicker-row-check">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )}
    </div>
  )
}

// ── COMPANY DETAIL PANEL ───────────────────────────────────────────────────────

function CompanyDetail({ company }) {
  if (!company) {
    return (
      <div className="cpicker-detail cpicker-detail--empty">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        <span>Наведите на компанию чтобы увидеть подробности</span>
      </div>
    )
  }

  return (
    <div className="cpicker-detail">
      <div className="cpicker-detail-header">
        <div className="cpicker-detail-logo" style={{ background: company.color }}>{company.abbr}</div>
        <div className="cpicker-detail-header-body">
          <div className="cpicker-detail-name">{company.name}</div>
        </div>
      </div>

      {company.desc && (
        <p className="cpicker-detail-desc">{company.desc}</p>
      )}
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function CompanyPicker() {
  const navigate = useNavigate()

  const [step, setStep]         = useState(0)
  const [dir, setDir]           = useState(1)
  const [selected, setSelected] = useState(loadSelected)
  const [activeId, setActiveId] = useState(null)
  const [showSpotlight, setShowSpotlight] = useState(false)

  const totalSteps = CATEGORY_ORDER.length
  const catKey     = CATEGORY_ORDER[step]
  const cat        = companies[catKey]
  const catList    = cat?.list || []

  // Default active to first company in category when step changes
  useEffect(() => {
    setActiveId(catList[0]?.id || null)
  }, [step]) // eslint-disable-line

  const activeCompany = catList.find(c => c.id === activeId) || catList[0] || null

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function goNext() {
    if (step < totalSteps - 1) { setDir(1); setStep(s => s + 1) }
  }

  function goBack() {
    setDir(-1)
    if (step === 0) { navigate(-1); return }
    setStep(s => s - 1)
  }

  function resetCategory() {
    setSelected(prev => {
      const next = new Set(prev)
      catList.forEach(c => next.delete(c.id))
      return next
    })
  }

  function finish() {
    saveSelected(selected)
    localStorage.setItem('ss_promo_setup', '1')
    navigate('/account', { state: { tab: 'companies' } })
  }

  const progress      = Math.round(((step + 1) / totalSteps) * 100)
  const catSelectedN  = catList.filter(c => selected.has(c.id)).length

  return (
    <Layout>
      <main className="cpicker-main">
        <div className="cpicker-container">

          {/* Header */}
          <div className="cpicker-breadcrumb-row">
            <div className="breadcrumb">
              <span className="breadcrumb-current">Подбор компаний</span>
              <HelpButton seenKey="ss_spl_cpicker" onOpen={() => setShowSpotlight(true)} />
            </div>
            <div className="cpicker-header-right">
              <span className="cpicker-selected-total">Выбрано {selected.size} {cNoun(selected.size)}</span>
              <span className="cpicker-step-counter">{step + 1} / {totalSteps}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div id="sp-cpicker-progress" className="cpicker-progress-wrap">
            <div className="cpicker-progress-bar" style={{ width: `${progress}%` }} />
          </div>

          {/* Category title */}
          <div id="sp-cpicker-step" className="cpicker-cat-header">
            <span className="cpicker-cat-title">{cat?.label}</span>
            {catSelectedN > 0 && (
              <span className="cpicker-cat-count">{catSelectedN} выбрано</span>
            )}
          </div>

          {/* Actions */}
          <div id="sp-cpicker-actions" className="cpicker-actions cpicker-actions--new">
            <div className="cpicker-actions-left">
              <button className="cpicker-btn-back" onClick={goBack}>← Назад</button>
              {catSelectedN > 0 && (
                <button className="cpicker-btn-reset" onClick={resetCategory}>Сбросить</button>
              )}
            </div>
            <div className="cpicker-actions-right">
              <button className="cpicker-btn-finish" onClick={finish}>Готово</button>
              {step < totalSteps - 1 && (
                <button className="cpicker-btn-next" onClick={goNext}>Далее →</button>
              )}
            </div>
          </div>

          {/* Two-column layout */}
          <div key={step} className={`cpicker-two-col cpicker-step-anim cpicker-step-anim--${dir > 0 ? 'fwd' : 'back'}`}>
            <div className="cpicker-list">
              {catList.map(c => (
                <CompanyRow
                  key={c.id}
                  company={c}
                  selected={selected.has(c.id)}
                  active={activeId === c.id || (!activeId && catList[0]?.id === c.id)}
                  onToggle={toggle}
                  onActivate={setActiveId}
                />
              ))}
            </div>
            <CompanyDetail company={activeCompany} />
          </div>

        </div>
      </main>

      {showSpotlight && <SpotlightTour steps={CPICKER_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
    </Layout>
  )
}
