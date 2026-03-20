import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'

// ── Spending categories (mapped to envelopes where possible) ─────────────────
const SPEND_CATS = [
  { id: 'food',      label: 'Еда и супермаркеты',  icon: '🛒', envKey: 'food' },
  { id: 'cafe',      label: 'Кафе и рестораны',     icon: '☕', envKey: null },
  { id: 'transport', label: 'Транспорт',             icon: '🚗', envKey: 'transport' },
  { id: 'home',      label: 'Дом и техника',         icon: '🏠', envKey: 'home' },
  { id: 'clothes',   label: 'Одежда и обувь',        icon: '👕', envKey: 'clothes' },
  { id: 'health',    label: 'Красота и здоровье',    icon: '💊', envKey: 'health' },
  { id: 'leisure',   label: 'Развлечения',            icon: '🎭', envKey: 'leisure' },
  { id: 'travel',    label: 'Путешествия',            icon: '✈', envKey: null },
]

function loadSpending() {
  try {
    const saved = localStorage.getItem('ss_card_spending')
    if (saved) return JSON.parse(saved)
    // Pre-fill from envelopes
    const envRaw = localStorage.getItem('ss_envelopes')
    if (envRaw) {
      const envs = JSON.parse(envRaw)
      const result = {}
      SPEND_CATS.forEach(cat => {
        if (cat.envKey && envs[cat.envKey]) {
          result[cat.id] = envs[cat.envKey].reduce((s, e) => s + (e.amount || 0), 0)
        } else {
          result[cat.id] = 0
        }
      })
      return result
    }
  } catch {}
  return Object.fromEntries(SPEND_CATS.map(c => [c.id, 0]))
}

// ── Cards data ────────────────────────────────────────────────────────────────
const CARDS = [
  {
    id: 'c1', bank: 'Т-Банк', name: 'Блэк',
    color: '#FFDD2D', textColor: '#1A1A1A', isSystemic: true,
    type: 'debit',
    cashback: { food: 1, cafe: 1, transport: 1, home: 1, clothes: 1, health: 1, leisure: 1, travel: 1, other: 1 },
    cashbackNote: 'до 5% на выбранные категории, до 15% у партнёров',
    graceDays: 0,
    fee: 0, feeBase: 99,
    conditions: ['no_extra'],
    tags: ['1% на всё', 'до 15% у партнёров', 'бесплатное обслуживание'],
    bonusType: 'rubles',
    bonusSystem: 'Кешбэк рублями',
    bonusDesc: '1% на все покупки. До 5% кешбэка на выбранные категории (новый выбор каждый месяц). До 15% у партнёров Т-Банка. Начисляется сразу рублями на счёт.',
    feeDesc: 'Бесплатно при тратах от 30\u00a0000\u00a0₽/мес или остатке от 50\u00a0000\u00a0₽. Иначе 99\u00a0₽/мес.',
    url: 'https://www.tbank.ru/tbank-black/',
  },
  {
    id: 'c2', bank: 'Т-Банк', name: 'Платинум',
    color: '#FFDD2D', textColor: '#1A1A1A', isSystemic: true,
    type: 'credit',
    cashback: { other: 1 },
    cashbackNote: 'до 30% у партнёров',
    graceDays: 55,
    fee: 590, feeBase: 590,
    conditions: ['no_extra'],
    tags: ['55 дней без %', '1% кешбэк'],
    bonusType: 'rubles',
    bonusSystem: 'Льготный период + кешбэк',
    bonusDesc: '55 дней без процентов на покупки. 1% кешбэк рублями. До 30% у партнёров. При своевременном погашении процентов нет.',
    feeDesc: '590\u00a0₽/год. Бесплатно в первый год при тратах от 10\u00a0000\u00a0₽/мес.',
    url: 'https://www.tbank.ru/credit-card/tinkoff-platinum/',
  },
  {
    id: 'c3', bank: 'Альфа-Банк', name: 'Кэшбэк',
    color: '#EF3124', textColor: '#FFF', isSystemic: true,
    type: 'debit',
    cashback: { food: 5, cafe: 5, transport: 5, other: 1 },
    cashbackNote: 'до 5% на 3 категории на выбор',
    graceDays: 0,
    fee: 0, feeBase: 149,
    conditions: ['no_extra'],
    tags: ['до 5% на категории', '1% на остальное'],
    bonusType: 'rubles',
    bonusSystem: 'Кешбэк рублями',
    bonusDesc: 'До 5% кешбэка на 3 категории на выбор (продукты, кафе, транспорт, одежда, развлечения и др.). 1% на всё остальное. Начисление ежемесячно.',
    feeDesc: 'Бесплатно при тратах от 10\u00a0000\u00a0₽/мес. Иначе 149\u00a0₽/мес.',
    url: 'https://www.alfabank.ru/get-money/cashback/',
  },
  {
    id: 'c4', bank: 'Альфа-Банк', name: '100 дней',
    color: '#EF3124', textColor: '#FFF', isSystemic: true,
    type: 'credit',
    cashback: { other: 1 },
    cashbackNote: '1% на всё',
    graceDays: 100,
    fee: 0, feeBase: 1490,
    conditions: ['no_extra'],
    tags: ['100 дней без %'],
    bonusType: 'rubles',
    bonusSystem: 'Льготный период + кешбэк',
    bonusDesc: '100 дней без процентов на покупки и переводы. 1% кешбэк рублями. Снятие наличных до 50\u00a0000\u00a0₽/мес без комиссии в течение льготного периода.',
    feeDesc: 'Первый год бесплатно. Далее 1\u00a0490\u00a0₽/год.',
    url: 'https://www.alfabank.ru/get-money/credit-cards/100-days/',
  },
  {
    id: 'c5', bank: 'Сбер', name: 'СберКарта',
    color: '#21A038', textColor: '#FFF', isSystemic: true,
    type: 'debit',
    cashback: { food: 0.5, cafe: 0.5, transport: 0.5, home: 0.5, clothes: 0.5, health: 0.5, leisure: 0.5, travel: 0.5, other: 0.5 },
    cashbackNote: 'до 30% у партнёров СберСпасибо',
    graceDays: 0,
    fee: 0, feeBase: 0,
    conditions: ['no_extra'],
    tags: ['0.5% Спасибо', 'до 30% у партнёров'],
    bonusType: 'points',
    bonusSystem: 'Бонусы СберСпасибо',
    bonusDesc: '0.5% бонусами Спасибо на все покупки. До 30% у партнёров (аптеки, рестораны, АЗС, онлайн-сервисы). Бонусы можно тратить у 250\u202f000+ партнёров.',
    feeDesc: 'Обслуживание бесплатно.',
    url: 'https://www.sberbank.ru/ru/person/bank_cards/debet/sbercard/',
  },
  {
    id: 'c6', bank: 'ВТБ', name: 'Мультикарта',
    color: '#009FDF', textColor: '#FFF', isSystemic: true,
    type: 'debit',
    cashback: { food: 1.5, cafe: 1.5, transport: 1.5, home: 1.5, clothes: 1.5, health: 1.5, leisure: 1.5, travel: 1.5, other: 1.5 },
    cashbackNote: 'до 2% при тратах от 75\u00a0000\u00a0₽/мес',
    graceDays: 0,
    fee: 0, feeBase: 249,
    conditions: ['salary', 'no_extra'],
    tags: ['1.5% на всё', 'зарплатный проект'],
    bonusType: 'rubles',
    bonusSystem: 'Кешбэк рублями',
    bonusDesc: '1.5% кешбэк на все покупки. 2% при тратах от 75\u00a0000\u00a0₽/мес. Повышенный кешбэк для зарплатных клиентов ВТБ.',
    feeDesc: 'Бесплатно при тратах от 5\u00a0000\u00a0₽/мес или при зарплатном проекте. Иначе 249\u00a0₽/мес.',
    url: 'https://www.vtb.ru/personal/karty/multicard/',
  },
  {
    id: 'c7', bank: 'Газпромбанк', name: 'МИР Supreme',
    color: '#003087', textColor: '#FFF', isSystemic: true,
    type: 'debit',
    cashback: { food: 2, transport: 3, other: 1 },
    cashbackNote: '3% АЗС, 2% продукты, 1% остальное',
    graceDays: 0,
    fee: 0, feeBase: 0,
    conditions: ['no_extra'],
    tags: ['3% на АЗС', '2% продукты', 'бесплатно'],
    bonusType: 'rubles',
    bonusSystem: 'Кешбэк рублями',
    bonusDesc: '3% кешбэк на АЗС и автомойки. 2% на продуктовые магазины и супермаркеты. 1% на все остальные покупки. Без ограничений по сумме.',
    feeDesc: 'Обслуживание бесплатно.',
    url: 'https://www.gazprombank.ru/personal/bank-cards/debit-cards/mir-supreme/',
  },
  {
    id: 'c8', bank: 'МТС Банк', name: 'Cash Back',
    color: '#E30611', textColor: '#FFF', isSystemic: false,
    type: 'debit',
    cashback: { cafe: 5, transport: 5, other: 1 },
    cashbackNote: '5% кафе и транспорт',
    graceDays: 0,
    fee: 0, feeBase: 99,
    conditions: ['no_extra'],
    tags: ['5% кафе и транспорт', '1% на остальное'],
    bonusType: 'rubles',
    bonusSystem: 'Кешбэк рублями',
    bonusDesc: '5% кешбэк на кафе, рестораны и транспорт (такси, метро, автобус). 1% на все остальные покупки. Начисление рублями.',
    feeDesc: 'Бесплатно при тратах от 15\u00a0000\u00a0₽/мес. Иначе 99\u00a0₽/мес.',
    url: 'https://www.mtsbank.ru/karta-cash-back/',
  },
  {
    id: 'c9', bank: 'Росбанк', name: '#МожноВСЁ',
    color: '#CC2030', textColor: '#FFF', isSystemic: true,
    type: 'debit',
    cashback: { food: 3, cafe: 3, transport: 3, home: 3, clothes: 3, health: 3, leisure: 3, travel: 3, other: 1 },
    cashbackNote: '3% на 3 категории на выбор',
    graceDays: 0,
    fee: 0, feeBase: 99,
    conditions: ['no_extra'],
    tags: ['3% на категории', '1% остальное'],
    bonusType: 'rubles',
    bonusSystem: 'Кешбэк рублями',
    bonusDesc: '3% на любые 3 категории на выбор. 1% на все остальные покупки. Категории можно менять раз в квартал.',
    feeDesc: 'Бесплатно при тратах от 15\u00a0000\u00a0₽/мес. Иначе 99\u00a0₽/мес.',
    url: 'https://www.rosbank.ru/card/mozhno-vsyo/',
  },
  {
    id: 'c10', bank: 'Банк Дом.РФ', name: 'Умная карта',
    color: '#1A3F6F', textColor: '#FFF', isSystemic: true,
    type: 'debit',
    cashback: { food: 2, cafe: 2, transport: 2, home: 2, clothes: 2, health: 2, leisure: 2, travel: 2, other: 2 },
    cashbackNote: '5% на крупнейшую категорию автоматически',
    graceDays: 0,
    fee: 0, feeBase: 99,
    conditions: ['no_extra'],
    tags: ['2% на всё', '5% топ-категория'],
    bonusType: 'rubles',
    bonusSystem: 'Умный кешбэк',
    bonusDesc: '2% кешбэк на все покупки. Дополнительные 3% (итого 5%) на категорию с наибольшими тратами за месяц — определяется автоматически.',
    feeDesc: 'Бесплатно при тратах от 10\u00a0000\u00a0₽/мес. Иначе 99\u00a0₽/мес.',
    url: 'https://domrfbank.ru/cards/umkarta/',
  },
  {
    id: 'c11', bank: 'Совкомбанк', name: 'Халва',
    color: '#6B3FA0', textColor: '#FFF', isSystemic: true,
    type: 'credit',
    cashback: { food: 1.5, cafe: 1.5, transport: 1.5, home: 1.5, clothes: 1.5, health: 1.5, leisure: 1.5, travel: 1.5, other: 1.5 },
    cashbackNote: 'рассрочка до 36 мес у партнёров',
    graceDays: 0,
    fee: 0, feeBase: 0,
    conditions: ['no_extra'],
    tags: ['рассрочка 0%', '1.5% кешбэк', 'бесплатно'],
    bonusType: 'rubles',
    bonusSystem: 'Рассрочка + кешбэк',
    bonusDesc: 'Рассрочка до 36 месяцев в магазинах-партнёрах без переплаты. 1.5% кешбэк на покупки вне рассрочки. Накопительный счёт с начислением до 17%.',
    feeDesc: 'Обслуживание карты бесплатно.',
    url: 'https://sovcombank.ru/cards/halva/',
  },
  {
    id: 'c12', bank: 'Сбер', name: 'СберПрайм+',
    color: '#21A038', textColor: '#FFF', isSystemic: true,
    type: 'debit',
    cashback: { food: 5, cafe: 5, transport: 3, home: 3, clothes: 3, health: 3, leisure: 3, travel: 5, other: 1.5 },
    cashbackNote: 'до 10% у партнёров, подписка СберПрайм',
    graceDays: 0,
    fee: 0, feeBase: 0,
    conditions: ['premium', 'subscription'],
    tags: ['до 10% Спасибо', 'подписка СберПрайм', 'премиальная'],
    bonusType: 'points',
    bonusSystem: 'Повышенный СберСпасибо',
    bonusDesc: 'До 10% бонусами Спасибо на партнёров. 5% на продукты, кафе и путешествия. 3% на транспорт, здоровье, одежду. 1.5% на всё остальное. Требуется подписка СберПрайм.',
    feeDesc: 'Обслуживание карты бесплатно при активной подписке СберПрайм. Подписка — от 399\u00a0₽/мес.',
    url: 'https://www.sberbank.ru/ru/person/subscriptions/sberprime/',
  },
]

const ALL_CARD_BANKS = [...new Set(CARDS.map(c => c.bank))]

// ── Subscriptions data ────────────────────────────────────────────────────────
const SUBS = [
  {
    id: 'sub1', name: 'Яндекс Плюс', icon: '🎵',
    color: '#FC3F1D', textColor: '#FFF',
    cost: 'от 299 ₽/мес',
    cashbackBonus: 'до 5% кешбэк баллами Плюс',
    tags: ['Музыка, Кино', 'Такси, Доставка', 'Кешбэк баллами'],
    desc: 'Кешбэк до 5% баллами Плюс на покупки в экосистеме Яндекса (Такси, Лавка, Еда, Маркет). Баллы тратятся 1:1 вместо рублей. При оплате подходящей картой — дополнительный кешбэк.',
    feeDesc: 'от 299 ₽/мес — Плюс. от 499 ₽/мес — Плюс с опциями. Первые 3 месяца бесплатно для новых пользователей.',
    cashbackType: 'Баллы (1 балл = 1 ₽)',
    compatibility: 'Т-Банк, Альфа-Банк, ВТБ, Сбер (частично)',
  },
  {
    id: 'sub2', name: 'СберПрайм', icon: '💚',
    color: '#21A038', textColor: '#FFF',
    cost: 'от 399 ₽/мес',
    cashbackBonus: 'до 10% кешбэк бонусами Спасибо',
    tags: ['Сбербанк экосистема', 'Повышенный Спасибо', 'Доставка и медиа'],
    desc: 'Повышенные бонусы Спасибо (до 10% у партнёров) вместо стандартных 0.5%. Бесплатная доставка в СберМаркет. Доступ к СберТВ, Звук, кешбэк в Аптека.ру и Сбер Здоровье.',
    feeDesc: '399 ₽/мес или 3 499 ₽/год. Бесплатно при остатке от 100 000 ₽ в Сбере.',
    cashbackType: 'Бонусы СберСпасибо',
    compatibility: 'СберКарта, СберПрайм+',
  },
  {
    id: 'sub3', name: 'Т-Прайм', icon: '⭐',
    color: '#FFDD2D', textColor: '#1A1A1A',
    cost: 'от 199 ₽/мес',
    cashbackBonus: 'до 5% на все покупки',
    tags: ['Т-Банк экосистема', 'Страховка в поездках', 'Консьерж-сервис'],
    desc: 'Кешбэк до 5% на все покупки. Бесплатные переводы и снятие наличных. Страховка при путешествиях за рубеж. Приоритетная поддержка 24/7. Доступ к вкладу Т-Привилегия с повышенной ставкой.',
    feeDesc: 'Бесплатно при остатке от 100 000 ₽ или тратах от 30 000 ₽/мес. Иначе — 199 ₽/мес.',
    cashbackType: 'Рубли (кешбэк)',
    compatibility: 'Т-Банк Блэк, Т-Банк Платинум',
  },
]

const CARD_COND_FILTERS = [
  { id: 'salary',       label: 'Зарплатный проект' },
  { id: 'pension',      label: 'Для пенсионеров' },
  { id: 'premium',      label: 'Премиальная' },
  { id: 'subscription', label: 'С подпиской' },
  { id: 'no_extra',     label: 'Без условий' },
]

// ── Spotlight ────────────────────────────────────────────────────────────────
const CARDS_SPOTLIGHT = [
  {
    targetId: 'sp-crd-spend',
    btnId: null,
    title: 'Ваши расходы по категориям',
    desc: 'Укажи ежемесячные траты по категориям — SmartSpend рассчитает реальный кешбэк для каждой карты. Данные берутся из конвертов автоматически.',
  },
  {
    targetId: 'sp-crd-sort',
    btnId: null,
    title: 'Сортировка по выгоде',
    desc: 'Сравнивай карты по кешбэку в рублях, по экономии от льготного периода (для кредитных) или по обоим показателям вместе.',
  },
  {
    targetId: 'sp-crd-list',
    btnId: null,
    title: 'Карточки предложений',
    desc: 'Раскрой карточку, чтобы увидеть разбивку кешбэка по твоим категориям трат, условия обслуживания и ссылку на банк.',
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtRub = n => Math.round(n).toLocaleString('ru') + '\u00a0₽'

function calcBonus(card, spending) {
  return SPEND_CATS.reduce((total, cat) => {
    const rate = card.cashback[cat.id] ?? card.cashback.other ?? 0
    return total + (spending[cat.id] || 0) * rate / 100
  }, 0)
}

// Interest saved by using grace period (assume 25% annual rate avoided)
function calcGraceValue(card, spending) {
  if (!card.graceDays) return 0
  const totalMonthly = SPEND_CATS.reduce((s, c) => s + (spending[c.id] || 0), 0)
  return totalMonthly * 0.25 * (card.graceDays / 365)
}

// ── Accordion ────────────────────────────────────────────────────────────────
function CrdAccordion({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="crd-acc">
      <button className={`crd-acc-head${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {open && <div className="crd-acc-body">{children}</div>}
    </div>
  )
}

// ── Spending modal ───────────────────────────────────────────────────────────
function SpendModal({ spending, onChange, onClose }) {
  const [local, setLocal] = useState({ ...spending })

  function handleInput(catId, raw) {
    const n = parseInt(raw.replace(/\D/g, ''), 10)
    setLocal(prev => ({ ...prev, [catId]: isNaN(n) ? 0 : n }))
  }

  function handleSave() {
    localStorage.setItem('ss_card_spending', JSON.stringify(local))
    onChange(local)
    onClose()
  }

  const total = SPEND_CATS.reduce((s, c) => s + (local[c.id] || 0), 0)

  return (
    <div className="crd-modal-overlay" onClick={onClose}>
      <div className="crd-modal" onClick={e => e.stopPropagation()}>
        <div className="crd-modal-header">
          <span className="crd-modal-title">Расходы по категориям</span>
          <button className="crd-modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="crd-modal-body">
          <p className="crd-modal-hint">
            Укажи среднемесячные расходы по каждой категории — SmartSpend рассчитает реальный кешбэк для каждой карты. Данные из конвертов подставлены автоматически.
          </p>

          <div className="crd-spend-list">
            {SPEND_CATS.map(cat => (
              <div key={cat.id} className="crd-spend-row">
                <span className="crd-spend-icon">{cat.icon}</span>
                <span className="crd-spend-label">{cat.label}</span>
                <div className="crd-spend-input-wrap">
                  <input
                    className="crd-spend-input"
                    type="text"
                    inputMode="numeric"
                    value={local[cat.id] > 0 ? local[cat.id].toLocaleString('ru') : ''}
                    placeholder="0"
                    onChange={e => handleInput(cat.id, e.target.value)}
                  />
                  <span className="crd-spend-unit">₽</span>
                </div>
              </div>
            ))}
          </div>

          <div className="crd-spend-total">
            <span className="crd-spend-total-label">Итого расходов</span>
            <span className="crd-spend-total-val">{fmtRub(total)}<span className="crd-spend-total-sub"> / мес</span></span>
          </div>
        </div>

        <div className="crd-modal-footer">
          <button className="crd-modal-reset" onClick={() => setLocal(Object.fromEntries(SPEND_CATS.map(c => [c.id, 0])))}>
            Сбросить
          </button>
          <button className="crd-modal-apply" onClick={handleSave}>
            Применить
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Filter modal ─────────────────────────────────────────────────────────────
function FilterModal({ filterBanks, setFilterBanks, filterType, setFilterType, filterConds, setFilterConds, onClose, totalActive }) {
  const [bankSearch, setBankSearch] = useState('')
  const visibleBanks = ALL_CARD_BANKS.filter(b => b.toLowerCase().includes(bankSearch.toLowerCase()))

  function toggleSet(setter, id) {
    setter(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function resetAll() {
    setFilterBanks(new Set())
    setFilterType(new Set())
    setFilterConds(new Set())
  }

  return (
    <div className="crd-modal-overlay" onClick={onClose}>
      <div className="crd-modal" onClick={e => e.stopPropagation()}>
        <div className="crd-modal-header">
          <span className="crd-modal-title">Фильтры</span>
          <button className="crd-modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="crd-modal-body">
          {/* Banks */}
          <div className="crd-modal-section">
            <div className="crd-modal-section-hdr">
              <span className="crd-modal-section-title">Банки</span>
              {filterBanks.size > 0 && (
                <button className="crd-modal-section-reset" onClick={() => setFilterBanks(new Set())}>Сбросить</button>
              )}
            </div>
            <input className="crd-bank-search" type="text" placeholder="Поиск банка..."
              value={bankSearch} onChange={e => setBankSearch(e.target.value)} />
            <div className="crd-fchips">
              {visibleBanks.map(bank => (
                <button key={bank}
                  className={`crd-fchip${filterBanks.has(bank) ? ' active' : ''}`}
                  onClick={() => toggleSet(setFilterBanks, bank)}>
                  {bank}
                </button>
              ))}
            </div>
          </div>

          {/* Card type */}
          <div className="crd-modal-section">
            <div className="crd-modal-section-hdr">
              <span className="crd-modal-section-title">Тип карты</span>
              {filterType.size > 0 && (
                <button className="crd-modal-section-reset" onClick={() => setFilterType(new Set())}>Сбросить</button>
              )}
            </div>
            <div className="crd-fchips">
              {[{ id: 'debit', label: 'Дебетовая' }, { id: 'credit', label: 'Кредитная' }].map(t => (
                <button key={t.id}
                  className={`crd-fchip${filterType.has(t.id) ? ' active' : ''}`}
                  onClick={() => toggleSet(setFilterType, t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div className="crd-modal-section">
            <div className="crd-modal-section-hdr">
              <span className="crd-modal-section-title">Специальные условия</span>
              {filterConds.size > 0 && (
                <button className="crd-modal-section-reset" onClick={() => setFilterConds(new Set())}>Сбросить</button>
              )}
            </div>
            <div className="crd-fchips">
              {CARD_COND_FILTERS.map(f => (
                <button key={f.id}
                  className={`crd-fchip${filterConds.has(f.id) ? ' active' : ''}`}
                  onClick={() => toggleSet(setFilterConds, f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="crd-modal-footer">
          <button className="crd-modal-reset" onClick={resetAll} disabled={totalActive === 0}>
            Сбросить{totalActive > 0 ? ` (${totalActive})` : ''}
          </button>
          <button className="crd-modal-apply" onClick={onClose}>
            Показать результаты
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Cards() {
  const navigate = useNavigate()

  const [spending, setSpending]           = useState(loadSpending)
  const [sortBy, setSortBy]               = useState('total')  // 'bonus' | 'grace' | 'total'
  const [expanded, setExpanded]           = useState(null)
  const [showSpend, setShowSpend]         = useState(false)
  const [showFilters, setShowFilters]     = useState(false)
  const [showSpotlight, setShowSpotlight] = useState(false)

  const [filterBanks, setFilterBanks] = useState(new Set())
  const [filterType,  setFilterType]  = useState(new Set())
  const [filterConds, setFilterConds] = useState(new Set())

  const totalActiveFilters = filterBanks.size + filterType.size + filterConds.size
  const totalSpending = SPEND_CATS.reduce((s, c) => s + (spending[c.id] || 0), 0)
  const hasSpending = totalSpending > 0

  const sorted = useMemo(() => {
    return CARDS
      .filter(c => {
        if (filterBanks.size > 0 && !filterBanks.has(c.bank)) return false
        if (filterType.size > 0 && !filterType.has(c.type)) return false
        if (filterConds.size > 0 && !c.conditions.some(x => filterConds.has(x))) return false
        return true
      })
      .map(c => ({
        ...c,
        bonus: calcBonus(c, spending),
        graceVal: calcGraceValue(c, spending),
      }))
      .sort((a, b) => {
        if (sortBy === 'bonus') return b.bonus - a.bonus
        if (sortBy === 'grace') return b.graceVal - a.graceVal
        return (b.bonus + b.graceVal) - (a.bonus + a.graceVal)
      })
  }, [spending, sortBy, filterBanks, filterType, filterConds])

  return (
    <Layout>
      <main className="crd-main">

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-item" onClick={() => navigate('/profile')}>Профиль</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className="breadcrumb-current">Подбор банковской карты</span>
          <HelpButton seenKey="ss_spl_cards" onOpen={() => setShowSpotlight(true)} />
        </div>

        {/* ── Controls row ── */}
        <div className="crd-controls" id="sp-crd-spend">
          {/* Spending button */}
          <button className={`crd-spend-btn${hasSpending ? ' filled' : ''}`} onClick={() => setShowSpend(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            {hasSpending ? `Расходы: ${fmtRub(totalSpending)}/мес` : 'Укажи расходы'}
          </button>

          {/* Sort */}
          <div className="crd-sort-row" id="sp-crd-sort">
            <button className={`crd-sort-btn${sortBy === 'total' ? ' active' : ''}`}
              onClick={() => setSortBy('total')}>
              Кешбэк + льгота
            </button>
            <button className={`crd-sort-btn${sortBy === 'bonus' ? ' active' : ''}`}
              onClick={() => setSortBy('bonus')}>
              Кешбэк
            </button>
            <button className={`crd-sort-btn${sortBy === 'grace' ? ' active' : ''}`}
              onClick={() => setSortBy('grace')}>
              Льготный период
            </button>
          </div>

          {/* Filter */}
          <button className={`crd-filter-btn${totalActiveFilters > 0 ? ' active' : ''}`}
            onClick={() => setShowFilters(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Фильтры
            {totalActiveFilters > 0 && <span className="crd-filter-badge">{totalActiveFilters}</span>}
          </button>
        </div>

        {/* ── Card list ── */}
        <div className="crd-list" id="sp-crd-list">
          {sorted.length === 0 && (
            <div className="crd-empty">Нет карт под выбранные фильтры</div>
          )}

          {sorted.map(card => {
            const isOpen = expanded === card.id
            const typeLabel = card.type === 'debit' ? 'Дебетовая' : 'Кредитная'

            // Category bonus breakdown for expanded view
            const catBreakdown = SPEND_CATS
              .map(cat => {
                const rate = card.cashback[cat.id] ?? card.cashback.other ?? 0
                const amt = spending[cat.id] || 0
                return { ...cat, rate, amt, bonus: Math.round(amt * rate / 100) }
              })
              .filter(c => c.amt > 0)

            return (
              <div key={card.id} className={`crd-card${isOpen ? ' open' : ''}`}>
                <div className="crd-card-main"
                  onClick={() => setExpanded(isOpen ? null : card.id)}>
                  <div className="crd-card-body">
                    <div className="crd-card-names">
                      <span className="crd-bank-name">{card.bank}</span>
                    </div>
                    <div className="crd-card-name">{card.name}</div>
                    <div className="crd-tags">
                      <span className="crd-tag crd-tag-type">{typeLabel}</span>
                      {card.graceDays > 0 && (
                        <span className="crd-tag crd-tag-grace">{card.graceDays}д без %</span>
                      )}
                      {card.tags.slice(0, 2).map((t, i) => (
                        <span key={i} className="crd-tag">{t}</span>
                      ))}
                    </div>
                    <div className="crd-card-pills">
                      {hasSpending ? (
                        <>
                          <span className="crd-pill crd-pill-bonus">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                            </svg>
                            {fmtRub(card.bonus)}<span className="crd-pill-sub">/мес</span>
                          </span>
                          {card.graceVal > 0 && (
                            <span className="crd-pill crd-pill-grace">
                              +{fmtRub(card.graceVal)}<span className="crd-pill-sub"> экономия</span>
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="crd-pill crd-pill-empty" onClick={e => { e.stopPropagation(); setShowSpend(true) }}>
                          Укажи расходы → увидишь кешбэк
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="crd-card-aside">
                    <div className="crd-bank-logo" style={{ background: card.color, color: card.textColor }}>
                      {card.bank.slice(0, 2)}
                    </div>
                    <div className={`crd-expand-btn${isOpen ? ' open' : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="crd-card-detail">
                    {/* Detail grid */}
                    <div className="crd-detail-grid">
                      <div className="crd-detail-item">
                        <span className="crd-detail-lbl">Тип карты</span>
                        <span className="crd-detail-val">{typeLabel}</span>
                      </div>
                      <div className="crd-detail-item">
                        <span className="crd-detail-lbl">Льготный период</span>
                        <span className="crd-detail-val">
                          {card.graceDays > 0 ? `${card.graceDays} дней` : 'нет'}
                        </span>
                      </div>
                      <div className="crd-detail-item">
                        <span className="crd-detail-lbl">Базовый кешбэк</span>
                        <span className="crd-detail-val green">{card.cashback.other ?? 0}%</span>
                      </div>
                      <div className="crd-detail-item">
                        <span className="crd-detail-lbl">Тип бонуса</span>
                        <span className="crd-detail-val">
                          {card.bonusType === 'rubles' ? 'Рубли' : card.bonusType === 'points' ? 'Баллы' : 'Мили'}
                        </span>
                      </div>
                      <div className="crd-detail-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="crd-detail-lbl">Обслуживание</span>
                        <span className="crd-detail-val">{card.feeDesc}</span>
                      </div>
                    </div>

                    {/* Cashback breakdown by category */}
                    {catBreakdown.length > 0 && (
                      <div className="crd-cashback-section">
                        <div className="crd-cashback-title">Кешбэк по вашим расходам</div>
                        <div className="crd-cashback-rows">
                          {catBreakdown.map(cat => (
                            <div key={cat.id} className="crd-cashback-row">
                              <span className="crd-cashback-icon">{cat.icon}</span>
                              <span className="crd-cashback-cat">{cat.label}</span>
                              <span className="crd-cashback-rate">{cat.rate}%</span>
                              <span className="crd-cashback-amt">{fmtRub(cat.bonus)}</span>
                            </div>
                          ))}
                          <div className="crd-cashback-total-row">
                            <span className="crd-cashback-total-label">Итого в месяц</span>
                            <span className="crd-cashback-total-val">{fmtRub(card.bonus)}</span>
                          </div>
                          {card.graceVal > 0 && (
                            <div className="crd-cashback-grace-row">
                              <span className="crd-cashback-total-label">Экономия от льготного периода</span>
                              <span className="crd-cashback-total-val">{fmtRub(card.graceVal)}</span>
                            </div>
                          )}
                        </div>
                        <p className="crd-cashback-note">{card.cashbackNote}</p>
                      </div>
                    )}

                    {!hasSpending && (
                      <button className="crd-fill-spend-btn" onClick={() => setShowSpend(true)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        Укажи расходы, чтобы увидеть реальный кешбэк
                      </button>
                    )}

                    <CrdAccordion title="Бонусная система">
                      <p className="crd-acc-text">{card.bonusDesc}</p>
                    </CrdAccordion>

                    <CrdAccordion title="Условия обслуживания">
                      <p className="crd-acc-text">{card.feeDesc}</p>
                    </CrdAccordion>

                    <a className="crd-cta-btn" href={card.url} target="_blank" rel="noopener noreferrer">
                      Узнать подробнее на сайте банка
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="crd-disclaimer">
          Данные носят информационный характер. Расчёт кешбэка — приблизительный, на основе базовых ставок.
          Актуальные условия уточняйте на сайте банка.
        </div>

      </main>

      {showSpotlight && <SpotlightTour steps={CARDS_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
      {showSpend && <SpendModal spending={spending} onChange={setSpending} onClose={() => setShowSpend(false)} />}
      {showFilters && (
        <FilterModal
          filterBanks={filterBanks} setFilterBanks={setFilterBanks}
          filterType={filterType}   setFilterType={setFilterType}
          filterConds={filterConds} setFilterConds={setFilterConds}
          onClose={() => setShowFilters(false)}
          totalActive={totalActiveFilters}
        />
      )}
    </Layout>
  )
}
