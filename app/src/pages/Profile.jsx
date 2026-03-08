import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useApp } from '../context/AppContext'
import { userData } from '../data/mock'

// Данные финансовой картины
const BUDGET_GROUPS = [
  {
    id: 'housing', label: 'Жильё', total: -25000, pct: 31,
    rows: [
      { label: 'Аренда квартиры', value: -20000 },
      { label: 'Коммунальные услуги', value: -5000 },
    ],
    hint: '31% дохода на жильё — выше рекомендуемых 25–30%. Если аренда выросла, возможно стоит пересмотреть бюджет.',
    hintType: 'warn',
  },
  {
    id: 'credit', label: 'Кредитные обязательства', total: -11700, pct: 15,
    rows: [
      { label: 'Кредит — автомобиль', value: -8500 },
      { label: 'Кредитная карта', value: -3200 },
    ],
    hint: 'Кредитная нагрузка 15% дохода — в норме.',
    hintType: 'info',
  },
  {
    id: 'envelopes', label: 'Конверты', total: -20000, pct: 25,
    rows: [
      { label: 'Еда и продукты', value: -10000 },
      { label: 'Одежда', value: -5000 },
      { label: 'Бытовая химия и гигиена', value: -3000 },
      { label: 'Прочие конверты', value: -2000 },
    ],
  },
]

const INCOME = 80000
const TOTAL_EXPENSES = 56700
const SAVINGS = INCOME - TOTAL_EXPENSES
const CAPITAL = 1240000

const EMO_RATES = [
  { rate: 0.04, label: '4%', level: 'low' },
  { rate: 0.05, label: '5%', level: 'medium' },
  { rate: 0.07, label: '7%', level: 'high' },
  { rate: 0.10, label: '10%', level: 'extra' },
]

function BudgetGroup({ group }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div
        className={`bl-group-header${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', transition: 'background 0.12s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
        onMouseLeave={e => e.currentTarget.style.background = ''}
      >
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', flexShrink: 0, color: 'var(--text-3)' }}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="bl-group-label" style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{group.label}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-2)' }}>{group.total.toLocaleString('ru')} ₽</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 32, textAlign: 'right' }}>{group.pct}%</span>
      </div>
      {open && (
        <div>
          {group.rows.map((row, i) => (
            <div key={i} className="bl-row sub" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 20px 8px 40px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{row.label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-2)' }}>{row.value.toLocaleString('ru')} ₽</span>
            </div>
          ))}
          {group.hint && (
            <div className={`ctx-hint ${group.hintType === 'warn' ? 'ctx-hint-warn' : 'ctx-hint-info'}`}>
              <span>{group.hint}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { username } = useApp()
  const [emoRate, setEmoRate] = useState(0.05)

  const emoAnnual = Math.round(CAPITAL * emoRate)
  const emoMonthly = Math.round(emoAnnual / 12)

  return (
    <Layout>
      <main className="profile-main">
        {/* Приветствие */}
        <div className="entry-header">
          <div className="entry-greeting">
            <div className="entry-title">Привет, {username.split(' ')[0]}</div>
            <div className="entry-subtitle">
              В этом месяце ты откладываешь <strong>{Math.round((SAVINGS / INCOME) * 100)}% дохода</strong> — хороший темп накопления.
            </div>
          </div>
          <div className="entry-tiles">
            <div className="entry-tile">
              <div className="entry-tile-label">Доход</div>
              <div className="entry-tile-value">{INCOME.toLocaleString('ru')} ₽</div>
            </div>
            <div className="entry-tile-divider" />
            <div className="entry-tile">
              <div className="entry-tile-label">Расходы</div>
              <div className="entry-tile-value">{TOTAL_EXPENSES.toLocaleString('ru')} ₽</div>
              <div className="entry-tile-sub">{Math.round((TOTAL_EXPENSES / INCOME) * 100)}% дохода</div>
            </div>
            <div className="entry-tile-divider" />
            <div className="entry-tile entry-tile-highlight">
              <div className="entry-tile-label">Откладывается</div>
              <div className="entry-tile-value">{SAVINGS.toLocaleString('ru')} ₽</div>
              <div className="entry-tile-sub">{Math.round((SAVINGS / INCOME) * 100)}% дохода</div>
            </div>
          </div>
        </div>

        {/* Финансовая картина */}
        <div>
          <div className="section-heading">
            <span className="section-title">Финансовая картина</span>
            <button className="section-link">Редактировать</button>
          </div>
          <div className="profile-card">
            {/* Доход */}
            <div className="bl-row bl-row-income">
              <span className="bl-label">Доход</span>
              <span className="bl-value">{INCOME.toLocaleString('ru')} ₽</span>
            </div>
            {/* Группы */}
            {BUDGET_GROUPS.map(g => <BudgetGroup key={g.id} group={g} />)}
            {/* Итог */}
            <div className="bl-row bl-row-total" style={{ borderTop: '2px solid var(--border)' }}>
              <span className="bl-label" style={{ fontWeight: 600 }}>Итого расходов</span>
              <span className="bl-value" style={{ fontWeight: 600 }}>
                −{TOTAL_EXPENSES.toLocaleString('ru')} ₽
                <span className="bl-tag-neutral"> {Math.round((TOTAL_EXPENSES / INCOME) * 100)}%</span>
              </span>
            </div>
            <div className="bl-row bl-row-remainder">
              <span className="bl-label">Остаток — к инвестированию</span>
              <span className="bl-value">
                {SAVINGS.toLocaleString('ru')} ₽
                <span className="bl-tag"> {Math.round((SAVINGS / INCOME) * 100)}%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Капитал и EmoSpend */}
        <div>
          <div className="section-heading">
            <span className="section-title">Капитал и свободные расходы</span>
          </div>
          <div className="profile-card">
            <div className="cap-top">
              <div>
                <div className="cap-label">Общий капитал</div>
                <div className="cap-value">{CAPITAL.toLocaleString('ru')} ₽</div>
                <div className="cap-meta">Рекомендуется обновлять раз в год</div>
              </div>
              <button className="btn-sm" onClick={() => navigate('/account')}>Обновить</button>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 20 }}>
              <div className="emo-title">EmoSpend</div>
              <div className="emo-subtitle">Свободные траты вне наборов — от капитала</div>
              <div className="emo-tiles">
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
          </div>
        </div>

        {/* Конверты */}
        <div>
          <div className="section-heading">
            <span className="section-title">Конверты и наборы</span>
            <button className="section-link">Редактировать</button>
          </div>
          <div className="envelopes-list">
            {userData.budgets.map((b, i) => {
              const pct = Math.min(100, Math.round((b.spent / b.limit) * 100))
              const over = b.spent > b.limit
              return (
                <div key={i} className="envelope-card">
                  <div className="env-bar" style={{ background: b.color }} />
                  <div className="env-body">
                    <div className="env-header">
                      <span className="env-name">{b.name}</span>
                      <span className="env-amount" style={{ color: over ? 'var(--status-urgent)' : 'var(--text)' }}>
                        {b.spent.toLocaleString('ru')} <span className="env-limit">/ {b.limit.toLocaleString('ru')} ₽</span>
                      </span>
                    </div>
                    <div className="env-progress-bar">
                      <div className="env-progress-fill" style={{ width: `${pct}%`, background: over ? 'var(--status-urgent)' : b.color }} />
                    </div>
                    <div className="env-meta">
                      <span style={{ color: over ? 'var(--status-urgent)' : 'var(--text-3)', fontSize: 11 }}>
                        {over ? `Превышено на ${(b.spent - b.limit).toLocaleString('ru')} ₽` : `${pct}% использовано`}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </Layout>
  )
}
