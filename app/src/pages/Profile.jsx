import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'
import { useApp } from '../context/AppContext'
import { inventoryGroups } from '../data/mock'

// Inventory group id → envelope category ids
const GROUP_CATS = {
  g1: ['clothes'],
  g2: ['food'],
  g3: ['home'],
  g4: ['health'],
  g5: ['transport'],
  g6: ['leisure'],
  g7: ['education'],
  g8: ['other'],
}

const BASE_RETURN = 0.04

// ── Profile Tour ─────────────────────────────────────────────────────────────
// ── Spotlight Tour ─────────────────────────────────────────────────────────────
const SPOTLIGHT_STEPS = [
  {
    targetId: 'sp-tiles',
    btnId: null,
    title: 'Финансовые показатели',
    desc: 'Сводка по текущему месяцу: твой доход, общие расходы и сколько остаётся на накопления.',
  },
  {
    targetId: 'sp-finance',
    btnId: 'sp-btn-finance',
    title: 'Финансовая картина',
    desc: 'Детальная разбивка расходов — жильё, кредит, конверты. Нажми «Редактировать», чтобы указать доход и обязательные расходы.',
  },
  {
    targetId: 'sp-emo',
    btnId: 'sp-btn-emo',
    title: 'Капитал и EmoSpend',
    desc: 'Показывает накопления и сколько можно тратить на удовольствия. Выбери уровень удовольствия — он определяет размер EmoSpend.',
  },
  {
    targetId: 'sp-deposits',
    btnId: null,
    title: 'Вклады и накопительные счета',
    desc: 'Сравни ставки в банках и выбери лучшее предложение для своего капитала. Доступны фильтры по сроку, банку и условиям.',
  },
  {
    targetId: 'sp-envelopes',
    btnId: 'sp-btn-envelopes',
    title: 'Конверты и наборы',
    desc: 'Твой план расходов по категориям. Нажми «Редактировать», чтобы добавить наборы из каталога.',
  },
  {
    targetId: 'sp-cards',
    btnId: null,
    title: 'Подбор банковской карты',
    desc: 'Найди карту с кешбэком под твои категории трат — продукты, транспорт, рестораны или путешествия.',
  },
]


const DEFAULT_FINANCE = {
  income: 0,
  housing: 0,
  credit: 0,
  creditMonths: 0,
  capital: 0,
  updatedAt: '',
}

function loadFinance() {
  try {
    const raw = localStorage.getItem('ss_finance')
    if (raw) {
      const parsed = JSON.parse(raw)
      // Сброс старых тестовых данных — если капитал был захардкожен
      if (parsed.capital === 1240000) {
        localStorage.removeItem('ss_finance')
        return DEFAULT_FINANCE
      }
      return { ...DEFAULT_FINANCE, ...parsed }
    }
  } catch {}
  return DEFAULT_FINANCE
}

function saveFinance(data) {
  localStorage.setItem('ss_finance', JSON.stringify(data))
}

const BASE_STEPS = [
  { id: 'income',  q: 'Ваш ежемесячный доход',        hint: 'Укажите сумму после вычета налогов, которую вы получаете на руки', icon: '💰', unit: '₽ / мес' },
  { id: 'housing', q: 'Расходы на жильё в месяц',      hint: 'Аренда или ипотека + коммунальные услуги (свет, вода, интернет)', icon: '🏠', unit: '₽ / мес' },
  { id: 'credit',  q: 'Кредитные выплаты в месяц',     hint: 'Все кредиты, ипотека (если не учтена выше), кредитные карты',    icon: '💳', unit: '₽ / мес' },
  { id: 'capital', q: 'Ваш общий капитал',              hint: 'Накопления, вклады, инвестиции, брокерский счёт — всё вместе',   icon: '📈', unit: '₽' },
]
const CREDIT_MONTHS_STEP = {
  id: 'creditMonths',
  q: 'Сколько месяцев осталось платить?',
  hint: 'Когда кредит закроется, эта сумма начнёт пополнять ваши накопления — прогноз учтёт это',
  icon: '📅',
  unit: 'мес',
}

function FinancialModal({ open, initialData, onSave, onClose }) {
  const [step, setStep] = useState(0)
  const [values, setValues] = useState({
    income:       String(initialData.income),
    housing:      String(initialData.housing),
    credit:       String(initialData.credit),
    creditMonths: String(initialData.creditMonths ?? 0),
    capital:      String(initialData.capital),
  })
  const [done, setDone] = useState(false)

  // Dynamically build steps: insert creditMonths after credit if credit > 0
  const hasCredit = parseInt(values.credit) > 0
  const steps = hasCredit
    ? [BASE_STEPS[0], BASE_STEPS[1], BASE_STEPS[2], CREDIT_MONTHS_STEP, BASE_STEPS[3]]
    : BASE_STEPS

  const current = steps[step]
  const progress = ((step + 1) / steps.length) * 100
  const rawVal = values[current?.id] || ''
  const numVal = parseInt(rawVal.replace(/\s/g, ''), 10)
  const isValid = !isNaN(numVal) && numVal >= 0

  function handleInput(e) {
    const digits = e.target.value.replace(/\D/g, '')
    setValues(v => ({ ...v, [current.id]: digits }))
  }

  function next() {
    if (!isValid) return
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      setDone(true)
    }
  }

  function back() {
    if (step > 0) setStep(s => s - 1)
  }

  function handleSave() {
    const now = new Date()
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
    const credit = parseInt(values.credit) || 0
    const result = {
      income:       parseInt(values.income) || 0,
      housing:      parseInt(values.housing) || 0,
      credit,
      creditMonths: credit > 0 ? (parseInt(values.creditMonths) || 0) : 0,
      capital:      parseInt(values.capital) || 0,
      updatedAt:    dateStr,
    }
    saveFinance(result)
    onSave(result)
    handleClose()
  }

  function handleClose() {
    setStep(0)
    setDone(false)
    setValues({
      income:       String(initialData.income),
      housing:      String(initialData.housing),
      credit:       String(initialData.credit),
      creditMonths: String(initialData.creditMonths ?? 0),
      capital:      String(initialData.capital),
    })
    onClose()
  }

  if (!open) return null

  return (
    <div className="quiz-overlay open" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="quiz-modal fin-modal">
        <div className="quiz-progress-bar" style={{ width: `${progress}%` }} />
        <div className="quiz-inner">
          {done ? (
            <div className="quiz-result">
              <div className="quiz-result-icon">✅</div>
              <div className="quiz-result-title">Данные обновлены</div>
              <div className="quiz-result-desc">
                Финансовая картина и прогноз накоплений пересчитаны с новыми данными
              </div>
              <button className="quiz-result-btn" onClick={handleSave}>
                Сохранить →
              </button>
            </div>
          ) : (
            <>
              <div className="fin-step-icon">{current.icon}</div>
              <div className="quiz-q">{current.q}</div>
              <div className="fin-step-hint">{current.hint}</div>
              <div className="fin-input-wrap">
                <input
                  className="fin-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={rawVal ? parseInt(rawVal).toLocaleString('ru') : ''}
                  onChange={handleInput}
                  onKeyDown={e => e.key === 'Enter' && next()}
                  autoFocus
                />
                <span className="fin-input-unit">{current.unit}</span>
              </div>
              <div className="quiz-actions">
                {step > 0 && (
                  <button className="quiz-btn-skip" onClick={back}>← Назад</button>
                )}
                <button
                  className="quiz-btn-next"
                  onClick={next}
                  disabled={!isValid}
                  style={{ opacity: isValid ? 1 : 0.4, cursor: isValid ? 'pointer' : 'default' }}
                >
                  {step < steps.length - 1 ? 'Далее →' : 'Завершить'}
                </button>
              </div>
            </>
          )}
        </div>
        <button className="fin-modal-close" onClick={handleClose} title="Закрыть">✕</button>
      </div>
    </div>
  )
}

const FEDERAL_PM_2026 = 20644  // Прожиточный минимум РФ 2026, ₽/мес
const SMART_SPEND_BASE = Math.round(FEDERAL_PM_2026 * 0.75) // 75% — конверты (без жилья ~25%)

const EMO_RATES = [
  { rate: 0.04, label: 'FIRE', pct: '4%', level: 'low' },
  { rate: 0.05, label: 'SMART', pct: '5%', level: 'medium' },
  { rate: 0.07, label: 'RICH', pct: '7%', level: 'high' },
  { rate: 0.10, label: 'EXTRA', pct: '10%', level: 'extra' },
]

// ── Категории конвертов ──
const CATEGORIES = [
  { id: 'other',      name: 'Прочие расходы',        color: '#B0A898' },
  { id: 'all',        name: 'Все покупки',            color: '#A8B8C8' },
  { id: 'food',       name: 'Еда и Супермаркеты',    color: '#8DBFA8' },
  { id: 'cafe',       name: 'Кафе, Бары, Рестораны', color: '#C4A882' },
  { id: 'transport',  name: 'Авто и Транспорт',      color: '#8AAFC8' },
  { id: 'home',       name: 'Дом и Техника',         color: '#9EA8C0' },
  { id: 'clothes',    name: 'Одежда и Обувь',        color: '#B8A0C8' },
  { id: 'leisure',    name: 'Развлечения и Хобби',   color: '#C8A8A0' },
  { id: 'health',     name: 'Красота и Здоровье',    color: '#C4B0C0' },
  { id: 'education',  name: 'Образование и Дети',    color: '#A8C0B0' },
  { id: 'travel',     name: 'Путешествия и Отдых',   color: '#C0B898' },
]

// Map profile envelope category → catalog category filter
const CAT_TO_CATALOG = {
  food:       'food',
  cafe:       'food',
  clothes:    'clothes',
  home:       'home',
  transport:  'transport',
  health:     'health',
  leisure:    'leisure',
  education:  'all',
  travel:     'leisure',
  other:      'all',
  all:        'all',
}

const INITIAL_ENVELOPES = {}

function loadEnvelopes() {
  try {
    const raw = localStorage.getItem('ss_envelopes')
    if (raw) return JSON.parse(raw)
  } catch {}
  return INITIAL_ENVELOPES
}

function saveEnvelopes(data) {
  localStorage.setItem('ss_envelopes', JSON.stringify(data))
}

function loadInventoryExtra() {
  try { return JSON.parse(localStorage.getItem('ss_inventory_extra') || '[]') } catch { return [] }
}

function calcItemMonthly(item) {
  if (item.type === 'consumable') {
    const qty = item.qty || 100
    return Math.round(((item.price || 0) / qty) * (item.dailyUse || 1) * 30)
  }
  return Math.round(((item.price || 0) / (item.wearLifeWeeks || 52)) * 4.33)
}

const SOURCE_META = {
  smartspend: { label: 'SmartSpend', cls: 'smartspend' },
  community:  { label: 'Сообщество', cls: 'community' },
  custom:     { label: 'Мой набор',  cls: '' },
  personal:   { label: 'Личное',     cls: 'personal' },
}

function SourceIcon({ source }) {
  if (source === 'smartspend') return (
    <svg className="set-source-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="1.5" y="1.5" width="4" height="4" rx="1"/><rect x="8.5" y="1.5" width="4" height="4" rx="1"/>
      <rect x="1.5" y="8.5" width="4" height="4" rx="1"/><rect x="8.5" y="8.5" width="4" height="4" rx="1"/>
    </svg>
  )
  if (source === 'community') return (
    <svg className="set-source-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="5" cy="4.5" r="2"/><circle cx="9.5" cy="4.5" r="1.5"/>
      <path d="M1 11c0-2.2 1.8-4 4-4s4 1.8 4 4"/><path d="M9.5 8c1.4 0 2.5 1 2.5 2.5"/>
    </svg>
  )
  if (source === 'personal') return (
    <svg className="set-source-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="7" cy="4.5" r="2.5"/><path d="M2 12.5c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
    </svg>
  )
  return (
    <svg className="set-source-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M7 1.5l1.5 3 3.5.5-2.5 2.5.5 3.5L7 9.5l-3 1.5.5-3.5L2 5l3.5-.5z"/>
    </svg>
  )
}

function TypeTag({ type, period }) {
  if (type === 'consumable') return (
    <span className="set-meta-tag">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10"/><path d="M12 6v6l4 2"/>
      </svg>
      {period}
    </span>
  )
  return (
    <span className="set-meta-tag">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
      {period}
    </span>
  )
}

function SetCard({ set, onDelete, onOpen, onPause, editMode }) {
  const isClickable = !editMode && (set.id || set.source === 'personal')
  const isPaused = !!set.paused
  return (
    <div className={`set-card${isPaused ? ' paused' : ''}`} onClick={isClickable ? onOpen : undefined} style={isClickable ? { cursor: 'pointer' } : {}}>
      <div className="set-card-name">{set.name}</div>
      {isPaused && <div className="set-card-paused-label">На паузе</div>}
      <div className="set-card-bottom">
        <span className={`set-card-amount${isPaused ? ' muted' : ''}`}>{set.amount ? set.amount.toLocaleString('ru') + ' ₽' : '—'}</span>
        <span className="set-card-period">/ мес</span>
      </div>
      {set.source !== 'personal' && (
        <button
          className={`set-pause-btn${isPaused ? ' playing' : ''}${editMode ? ' always-show' : ''}`}
          onClick={e => { e.stopPropagation(); onPause() }}
          title={isPaused ? 'Запустить' : 'Поставить на паузу'}
        >
          {isPaused ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          )}
        </button>
      )}
      {editMode && set.source !== 'personal' && (
        <button className="set-delete" onClick={e => { e.stopPropagation(); onDelete() }} title="Удалить набор">✕</button>
      )}
    </div>
  )
}

function BudgetGroup({ group }) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  return (
    <div>
      <div
        className={`bl-group-header collapsible${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="bl-group-chevron">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className="bl-group-label">{group.label}</span>
        <span className="bl-group-total">
          {group.total !== null ? `−${Math.abs(group.total).toLocaleString('ru')} ₽` : <span className="muted">не указаны</span>}
        </span>
        <span className="bl-group-pct">
          {group.pct !== null ? `${group.pct}%` : <span className="muted">—</span>}
        </span>
      </div>
      {open && (
        <div className="bl-group-rows">
          {group.rows.map((row, i) => (
            <div key={i} className="bl-row sub">
              <span className="bl-label">{row.label}</span>
              <span className="bl-value">−{Math.abs(row.value).toLocaleString('ru')} ₽</span>
            </div>
          ))}
          {group.hint && !dismissed && (
            <div className={`ctx-hint${group.hintType === 'info' ? ' info' : ''}`}>
              {group.hintType === 'warn'
                ? <svg className="ctx-hint-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                : <svg className="ctx-hint-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              }
              <span className="ctx-hint-text">{group.hint}</span>
              <button className="ctx-hint-dismiss" onClick={e => { e.stopPropagation(); setDismissed(true) }} title="Скрыть">✕</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.', ',') + ' млн'
  return Math.round(n / 1000) + ' тыс'
}

function forecastKey(fin) {
  return `${fin.income}|${fin.housing}|${fin.credit}|${fin.creditMonths}|${fin.capital}`
}

// Прогноз накоплений: капитал растёт на BASE_RETURN + свободный остаток (кредит освобождается после погашения)
// EmoSpend НЕ вычитается из капитала — он считается отдельно как потенциал трат
function calcSavings(monthlyFree, emoRate, startCapital, creditPayment = 0, remainingCreditMonths = 0) {
  const points = []
  let cap = startCapital
  for (let m = 1; m <= 120; m++) {
    const freed = creditPayment > 0 && remainingCreditMonths > 0 && m > remainingCreditMonths ? creditPayment : 0
    cap = cap + cap * (BASE_RETURN - emoRate) / 12 + monthlyFree + freed
    if (m % 12 === 0) {
      points.push({ year: m / 12, cap: Math.round(cap), emo: Math.round(cap * emoRate / 12) })
    }
  }
  return points
}

// Предел накоплений: первый год когда годовой прирост капитала падает ниже 5%
function findSavingsCeiling(monthlyFree, emoRate, startCapital, creditPayment = 0, remainingCreditMonths = 0) {
  let cap = startCapital
  let prevYearCap = startCapital
  for (let m = 1; m <= 600; m++) {
    const freed = creditPayment > 0 && remainingCreditMonths > 0 && m > remainingCreditMonths ? creditPayment : 0
    cap = cap + cap * (BASE_RETURN - emoRate) / 12 + monthlyFree + freed
    if (cap <= 0) return { year: Math.ceil(m / 12), cap: 0, depleted: true }
    if (m % 12 === 0) {
      const yoy = prevYearCap > 0 ? (cap - prevYearCap) / prevYearCap : 1
      if (yoy < 0.05 && cap > startCapital) return { year: m / 12, cap: Math.round(cap), depleted: false }
      prevYearCap = cap
    }
  }
  return null
}

function calcTrajectory(emoRate, monthlyInvest, capital, creditPayment = 0, creditMonths = 0) {
  const points = []
  let cap = capital
  for (let m = 1; m <= 120; m++) {
    // After credit is paid off, the freed payment is added to monthly investment
    const freed = creditPayment > 0 && creditMonths > 0 && m > creditMonths ? creditPayment : 0
    const invest = monthlyInvest + freed
    const growth = cap * BASE_RETURN / 12
    const spending = cap * emoRate / 12
    cap = cap + growth - spending + invest
    if (m % 12 === 0) {
      points.push({ year: m / 12, cap: Math.round(cap), emo: Math.round(cap * emoRate / 12) })
    }
  }
  return points
}

function ForecastCollapsible({ open, onToggle, emoRate, dark, monthlyInvest, capital, credit, creditMonths }) {
  // Считаем сводку через ту же функцию — всегда актуально
  const pts = calcTrajectory(emoRate, monthlyInvest, capital, credit, creditMonths)
  const last = pts[pts.length - 1] || { cap: capital, emo: 0 }
  const capFmt = last.cap >= 1_000_000
    ? (last.cap / 1_000_000).toFixed(1).replace('.', ',') + '\u00a0млн ₽'
    : last.cap.toLocaleString('ru') + '\u00a0₽'
  const emoFmt = last.emo.toLocaleString('ru') + '\u00a0₽'

  return (
    <div className="forecast-collapsible">
      <button className="forecast-toggle-row" onClick={onToggle}>
        <div className="forecast-toggle-left">
          <span className="forecast-toggle-title">Прогноз накоплений · 10 лет · чистая доходность 4% годовых</span>
          {!open && (
            <div className="forecast-toggle-pills">
              <span className="ftpill ftpill-cap">{capFmt}</span>
              <span className="ftpill ftpill-sep">·</span>
              <span className="ftpill ftpill-emo">EmoSpend {emoFmt}/мес</span>
            </div>
          )}
        </div>
        <svg
          className={`forecast-toggle-chevron${open ? ' open' : ''}`}
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {open && (
        <ForecastChart
          emoRate={emoRate} dark={dark}
          monthlyInvest={monthlyInvest} capital={capital}
          creditPayment={credit} creditMonths={creditMonths}
        />
      )}
    </div>
  )
}

function ForecastChart({ emoRate, dark, monthlyInvest, capital, creditPayment, creditMonths }) {
  const canvasRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.parentElement.clientWidth
    const H = 220
    canvas.width = W * window.devicePixelRatio
    canvas.height = H * window.devicePixelRatio
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    ctx.clearRect(0, 0, W, H)

    const data = calcTrajectory(emoRate, monthlyInvest, capital, creditPayment, creditMonths)
    const dataBase = calcTrajectory(BASE_RETURN, monthlyInvest, capital, creditPayment, creditMonths)

    const padL = 68, padR = 16, padT = 20, padB = 28
    const chartW = W - padL - padR
    const chartH = H - padT - padB

    const maxCap = Math.max(...dataBase.map(d => d.cap))
    const maxEmo = Math.max(...data.map(d => d.emo))

    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = padT + chartH - (i / 4) * chartH
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke()
      ctx.fillStyle = dark ? '#5A5854' : '#AAAAAA'
      ctx.font = `10px 'Geist Mono', monospace`
      ctx.textAlign = 'right'
      ctx.fillText(fmt(maxCap * i / 4), padL - 8, y + 3.5)
    }

    const n = data.length
    const groupW = chartW / n
    const barPad = groupW * 0.14
    const barW = Math.max(4, (groupW - barPad * 2) / 2 - 2)

    const drawBar = (x, h, color) => {
      const r = 3
      const by = padT + chartH - h
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(x + r, by); ctx.lineTo(x + barW - r, by)
      ctx.quadraticCurveTo(x + barW, by, x + barW, by + r)
      ctx.lineTo(x + barW, padT + chartH); ctx.lineTo(x, padT + chartH)
      ctx.lineTo(x, by + r); ctx.quadraticCurveTo(x, by, x + r, by)
      ctx.closePath(); ctx.fill()
    }

    data.forEach((d, i) => {
      const gx = padL + i * groupW + barPad
      drawBar(gx, (d.cap / maxCap) * chartH, '#8DBFA8')
      const emoMaxH = chartH * 0.4
      drawBar(gx + barW + 2, (d.emo / maxEmo) * emoMaxH, '#D4C9B8')
      ctx.fillStyle = dark ? '#5A5854' : '#AAAAAA'
      ctx.font = `10px 'Geist', sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(d.year + ' л', padL + i * groupW + groupW / 2, H - 8)
    })

    if (barW > 14) {
      data.forEach((d, i) => {
        const gx = padL + i * groupW + barPad
        const capH = (d.cap / maxCap) * chartH
        ctx.fillStyle = dark ? '#7AAF96' : '#5A8A70'
        ctx.font = `9px 'Geist Mono', monospace`
        ctx.textAlign = 'left'
        ctx.fillText(fmt(d.cap), gx, padT + chartH - capH - 4)
        const emoMaxH = chartH * 0.4
        const emoH = (d.emo / maxEmo) * emoMaxH
        ctx.fillStyle = dark ? '#A09880' : '#94A3B8'
        ctx.fillText(fmt(d.emo), gx + barW + 2, padT + chartH - emoH - 4)
      })
    }
  }, [emoRate, dark, monthlyInvest, capital, creditPayment, creditMonths])

  useEffect(() => {
    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [draw])

  const data = calcTrajectory(emoRate, monthlyInvest, capital, creditPayment, creditMonths)
  const dataBase = calcTrajectory(BASE_RETURN, monthlyInvest, capital, creditPayment, creditMonths)
  const last = data[data.length - 1]
  const lastBase = dataBase[dataBase.length - 1]
  const diff = last.cap - lastBase.cap
  const showBase = emoRate > BASE_RETURN
  const diffStr = diff < 0
    ? `−${Math.abs(diff).toLocaleString('ru')} ₽`
    : `+${diff.toLocaleString('ru')} ₽`

  return (
    <div className="forecast-inner">
      <div className="forecast-legend">
        <span className="fc-legend-item"><span className="fc-dot capital" />Капитал</span>
        <span className="fc-legend-item"><span className="fc-dot emo" />EmoSpend / мес</span>
      </div>
      <div className="forecast-chart-wrap">
        <canvas ref={canvasRef} height="220" />
      </div>
      <div className="forecast-summary">
        <div className="fc-sum-item">
          <span className="fc-sum-label">Капитал через 10 лет</span>
          <span className="fc-sum-value cap">{last.cap.toLocaleString('ru')} ₽</span>
          {showBase && <span className="fc-sum-delta">{diffStr} от базовой</span>}
        </div>
        <div className="fc-sum-item">
          <span className="fc-sum-label">EmoSpend / мес через 10 лет</span>
          <span className="fc-sum-value emo">{last.emo.toLocaleString('ru')} ₽</span>
        </div>
        <div className="fc-sum-item">
          <span className="fc-sum-label">Пополнение за 10 лет</span>
          <span className="fc-sum-value">+{(monthlyInvest * 120).toLocaleString('ru')} ₽</span>
          {creditPayment > 0 && creditMonths > 0 && creditMonths <= 120 && (
            <span className="fc-sum-delta fc-credit-hint">
              +{creditPayment.toLocaleString('ru')} ₽/мес после закрытия кредита через {creditMonths} мес.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const { username, dark } = useApp()
  const navigate = useNavigate()
  const [emoRate, setEmoRate] = useState(0.04)
  const [bsOpen, setBsOpen] = useState(false)
  const [envelopes, setEnvelopes] = useState(loadEnvelopes)
  const [editMode, setEditMode] = useState(false)
  const [finOpen, setFinOpen] = useState(false)
  const [finance, setFinance] = useState(loadFinance)
  const [showSpotlight, setShowSpotlight] = useState(false)
  const [chartOpen, setChartOpen] = useState(() => {
    const current = forecastKey(loadFinance())
    return localStorage.getItem('ss_forecast_seen') !== current
  })

  function toggleChart() {
    if (chartOpen) {
      // пользователь сворачивает — фиксируем как просмотренное
      localStorage.setItem('ss_forecast_seen', forecastKey(finance))
    }
    setChartOpen(o => !o)
  }

  const { income, housing, credit, creditMonths = 0, capital, updatedAt } = finance

  // Личные (сиротские) позиции инвентаря → по категориям конвертов
  const personalByCat = (() => {
    const base = inventoryGroups.flatMap(g => g.items.map(item => ({ ...item, groupId: g.id })))
    const extra = loadInventoryExtra().map(i => ({ ...i, isExtra: true }))
    const allItems = [...base, ...extra]
    const map = {}
    CATEGORIES.forEach(cat => {
      if (cat.id === 'all') return
      const matchIds = new Set(
        inventoryGroups.filter(g => (GROUP_CATS[g.id] || []).includes(cat.id)).map(g => g.id)
      )
      const orphans = allItems.filter(i => matchIds.has(i.groupId) && !i.setId)
      if (orphans.length > 0) map[cat.id] = orphans
    })
    return map
  })()

  // Суммируем конверты + личные позиции инвентаря по категориям (паузированные наборы исключаются)
  const grandTotal = CATEGORIES.reduce((sum, cat) => {
    const envAmt = (envelopes[cat.id] || []).filter(x => !x.paused).reduce((s, x) => s + x.amount, 0)
    const personalAmt = (personalByCat[cat.id] || []).reduce((s, i) => s + calcItemMonthly(i), 0)
    return sum + envAmt + personalAmt
  }, 0)

  // Динамический перерасчёт
  const totalExpenses = housing + credit + grandTotal
  const savings = income - totalExpenses
  const monthlyInvest = Math.max(0, savings)

  // Строим группы финансовой картины из актуальных данных
  const housingPct = income > 0 ? Math.round(housing / income * 100) : null
  const creditPct = income > 0 ? Math.round(credit / income * 100) : null
  const staticGroups = [
    {
      id: 'housing', label: 'Жильё', total: -housing, pct: housingPct,
      rows: [{ label: 'Аренда / ипотека + ЖКХ', value: -housing }],
      hint: housingPct != null
        ? (housingPct > 30
          ? `${housingPct}% дохода на жильё — выше рекомендуемых 25–30%. Если аренда выросла, возможно стоит пересмотреть бюджет.`
          : `${housingPct}% дохода на жильё — в норме.`)
        : null,
      hintType: housingPct != null && housingPct > 30 ? 'warn' : 'info',
    },
    {
      id: 'credit', label: 'Кредиты', total: -credit, pct: creditPct,
      rows: credit > 0 ? [{ label: 'Кредиты и кредитные карты', value: -credit }] : [],
      hint: credit > 0 && creditPct != null
        ? `Кредитная нагрузка ${creditPct}% дохода — ${creditPct <= 20 ? 'в норме.' : 'выше рекомендуемых 20%. Рассмотрите досрочное погашение.'}`
        : null,
      hintType: creditPct == null || creditPct <= 20 ? 'info' : 'warn',
    },
  ]

  const emoAnnual = Math.round(capital * emoRate)
  const emoMonthly = Math.round(emoAnnual / 12)

  // Чистый доход = доход − жильё − кредиты (до конвертов)
  const netIncome = income > 0 ? Math.max(0, income - housing - credit) : 0
  // Если чистый доход >= ПМ — используем ПМ как потолок; иначе берём чистый доход
  const useBasePM = income > 0 && netIncome >= SMART_SPEND_BASE
  const budgetBase = income > 0 ? Math.min(netIncome, SMART_SPEND_BASE) : SMART_SPEND_BASE
  const sustainableBudget = budgetBase + emoMonthly
  const envelopeDiff = grandTotal - sustainableBudget
  const neededCapital = envelopeDiff > 0
    ? Math.round(envelopeDiff * 12 / emoRate)
    : 0
  // Предупреждение: чистый доход ниже прожиточного минимума конвертов
  const showPmWarn = income > 0 && netIncome < SMART_SPEND_BASE

  const envelopesGroup = {
    id: 'envelopes',
    label: 'Конверты',
    total: -grandTotal,
    pct: income > 0 ? Math.round(grandTotal / income * 100) : null,
    hint: showPmWarn ? `Чистый доход ${netIncome.toLocaleString('ru')} ₽ ниже базового минимума — рекомендуем сначала увеличить доход.` : null,
    hintType: 'warn',
    rows: CATEGORIES
      .filter(cat => (envelopes[cat.id] || []).some(x => !x.paused))
      .map(cat => ({
        label: cat.name,
        value: -(envelopes[cat.id] || []).filter(x => !x.paused).reduce((s, x) => s + x.amount, 0),
      })),
  }

  const budgetGroups = [
    ...staticGroups,
    envelopesGroup,
    { id: 'other', label: 'Прочие расходы', total: null, pct: null, rows: [] },
  ]

  const savingsPct = income > 0 ? Math.round((savings / income) * 100) : 0
  const greetingSubtitle = (() => {
    if (!income || income <= 0) {
      return <>Укажи доход в разделе «Финансовая картина» — и система покажет, сколько ты откладываешь каждый месяц.</>
    }
    if (savings < 0) {
      const deficit = Math.abs(savings).toLocaleString('ru')
      return <>Расходы превышают доход на <strong>{deficit} ₽</strong> — самое время пересмотреть конверты и найти, где можно сократить.</>
    }
    if (savingsPct < 5) {
      return <>Откладывается совсем немного — <strong>{savingsPct}% дохода</strong>. Попробуй найти статью расходов, которую можно сократить хотя бы на пару тысяч.</>
    }
    if (savingsPct < 15) {
      return <>В этом месяце откладываешь <strong>{savingsPct}% дохода</strong> — есть куда расти. Постепенно стремись к 20%, и капитал начнёт работать заметнее.</>
    }
    if (savingsPct < 25) {
      return <>В этом месяце откладываешь <strong>{savingsPct}% дохода</strong> — хороший темп накопления. Держи курс.</>
    }
    if (savingsPct < 40) {
      return <>Откладываешь <strong>{savingsPct}% дохода</strong> — отличный результат. Такой темп позволяет капиталу расти быстрее инфляции.</>
    }
    return <>Откладываешь <strong>{savingsPct}% дохода</strong> — впечатляющая дисциплина. При таком темпе финансовая независимость ближе, чем кажется.</>
  })()

  function deleteSet(catId, idx) {
    setEnvelopes(prev => {
      const setEntry = (prev[catId] || [])[idx]
      const next = { ...prev, [catId]: [...(prev[catId] || [])] }
      next[catId].splice(idx, 1)
      saveEnvelopes(next)
      // Удаляем замороженные позиции этого набора из инвентаря
      if (setEntry?.id) {
        try {
          const invData = JSON.parse(localStorage.getItem('ss_inventory_extra') || '[]')
          const filtered = invData.filter(e => !(e.setId === setEntry.id && e.paused))
          localStorage.setItem('ss_inventory_extra', JSON.stringify(filtered))
        } catch {}
      }
      return next
    })
  }

  function togglePauseSet(catId, idx) {
    setEnvelopes(prev => {
      const list = [...(prev[catId] || [])]
      const entry = { ...list[idx] }
      const nowPaused = !entry.paused
      entry.paused = nowPaused
      list[idx] = entry
      const next = { ...prev, [catId]: list }
      saveEnvelopes(next)
      if (entry.id) {
        try {
          const invData = JSON.parse(localStorage.getItem('ss_inventory_extra') || '[]')
          const updated = invData.map(i => i.setId === entry.id ? { ...i, paused: nowPaused } : i)
          localStorage.setItem('ss_inventory_extra', JSON.stringify(updated))
        } catch {}
      }
      return next
    })
  }

  function goToCatalog(catId) {
    const catalogCat = CAT_TO_CATALOG[catId] || 'all'
    navigate(`/catalog?cat=${catalogCat}`)
  }

  const visibleCats = CATEGORIES
    .filter(cat => {
      const sets = envelopes[cat.id] || []
      return sets.length > 0 || (personalByCat[cat.id] || []).length > 0 || editMode
    })
    .sort((a, b) => {
      const totalA = (envelopes[a.id] || []).filter(x => !x.paused).reduce((s, x) => s + x.amount, 0)
        + (personalByCat[a.id] || []).reduce((s, i) => s + calcItemMonthly(i), 0)
      const totalB = (envelopes[b.id] || []).filter(x => !x.paused).reduce((s, x) => s + x.amount, 0)
        + (personalByCat[b.id] || []).reduce((s, i) => s + calcItemMonthly(i), 0)
      return totalB - totalA
    })

  return (
    <Layout>
      <main className="profile-main">
        {/* Приветствие */}
        <div className="entry-header" id="sp-tiles">
          <div className="entry-greeting">
            <div className="entry-title" style={{display:'flex',alignItems:'center',gap:10}}>
              Привет, {username.split(' ')[0]}
              <HelpButton seenKey="ss_spl_profile" onOpen={() => setShowSpotlight(true)} />
            </div>
          </div>
        </div>

        {/* Финансовая картина */}
        <div id="sp-finance">
          <div className="section-heading">
            <div>
              <span className="section-title">Бюджет месяца</span>
              <div className="section-subtitle">Сколько приходит и куда уходит каждый месяц</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2}}>
              <button id="sp-btn-finance" className="section-link" onClick={() => setFinOpen(true)}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Обновить данные
              </button>
              {updatedAt && <span style={{fontSize:10,color:'var(--text-3)',letterSpacing:'0.01em'}}>{updatedAt}</span>}
            </div>
          </div>
          {income === 0 && (
            <button className="zero-state-banner" onClick={() => setFinOpen(true)}>
              <div className="zero-state-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
              </div>
              <div className="zero-state-text">
                <span className="zero-state-title">Укажите доход и расходы</span>
                <span className="zero-state-sub">Все расчёты будут нулевыми, пока не заполнены данные</span>
              </div>
              <svg className="zero-state-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          )}
          <div className="profile-card">
            <div className="bl-row income">
              <span className="bl-label">Доход</span>
              <span className="bl-value">{income.toLocaleString('ru')} ₽</span>
            </div>
            {budgetGroups
              .filter(g => (g.total !== null && g.total !== 0) || g.rows.length > 0)
              .map(g => <BudgetGroup key={g.id} group={g} />)}
            <div className="bl-row total-expenses">
              <span className="bl-label">Итого расходов</span>
              <span className="bl-value">−{totalExpenses.toLocaleString('ru')} ₽ {income > 0 && <span className="bl-tag-neutral">{Math.round((totalExpenses / income) * 100)}% дохода</span>}</span>
            </div>
            <div className={`bl-row remainder${savings < 0 ? ' remainder--deficit' : savingsPct >= 20 ? ' remainder--good' : ''}`}>
              <span className="bl-label">Свободный остаток</span>
              <span className="bl-value">
                {savings < 0 ? '−' : ''}{Math.abs(savings).toLocaleString('ru')} ₽{income > 0 && <> <span className="bl-tag">{Math.round((savings / income) * 100)}%</span></>}
              </span>
            </div>
          </div>

        </div>

        {/* Капитал и EmoSpend */}
        <div id="sp-emo">
          <div className="section-heading">
            <div>
              <span className="section-title">Сколько можно тратить</span>
              <div className="section-subtitle">Сумма, которую можно тратить не затрагивая накопления</div>
            </div>
          </div>
          <div className="emo-inner">
            {/* Stats card */}
            <div className="emo-stats-card">
              <div className="emo-stat">
                <div className="emo-stat-num">₽{capital.toLocaleString('ru')}</div>
                <div className="emo-stat-label">текущий капитал</div>
              </div>
              <div className="emo-stat">
                <div className="emo-stat-num">{Math.round(emoRate * 100)}%</div>
                <div className="emo-stat-label">ставка EmoSpend</div>
              </div>
              <div className="emo-stat">
                <div className="emo-stat-num">
                  ₽{emoMonthly.toLocaleString('ru')}
                  <span className="emo-stat-per">/мес</span>
                </div>
                <div className="emo-stat-label">можно тратить</div>
              </div>
            </div>

            {/* Slider + forecast card */}
            <div className="emo-card">
              <div className="emo-card-body">
                <div className="emo-card-left">
                  <div className="emo-card-header">
                    <div className="emo-card-label">EmoSpend</div>
                    <div className="emo-card-sub">от ежемесячного дохода</div>
                  </div>

                  <div className="emo-slider-wrap">
                    <div className="emo-slider-labels">
                      <span>0%</span><span>10%</span><span>25%</span>
                    </div>
                    <div className="emo-slider-track">
                      <div className="emo-slider-fill" style={{ width: `${emoRate * 400}%` }}/>
                      <div className="emo-slider-thumb" style={{ left: `${emoRate * 400}%` }}/>
                      <input
                        type="range" min={0} max={25} step={1}
                        value={Math.round(emoRate * 100)}
                        onChange={e => setEmoRate(Number(e.target.value) / 100)}
                        className="emo-slider-input"
                      />
                    </div>
                  </div>

                  {(() => {
                    const pts = calcSavings(savings, emoRate, capital, credit, creditMonths)
                    const INDICES = [0, 1, 2, 4, 6, 9]
                    const YEAR_OFFSETS = [1, 2, 3, 5, 7, 10]
                    const rows = INDICES.map(i => pts[i]).filter(Boolean)
                    const maxAbs = rows.length ? Math.max(...rows.map(r => Math.abs(r.cap)), 1) : 1
                    const curYear = new Date().getFullYear()
                    const fmtM = v => {
                      const abs = Math.abs(v)
                      const str = abs >= 1_000_000
                        ? `₽${(abs / 1_000_000).toFixed(1)}М`
                        : `₽${Math.round(abs / 1000)}K`
                      return v < 0 ? `−${str}` : str
                    }
                    return (
                      <div className="emo-forecast">
                        {rows.map((r, i) => (
                          <div key={i} className="forecast-row">
                            <span className="forecast-year">{curYear + YEAR_OFFSETS[i]}</span>
                            <div className="forecast-bar-track">
                              <div
                                className={`forecast-bar-fill${r.cap < 0 ? ' forecast-bar-fill--neg' : ''}`}
                                style={{ width: `${Math.round(Math.abs(r.cap) / maxAbs * 100)}%` }}
                              />
                            </div>
                            <span className={`forecast-val${r.cap < 0 ? ' forecast-val--neg' : ''}`}>{fmtM(r.cap)}</span>
                            <span className="forecast-emo">
                              {r.cap > 0 ? fmtM(r.emo) : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}

                  {/* Предел накоплений */}
                  {(() => {
                    const ceiling = findSavingsCeiling(savings, emoRate, capital, credit, creditMonths)
                    if (!ceiling) return (
                      <div className="savings-ceiling">
                        Предел накоплений — не достигается в ближайшие 50 лет
                      </div>
                    )
                    if (ceiling.depleted) return (
                      <div className="savings-ceiling savings-ceiling--warn">
                        Капитал исчерпается через {ceiling.year} {ceiling.year === 1 ? 'год' : ceiling.year < 5 ? 'года' : 'лет'}
                      </div>
                    )
                    const fmt = v => v >= 1_000_000
                      ? `₽${(v / 1_000_000).toFixed(1)}М`
                      : `₽${Math.round(v / 1000)}K`
                    const capStr = fmt(ceiling.cap)
                    const emoStr = fmt(Math.round(ceiling.cap * emoRate / 12))
                    const yrs = ceiling.year
                    const yrsLabel = yrs === 1 ? 'год' : yrs < 5 ? 'года' : 'лет'
                    return (
                      <div className="savings-ceiling">
                        Предел накоплений — через {yrs} {yrsLabel} · {capStr} · {emoStr}/мес
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>

          <button id="sp-deposits" className="profile-tool-row" onClick={() => navigate('/deposits')}>
            <div className="profile-tool-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="2" width="18" height="20" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
                <path d="M9 16l2 2 4-4"/>
              </svg>
            </div>
            <div className="profile-tool-text">
              <div className="profile-tool-title">Вклады и накопительные счета</div>
              <div className="profile-tool-desc">Посмотреть ставки в банках</div>
            </div>
            <svg className="profile-tool-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        {/* Конверты и наборы */}
        <div id="sp-envelopes">
          <div className="section-heading">
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <span className="section-title">Конверты и наборы</span>
              <div className="section-subtitle">Распределяйте бюджет по конвертам раз в месяц</div>
            </div>
            <button
              id="sp-btn-envelopes"
              className={`section-link${editMode ? ' editing' : ''}`}
              onClick={() => setEditMode(e => !e)}
            >
              {editMode ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Готово
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  Редактировать
                </>
              )}
            </button>
          </div>

          {(() => {
            const available = SMART_SPEND_BASE + emoMonthly
            const diff = available - grandTotal
            const over = diff < 0
            return (
              <div className="env-budget-summary">
                <div className={`env-bs-details${bsOpen ? ' env-bs-details--open' : ''}`}>
                  <div className="env-bs-details-inner">
                    <div className="env-bs-row">
                      <div className="env-bs-left">
                        <span className="env-bs-label">Минимальные расходы</span>
                        <span className="env-bs-hint">75% федерального прожиточного минимума · ₽{SMART_SPEND_BASE.toLocaleString('ru')}</span>
                      </div>
                      <span className="env-bs-val">₽{SMART_SPEND_BASE.toLocaleString('ru')}</span>
                    </div>
                    <div className="env-bs-row">
                      <div className="env-bs-left">
                        <span className="env-bs-label">Доход от капитала</span>
                        <span className="env-bs-hint">{Math.round(emoRate * 100)}% годовых · капитал {capital.toLocaleString('ru')} ₽</span>
                      </div>
                      <span className="env-bs-val env-bs-val--income">+ ₽{emoMonthly.toLocaleString('ru')}</span>
                    </div>
                    <div className="env-bs-row">
                      <div className="env-bs-left">
                        <span className="env-bs-label">План расходов по наборам</span>
                        <span className="env-bs-hint">сумма активных конвертов</span>
                      </div>
                      <span className="env-bs-val env-bs-val--minus">− ₽{grandTotal.toLocaleString('ru')}</span>
                    </div>
                  </div>
                </div>
                <button
                  className={`env-bs-row env-bs-row--total${over ? ' env-bs-row--over' : ''}`}
                  onClick={() => setBsOpen(o => !o)}
                >
                  <div className="env-bs-left">
                    <span className="env-bs-label">{over ? 'Превышен расход' : 'Ещё можно потратить'}</span>
                    <span className="env-bs-hint">{over ? 'нажмите чтобы увидеть разбивку' : 'нажмите чтобы увидеть разбивку'}</span>
                  </div>
                  <div className="env-bs-total-right">
                    <span className="env-bs-val env-bs-val--total">
                      {over ? '−' : '+'}₽{Math.abs(diff).toLocaleString('ru')}
                    </span>
                    <svg
                      className={`env-bs-chevron${bsOpen ? ' env-bs-chevron--open' : ''}`}
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="18 15 12 9 6 15"/>
                    </svg>
                  </div>
                </button>
              </div>
            )
          })()}

          <div className="envelopes-list">
            {visibleCats.length === 0 && (
              <div className="envelopes-empty">
                <div className="env-empty-icon">
                  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                    <rect x="6" y="14" width="40" height="28" rx="5" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1.5"/>
                    <path d="M6 20l20 13 20-13" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="38" cy="36" r="9" fill="var(--bg)" stroke="var(--border)" strokeWidth="1.5"/>
                    <path d="M38 32v4M38 38v.5" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="env-empty-title">Конверты пока пусты</div>
                <div className="env-empty-desc">
                  Добавьте готовые наборы из каталога — и SmartSpend автоматически рассчитает ваши расходы по категориям и покажет сколько откладывать каждый месяц.
                </div>
                <div className="env-empty-steps">
                  <div className="env-empty-step">
                    <div className="env-empty-step-num">1</div>
                    <div className="env-empty-step-text">Откройте каталог и выберите набор, подходящий вашему образу жизни</div>
                  </div>
                  <div className="env-empty-step">
                    <div className="env-empty-step-num">2</div>
                    <div className="env-empty-step-text">Нажмите «Добавить в конверт» — набор появится в нужной категории</div>
                  </div>
                  <div className="env-empty-step">
                    <div className="env-empty-step-num">3</div>
                    <div className="env-empty-step-text">Укажите доход в настройках — и система покажет, сколько остаётся на накопления</div>
                  </div>
                </div>
                <button className="env-empty-cta" onClick={() => navigate('/catalog')}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                  </svg>
                  Перейти в каталог
                </button>
              </div>
            )}
            {visibleCats.map(cat => {
              const sets = envelopes[cat.id] || []
              const hasSets = sets.length > 0
              const personalItems = personalByCat[cat.id] || []
              const hasPersonal = personalItems.length > 0
              const personalMonthly = personalItems.reduce((s, i) => s + calcItemMonthly(i), 0)
              const total = sets.filter(x => !x.paused).reduce((s, x) => s + x.amount, 0) + (hasPersonal ? personalMonthly : 0)
              const personalSet = {
                id: null,
                source: 'personal',
                name: 'Личное',
                items: personalItems.length,
                amount: personalMonthly,
                type: personalItems.every(i => i.type === 'consumable') ? 'consumable'
                     : personalItems.every(i => i.type === 'wear') ? 'depreciation' : 'consumable',
                period: 'смешанный',
              }

              return (
                <div key={cat.id} className="envelope-card">
                  <div className="envelope-header">
                    <div className="env-info">
                      <div className="env-name">{cat.name}</div>
                    </div>
                    <div className="env-right">
                      <div className="env-total">{total > 0 ? total.toLocaleString('ru') + ' ₽' : '—'}</div>
                      {total > 0 && <div className="env-total-sub">/ месяц</div>}
                    </div>
                  </div>

                  {(hasSets || hasPersonal) && (
                    <div className="sets-grid">
                      {sets.map((set, idx) => (
                        <SetCard
                          key={idx}
                          set={set}
                          editMode={editMode}
                          onDelete={() => deleteSet(cat.id, idx)}
                          onOpen={() => navigate(`/set/${set.id}`, { state: { fromProfile: true } })}
                          onPause={() => togglePauseSet(cat.id, idx)}
                        />
                      ))}
                      {hasPersonal && (
                        <SetCard
                          set={personalSet}
                          editMode={editMode}
                          onOpen={() => navigate('/inventory')}
                        />
                      )}
                      {editMode && (
                        <div className="set-card-add" onClick={() => goToCatalog(cat.id)}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                          <span className="set-card-add-label">Добавить набор</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!hasSets && !hasPersonal && editMode && (
                    <div className="sets-grid-empty">
                      {cat.id === 'other' && (
                        <div className="env-envelope-hint">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
                          <span>Например, <strong>«Подарки близким»</strong> — незапланированные праздничные траты часто ломают бюджет</span>
                        </div>
                      )}
                      <button className="env-add-only" onClick={() => goToCatalog(cat.id)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                        Добавить первый набор в этот конверт
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>


          <button id="sp-cards" className="profile-tool-row" onClick={() => navigate('/cards')}>
            <div className="profile-tool-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div className="profile-tool-text">
              <div className="profile-tool-title">Подобрать банковскую карту</div>
              <div className="profile-tool-desc">Кешбэк под ваши категории трат</div>
            </div>
            <svg className="profile-tool-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </main>
      {editMode && createPortal(
        <div className="env-edit-toolbar">
          <button className="env-edit-done-btn" onClick={() => setEditMode(false)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Готово
          </button>
        </div>,
        document.body
      )}
      <FinancialModal
        open={finOpen}
        initialData={finance}
        onSave={f => setFinance(f)}
        onClose={() => setFinOpen(false)}
      />
      {showSpotlight && <SpotlightTour steps={SPOTLIGHT_STEPS} onClose={() => setShowSpotlight(false)} />}
    </Layout>
  )
}
