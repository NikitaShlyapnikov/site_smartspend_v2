import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const COLORS = ['#4E8268', '#6888A0', '#8268A0', '#A08268', '#688870', '#A06870', '#70A088', '#6870A0']

const CATEGORIES = [
  { id: 'clothes', label: 'Одежда', icon: '👔' },
  { id: 'food', label: 'Еда и продукты', icon: '🥦' },
  { id: 'home', label: 'Дом и техника', icon: '🏠' },
  { id: 'health', label: 'Здоровье и уход', icon: '💊' },
  { id: 'transport', label: 'Авто и транспорт', icon: '🚗' },
  { id: 'leisure', label: 'Досуг и подписки', icon: '🎮' },
  { id: 'other', label: 'Другое', icon: '📦' },
]

export default function CreateSet() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [category, setCategory] = useState('clothes')
  const [type, setType] = useState('wear')
  const [isPublic, setIsPublic] = useState(true)
  const [items, setItems] = useState([{ name: '', amount: '', period: 'разово' }])

  function addItem() {
    setItems(prev => [...prev, { name: '', amount: '', period: 'разово' }])
  }

  function removeItem(i) {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateItem(i, field, value) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const totalAmount = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

  return (
    <Layout>
      <main className="create-main">
        {/* Хлебные крошки */}
        <div className="breadcrumb">
          <span className="breadcrumb-item" onClick={() => navigate('/catalog')}>Каталог</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="breadcrumb-item breadcrumb-current">Создать набор</span>
        </div>

        <div>
          <div className="page-title">Создать набор</div>
          <div className="page-subtitle">Опишите ваш набор вещей и поделитесь с сообществом</div>
        </div>

        {/* Видимость */}
        <div className="form-section">
          <div className="form-section-title">Видимость</div>
          <div className="visibility-toggle">
            <button
              className={`visibility-btn${isPublic ? ' active' : ''}`}
              onClick={() => setIsPublic(true)}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              </svg>
              Публичный
            </button>
            <button
              className={`visibility-btn${!isPublic ? ' active' : ''}`}
              onClick={() => setIsPublic(false)}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Приватный
            </button>
          </div>
        </div>

        {/* Основная информация */}
        <div className="form-section">
          <div className="form-section-title">Основная информация</div>
          <div className="form-group">
            <label className="form-label">Название набора</label>
            <input
              className="form-input"
              placeholder="Например: Базовый гардероб на лето"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea
              className="form-textarea"
              placeholder="Для кого этот набор, что в него входит и зачем он нужен..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Цвет акцента</label>
            <div className="color-picker-row">
              {COLORS.map(c => (
                <div
                  key={c}
                  className={`color-dot${color === c ? ' selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Категория */}
        <div className="form-section">
          <div className="form-section-title">Категория</div>
          <div className="category-chips">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`category-chip${category === cat.id ? ' active' : ''}`}
                onClick={() => setCategory(cat.id)}
                style={category === cat.id ? { borderColor: color, background: color + '18', color } : {}}
              >
                <span className="category-chip-icon">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Тип набора */}
        <div className="form-section">
          <div className="form-section-title">Тип набора</div>
          <div className="set-type-selector">
            <div
              className={`set-type-option${type === 'wear' ? ' active' : ''}`}
              onClick={() => setType('wear')}
            >
              <div className="set-type-radio">
                <div className={`set-type-radio-dot${type === 'wear' ? ' filled' : ''}`} style={type === 'wear' ? { background: color } : {}} />
              </div>
              <div>
                <div className="set-type-label">Износ</div>
                <div className="set-type-desc">Предметы с ограниченным сроком службы (одежда, техника)</div>
              </div>
            </div>
            <div
              className={`set-type-option${type === 'consumable' ? ' active' : ''}`}
              onClick={() => setType('consumable')}
            >
              <div className="set-type-radio">
                <div className={`set-type-radio-dot${type === 'consumable' ? ' filled' : ''}`} style={type === 'consumable' ? { background: color } : {}} />
              </div>
              <div>
                <div className="set-type-label">Расходник</div>
                <div className="set-type-desc">Регулярно заканчивающиеся товары (продукты, гигиена)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Позиции */}
        <div className="form-section">
          <div className="form-section-title">
            Позиции набора
            {totalAmount > 0 && (
              <span className="form-section-total">{totalAmount.toLocaleString('ru')} ₽</span>
            )}
          </div>
          <div className="items-list">
            {items.map((item, i) => (
              <div key={i} className="item-row">
                <input
                  className="form-input item-name-input"
                  placeholder="Название позиции"
                  value={item.name}
                  onChange={e => updateItem(i, 'name', e.target.value)}
                />
                <input
                  className="form-input item-amount-input"
                  placeholder="Сумма ₽"
                  type="number"
                  value={item.amount}
                  onChange={e => updateItem(i, 'amount', e.target.value)}
                />
                <select
                  className="form-input item-period-select"
                  value={item.period}
                  onChange={e => updateItem(i, 'period', e.target.value)}
                >
                  <option>разово</option>
                  <option>в месяц</option>
                  <option>в год</option>
                  <option>в сезон</option>
                </select>
                <button
                  className="item-row-remove"
                  onClick={() => removeItem(i)}
                  disabled={items.length === 1}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button className="btn-add-item" onClick={addItem}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Добавить позицию
          </button>
        </div>

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
