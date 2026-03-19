import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

// ── Period groups ─────────────────────────────────────────────────────────────
const PERIOD_GROUPS = [
  { id: '1-6',   label: '1–6 мес',    months: [1, 2, 3, 4, 5, 6] },
  { id: '6-12',  label: '6–12 мес',   months: [6, 7, 8, 9, 10, 11, 12] },
  { id: '12-18', label: '1–1.5 года', months: [12, 15, 18] },
  { id: '18-36', label: '1.5–3 года', months: [18, 24, 36] },
]

// ── Mock deposits ─────────────────────────────────────────────────────────────
const DEPOSITS = [
  {
    id: 'd1', bank: 'Т-Банк', name: 'СмartВклад Онлайн',
    color: '#FFDD2D', textColor: '#1A1A1A',
    rates: { 1: 14.0, 2: 16.5, 3: 21.5, 6: 20.0, 12: 18.5, 18: 17.0 },
    minAmount: 50000,
    tags: ['для новых клиентов', 'выплата % в конце срока', 'без пополнения и снятия'],
    asv: true, online: true,
    conditions: 'Только для новых клиентов банка. Открытие онлайн через приложение. Без пополнения и снятия до окончания срока.',
    params: 'Выплата процентов в конце срока вклада. Капитализация: нет. Автопролонгация: по желанию.',
  },
  {
    id: 'd2', bank: 'Альфа-Банк', name: 'Альфа-Вклад',
    color: '#EF3124', textColor: '#FFF',
    rates: { 1: 13.5, 3: 20.8, 6: 19.5, 12: 18.0, 18: 16.5, 24: 15.5 },
    minAmount: 10000,
    tags: ['выплата % ежемесячно', 'с пополнением'],
    asv: true, online: true,
    conditions: 'Для новых и действующих клиентов. Открытие онлайн. Пополнение разрешено в течение всего срока.',
    params: 'Выплата процентов ежемесячно на отдельный счёт. Пополнение: да. Снятие: нет.',
  },
  {
    id: 'd3', bank: 'Сбер', name: 'Лучший %',
    color: '#21A038', textColor: '#FFF',
    rates: { 1: 12.0, 2: 15.5, 3: 19.0, 4: 18.0, 5: 17.5, 6: 18.5, 12: 17.0, 18: 15.5, 24: 14.0, 36: 13.0 },
    minAmount: 1000,
    tags: ['с пополнением', 'выплата % ежемесячно'],
    asv: true, online: true,
    conditions: 'Для всех клиентов. От 1 000 ₽. Пополнение разрешено в первую треть срока.',
    params: 'Выплата процентов ежемесячно. Капитализация: доступна. Снятие: нет.',
  },
  {
    id: 'd4', bank: 'ВТБ', name: 'Новое время',
    color: '#009FDF', textColor: '#FFF',
    rates: { 3: 20.0, 4: 19.0, 5: 18.5, 6: 19.5, 12: 18.0, 18: 16.0 },
    minAmount: 30000,
    tags: ['для новых клиентов', 'выплата % в конце срока', 'без пополнения и снятия'],
    asv: true, online: true,
    conditions: 'Только для новых клиентов. От 30 000 ₽. Открытие в офисе или онлайн.',
    params: 'Выплата в конце срока. Без пополнения и снятия. Автопролонгация: нет.',
  },
  {
    id: 'd5', bank: 'Газпромбанк', name: 'Накопи +',
    color: '#003087', textColor: '#FFF',
    rates: { 3: 19.5, 6: 19.0, 12: 17.5, 18: 16.0, 24: 15.0, 36: 13.5 },
    minAmount: 15000,
    tags: ['с пополнением', 'выплата % в конце срока'],
    asv: true, online: false,
    conditions: 'Открытие в офисе или через личный кабинет. Пополнение разрешено.',
    params: 'Выплата в конце срока. Капитализация: нет. Снятие: нет.',
  },
  {
    id: 'd6', bank: 'Банк Дом.РФ', name: 'Надёжный прайм',
    color: '#1A3F6F', textColor: '#FFF',
    rates: { 1: 13.0, 2: 17.0, 3: 20.5, 6: 18.0 },
    minAmount: 100000,
    tags: ['для новых клиентов', 'выплата % в конце срока', 'без пополнения и снятия'],
    asv: true, online: true,
    conditions: 'Для новых клиентов. От 100 000 ₽. Открытие онлайн.',
    params: 'Без пополнения и снятия. Выплата в конце срока. Автопролонгация: нет.',
  },
  {
    id: 'd7', bank: 'МТС Банк', name: 'МТС Специальный',
    color: '#E30611', textColor: '#FFF',
    rates: { 3: 20.2, 6: 19.0, 12: 17.0 },
    minAmount: 10000,
    tags: ['инвест или страхование', 'выплата % в конце срока', 'без пополнения и снятия'],
    asv: true, online: true,
    conditions: 'Требуется оформление инвестиционных или страховых продуктов банка.',
    params: 'Без пополнения и снятия. Выплата в конце срока.',
  },
  {
    id: 'd8', bank: 'Росбанк', name: 'Максимальный доход',
    color: '#CC2030', textColor: '#FFF',
    rates: { 1: 12.5, 2: 16.0, 3: 19.8, 6: 18.5, 12: 17.0, 18: 15.5 },
    minAmount: 50000,
    tags: ['выплата % в конце срока', 'без пополнения и снятия'],
    asv: true, online: true,
    conditions: 'Для новых и действующих клиентов. Открытие онлайн или в офисе.',
    params: 'Выплата в конце срока. Без пополнения и снятия. Капитализация: нет.',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtRub = n => Math.round(n).toLocaleString('ru') + '\u00a0₽'
const fmtMonth = m => m < 12 ? `${m}\u00a0мес` : m === 12 ? '1\u00a0год' : m === 18 ? '1.5\u00a0года' : m === 24 ? '2\u00a0года' : m === 36 ? '3\u00a0года' : `${m}\u00a0мес`

function calcIncome(rate, amount, months) {
  return Math.round(amount * (rate / 100) * (months / 12))
}

// ── Accordion ─────────────────────────────────────────────────────────────────
function Accordion({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="dep-acc">
      <button className={`dep-acc-head${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {open && <div className="dep-acc-body">{children}</div>}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Deposits() {
  const navigate = useNavigate()

  const [amount, setAmount] = useState(() => {
    try {
      const f = JSON.parse(localStorage.getItem('ss_finance') || '{}')
      return f.capital && f.capital >= 1000 ? f.capital : 500000
    } catch { return 500000 }
  })
  const [amountInput, setAmountInput] = useState(() => {
    try {
      const f = JSON.parse(localStorage.getItem('ss_finance') || '{}')
      return f.capital && f.capital >= 1000 ? String(f.capital) : '500000'
    } catch { return '500000' }
  })
  const [periodGroup, setPeriodGroup] = useState('1-6')
  const [selectedMonth, setSelectedMonth] = useState(3)
  const [sortBy, setSortBy] = useState('rate')
  const [expanded, setExpanded] = useState(null)

  const currentGroup = PERIOD_GROUPS.find(g => g.id === periodGroup)
  const months = currentGroup.months

  // Max rate for each month across all deposits
  const monthRates = useMemo(() => months.map(m => ({
    month: m,
    rate: Math.max(0, ...DEPOSITS.map(d => d.rates[m] || 0)),
  })), [months])

  const maxRate = Math.max(...monthRates.map(r => r.rate), 1)

  // Filtered and sorted deposits for selected month
  const filtered = useMemo(() => DEPOSITS
    .filter(d => d.rates[selectedMonth])
    .sort((a, b) => sortBy === 'rate'
      ? (b.rates[selectedMonth] || 0) - (a.rates[selectedMonth] || 0)
      : calcIncome(b.rates[selectedMonth] || 0, amount, selectedMonth) - calcIncome(a.rates[selectedMonth] || 0, amount, selectedMonth)
    ), [selectedMonth, sortBy, amount])

  function handleGroupChange(gId) {
    setPeriodGroup(gId)
    const g = PERIOD_GROUPS.find(p => p.id === gId)
    const firstValid = g.months.find(m => DEPOSITS.some(d => d.rates[m]))
    setSelectedMonth(firstValid || g.months[0])
    setExpanded(null)
  }

  function handleMonthClick(m) {
    setSelectedMonth(m)
    setExpanded(null)
  }

  function handleAmountChange(e) {
    const raw = e.target.value.replace(/\D/g, '')
    setAmountInput(raw)
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n > 0) setAmount(n)
  }

  // Best deposit for selected month
  const bestRate = Math.max(...filtered.map(d => d.rates[selectedMonth] || 0))
  const bestIncome = calcIncome(bestRate, amount, selectedMonth)

  return (
    <Layout>
      <main className="dep-main">

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-item" onClick={() => navigate('/profile')}>Профиль</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          <span className="breadcrumb-current">Вклады и накопительные счета</span>
        </div>

        {/* Chart card */}
        <div className="dep-chart-card">
          <div className="dep-chart-header">
            <div className="dep-chart-title">Максимальные ставки по срокам</div>
            <div className="dep-period-tabs">
              {PERIOD_GROUPS.map(g => (
                <button key={g.id}
                  className={`dep-period-tab${periodGroup === g.id ? ' active' : ''}`}
                  onClick={() => handleGroupChange(g.id)}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="dep-chart">
            {monthRates.map(({ month, rate }) => {
              const isSelected = selectedMonth === month
              const heightPct = rate > 0 ? Math.max(12, (rate / maxRate) * 100) : 8
              return (
                <div key={month} className={`dep-bar-col${isSelected ? ' selected' : ''}`}
                  onClick={() => handleMonthClick(month)}>
                  <div className="dep-bar-rate">{rate > 0 ? `${rate}%` : '—'}</div>
                  <div className="dep-bar-track">
                    <div className="dep-bar" style={{ height: `${heightPct}%` }} />
                  </div>
                  <div className="dep-bar-label">{fmtMonth(month)}</div>
                </div>
              )
            })}
          </div>

          {/* Selected month summary */}
          <div className="dep-chart-footer">
            <div className="dep-chart-stat">
              <span className="dep-chart-stat-val">{fmtMonth(selectedMonth)}</span>
              <span className="dep-chart-stat-lbl">выбранный срок</span>
            </div>
            <div className="dep-chart-stat">
              <span className="dep-chart-stat-val">{bestRate}%</span>
              <span className="dep-chart-stat-lbl">макс. ставка</span>
            </div>
            <div className="dep-chart-stat">
              <span className="dep-chart-stat-val">{fmtRub(bestIncome)}</span>
              <span className="dep-chart-stat-lbl">макс. доход</span>
            </div>
            <div className="dep-chart-stat">
              <span className="dep-chart-stat-val">{filtered.length}</span>
              <span className="dep-chart-stat-lbl">предложений</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="dep-filters">
          <div className="dep-filter-group">
            <span className="dep-filter-label">Сумма вклада</span>
            <div className="dep-amount-wrap">
              <input className="dep-amount-input" type="text" inputMode="numeric"
                value={amountInput ? parseInt(amountInput).toLocaleString('ru') : ''}
                onChange={handleAmountChange}
                placeholder="500 000"
              />
              <span className="dep-amount-unit">₽</span>
            </div>
          </div>
          <div className="dep-filter-group">
            <span className="dep-filter-label">Сортировка</span>
            <div className="dep-sort-toggle">
              <button className={`dep-sort-btn${sortBy === 'rate' ? ' active' : ''}`}
                onClick={() => setSortBy('rate')}>% ставка</button>
              <button className={`dep-sort-btn${sortBy === 'income' ? ' active' : ''}`}
                onClick={() => setSortBy('income')}>₽ доход</button>
            </div>
          </div>
        </div>

        {/* Deposit list */}
        <div className="dep-list">
          {filtered.length === 0 && (
            <div className="dep-empty">Нет предложений для этого срока</div>
          )}
          {filtered.map(dep => {
            const rate = dep.rates[selectedMonth]
            const income = calcIncome(rate, amount, selectedMonth)
            const isOpen = expanded === dep.id
            const isBest = rate === bestRate

            return (
              <div key={dep.id} className={`dep-card${isOpen ? ' open' : ''}`}>

                {/* Card main row */}
                <div className="dep-card-main" onClick={() => setExpanded(isOpen ? null : dep.id)}>
                  <div className="dep-bank-logo" style={{ background: dep.color, color: dep.textColor }}>
                    {dep.bank.slice(0, 1)}
                  </div>
                  <div className="dep-card-info">
                    <div className="dep-card-names">
                      <span className="dep-bank-name">{dep.bank}</span>
                      {isBest && <span className="dep-best-badge">лучшее</span>}
                    </div>
                    <div className="dep-dep-name">{dep.name}</div>
                    <div className="dep-tags">
                      {dep.tags.map((t, i) => <span key={i} className="dep-tag">{t}</span>)}
                    </div>
                  </div>
                  <div className="dep-card-right">
                    <div className="dep-rate-big">{rate}%</div>
                    <div className="dep-income-amt">{fmtRub(income)}</div>
                    <div className="dep-income-lbl">за {fmtMonth(selectedMonth)}</div>
                    <svg className={`dep-card-chevron${isOpen ? ' open' : ''}`}
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="dep-card-detail">
                    <div className="dep-detail-grid">
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Ставка</span>
                        <span className="dep-detail-val green">{rate}% годовых</span>
                      </div>
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Срок</span>
                        <span className="dep-detail-val">{fmtMonth(selectedMonth)}</span>
                      </div>
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Мин. сумма</span>
                        <span className="dep-detail-val">{fmtRub(dep.minAmount)}</span>
                      </div>
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Страхование АСВ</span>
                        <span className="dep-detail-val">{dep.asv ? 'до 1,4\u00a0млн ₽' : 'нет'}</span>
                      </div>
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Открытие онлайн</span>
                        <span className="dep-detail-val">{dep.online ? 'да' : 'только в офисе'}</span>
                      </div>
                      <div className="dep-detail-item">
                        <span className="dep-detail-lbl">Ваш доход</span>
                        <span className="dep-detail-val green">{fmtRub(income)}</span>
                      </div>
                    </div>

                    <Accordion title="Условия для открытия">
                      <p className="dep-acc-text">{dep.conditions}</p>
                    </Accordion>
                    <Accordion title="Параметры вклада">
                      <p className="dep-acc-text">{dep.params}</p>
                    </Accordion>

                    {/* Mini rate table — all available terms for this deposit */}
                    <div className="dep-rates-table">
                      <div className="dep-rates-title">Ставки по другим срокам</div>
                      <div className="dep-rates-row">
                        {Object.entries(dep.rates).sort((a, b) => +a[0] - +b[0]).map(([m, r]) => (
                          <div key={m}
                            className={`dep-rate-cell${+m === selectedMonth ? ' current' : ''}`}
                            onClick={() => { handleMonthClick(+m); if (+m !== selectedMonth) { const g = PERIOD_GROUPS.find(pg => pg.months.includes(+m)); if (g) setPeriodGroup(g.id) } }}>
                            <div className="dep-rate-cell-pct">{r}%</div>
                            <div className="dep-rate-cell-term">{fmtMonth(+m)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button className="dep-cta-btn">
                      Узнать подробнее
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="dep-disclaimer">
          Данные носят информационный характер. Актуальные условия уточняйте на сайте банка. Вклады застрахованы АСВ в пределах 1,4 млн ₽.
        </div>

      </main>
    </Layout>
  )
}
