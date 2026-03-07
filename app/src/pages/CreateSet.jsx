import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const COLORS = ['#4E8268', '#6888A0', '#8268A0', '#A08268', '#688870', '#A06870', '#70A088', '#6870A0']

const CATEGORIES = ['Одежда', 'Еда и продукты', 'Дом и техника', 'Здоровье и уход', 'Авто и транспорт', 'Досуг и подписки', 'Другое']

export default function CreateSet() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [category, setCategory] = useState('Другое')
  const [type, setType] = useState('base')
  const [items, setItems] = useState([{ name: '', amount: '', period: 'разово' }])

  function addItem() {
    setItems(prev => [...prev, { name: '', amount: '', period: 'разово' }])
  }

  function removeItem(i) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateItem(i, field, value) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  return (
    <Layout>
      <main className="create-main">
        <div>
          <div className="page-title">Создать набор</div>
          <div className="page-subtitle">Опишите ваш набор вещей и поделитесь с сообществом</div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Основная информация</div>
          <div className="form-group">
            <label className="form-label">Название набора</label>
            <input className="form-input" placeholder="Например: Базовый гардероб на лето" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea className="form-textarea" placeholder="Для кого этот набор, что в него входит..." value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Категория</label>
            <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Тип</label>
            <div className="seg-ctrl" style={{ alignSelf: 'flex-start' }}>
              <button className={`seg-btn${type === 'base' ? ' active' : ''}`} onClick={() => setType('base')}>Базовый</button>
              <button className={`seg-btn${type === 'extra' ? ' active' : ''}`} onClick={() => setType('extra')}>Расширенный</button>
            </div>
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

        <div className="form-section">
          <div className="form-section-title">Позиции набора</div>
          <div className="items-list">
            {items.map((item, i) => (
              <div key={i} className="item-row">
                <input className="form-input" placeholder="Название" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} />
                <input className="form-input" placeholder="Сумма ₽" type="number" value={item.amount} onChange={e => updateItem(i, 'amount', e.target.value)} />
                <select className="form-input" value={item.period} onChange={e => updateItem(i, 'period', e.target.value)}>
                  <option>разово</option>
                  <option>в месяц</option>
                  <option>в год</option>
                  <option>в сезон</option>
                </select>
                <button className="item-row-remove" onClick={() => removeItem(i)}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
          </div>
          <button className="btn-add-item" onClick={addItem}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Добавить позицию
          </button>
        </div>

        <div className="form-actions">
          <button className="btn-publish" onClick={() => navigate('/catalog')}>
            Опубликовать набор
          </button>
          <button className="btn-cancel" onClick={() => navigate('/catalog')}>
            Отмена
          </button>
        </div>
      </main>
    </Layout>
  )
}
