import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'

const CATEGORIES = [
  { id: 'other',      label: 'Прочие расходы'        },
  { id: 'food',       label: 'Еда и Супермаркеты'    },
  { id: 'cafe',       label: 'Кафе, Бары, Рестораны' },
  { id: 'transport',  label: 'Авто и Транспорт'      },
  { id: 'home',       label: 'Дом и Техника'         },
  { id: 'clothes',    label: 'Одежда и Обувь'        },
  { id: 'leisure',    label: 'Развлечения и Хобби'   },
  { id: 'health',     label: 'Красота и Здоровье'    },
  { id: 'education',  label: 'Образование и Дети'    },
  { id: 'travel',     label: 'Путешествия и Отдых'   },
]

function calcPerMonth(item) {
  if (item.type === 'consumable') {
    if (!item.price || !item.qty || !item.dailyUse) return 0
    return (item.price / item.qty) * item.dailyUse * 30
  } else {
    if (!item.price || !item.wearLifeWeeks) return 0
    return (item.price / item.wearLifeWeeks) * 4.33
  }
}

function AddItemForm({ onAdd, onCancel }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    name: '', type: 'consumable', price: '', qty: '', dailyUse: '', unit: 'г',
    wearLifeWeeks: '', purchaseDate: today, expectedPrice: '',
  })
  const set = k => v => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="inv-add-form">
      <div className="inv-add-form-title">Новая позиция</div>
      <div className="inv-add-form-grid">

        <div className="inv-add-form-field" style={{ gridColumn: '1/-1' }}>
          <div className="inv-add-form-lbl">Название</div>
          <input className="inv-add-form-input" value={form.name}
            onChange={e => set('name')(e.target.value)}
            placeholder={form.type === 'consumable' ? 'Например: Оливковое масло' : 'Например: Куртка'} />
        </div>

        <div className="inv-add-form-field">
          <div className="inv-add-form-lbl">Тип</div>
          <select className="inv-add-form-select" value={form.type} onChange={e => set('type')(e.target.value)}>
            <option value="consumable">Расходник</option>
            <option value="wear">Вещь (износ)</option>
          </select>
        </div>

        <div className="inv-add-form-field">
          <div className="inv-add-form-lbl">Цена, руб.</div>
          <input className="inv-add-form-input" type="number" value={form.price}
            onChange={e => set('price')(e.target.value)} placeholder="0" />
        </div>

        {form.type === 'consumable' ? (
          <>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Объём / масса</div>
              <input className="inv-add-form-input" type="number" value={form.qty}
                onChange={e => set('qty')(e.target.value)} placeholder="500" />
            </div>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Единица</div>
              <select className="inv-add-form-select" value={form.unit} onChange={e => set('unit')(e.target.value)}>
                <option value="г">г</option>
                <option value="мл">мл</option>
                <option value="шт">шт</option>
                <option value="кап">кап</option>
                <option value="рул">рул</option>
              </select>
            </div>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Расход в день</div>
              <input className="inv-add-form-input" type="number" value={form.dailyUse}
                onChange={e => set('dailyUse')(e.target.value)} placeholder="10" step="0.1" />
            </div>
          </>
        ) : (
          <>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Срок службы, нед.</div>
              <input className="inv-add-form-input" type="number" value={form.wearLifeWeeks}
                onChange={e => set('wearLifeWeeks')(e.target.value)} placeholder="52" />
            </div>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Плановая цена, руб.</div>
              <input className="inv-add-form-input" type="number" value={form.expectedPrice}
                onChange={e => set('expectedPrice')(e.target.value)} placeholder="необязательно" />
            </div>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Дата покупки</div>
              <input className="inv-add-form-input" type="date" value={form.purchaseDate}
                onChange={e => set('purchaseDate')(e.target.value)} max={today} />
            </div>
          </>
        )}

      </div>
      <div className="inv-add-form-actions">
        <button className="inv-add-cancel" onClick={onCancel}>Отмена</button>
        <button className="inv-add-submit" onClick={() => { if (!form.name.trim() || !form.price) return; onAdd(form) }}
          disabled={!form.name.trim() || !form.price}>Добавить</button>
      </div>
    </div>
  )
}

function SetItemRow({ item, onDelete }) {
  const pm = calcPerMonth(item)
  const meta = item.type === 'consumable'
    ? `${item.qty} ${item.unit} · расход ${item.dailyUse} ${item.unit}/день`
    : `срок ${item.wearLifeWeeks} нед.`
  return (
    <div className="cs-set-item-row">
      <div className="cs-set-item-info">
        <span className="cs-set-item-name">{item.name}</span>
        <span className="cs-set-item-meta">
          {parseInt(item.price).toLocaleString('ru')} ₽ · {meta}
        </span>
      </div>
      {pm > 0 && (
        <span className="cs-set-item-pm">{Math.round(pm).toLocaleString('ru')} ₽/мес</span>
      )}
      <button className="inv-item-delete" onClick={onDelete} title="Удалить">
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

export default function CreateSet() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const [title,     setTitle]     = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [introText, setIntroText] = useState('')
  const [category,  setCategory]  = useState(null)
  const [isPublic,  setIsPublic]  = useState(false)
  const [items,     setItems]     = useState([])
  const [showForm,  setShowForm]  = useState(false)
  const [catError,  setCatError]  = useState(false)
  const [toast,     setToast]     = useState(null)

  // Load for editing
  useEffect(() => {
    if (!editId) return
    try {
      const saved = JSON.parse(localStorage.getItem('ss_account_sets') || '[]')
      const s = saved.find(x => x.id === editId)
      if (!s) return
      setTitle(s.title || '')
      setShortDesc(s.shortDesc || '')
      setIntroText(s.introText || '')
      setCategory(s.category || null)
      setIsPublic(!!s.pub)
      setItems(s.items || [])
    } catch {}
  }, [editId])

  const totalPerMonth = items.reduce((s, it) => s + calcPerMonth(it), 0)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2200) }

  function addItem(form) {
    setItems(prev => [...prev, { ...form, id: Date.now() }])
    setShowForm(false)
  }
  function removeItem(id) {
    setItems(prev => prev.filter(it => it.id !== id))
  }

  function saveSet(pub, asDraft = false) {
    if (!title.trim()) { showToast('Введите название набора'); return false }
    if (!asDraft && category === null) { setCatError(true); showToast('Выберите категорию'); return false }

    const today = new Date().toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
    const set = {
      id:        editId || ('cs' + Date.now()),
      title:     title.trim(),
      shortDesc: shortDesc.trim(),
      introText: introText.trim(),
      category,
      items,
      meta:      today,
      pub,
      draft:     asDraft,
    }

    try {
      const saved = JSON.parse(localStorage.getItem('ss_account_sets') || '[]')
      if (editId) {
        const idx = saved.findIndex(x => x.id === editId)
        if (idx !== -1) saved[idx] = set; else saved.unshift(set)
      } else {
        saved.unshift(set)
      }
      localStorage.setItem('ss_account_sets', JSON.stringify(saved))
    } catch { return false }
    return true
  }

  function handlePublish() { if (saveSet(isPublic, false)) navigate('/account') }
  function handleDraft()   { if (saveSet(false, true)) { showToast('Черновик сохранён'); setTimeout(() => navigate('/account'), 1000) } }

  const catLabel = CATEGORIES.find(c => c.id === category)?.label
  const visHint  = isPublic
    ? 'Набор будет виден всем в каталоге — его смогут добавить другие пользователи.'
    : 'Набор виден только вам — хранится в вашем аккаунте.'

  return (
    <Layout>
      <main className="inventory-main">

        {/* Header */}
        <div className="inv-page-header">
          <div>
            <div className="page-title">{editId ? 'Редактировать набор' : 'Создать набор'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-edit-mode" onClick={handleDraft}>Сохранить черновик</button>
            <button className="btn-publish" onClick={handlePublish}>
              {isPublic ? 'Опубликовать' : 'Сохранить'}
            </button>
          </div>
        </div>

        {/* Visibility */}
        <div className="editor-field-block">
          <div className="editor-field-label">Видимость</div>
          <div className="visibility-toggle">
            <button className={`visibility-btn${!isPublic ? ' active' : ''}`} onClick={() => setIsPublic(false)}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Личная
            </button>
            <button className={`visibility-btn${isPublic ? ' active' : ''}`} onClick={() => setIsPublic(true)}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              </svg>
              Публичная
            </button>
          </div>
          <div className="editor-visibility-hint">{visHint}</div>
        </div>

        {/* Category */}
        <div className="editor-field-block">
          <div className="editor-field-label" style={catError ? { color: '#C84848' } : {}}>
            Категория
            {catError && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>— обязательно</span>}
          </div>
          <div className="editor-cats">
            {CATEGORIES.map(cat => (
              <button key={cat.id}
                className={`editor-cat-btn${category === cat.id ? ' active' : ''}`}
                onClick={() => { setCategory(cat.id); setCatError(false) }}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="editor-field-block">
          <div className="editor-field-label">
            Название набора
            <span className={`editor-char-count${title.length > 90 ? ' warn' : ''}`}> {title.length}/100</span>
          </div>
          <textarea className="editor-title-input" placeholder="Например: Базовый гардероб на лето"
            value={title} onChange={e => setTitle(e.target.value.slice(0, 100))} rows={1}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }} />
        </div>

        {/* Short description */}
        <div className="editor-field-block">
          <div className="editor-field-label">
            Краткое описание
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}> — видно в карточке</span>
            <span className={`editor-char-count${shortDesc.length > 240 ? ' warn' : ''}`}> {shortDesc.length}/250</span>
          </div>
          <textarea className="editor-excerpt-input"
            placeholder="Одно-два предложения: для кого набор и что в нём..."
            value={shortDesc} onChange={e => setShortDesc(e.target.value.slice(0, 250))} rows={2} />
        </div>

        {/* Items */}
        <div className="editor-field-block">
          <div className="editor-field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Позиции набора{items.length > 0 && ` · ${items.length} поз.`}</span>
            {totalPerMonth > 0 && (
              <span style={{ fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--mono)', textTransform: 'none', letterSpacing: 0, fontSize: 14 }}>
                {Math.round(totalPerMonth).toLocaleString('ru')} ₽/мес
              </span>
            )}
          </div>

          {items.length > 0 && (
            <div className="cs-set-items-list">
              {items.map(item => (
                <SetItemRow key={item.id} item={item} onDelete={() => removeItem(item.id)} />
              ))}
            </div>
          )}

          {showForm ? (
            <AddItemForm onAdd={addItem} onCancel={() => setShowForm(false)} />
          ) : (
            <div style={{ padding: '10px 14px' }}>
              <button className="inv-add-toggle" onClick={() => setShowForm(true)}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Добавить позицию
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="editor-field-block">
          <div className="editor-field-label">Подробное описание</div>
          <textarea className="editor-body-input"
            placeholder="Расскажите подробнее: принципы подбора, расчёт стоимости, для кого подойдёт..."
            value={introText} onChange={e => setIntroText(e.target.value)}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }} />
        </div>

        {toast && <div className="editor-toast">{toast}</div>}
      </main>
    </Layout>
  )
}
