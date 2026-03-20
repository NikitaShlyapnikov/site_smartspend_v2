import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

// All months shown in chart (always 12 columns, scrollable on mobile)
const DESKTOP_MONTHS = [1, 2, 3, 4, 5, 6, 9, 12, 15, 18, 24, 36]

const FREQ_FILTERS = [
  { id: 'monthly', label: 'Ежемесячно' },
  { id: 'end',     label: 'В конце срока' },
]

const COND_FILTERS = [
  { id: 'new_client', label: 'Новый клиент' },
  { id: 'pension',    label: 'Пенсионер' },
  { id: 'new_money',  label: 'Новые деньги' },
  { id: 'insurance',  label: 'Страховка / инвест' },
  { id: 'premium',    label: 'Премиум' },
  { id: 'no_extra',   label: 'Без доп. условий' },
]

const LIQUID_FILTERS = [
  { id: 'replenishment', label: 'С пополнением' },
  { id: 'no_replenishment', label: 'Без пополнения и снятия' },
]

const DEPOSITS = [
  {
    id: 'd1', bank: 'Т-Банк', name: 'СмartВклад Онлайн',
    color: '#FFDD2D', textColor: '#1A1A1A', freq: 'end', isSystemic: true,
    rates: { 1: 14.0, 2: 16.5, 3: 21.5, 6: 20.0, 12: 18.5, 18: 17.0 },
    minAmount: 50000, maxAmount: null,
    replenishment: false, withdrawal: false,
    tags: ['для новых клиентов', 'выплата % в конце срока', 'без пополнения и снятия'],
    conditions: ['new_client'],
    conditionsText: 'Только для новых клиентов банка. Открытие онлайн через приложение. Без пополнения и снятия до окончания срока.',
    params: 'Выплата процентов в конце срока. Капитализация: нет. Автопролонгация: по желанию.',
  },
  {
    id: 'd2', bank: 'Альфа-Банк', name: 'Альфа-Вклад',
    color: '#EF3124', textColor: '#FFF', freq: 'monthly', isSystemic: true,
    rates: { 1: 13.5, 3: 20.8, 6: 19.5, 12: 18.0, 18: 16.5, 24: 15.5 },
    minAmount: 10000, maxAmount: null,
    replenishment: true, withdrawal: false,
    tags: ['выплата % ежемесячно', 'с пополнением'],
    conditions: ['no_extra'],
    conditionsText: 'Для новых и действующих клиентов. Пополнение разрешено в течение всего срока.',
    params: 'Выплата процентов ежемесячно на отдельный счёт. Пополнение: да. Снятие: нет.',
  },
  {
    id: 'd3', bank: 'Сбер', name: 'Лучший %',
    color: '#21A038', textColor: '#FFF', freq: 'monthly', isSystemic: true,
    rates: { 1: 12.0, 2: 15.5, 3: 19.0, 4: 18.0, 5: 17.5, 6: 18.5, 12: 17.0, 18: 15.5, 24: 14.0, 36: 13.0 },
    minAmount: 1000, maxAmount: null,
    replenishment: true, withdrawal: false,
    tags: ['с пополнением', 'выплата % ежемесячно'],
    conditions: ['no_extra'],
    conditionsText: 'Для всех клиентов. От 1 000 ₽. Пополнение разрешено в первую треть срока.',
    params: 'Выплата процентов ежемесячно. Капитализация: доступна. Снятие: нет.',
  },
  {
    id: 'd4', bank: 'ВТБ', name: 'Новое время',
    color: '#009FDF', textColor: '#FFF', freq: 'end', isSystemic: true,
    rates: { 3: 20.0, 4: 19.0, 5: 18.5, 6: 19.5, 12: 18.0, 18: 16.0 },
    minAmount: 30000, maxAmount: null,
    replenishment: false, withdrawal: false,
    tags: ['для новых клиентов', 'выплата % в конце срока', 'без пополнения и снятия'],
    conditions: ['new_client', 'new_money'],
    conditionsText: 'Только для новых клиентов. Только новые деньги — средства, ранее не размещавшиеся в ВТБ.',
    params: 'Выплата в конце срока. Без пополнения и снятия. Автопролонгация: нет.',
  },
  {
    id: 'd5', bank: 'Газпромбанк', name: 'Накопи +',
    color: '#003087', textColor: '#FFF', freq: 'end', isSystemic: true,
    rates: { 3: 19.5, 6: 19.0, 12: 17.5, 18: 16.0, 24: 15.0, 36: 13.5 },
    minAmount: 15000, maxAmount: null,
    replenishment: true, withdrawal: false,
    tags: ['с пополнением', 'выплата % в конце срока'],
    conditions: ['no_extra'],
    conditionsText: 'Открытие в офисе или через личный кабинет. Пополнение разрешено.',
    params: 'Выплата в конце срока. Капитализация: нет. Снятие: нет.',
  },
  {
    id: 'd6', bank: 'Банк Дом.РФ', name: 'Надёжный прайм',
    color: '#1A3F6F', textColor: '#FFF', freq: 'end', isSystemic: true,
    rates: { 1: 13.0, 2: 17.0, 3: 20.5, 6: 18.0 },
    minAmount: 100000, maxAmount: 30000000,
    replenishment: false, withdrawal: false,
    tags: ['для новых клиентов', 'выплата % в конце срока', 'без пополнения и снятия'],
    conditions: ['new_client'],
    conditionsText: 'Для новых клиентов. От 100 000 ₽. Без пополнения и снятия.',
    params: 'Без пополнения и снятия. Выплата в конце срока. Автопролонгация: нет.',
  },
  {
    id: 'd7', bank: 'МТС Банк', name: 'МТС Специальный',
    color: '#E30611', textColor: '#FFF', freq: 'end', isSystemic: false,
    rates: { 3: 20.2, 6: 19.0, 12: 17.0 },
    minAmount: 10000, maxAmount: 5000000,
    replenishment: false, withdrawal: false,
    tags: ['инвест или страхование', 'выплата % в конце срока', 'без пополнения и снятия'],
    conditions: ['insurance'],
    conditionsText: 'Требуется оформление инвестиционных или страховых продуктов банка.',
    params: 'Без пополнения и снятия. Выплата в конце срока.',
    tariff: {
      name: 'Инвестиционный / страховой продукт МТС',
      cost: 'от 50\u00a0000\u00a0₽ единовременно',
      conditions: 'Необходимо оформить инвестиционный или накопительный страховой продукт МТС Банка одновременно с открытием вклада.',
      benefits: ['Повышенная ставка на весь срок вклада', 'Страховое покрытие жизни или капитала', 'Потенциальный доход от инвест. инструмента'],
      url: 'https://www.mtsbank.ru/vklady/',
    },
  },
  {
    id: 'd8', bank: 'Росбанк', name: 'Максимальный доход',
    color: '#CC2030', textColor: '#FFF', freq: 'end', isSystemic: true,
    rates: { 1: 12.5, 2: 16.0, 3: 19.8, 6: 18.5, 12: 17.0, 18: 15.5 },
    minAmount: 50000, maxAmount: null,
    replenishment: false, withdrawal: false,
    tags: ['выплата % в конце срока', 'без пополнения и снятия'],
    conditions: ['no_extra'],
    conditionsText: 'Для новых и действующих клиентов. Открытие онлайн или в офисе.',
    params: 'Выплата в конце срока. Без пополнения и снятия. Капитализация: нет.',
  },
  {
    id: 'd9', bank: 'Сбер', name: 'Пенсионный плюс',
    color: '#21A038', textColor: '#FFF', freq: 'monthly', isSystemic: true,
    rates: { 3: 20.5, 6: 20.0, 12: 18.5, 18: 17.0 },
    minAmount: 1000, maxAmount: null,
    replenishment: true, withdrawal: false,
    tags: ['для пенсионеров', 'с пополнением', 'выплата % ежемесячно'],
    conditions: ['pension'],
    conditionsText: 'Только для получателей пенсии на счёт в Сбере. С пополнением.',
    params: 'Выплата процентов ежемесячно. Пополнение: да. Снятие: нет.',
  },
  {
    id: 'd10', bank: 'Т-Банк', name: 'Т-Привилегия',
    color: '#FFDD2D', textColor: '#1A1A1A', freq: 'end', isSystemic: true,
    rates: { 1: 16.0, 3: 22.5, 6: 21.0, 12: 19.5 },
    minAmount: 300000, maxAmount: null,
    replenishment: false, withdrawal: false,
    tags: ['премиальный клиент', 'выплата % в конце срока'],
    conditions: ['premium'],
    conditionsText: 'Только для клиентов с пакетом Т-Привилегия или Т-Прайм. Минимальная сумма от 300 000 ₽.',
    params: 'Выплата в конце срока. Без пополнения и снятия. Капитализация: нет.',
    tariff: {
      name: 'Т-Привилегия / Т-Прайм',
      cost: 'от 199\u00a0₽/мес (или бесплатно)',
      conditions: 'Бесплатно при остатке от 100\u00a0000\u00a0₽ или тратах от 30\u00a0000\u00a0₽/мес. Иначе — 199\u00a0₽/мес.',
      benefits: ['Кешбэк до 5% на все покупки', 'Бесплатные переводы и снятие наличных', 'Страховка при путешествиях за рубеж', 'Приоритетная поддержка 24/7', 'Консьерж-сервис (Т-Прайм)'],
      url: 'https://www.tbank.ru/privilege/',
    },
  },
]

// ── Savings accounts (накопительные счета) ──────────────────────────────────
const SAVINGS = [
  {
    id: 's1', bank: 'Т-Банк', name: 'Сейф',
    color: '#FFDD2D', textColor: '#1A1A1A',
    rate: 17.0, rateBase: null, rateNote: 'постоянно',
    minAmount: 0, withdrawal: true, replenishment: true, asv: true,
    tags: ['без условий', 'мгновенный доступ', 'ежемесячные %'],
    conditionsText: 'Без условий и ограничений по сумме. Ставка не зависит от остатка.',
    params: 'Снятие: да. Пополнение: да. % начисляется ежедневно, выплата ежемесячно.',
  },
  {
    id: 's2', bank: 'Альфа-Банк', name: 'Альфа-Счёт',
    color: '#EF3124', textColor: '#FFF',
    rate: 20.0, rateBase: 14.0, rateNote: 'первые 2 мес',
    minAmount: 0, withdrawal: true, replenishment: true, asv: true,
    tags: ['акция для новых', 'мгновенный доступ', 'ежемесячные %'],
    conditionsText: 'Повышенная ставка 20% — первые 2 месяца для новых клиентов Альфа-Банка. Далее — 14%.',
    params: 'Снятие: да. Пополнение: да. % начисляется ежемесячно.',
  },
  {
    id: 's3', bank: 'Сбер', name: 'СберСохраняй',
    color: '#21A038', textColor: '#FFF',
    rate: 16.0, rateBase: null, rateNote: 'постоянно',
    minAmount: 0, withdrawal: true, replenishment: true, asv: true,
    tags: ['без условий', 'мгновенный доступ', 'ежедневные %'],
    conditionsText: 'Для всех клиентов. Без минимального остатка. Начисление каждый день.',
    params: 'Снятие: да. Пополнение: да. % начисляется ежедневно, выплата ежемесячно.',
  },
  {
    id: 's4', bank: 'ВТБ', name: 'Накопительный',
    color: '#009FDF', textColor: '#FFF',
    rate: 17.5, rateBase: null, rateNote: 'постоянно',
    minAmount: 0, withdrawal: true, replenishment: true, asv: true,
    tags: ['без условий', 'мгновенный доступ', 'ежедневные %'],
    conditionsText: 'Для всех клиентов. Без ограничений по остатку и операциям.',
    params: 'Снятие: да. Пополнение: да. % начисляется ежедневно.',
  },
  {
    id: 's5', bank: 'Газпромбанк', name: 'Газпромбанк Плюс',
    color: '#003087', textColor: '#FFF',
    rate: 18.5, rateBase: 15.0, rateNote: 'при тратах от 10\u00a0000\u00a0₽/мес',
    minAmount: 0, withdrawal: true, replenishment: true, asv: true,
    tags: ['с условием трат', 'мгновенный доступ', 'ежемесячные %'],
    conditionsText: 'Повышенная ставка при тратах по карте от 10 000 ₽/мес. Иначе — 15%.',
    params: 'Снятие: да. Пополнение: да. % начисляется ежемесячно.',
  },
]

const ALL_BANKS = [...new Set(DEPOSITS.map(d => d.bank))]

const CHART_H = 140
const MIN_BAR  = 28

const fmtRub = n => Math.round(n).toLocaleString('ru') + '\u00a0₽'
const fmtMonth = m =>
  m < 12 ? `${m}\u00a0мес`
  : m === 12 ? '1\u00a0год'
  : m === 15 ? '15\u00a0мес'
  : m === 18 ? '1.5\u00a0года'
  : m === 24 ? '2\u00a0года'
  : m === 36 ? '3\u00a0года'
  : `${m}\u00a0мес`

function calcIncome(rate, amount, months) {
  return Math.round(amount * (rate / 100) * (months / 12))
}

// Эффективная ставка с учётом капитализации (для ежемесячных выплат)
function calcEffectiveRate(rate, freq) {
  if (freq === 'monthly') {
    return +((Math.pow(1 + rate / 100 / 12, 12) - 1) * 100).toFixed(2)
  }
  return rate
}

function Accordion({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="dep-acc">
      <button className={`dep-acc-head${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {open && <div className="dep-acc-body">{children}</div>}
    </div>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button className={`dep-fchip${active ? ' active' : ''}`} onClick={onClick}>
      {label}
    </button>
  )
}

export default function Deposits() {
  const navigate = useNavigate()

  const chartRef = useRef(null)
  const drag = useRef({ on: false, x: 0, sl: 0 })

  const [amount, setAmount] = useState(() => {
    try {
      const f = JSON.parse(localStorage.getItem('ss_finance') || '{}')
      return f.capital && f.capital >= 1000 ? f.capital : 500000
    } catch { return 500000 }
  })
  const [selectedMonth, setSelectedMonth] = useState(3)
  const [sortBy, setSortBy]               = useState('rate')
  const [expanded, setExpanded]           = useState(null)
  const [showModal, setShowModal]         = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [bankSearch, setBankSearch]       = useState('')

  useEffect(() => {
    const fn = () => setShowScrollTop(window.scrollY > 480)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Auto-scroll chart to center selected bar
  useEffect(() => {
    const el = chartRef.current
    if (!el) return
    const idx = DESKTOP_MONTHS.indexOf(selectedMonth)
    if (idx < 0) return
    const colW = el.scrollWidth / DESKTOP_MONTHS.length
    el.scrollTo({ left: Math.max(0, idx * colW - el.clientWidth / 2 + colW / 2), behavior: 'smooth' })
  }, [selectedMonth])

  // Drag scroll handlers
  function onChartMouseDown(e) {
    drag.current = { on: true, x: e.clientX, sl: chartRef.current.scrollLeft }
    chartRef.current.style.cursor = 'grabbing'
  }
  function onChartMouseMove(e) {
    if (!drag.current.on) return
    chartRef.current.scrollLeft = drag.current.sl + (drag.current.x - e.clientX)
  }
  function onChartMouseUp() {
    drag.current.on = false
    if (chartRef.current) chartRef.current.style.cursor = 'grab'
  }
  function onChartTouchStart(e) {
    drag.current = { on: true, x: e.touches[0].clientX, sl: chartRef.current.scrollLeft }
  }
  function onChartTouchMove(e) {
    if (!drag.current.on) return
    chartRef.current.scrollLeft = drag.current.sl + (drag.current.x - e.touches[0].clientX)
  }

  // Filter state
  const [filterBanks,   setFilterBanks]   = useState(new Set())
  const [filterFreq,    setFilterFreq]    = useState(new Set())
  const [filterConds,   setFilterConds]   = useState(new Set())
  const [filterLiquid,  setFilterLiquid]  = useState(new Set())

  const totalActiveFilters = filterBanks.size + filterFreq.size + filterConds.size + filterLiquid.size

  const monthRates = useMemo(() => DESKTOP_MONTHS.map(m => ({
    month: m,
    rate: Math.max(0, ...DEPOSITS.map(d => d.rates[m] || 0)),
  })), [])

  const validRates = monthRates.filter(r => r.rate > 0).map(r => r.rate)
  const minRate = validRates.length ? Math.min(...validRates) : 0
  const maxRate = validRates.length ? Math.max(...validRates) : 1

  function barHeight(rate) {
    if (rate <= 0) return 4
    if (maxRate === minRate) return CHART_H
    return Math.round(MIN_BAR + ((rate - minRate) / (maxRate - minRate)) * (CHART_H - MIN_BAR))
  }

  const filtered = useMemo(() => {
    return DEPOSITS
      .filter(d => {
        if (!d.rates[selectedMonth]) return false
        if (filterBanks.size > 0 && !filterBanks.has(d.bank)) return false
        if (filterFreq.size > 0 && !filterFreq.has(d.freq)) return false
        if (filterConds.size > 0 && !d.conditions.some(c => filterConds.has(c))) return false
        if (filterLiquid.has('replenishment') && !d.replenishment) return false
        if (filterLiquid.has('no_replenishment') && d.replenishment) return false
        return true
      })
      .sort((a, b) => sortBy === 'rate'
        ? (b.rates[selectedMonth] || 0) - (a.rates[selectedMonth] || 0)
        : calcIncome(b.rates[selectedMonth] || 0, amount, selectedMonth)
          - calcIncome(a.rates[selectedMonth] || 0, amount, selectedMonth)
      )
  }, [selectedMonth, sortBy, amount, filterBanks, filterFreq, filterConds, filterLiquid])

  function handleAmountChange(e) {
    const n = parseInt(e.target.value.replace(/\D/g, ''), 10)
    if (!isNaN(n) && n > 0) setAmount(n)
  }

  function toggleSet(setter, id) {
    setter(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function resetFilters() {
    setFilterBanks(new Set())
    setFilterFreq(new Set())
    setFilterConds(new Set())
    setFilterLiquid(new Set())
  }

  const bestRate = filtered.length ? Math.max(...filtered.map(d => d.rates[selectedMonth] || 0)) : 0
  const visibleBanks = ALL_BANKS.filter(b => b.toLowerCase().includes(bankSearch.toLowerCase()))

  return (
    <Layout>
      <main className="dep-main">

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-item" onClick={() => navigate('/profile')}>Профиль</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className="breadcrumb-current">Вклады и накопительные счета</span>
        </div>

        {/* ── Chart card ── */}
        <div className="dep-chart-card">
          <div className="dep-chart-title">Максимальные ставки по срокам</div>

          <div className="dep-chart" ref={chartRef}
            onMouseDown={onChartMouseDown}
            onMouseMove={onChartMouseMove}
            onMouseUp={onChartMouseUp}
            onMouseLeave={onChartMouseUp}
            onTouchStart={onChartTouchStart}
            onTouchMove={onChartTouchMove}
            onTouchEnd={() => { drag.current.on = false }}>
            {monthRates.map(({ month, rate }) => {
              const isSelected = selectedMonth === month
              const bH = barHeight(rate)
              return (
                <div key={month}
                  className={`dep-bar-col${isSelected ? ' selected' : ''}`}
                  onClick={() => { setSelectedMonth(month); setExpanded(null) }}>
                  <div className="dep-bar-rate">{rate > 0 ? `${rate}%` : '—'}</div>
                  <div className="dep-bar-spacer" />
                  <div className="dep-bar" style={{ height: bH }} />
                  <div className="dep-bar-label">{fmtMonth(month)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Filters row ── */}
        <div className="dep-filters-card">
          <div className="dep-filters-row">
            <div className="dep-filter-group">
              <span className="dep-filter-label">Сумма вклада</span>
              <div className="dep-amount-wrap">
                <input className="dep-amount-input" type="text" inputMode="numeric"
                  value={amount.toLocaleString('ru')}
                  onChange={handleAmountChange}
                  placeholder="500 000"
                />
                <span className="dep-amount-unit">₽</span>
              </div>
            </div>

            <div className="dep-filter-group">
              <span className="dep-filter-label">Срок</span>
              <select className="dep-term-select" value={selectedMonth}
                onChange={e => { setSelectedMonth(Number(e.target.value)); setExpanded(null) }}>
                {DESKTOP_MONTHS.filter(m => DEPOSITS.some(d => d.rates[m])).map(m => (
                  <option key={m} value={m}>{fmtMonth(m)}</option>
                ))}
              </select>
            </div>

            <div className="dep-filter-group">
              <span className="dep-filter-label">Сортировка</span>
              <div className="dep-sort-toggle">
                <button className={`dep-sort-btn${sortBy === 'rate' ? ' active' : ''}`}
                  onClick={() => setSortBy('rate')}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v20M2 12h20"/>
                  </svg>
                  % ставка
                </button>
                <button className={`dep-sort-btn${sortBy === 'income' ? ' active' : ''}`}
                  onClick={() => setSortBy('income')}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                  </svg>
                  ₽ доход
                </button>
              </div>
            </div>

            <div className="dep-filter-group">
              <span className="dep-filter-label">Фильтры</span>
              <button className={`dep-filter-toggle-btn${totalActiveFilters > 0 ? ' active' : ''}`}
                onClick={() => setShowModal(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Фильтры
                {totalActiveFilters > 0 && (
                  <span className="dep-filter-badge">{totalActiveFilters}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Deposit list ── */}
        <div className="dep-list">
          {filtered.length === 0 && (
            <div className="dep-empty">Нет предложений для выбранных фильтров</div>
          )}
          {filtered.map(dep => {
            const rate      = dep.rates[selectedMonth]
            const income    = calcIncome(rate, amount, selectedMonth)
            const isOpen    = expanded === dep.id
            const isBest    = rate === bestRate && filtered.length > 0
            const belowMin  = amount < dep.minAmount

            return (
              <div key={dep.id} className={`dep-card${isOpen ? ' open' : ''}`}>
                <div className="dep-card-main"
                  onClick={() => setExpanded(isOpen ? null : dep.id)}>
                  <div className="dep-card-body">
                    <div className="dep-card-names">
                      <span className="dep-bank-name">{dep.bank}</span>
                      {isBest && <span className="dep-best-badge">лучшее</span>}
                    </div>
                    <div className="dep-dep-name">{dep.name}</div>
                    <div className="dep-tags">
                      {dep.tags.map((t, i) => <span key={i} className="dep-tag">{t}</span>)}
                    </div>
                    <div className="dep-card-pills">
                      <span className="dep-pill dep-pill-rate">% {rate}</span>
                      <span className={`dep-pill dep-pill-income${belowMin ? ' warn' : ''}`}>
                        {belowMin && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                        )}
                        ₽ {fmtRub(income)}
                      </span>
                    </div>
                  </div>
                  <div className="dep-card-aside">
                    <div className="dep-bank-logo" style={{ background: dep.color, color: dep.textColor }}>
                      {dep.bank.slice(0, 2)}
                    </div>
                    <div className={`dep-expand-btn${isOpen ? ' open' : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {isOpen && (() => {
                  const effectiveRate = calcEffectiveRate(rate, dep.freq)
                  const amountRange = dep.maxAmount
                    ? `от\u00a0${fmtRub(dep.minAmount)}\u00a0до\u00a0${fmtRub(dep.maxAmount)}`
                    : `от\u00a0${fmtRub(dep.minAmount)}`
                  const freqLabel = dep.freq === 'monthly' ? 'Ежемесячно' : 'В конце срока'
                  return (
                  <div className="dep-card-detail">
                    {belowMin && (
                      <div className="dep-amount-warn">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        Ваша сумма {fmtRub(amount)} меньше минимальной ({fmtRub(dep.minAmount)}) — открыть вклад не получится
                      </div>
                    )}
                    <div className="dep-detail-grid">
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Ставка банка</span>
                        <span className="dep-detail-val green">{rate}%</span>
                      </div>
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Эффективная ставка</span>
                        <span className="dep-detail-val green">
                          {effectiveRate}%
                          {dep.freq === 'monthly' && <span className="dep-detail-hint"> с кап.</span>}
                        </span>
                      </div>
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Выплата %</span>
                        <span className="dep-detail-val">{freqLabel}</span>
                      </div>
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Срок вклада</span>
                        <span className="dep-detail-val">{fmtMonth(selectedMonth)}</span>
                      </div>
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Сумма вклада</span>
                        <span className="dep-detail-val">{amountRange}</span>
                      </div>
                      <div className="dep-detail-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="dep-detail-lbl">Защита вкладов</span>
                        <span className="dep-detail-val">
                          {dep.isSystemic
                            ? 'Системообразующий банк\u00a0— гарантия ЦБ\u00a0РФ на всю сумму'
                            : 'Страхование АСВ до\u00a01,4\u00a0млн\u00a0₽'}
                        </span>
                      </div>
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Пополнение</span>
                        <span className="dep-detail-val">{dep.replenishment ? 'Да' : 'Нет'}</span>
                      </div>
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Снятие</span>
                        <span className="dep-detail-val">{dep.withdrawal ? 'Да' : 'Нет'}</span>
                      </div>
                      <div className="dep-detail-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="dep-detail-lbl">Ваш доход за {fmtMonth(selectedMonth)}</span>
                        <span className={`dep-detail-val${belowMin ? ' warn' : ' green'}`}>{fmtRub(income)}</span>
                      </div>
                    </div>

                    <Accordion title="Условия для открытия">
                      <p className="dep-acc-text">{dep.conditionsText}</p>
                    </Accordion>
                    <Accordion title="Параметры вклада">
                      <p className="dep-acc-text">{dep.params}</p>
                    </Accordion>

                    {dep.tariff && (
                      <div className="dep-tariff-block">
                        <div className="dep-tariff-header">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          <span className="dep-tariff-name">{dep.tariff.name}</span>
                          <span className="dep-tariff-cost">{dep.tariff.cost}</span>
                        </div>
                        <p className="dep-tariff-cond">{dep.tariff.conditions}</p>
                        <ul className="dep-tariff-benefits">
                          {dep.tariff.benefits.map((b, i) => (
                            <li key={i} className="dep-tariff-benefit">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              {b}
                            </li>
                          ))}
                        </ul>
                        {dep.tariff.url && (
                          <a className="dep-tariff-link" href={dep.tariff.url} target="_blank" rel="noopener noreferrer">
                            Подробнее
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    )}

                    <button className="dep-cta-btn">
                      Узнать подробнее
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </button>
                  </div>
                  )
                })()}
              </div>
            )
          })}
        </div>

        {/* ── Накопительные счета (только при сроке 1 мес) ── */}

        {selectedMonth === 1 && <div className="dep-list">
          {SAVINGS.map(sav => {
            const savIncome = calcIncome(sav.rate, amount, 1) // всегда 1 мес
            const isOpen = expanded === sav.id
            return (
              <div key={sav.id} className={`dep-card${isOpen ? ' open' : ''}`}>
                <div className="dep-card-main" onClick={() => setExpanded(isOpen ? null : sav.id)}>
                  <div className="dep-card-body">
                    <div className="dep-card-names">
                      <span className="dep-bank-name">{sav.bank}</span>
                    </div>
                    <div className="dep-dep-name">{sav.name}</div>
                    <div className="dep-tags">
                      {sav.tags.map((t, i) => <span key={i} className="dep-tag">{t}</span>)}
                    </div>
                    <div className="dep-card-pills">
                      <span className="dep-pill dep-pill-rate">% {sav.rate}</span>
                      <span className="dep-pill dep-pill-note">{sav.rateNote}</span>
                      <span className="dep-pill dep-pill-income">₽ {fmtRub(calcIncome(sav.rate, amount, 1))}</span>
                    </div>
                  </div>
                  <div className="dep-card-aside">
                    <div className="dep-bank-logo" style={{ background: sav.color, color: sav.textColor }}>
                      {sav.bank.slice(0, 2)}
                    </div>
                    <div className={`dep-expand-btn${isOpen ? ' open' : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="dep-card-detail">
                    {/* Savings info grid */}
                    <div className="dep-detail-grid" style={{ paddingTop: 14 }}>
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Ставка</span>
                        <span className="dep-detail-val green">{sav.rate}%</span>
                      </div>
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Условие ставки</span>
                        <span className="dep-detail-val">{sav.rateNote}</span>
                      </div>
                      {sav.rateBase && (
                        <div className="dep-detail-item">
                          <span className="dep-detail-lbl">Базовая ставка</span>
                          <span className="dep-detail-val">{sav.rateBase}%</span>
                        </div>
                      )}
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Снятие</span>
                        <span className="dep-detail-val">{sav.withdrawal ? 'Да, в любой момент' : 'Нет'}</span>
                      </div>
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Пополнение</span>
                        <span className="dep-detail-val">{sav.replenishment ? 'Да, без ограничений' : 'Нет'}</span>
                      </div>
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Страхование АСВ</span>
                        <span className="dep-detail-val">{sav.asv ? 'до 1,4\u00a0млн ₽' : 'нет'}</span>
                      </div>
                      <div className="dep-detail-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="dep-detail-lbl">Доход за 1 мес при {fmtRub(amount)}</span>
                        <span className="dep-detail-val green">{fmtRub(savIncome)}</span>
                      </div>
                    </div>

                    <div className="dep-sav-notice">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      В отличие от вклада ставка по накопительному счёту может измениться в любой момент по решению банка.
                    </div>

                    <Accordion title="Условия">
                      <p className="dep-acc-text">{sav.conditionsText}</p>
                    </Accordion>
                    <Accordion title="Параметры">
                      <p className="dep-acc-text">{sav.params}</p>
                    </Accordion>

                    <button className="dep-cta-btn">
                      Узнать подробнее
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>}

        <div className="dep-disclaimer">
          Данные носят информационный характер. Актуальные условия уточняйте на сайте банка.
          Вклады и накопительные счета застрахованы АСВ в пределах 1,4 млн ₽.
        </div>

      </main>

      {/* Scroll to top */}
      {showScrollTop && (
        <button className="dep-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </button>
      )}

      {/* ── Filters modal ── */}
      {showModal && (
        <div className="dep-modal-overlay" onClick={() => { setShowModal(false); setBankSearch('') }}>
          <div className="dep-modal" onClick={e => e.stopPropagation()}>
            <div className="dep-modal-header">
              <span className="dep-modal-title">Фильтры</span>
              <button className="dep-modal-close" onClick={() => { setShowModal(false); setBankSearch('') }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="dep-modal-body">
              {/* Banks */}
              <div className="dep-modal-section">
                <div className="dep-modal-section-hdr">
                  <span className="dep-modal-section-title">Банки</span>
                  {filterBanks.size > 0 && (
                    <button className="dep-modal-section-reset" onClick={() => setFilterBanks(new Set())}>Сбросить</button>
                  )}
                </div>
                <input className="dep-bank-search" type="text" placeholder="Поиск банка..."
                  value={bankSearch} onChange={e => setBankSearch(e.target.value)} />
                <div className="dep-fchips">
                  {visibleBanks.length > 0 ? visibleBanks.map(bank => (
                    <FilterChip key={bank} label={bank}
                      active={filterBanks.has(bank)}
                      onClick={() => toggleSet(setFilterBanks, bank)} />
                  )) : <span className="dep-bank-no-results">Ничего не найдено</span>}
                </div>
              </div>

              {/* Payment frequency */}
              <div className="dep-modal-section">
                <div className="dep-modal-section-hdr">
                  <span className="dep-modal-section-title">Выплата процентов</span>
                  {filterFreq.size > 0 && (
                    <button className="dep-modal-section-reset" onClick={() => setFilterFreq(new Set())}>Сбросить</button>
                  )}
                </div>
                <div className="dep-fchips">
                  {FREQ_FILTERS.map(f => (
                    <FilterChip key={f.id} label={f.label}
                      active={filterFreq.has(f.id)}
                      onClick={() => toggleSet(setFilterFreq, f.id)} />
                  ))}
                </div>
              </div>

              {/* Additional conditions */}
              <div className="dep-modal-section">
                <div className="dep-modal-section-hdr">
                  <span className="dep-modal-section-title">Дополнительные условия</span>
                  {filterConds.size > 0 && (
                    <button className="dep-modal-section-reset" onClick={() => setFilterConds(new Set())}>Сбросить</button>
                  )}
                </div>
                <div className="dep-fchips">
                  {COND_FILTERS.map(f => (
                    <FilterChip key={f.id} label={f.label}
                      active={filterConds.has(f.id)}
                      onClick={() => toggleSet(setFilterConds, f.id)} />
                  ))}
                </div>
              </div>

              {/* Liquidity */}
              <div className="dep-modal-section">
                <div className="dep-modal-section-hdr">
                  <span className="dep-modal-section-title">Пополнение и снятие</span>
                  {filterLiquid.size > 0 && (
                    <button className="dep-modal-section-reset" onClick={() => setFilterLiquid(new Set())}>Сбросить</button>
                  )}
                </div>
                <div className="dep-fchips">
                  {LIQUID_FILTERS.map(f => (
                    <FilterChip key={f.id} label={f.label}
                      active={filterLiquid.has(f.id)}
                      onClick={() => toggleSet(setFilterLiquid, f.id)} />
                  ))}
                </div>
              </div>
            </div>

            <div className="dep-modal-footer">
              <button className="dep-modal-reset" onClick={resetFilters}
                disabled={totalActiveFilters === 0}>
                Сбросить{totalActiveFilters > 0 ? ` (${totalActiveFilters})` : ''}
              </button>
              <button className="dep-modal-apply" onClick={() => { setShowModal(false); setBankSearch('') }}>
                Показать {filtered.length} предложений
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
