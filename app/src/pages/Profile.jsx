import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useApp } from '../context/AppContext'

const BASE_RETURN = 0.04

const DEFAULT_FINANCE = {
  income: 80000,
  housing: 25000,
  credit: 11700,
  creditMonths: 24,
  capital: 1240000,
  updatedAt: '3 августа 2025',
}

function loadFinance() {
  try {
    const raw = localStorage.getItem('ss_finance')
    if (raw) return { ...DEFAULT_FINANCE, ...JSON.parse(raw) }
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

const EMO_RATES = [
  { rate: 0.04, label: '4%', level: 'low' },
  { rate: 0.05, label: '5%', level: 'medium' },
  { rate: 0.07, label: '7%', level: 'high' },
  { rate: 0.10, label: '10%', level: 'extra' },
]

// ── Категории конвертов ──
const CATEGORIES = [
  { id: 'other',     name: 'Прочие расходы',        color: '#B0A898' },
  { id: 'all',       name: 'Все покупки',            color: '#A8B8C8' },
  { id: 'food',      name: 'Еда и Супермаркеты',     color: '#8DBFA8' },
  { id: 'cafe',      name: 'Кафе, Бары, Рестораны',  color: '#C4A882' },
  { id: 'auto',      name: 'Авто и Транспорт',       color: '#8AAFC8' },
  { id: 'home',      name: 'Дом и Техника',          color: '#9EA8C0' },
  { id: 'clothes',   name: 'Одежда и Обувь',         color: '#B8A0C8' },
  { id: 'fun',       name: 'Развлечения и Хобби',    color: '#C8A8A0' },
  { id: 'beauty',    name: 'Красота и Здоровье',     color: '#C4B0C0' },
  { id: 'education', name: 'Образование и Дети',     color: '#A8C0B0' },
  { id: 'travel',    name: 'Путешествия и Отдых',    color: '#C0B898' },
]

// Map profile envelope category → catalog category filter
const CAT_TO_CATALOG = {
  food:      'food',
  cafe:      'food',
  clothes:   'clothes',
  home:      'home',
  auto:      'transport',
  beauty:    'health',
  fun:       'leisure',
  education: 'all',
  travel:    'leisure',
  other:     'all',
  all:       'all',
}

const INITIAL_ENVELOPES = {
  food: [
    { id: 's2', source: 'smartspend', name: 'Базовое питание', items: 18, amount: 7500, type: 'consumable', period: 'еженедельно' },
    { id: null, source: 'custom', name: 'Вкусняшки', items: 6, amount: 2500, type: 'consumable', period: 'еженедельно' },
  ],
  clothes: [
    { id: 's1', source: 'smartspend', name: 'Базовый гардероб', items: 7, amount: 5000, type: 'depreciation', period: 'раз в 2–5 лет' },
  ],
  beauty: [
    { id: 's5', source: 'smartspend', name: 'Гигиена', items: 12, amount: 2000, type: 'consumable', period: 'ежемесячно' },
    { id: null, source: 'custom', name: 'Уход за кожей', items: 4, amount: 1000, type: 'consumable', period: 'ежемесячно' },
  ],
}

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

const SOURCE_META = {
  smartspend: { label: 'SmartSpend', cls: 'smartspend' },
  community:  { label: 'Сообщество', cls: 'community' },
  custom:     { label: 'Мой набор',  cls: '' },
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

function SetCard({ set, catColor, onDelete, onOpen, editMode }) {
  const sm = SOURCE_META[set.source] || SOURCE_META.custom
  return (
    <div className="set-card" onClick={!editMode && set.id ? onOpen : undefined} style={!editMode && set.id ? { cursor: 'pointer' } : {}}>
      <div className="set-card-accent" style={{ background: catColor }} />
      <div className="set-card-top">
        <div className="set-source">
          <SourceIcon source={set.source} />
          <span className={`set-source-label ${sm.cls}`}>{sm.label}</span>
        </div>
        <div className="set-card-name">{set.name}</div>
        <div className="set-card-meta">
          <span className="set-meta-tag">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            {set.items} поз.
          </span>
          <TypeTag type={set.type} period={set.period} />
        </div>
      </div>
      <div className="set-card-bottom">
        <span className="set-card-amount">{set.amount ? set.amount.toLocaleString('ru') + ' ₽' : '—'}</span>
        <span className="set-card-period">/ мес</span>
      </div>
      {editMode && (
        <button className="set-delete" onClick={onDelete} title="Удалить набор">✕</button>
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
      <div className="forecast-inner-title">Прогноз накоплений · без учёта доходности</div>
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
  const [emoRate, setEmoRate] = useState(0.05)
  const [envelopes, setEnvelopes] = useState(loadEnvelopes)
  const [editMode, setEditMode] = useState(false)
  const [finOpen, setFinOpen] = useState(false)
  const [finance, setFinance] = useState(loadFinance)

  const { income, housing, credit, creditMonths = 0, capital, updatedAt } = finance

  // Суммируем конверты по категориям
  const grandTotal = CATEGORIES.reduce((sum, cat) => {
    return sum + (envelopes[cat.id] || []).reduce((s, x) => s + x.amount, 0)
  }, 0)

  // Динамический перерасчёт
  const totalExpenses = housing + credit + grandTotal
  const savings = income - totalExpenses
  const monthlyInvest = Math.max(0, savings)

  // Строим группы финансовой картины из актуальных данных
  const housingPct = Math.round(housing / income * 100)
  const creditPct = Math.round(credit / income * 100)
  const staticGroups = [
    {
      id: 'housing', label: 'Жильё', total: -housing, pct: housingPct,
      rows: [{ label: 'Аренда / ипотека + ЖКХ', value: -housing }],
      hint: housingPct > 30
        ? `${housingPct}% дохода на жильё — выше рекомендуемых 25–30%. Если аренда выросла, возможно стоит пересмотреть бюджет.`
        : `${housingPct}% дохода на жильё — в норме.`,
      hintType: housingPct > 30 ? 'warn' : 'info',
    },
    {
      id: 'credit', label: 'Кредитные обязательства', total: -credit, pct: creditPct,
      rows: credit > 0 ? [{ label: 'Кредиты и кредитные карты', value: -credit }] : [],
      hint: credit > 0
        ? `Кредитная нагрузка ${creditPct}% дохода — ${creditPct <= 20 ? 'в норме.' : 'выше рекомендуемых 20%. Рассмотрите досрочное погашение.'}`
        : null,
      hintType: creditPct <= 20 ? 'info' : 'warn',
    },
  ]

  const envelopesGroup = {
    id: 'envelopes',
    label: 'Конверты',
    total: -grandTotal,
    pct: Math.round(grandTotal / income * 100),
    rows: CATEGORIES
      .filter(cat => (envelopes[cat.id] || []).length > 0)
      .map(cat => ({
        label: cat.name,
        value: -(envelopes[cat.id] || []).reduce((s, x) => s + x.amount, 0),
      })),
  }

  const budgetGroups = [
    ...staticGroups,
    envelopesGroup,
    { id: 'other', label: 'Прочие расходы', total: null, pct: null, rows: [] },
  ]

  const emoAnnual = Math.round(capital * emoRate)
  const emoMonthly = Math.round(emoAnnual / 12)

  const savingsPct = Math.round((savings / income) * 100)
  const greetingSubtitle = (() => {
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
      const next = { ...prev, [catId]: [...(prev[catId] || [])] }
      next[catId].splice(idx, 1)
      saveEnvelopes(next)
      return next
    })
  }

  function goToCatalog(catId) {
    const catalogCat = CAT_TO_CATALOG[catId] || 'all'
    navigate(`/catalog?cat=${catalogCat}`)
  }

  const visibleCats = CATEGORIES.filter(cat => {
    const sets = envelopes[cat.id] || []
    return sets.length > 0 || editMode
  })

  return (
    <Layout>
      <main className="profile-main">
        {/* Приветствие */}
        <div className="entry-header">
          <div className="entry-greeting">
            <div className="entry-title">Привет, {username.split(' ')[0]}</div>
            <div className="entry-subtitle">{greetingSubtitle}</div>
          </div>
          <div className="entry-tiles">
            <div className="entry-tile">
              <div className="entry-tile-label">Доход</div>
              <div className="entry-tile-value">{income.toLocaleString('ru')} ₽</div>
            </div>
            <div className="entry-tile-divider" />
            <div className="entry-tile">
              <div className="entry-tile-label">Расходы</div>
              <div className="entry-tile-value">{totalExpenses.toLocaleString('ru')} ₽</div>
              <div className="entry-tile-sub">{Math.round((totalExpenses / income) * 100)}% дохода</div>
            </div>
            <div className="entry-tile-divider" />
            <div className="entry-tile highlight">
              <div className="entry-tile-label">Откладывается</div>
              <div className="entry-tile-value">{savings.toLocaleString('ru')} ₽</div>
              <div className="entry-tile-sub">{Math.round((savings / income) * 100)}% дохода</div>
            </div>
          </div>
        </div>

        {/* Финансовая картина */}
        <div>
          <div className="section-heading">
            <span className="section-title">Финансовая картина · {updatedAt}</span>
            <button className="section-link" onClick={() => setFinOpen(true)}>Редактировать</button>
          </div>
          <div className="profile-card">
            <div className="bl-row income">
              <span className="bl-label">Доход</span>
              <span className="bl-value">{income.toLocaleString('ru')} ₽</span>
            </div>
            {budgetGroups.map(g => <BudgetGroup key={g.id} group={g} />)}
            <div className="bl-row total-expenses">
              <span className="bl-label">Итого расходов</span>
              <span className="bl-value">−{totalExpenses.toLocaleString('ru')} ₽ <span className="bl-tag-neutral">{Math.round((totalExpenses / income) * 100)}% дохода</span></span>
            </div>
            <div className="bl-row remainder">
              <span className="bl-label">Остаток — к инвестированию</span>
              <span className="bl-value">{savings.toLocaleString('ru')} ₽ <span className="bl-tag">{Math.round((savings / income) * 100)}%</span></span>
            </div>
          </div>
        </div>

        {/* Капитал и EmoSpend */}
        <div>
          <div className="section-heading">
            <span className="section-title">Капитал и свободные расходы</span>
          </div>
          <div className="profile-card">
            <div className="combined-top">
              <div>
                <div className="cap-label">Общий капитал</div>
                <div className="cap-value">{capital.toLocaleString('ru')} ₽</div>
                <div className="cap-meta">
                  <span className="cap-period">Обновлено: {updatedAt}</span>
                  <span className="cap-hint">Рекомендуется обновлять раз в год</span>
                </div>
              </div>
            </div>

            <div className="combined-bottom">
              <div>
                <div className="emo-title">EmoSpend</div>
                <div className="emo-subtitle">Свободные траты вне наборов — от капитала</div>
              </div>
              <div className="emo-main">
                <div className="emo-tile">
                  <div className="emo-tile-label">В месяц</div>
                  <div className="emo-tile-value">{emoMonthly.toLocaleString('ru')} ₽</div>
                  <div className="emo-tile-sub">можно потратить</div>
                </div>
                <div className="emo-tile">
                  <div className="emo-tile-label">В год</div>
                  <div className="emo-tile-value">{emoAnnual.toLocaleString('ru')} ₽</div>
                  <div className="emo-tile-sub">{Math.round(emoRate * 100)}% от капитала</div>
                </div>
              </div>
              <div className="emo-rate-row">
                <span className="emo-rate-label">Ставка изъятия:</span>
                <div className="rate-selector">
                  {EMO_RATES.map(r => (
                    <button
                      key={r.rate}
                      className={`rate-btn rate-${r.level}${emoRate === r.rate ? ' active' : ''}`}
                      onClick={() => setEmoRate(r.rate)}
                    >
                      <span className="rate-pct">{r.label}</span>
                      <span className="rate-level">{r.level}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ForecastChart emoRate={emoRate} dark={dark} monthlyInvest={monthlyInvest} capital={capital} creditPayment={credit} creditMonths={creditMonths} />
          </div>
        </div>

        {/* Конверты и наборы */}
        <div>
          <div className="section-heading">
            <span className="section-title">Конверты и наборы</span>
            <button
              className={`section-link${editMode ? ' editing' : ''}`}
              onClick={() => setEditMode(e => !e)}
            >
              {editMode ? 'Готово' : 'Редактировать'}
            </button>
          </div>

          <div className="envelopes-list">
            {visibleCats.map(cat => {
              const sets = envelopes[cat.id] || []
              const hasSets = sets.length > 0
              const total = sets.reduce((s, x) => s + x.amount, 0)
              const count = sets.length
              const desc = hasSets
                ? `${count} набор${count === 1 ? '' : count < 5 ? 'а' : 'ов'} · пополняется 1-го числа`
                : 'Нет наборов'

              return (
                <div key={cat.id} className="envelope-card">
                  <div className="envelope-header">
                    <div className="env-bar" style={{ background: cat.color }} />
                    <div className="env-info">
                      <div className="env-name">{cat.name}</div>
                      <div className="env-desc">{desc}</div>
                    </div>
                    <div className="env-right">
                      <div className="env-total">{hasSets ? total.toLocaleString('ru') + ' ₽' : '—'}</div>
                      {hasSets && <div className="env-total-sub">/ месяц</div>}
                    </div>
                  </div>

                  {hasSets && (
                    <div className="sets-grid">
                      {sets.map((set, idx) => (
                        <SetCard
                          key={idx}
                          set={set}
                          catColor={cat.color}
                          editMode={editMode}
                          onDelete={() => deleteSet(cat.id, idx)}
                          onOpen={() => navigate(`/set/${set.id}`)}
                        />
                      ))}
                      {editMode && (
                        <div className="set-card-add" onClick={() => goToCatalog(cat.id)}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                          <span className="set-card-add-label">Добавить набор</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!hasSets && editMode && (
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

          <div className="envelopes-total">
            <span className="et-label">Итого в конвертах</span>
            <span className="et-value">{grandTotal.toLocaleString('ru')} ₽ <span className="et-sub">/ месяц</span></span>
          </div>
        </div>
      </main>
      <FinancialModal
        open={finOpen}
        initialData={finance}
        onSave={f => setFinance(f)}
        onClose={() => setFinOpen(false)}
      />
    </Layout>
  )
}
