import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const COLORS = ['#4E8268', '#6888A0', '#8268A0', '#A08268', '#688870', '#A06870', '#70A088', '#6870A0']

const CATEGORIES = [
  { id: 'clothes',   label: 'Одежда',          icon: '👔' },
  { id: 'food',      label: 'Еда и продукты',   icon: '🥦' },
  { id: 'home',      label: 'Дом и техника',    icon: '🏠' },
  { id: 'health',    label: 'Здоровье и уход',  icon: '💊' },
  { id: 'transport', label: 'Авто и транспорт', icon: '🚗' },
  { id: 'leisure',   label: 'Досуг и подписки', icon: '🎮' },
  { id: 'other',     label: 'Другое',           icon: '📦' },
]

const UNITS = ['шт', 'пар', 'упак', 'кг', 'л', 'компл']

// Статьи автора для привязки (мок)
const MY_ARTICLES = [
  { id: 'f2', title: 'Как я перестал бояться и полюбил EmoSpend' },
  { id: 'f4', title: 'Как сэкономить на авто без потери качества' },
  { id: 'f5', title: 'Подписки, которые реально стоят своих денег' },
  { id: 'f6', title: 'Гардероб на год: как я перестал покупать лишнее' },
]

function calcPerMonth(price, qty, lifespanMonths) {
  if (!price || !qty || !lifespanMonths) return 0
  return (parseFloat(price) * parseFloat(qty)) / parseFloat(lifespanMonths)
}

export default function CreateSet() {
  const navigate = useNavigate()

  const [title,       setTitle]       = useState('')
  const [shortDesc,   setShortDesc]   = useState('')
  const [introTitle,  setIntroTitle]  = useState('')
  const [introText,   setIntroText]   = useState('')
  const [color,       setColor]       = useState(COLORS[0])
  const [category,    setCategory]    = useState('clothes')
  const [type,        setType]        = useState('wear')
  const [isPublic,    setIsPublic]    = useState(true)
  const [linkedArticle, setLinkedArticle] = useState(null)
  const [articlePickerOpen, setArticlePickerOpen] = useState(false)

  const [items, setItems] = useState([
    { name: '', qty: '1', price: '', unit: 'шт', lifespan: '' },
  ])

  function addItem() {
    setItems(prev => [...prev, { name: '', qty: '1', price: '', unit: 'шт', lifespan: '' }])
  }
  function removeItem(i) {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }
  function updateItem(i, field, value) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const totalPerMonth = items.reduce((s, it) =>
    s + calcPerMonth(it.price, it.qty, it.lifespan), 0)

  return (
    <Layout>
      <main className="create-main">

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-item" onClick={() => navigate('/catalog')}>Каталог</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          <span className="breadcrumb-current">Создать набор</span>
        </div>

        <div>
          <div className="page-title">Создать набор</div>
          <div className="page-subtitle">Опишите набор и поделитесь с сообществом</div>
        </div>

        {/* ── Видимость ── */}
        <div className="form-section">
          <div className="form-section-title">Видимость</div>
          <div className="visibility-toggle">
            <button className={`visibility-btn${isPublic ? ' active' : ''}`} onClick={() => setIsPublic(true)}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              </svg>
              Публичный
            </button>
            <button className={`visibility-btn${!isPublic ? ' active' : ''}`} onClick={() => setIsPublic(false)}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Приватный
            </button>
          </div>
        </div>

        {/* ── Основная информация ── */}
        <div className="form-section">
          <div className="form-section-title">Основная информация</div>

          <div className="form-group">
            <label className="form-label">Название набора</label>
            <input className="form-input" placeholder="Например: Базовый гардероб на лето"
              value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Краткое описание <span className="form-label-hint">— видно в карточке набора</span></label>
            <textarea className="form-textarea" rows={2}
              placeholder="Одно-два предложения: для кого набор и что в нём..."
              value={shortDesc} onChange={e => setShortDesc(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Цвет акцента</label>
            <div className="color-picker-row">
              {COLORS.map(c => (
                <div key={c} className={`color-dot${color === c ? ' selected' : ''}`}
                  style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Категория ── */}
        <div className="form-section">
          <div className="form-section-title">Категория</div>
          <div className="category-chips">
            {CATEGORIES.map(cat => (
              <button key={cat.id}
                className={`category-chip${category === cat.id ? ' active' : ''}`}
                onClick={() => setCategory(cat.id)}
                style={category === cat.id ? { borderColor: color, background: color + '18', color } : {}}>
                <span className="category-chip-icon">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Тип набора ── */}
        <div className="form-section">
          <div className="form-section-title">Тип набора</div>
          <div className="set-type-selector">
            <div className={`set-type-option${type === 'wear' ? ' active' : ''}`} onClick={() => setType('wear')}>
              <div className="set-type-radio">
                <div className={`set-type-radio-dot${type === 'wear' ? ' filled' : ''}`}
                  style={type === 'wear' ? { background: color } : {}} />
              </div>
              <div>
                <div className="set-type-label">Износ</div>
                <div className="set-type-desc">Предметы с ограниченным сроком службы (одежда, техника)</div>
              </div>
            </div>
            <div className={`set-type-option${type === 'consumable' ? ' active' : ''}`} onClick={() => setType('consumable')}>
              <div className="set-type-radio">
                <div className={`set-type-radio-dot${type === 'consumable' ? ' filled' : ''}`}
                  style={type === 'consumable' ? { background: color } : {}} />
              </div>
              <div>
                <div className="set-type-label">Расходник</div>
                <div className="set-type-desc">Регулярно заканчивающиеся товары (продукты, гигиена)</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Позиции набора ── */}
        <div className="form-section">
          <div className="form-section-title">
            Позиции набора
            {totalPerMonth > 0 && (
              <span className="form-section-total">{totalPerMonth.toLocaleString('ru', { maximumFractionDigits: 0 })} ₽/мес</span>
            )}
          </div>

          <div className="items-table-wrap">
            <table className="cs-items-table">
              <thead>
                <tr>
                  <th>Позиция</th>
                  <th>Кол-во</th>
                  <th>Ед.</th>
                  <th>Цена, ₽</th>
                  <th>Срок, мес.</th>
                  <th>₽/мес</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const pm = calcPerMonth(item.price, item.qty, item.lifespan)
                  return (
                    <tr key={i} className="cs-item-row">
                      <td>
                        <input className="cs-cell-input cs-name-input" placeholder="Название"
                          value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} />
                      </td>
                      <td>
                        <input className="cs-cell-input cs-num-input" type="number" min="1" placeholder="1"
                          value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} />
                      </td>
                      <td>
                        <select className="cs-cell-input cs-unit-select"
                          value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td>
                        <input className="cs-cell-input cs-num-input" type="number" min="0" placeholder="0"
                          value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} />
                      </td>
                      <td>
                        <input className="cs-cell-input cs-num-input" type="number" min="1" placeholder="12"
                          value={item.lifespan} onChange={e => updateItem(i, 'lifespan', e.target.value)} />
                      </td>
                      <td className="cs-pm-cell">
                        {pm > 0 ? Math.round(pm).toLocaleString('ru') : '—'}
                      </td>
                      <td>
                        <button className="item-row-remove" onClick={() => removeItem(i)}
                          disabled={items.length === 1}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <button className="btn-add-item" onClick={addItem}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Добавить позицию
          </button>

          <div className="cs-formula-hint">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
            ₽/мес = Цена × Кол-во ÷ Срок (мес.) — амортизация за месяц
          </div>
        </div>

        {/* ── О наборе (подробное описание) ── */}
        <div className="form-section">
          <div className="form-section-title">О наборе</div>
          <div className="form-group">
            <label className="form-label">Заголовок раздела</label>
            <input className="form-input" placeholder="Например: Как формируется капсульный гардероб"
              value={introTitle} onChange={e => setIntroTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Подробное описание</label>
            <textarea className="form-textarea" rows={6}
              placeholder="Расскажите подробнее: принципы подбора, расчёт стоимости, для кого подойдёт..."
              value={introText} onChange={e => setIntroText(e.target.value)} />
          </div>
        </div>

        {/* ── Привязать статью ── */}
        <div className="form-section">
          <div className="form-section-title">Связанная статья</div>
          <div className="form-group">
            {linkedArticle ? (
              <div className="linked-set-chip">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h7"/>
                </svg>
                <span className="linked-set-name">{linkedArticle.title}</span>
                <button className="linked-set-remove" onClick={() => setLinkedArticle(null)} title="Открепить">
                  <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ) : (
              <button className="linked-set-add" onClick={() => setArticlePickerOpen(p => !p)}>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Прикрепить статью
              </button>
            )}
            {articlePickerOpen && (
              <div className="set-picker-list" style={{ marginTop: 6 }}>
                {MY_ARTICLES.map(a => (
                  <div key={a.id} className="set-picker-item"
                    onClick={() => { setLinkedArticle(a); setArticlePickerOpen(false) }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--text-3)' }}>
                      <path d="M4 6h16M4 12h16M4 18h7"/>
                    </svg>
                    <div className="set-picker-info">
                      <span className="set-picker-name">{a.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Действия ── */}
        <div className="form-actions">
          <button className="btn-publish" onClick={() => navigate('/catalog')}>
            {isPublic ? 'Опубликовать набор' : 'Сохранить приватно'}
          </button>
          <button className="btn-cancel" onClick={() => navigate('/catalog')}>Отмена</button>
        </div>

      </main>
    </Layout>
  )
}
