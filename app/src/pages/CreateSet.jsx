import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const CATEGORIES = [
  { id: 'clothes',   label: 'Одежда'    },
  { id: 'food',      label: 'Питание'   },
  { id: 'home',      label: 'Дом'       },
  { id: 'health',    label: 'Здоровье'  },
  { id: 'transport', label: 'Транспорт' },
  { id: 'leisure',   label: 'Досуг'     },
  { id: 'finance',   label: 'Финансы'   },
  { id: 'tech',      label: 'Техника'   },
  { id: 'other',     label: 'Другое'    },
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

// ── Точная копия AddItemForm из Inventory (без поля «Привязать к набору») ─────
function AddItemForm({ onAdd, onCancel }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    name: '', type: 'consumable', price: '', qty: '', dailyUse: '', unit: 'г',
    wearLifeWeeks: '', purchaseDate: today, expectedPrice: '',
  })
  const set = k => v => setForm(p => ({ ...p, [k]: v }))

  function handleSubmit() {
    if (!form.name.trim() || !form.price) return
    onAdd(form)
  }

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
        <button className="inv-add-submit" onClick={handleSubmit}
          disabled={!form.name.trim() || !form.price}>Добавить</button>
      </div>
    </div>
  )
}

// ── Строка добавленной позиции ────────────────────────────────────────────────
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

  const [preview,   setPreview]   = useState(false)
  const [title,     setTitle]     = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [introText, setIntroText] = useState('')
  const [category,  setCategory]  = useState('clothes')
  const [isPublic,  setIsPublic]  = useState(true)
  const [items,     setItems]     = useState([])
  const [showForm,  setShowForm]  = useState(false)

  const totalPerMonth = items.reduce((s, it) => s + calcPerMonth(it), 0)

  function addItem(form) {
    setItems(prev => [...prev, { ...form, id: Date.now() }])
    setShowForm(false)
  }
  function removeItem(id) {
    setItems(prev => prev.filter(it => it.id !== id))
  }

  return (
    <Layout>
      <main className="editor-main">

        {/* ── Toolbar ── */}
        <div className="editor-toolbar">
          <div className="editor-format-bar">
            <span className="editor-toolbar-title">Создать набор</span>
          </div>
          <div className="editor-toolbar-right">
            {items.length > 0 && (
              <span className="editor-counter">
                {items.length} поз.{totalPerMonth > 0 && ` · ${Math.round(totalPerMonth).toLocaleString('ru')} ₽/мес`}
              </span>
            )}
            <button className={`btn-preview-toggle${preview ? ' active' : ''}`} onClick={() => setPreview(p => !p)}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {preview ? 'Редактор' : 'Предпросмотр'}
            </button>
            <button className="btn-publish" onClick={() => navigate('/catalog')}>
              {isPublic ? 'Опубликовать' : 'Сохранить'}
            </button>
          </div>
        </div>

        <div className="editor-scroll">

          {preview ? (
            /* ══════════════════ PREVIEW MODE ══════════════════ */
            <div className="editor-preview-article" style={{ paddingTop: 24 }}>

              <div className="hero-card">
                <div className="hero-body">
                  <div className="hero-badges">
                    <span className="source-badge community">{isPublic ? 'Сообщество' : 'Личный'}</span>
                    <span className="cat-badge">{CATEGORIES.find(c => c.id === category)?.label}</span>
                  </div>
                  <div className="hero-title">{title || 'Без названия'}</div>
                  {shortDesc && <div className="hero-desc">{shortDesc}</div>}
                  <div className="hero-stats">
                    <div className="hstat">
                      <div className="hstat-val">
                        {totalPerMonth > 0 ? Math.round(totalPerMonth).toLocaleString('ru') + ' ₽' : '— ₽'}
                      </div>
                      <div className="hstat-lbl">в месяц</div>
                    </div>
                    <div className="hstat">
                      <div className="hstat-val">{items.length || '—'}</div>
                      <div className="hstat-lbl">позиций в наборе</div>
                    </div>
                  </div>
                  <div className="hero-actions">
                    <button className="btn-liked">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                      Добавить в конверт
                    </button>
                  </div>
                </div>
                <div className="hero-author">
                  <div className="author-avatar" style={{ background: '#4E8268' }}>НО</div>
                  <div className="author-info">
                    <div className="author-name">Никита Орлов</div>
                    <div className="author-bio">Интересуюсь личными финансами, инвестициями и оптимизацией бюджета.</div>
                  </div>
                  <button className="btn-follow">Подписаться</button>
                </div>
              </div>

              {items.length > 0 && (
                <div className="section-card">
                  <div className="section-header">
                    <div className="section-title">
                      Состав набора
                      <span className="section-count">{items.length} позиций</span>
                    </div>
                  </div>
                  <table className="cs-items-table">
                    <thead>
                      <tr>
                        <th>Позиция</th>
                        <th>Тип</th>
                        <th style={{ textAlign: 'right' }}>Цена, ₽</th>
                        <th style={{ textAlign: 'right' }}>₽/мес</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => {
                        const pm = calcPerMonth(item)
                        return (
                          <tr key={item.id} className="cs-item-row">
                            <td style={{ padding: '9px 14px', fontWeight: 500 }}>{item.name}</td>
                            <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--text-3)' }}>
                              {item.type === 'consumable' ? 'Расходник' : 'Износ'}
                            </td>
                            <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'var(--mono)' }}>
                              {parseInt(item.price).toLocaleString('ru')}
                            </td>
                            <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--accent-green)' }}>
                              {pm > 0 ? Math.round(pm).toLocaleString('ru') : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {introText && (
                <div className="content-card">
                  <div className="content-body">
                    {introText.split('\n\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                </div>
              )}
            </div>

          ) : (
            /* ══════════════════ EDITOR MODE ══════════════════ */
            <>
              {/* Meta */}
              <div className="editor-meta-block">
                <div className="editor-meta-row">
                  <div className="editor-meta-label">Категория</div>
                  <div className="editor-cats">
                    {CATEGORIES.map(cat => (
                      <button key={cat.id}
                        className={`editor-cat-btn${category === cat.id ? ' active' : ''}`}
                        onClick={() => setCategory(cat.id)}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="editor-meta-row">
                  <div className="editor-meta-label">Видимость</div>
                  <div className="visibility-toggle">
                    <button className={`visibility-btn${isPublic ? ' active' : ''}`} onClick={() => setIsPublic(true)}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                      </svg>
                      Публичный
                    </button>
                    <button className={`visibility-btn${!isPublic ? ' active' : ''}`} onClick={() => setIsPublic(false)}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                      Приватный
                    </button>
                  </div>
                </div>
              </div>

              {/* Название */}
              <div className="editor-field-block">
                <div className="editor-field-label">Название набора</div>
                <textarea className="editor-title-input" placeholder="Например: Базовый гардероб на лето"
                  value={title} onChange={e => setTitle(e.target.value)} rows={1} />
              </div>

              {/* Краткое описание */}
              <div className="editor-field-block">
                <div className="editor-field-label">
                  Краткое описание
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}> — видно в карточке</span>
                </div>
                <textarea className="editor-excerpt-input"
                  placeholder="Одно-два предложения: для кого набор и что в нём..."
                  value={shortDesc} onChange={e => setShortDesc(e.target.value)} rows={2} />
              </div>

              {/* Позиции */}
              <div className="editor-field-block">
                <div className="editor-field-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Позиции набора</span>
                  {totalPerMonth > 0 && (
                    <span style={{ fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--mono)', textTransform: 'none', letterSpacing: 0 }}>
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

              {/* Подробное описание */}
              <div className="editor-field-block editor-field-block--body">
                <div className="editor-field-label">Подробное описание</div>
                <textarea className="editor-body-input"
                  placeholder="Расскажите подробнее: принципы подбора, расчёт стоимости, для кого подойдёт..."
                  value={introText} onChange={e => setIntroText(e.target.value)} />
              </div>
            </>
          )}
        </div>

      </main>
    </Layout>
  )
}
