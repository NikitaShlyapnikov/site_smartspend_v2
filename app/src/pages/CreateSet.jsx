import { useState, useEffect, useRef } from 'react'
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

// Разрешить вводить только цифры и точку/запятую
function numOnly(e) {
  if (!/[\d.,\b]/.test(e.key) && !['ArrowLeft','ArrowRight','Tab','Delete','Backspace'].includes(e.key)) {
    e.preventDefault()
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
          <input className="inv-add-form-input" type="text" inputMode="decimal" value={form.price}
            onKeyDown={numOnly} onChange={e => set('price')(e.target.value)} placeholder="0" />
        </div>

        {form.type === 'consumable' ? (
          <>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Объём / масса</div>
              <input className="inv-add-form-input" type="text" inputMode="decimal" value={form.qty}
                onKeyDown={numOnly} onChange={e => set('qty')(e.target.value)} placeholder="500" />
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
              <input className="inv-add-form-input" type="text" inputMode="decimal" value={form.dailyUse}
                onKeyDown={numOnly} onChange={e => set('dailyUse')(e.target.value)} placeholder="10" />
            </div>
          </>
        ) : (
          <>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Срок службы, нед.</div>
              <input className="inv-add-form-input" type="text" inputMode="decimal" value={form.wearLifeWeeks}
                onKeyDown={numOnly} onChange={e => set('wearLifeWeeks')(e.target.value)} placeholder="52" />
            </div>
            <div className="inv-add-form-field">
              <div className="inv-add-form-lbl">Плановая цена, руб.</div>
              <input className="inv-add-form-input" type="text" inputMode="decimal" value={form.expectedPrice}
                onKeyDown={numOnly} onChange={e => set('expectedPrice')(e.target.value)} placeholder="необязательно" />
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
        <button className="inv-add-submit"
          onClick={() => { if (!form.name.trim() || !form.price) return; onAdd(form) }}
          disabled={!form.name.trim() || !form.price}>Добавить</button>
      </div>
    </div>
  )
}

// ── HTML Sanitizer ────────────────────────────────────────────────────────────
const ALLOWED_TAGS    = new Set(['h2','h3','p','ul','ol','li','strong','em','blockquote','div','img','br'])
const ALLOWED_CLASSES = new Set(['content-note','content-highlight'])
const FORBIDDEN_TAGS  = new Set(['script','style','iframe','frame','frameset','form','input','button','link','meta','base','object','embed','noscript','svg','math','template'])

function sanitizeHtml(raw) {
  const warnings = []
  const parser = new DOMParser()
  const doc    = parser.parseFromString(raw, 'text/html')
  if (!doc.body) return { clean: raw, warnings }
  FORBIDDEN_TAGS.forEach(tag => { doc.querySelectorAll(tag).forEach(el => { warnings.push(`Удалён запрещённый тег <${el.tagName.toLowerCase()}>`); el.remove() }) })
  const walk = (node) => {
    Array.from(node.childNodes).forEach(walk)
    if (node.nodeType !== 1) return
    const tag = node.tagName.toLowerCase()
    if (!ALLOWED_TAGS.has(tag)) {
      const parent = node.parentNode
      if (parent) { warnings.push(`Удалён недопустимый тег <${tag}>`); while (node.firstChild) parent.insertBefore(node.firstChild, node); parent.removeChild(node) }
      return
    }
    Array.from(node.attributes).forEach(attr => {
      const name = attr.name.toLowerCase(); const value = attr.value
      if (name.startsWith('on')) { warnings.push(`Удалён обработчик "${attr.name}"`); node.removeAttribute(attr.name); return }
      if (/javascript\s*:/i.test(value)) { warnings.push(`Удалён атрибут с JS`); node.removeAttribute(attr.name); return }
      if (name === 'style') { warnings.push(`Удалён атрибут style`); node.removeAttribute(attr.name); return }
      if (name === 'class') { const allowed = value.split(/\s+/).filter(c => ALLOWED_CLASSES.has(c)); if (allowed.length) node.setAttribute('class', allowed.join(' ')); else node.removeAttribute('class'); return }
      if (tag === 'img' && name === 'src') {
        let srcVal = value.trim()
        try { const url = new URL(srcVal); srcVal = url.pathname.split('/').pop() } catch {}
        if (/^photo-[a-z0-9_-]+$/.test(srcVal)) { node.setAttribute('src', srcVal) } else { warnings.push('Удалён внешний src'); node.removeAttribute('src') }
        return
      }
      if (tag === 'img' && name === 'alt') return
      node.removeAttribute(attr.name)
    })
  }
  Array.from(doc.body.childNodes).forEach(walk)
  return { clean: doc.body.innerHTML, warnings }
}

// ── GPT Prompt Modal ──────────────────────────────────────────────────────────
const GPT_PROMPT_SET = `Напиши HTML-разметку описания набора по тексту который я пришлю в следующем сообщении. Правила:

СТРУКТУРА
• Не включай теги <html>, <head>, <body> — только содержимое
• Начинай сразу с контента, без обёрток

ДОПУСТИМЫЕ ТЕГИ
• <h2>Заголовок раздела</h2> • <h3>Подзаголовок</h3>
• <p>Текст абзаца</p>
• <ul><li>Пункт</li></ul> — маркированный список
• <ol><li>Пункт</li></ol> — нумерованный список
• <strong>жирный</strong> • <em>курсив</em>
• <blockquote class="content-note">Важная заметка</blockquote>
• <div class="content-highlight">Ключевая мысль</div>

ИЗОБРАЖЕНИЯ
• <img src="PHOTO_CODE" alt="описание"> — замени PHOTO_CODE на реальный код фото

ЗАПРЕЩЕНО
• Теги: <script>, <style>, <iframe>, <form> и другие
• Атрибут style • Внешние URL в src • Атрибуты-обработчики событий

ВАЖНО: текст менять нельзя — только добавить HTML-оформление`

function GptPromptModal({ images, onClose, onCopied }) {
  function handleCopy() {
    let text = GPT_PROMPT_SET
    if (images.length > 0) {
      const codes = images.map(img => `  ${img.id}  — ${img.name}`).join('\n')
      text += `\n\nЗАГРУЖЕННЫЕ ФОТО (используй эти коды)\n${codes}`
    }
    navigator.clipboard.writeText(text).catch(() => {})
    onCopied(); onClose()
  }
  return (
    <div className="gpt-prompt-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="gpt-prompt-modal">
        <div className="gpt-prompt-header">
          <div className="gpt-prompt-title">Промт для GPT-сервиса</div>
          <button className="gpt-prompt-close" onClick={onClose}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="gpt-prompt-desc">
          <ol className="gpt-prompt-steps">
            <li>Напишите текст описания</li>
            <li>Скопируйте этот промт, откройте любой GPT-сервис и отправьте его</li>
            <li>В следующем сообщении отправьте ваш текст — GPT добавит HTML-оформление</li>
            <li>Скопируйте результат и вставьте сюда</li>
          </ol>
          {images.length > 0 && <div className="gpt-prompt-img-note">В промт будут добавлены коды загруженных фото ({images.length} шт.)</div>}
        </div>
        <pre className="gpt-prompt-text">{GPT_PROMPT_SET}</pre>
        <button className="gpt-prompt-copy" onClick={handleCopy}>Скопировать промт</button>
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
  const [showForm,      setShowForm]      = useState(false)
  const [catError,      setCatError]      = useState(false)
  const [toast,         setToast]         = useState(null)
  const [showItemsHelp, setShowItemsHelp] = useState(false)
  const [body,          setBody]          = useState('')
  const [htmlBody,      setHtmlBody]      = useState('')
  const [editorMode,    setEditorMode]    = useState('md')
  const [showMdHelp,    setShowMdHelp]    = useState(false)
  const [showPrompt,    setShowPrompt]    = useState(false)
  const [htmlWarnings,  setHtmlWarnings]  = useState([])
  const [images,        setImages]        = useState([])
  const [dragOver,      setDragOver]      = useState(false)
  const bodyRef   = useRef(null)
  const fileInput = useRef(null)

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
      setBody(s.body || '')
      setHtmlBody(s.htmlBody || '')
      setEditorMode(s.editorMode || 'md')
      setImages(s.images || [])
    } catch {}
  }, [editId])

  const totalPerMonth = items.reduce((s, it) => s + calcPerMonth(it), 0)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2200) }

  const activeText = editorMode === 'md' ? body : htmlBody
  const wordCount  = activeText.trim() ? activeText.trim().split(/\s+/).length : 0

  function addFiles(files) {
    const remaining = 10 - images.length
    if (remaining <= 0) { showToast('Максимум 10 фотографий'); return }
    Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, remaining).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        const id   = 'photo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
        const name = file.name.replace(/\.[^.]+$/, '')
        setImages(prev => [...prev, { id, name, url: e.target.result }])
      }
      reader.readAsDataURL(file)
    })
  }
  function handleDrop(e)   { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }
  function removeImage(id) { setImages(prev => prev.filter(img => img.id !== id)) }
  function copyImageCode(img) {
    if (editorMode === 'md') {
      navigator.clipboard.writeText(`![${img.name}](${img.id})`).catch(() => {})
      showToast('Markdown-код скопирован — вставьте в текст')
    } else {
      navigator.clipboard.writeText(img.id).catch(() => {})
      showToast('Код фото скопирован — вставьте в src=""')
    }
  }
  function handleHtmlBlur() {
    if (!htmlBody.trim()) return
    const { clean, warnings } = sanitizeHtml(htmlBody)
    setHtmlWarnings(warnings)
    if (clean !== htmlBody) setHtmlBody(clean)
  }

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
    let finalHtml = htmlBody
    if (editorMode === 'html' && htmlBody.trim()) {
      const { clean, warnings } = sanitizeHtml(htmlBody)
      finalHtml = clean
      setHtmlBody(clean)
      if (warnings.length) { setHtmlWarnings(warnings); showToast('HTML очищен от запрещённых элементов'); return false }
    }
    const set = {
      id:        editId || ('cs' + Date.now()),
      title:     title.trim(),
      shortDesc: shortDesc.trim(),
      introText: introText.trim(),
      body:       editorMode === 'md' ? body : '',
      htmlBody:   editorMode === 'html' ? finalHtml : '',
      editorMode,
      images:     images.map(img => ({ id: img.id, url: img.url })),
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

  return (
    <Layout>
      <main className="inventory-main">

        {/* Header */}
        <div className="inv-page-header">
          <div className="page-title">{editId ? 'Редактировать набор' : 'Создать набор'}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-draft" onClick={handleDraft}>Сохранить черновик</button>
            <button className="btn-publish" onClick={handlePublish}>Опубликовать</button>
          </div>
        </div>

        {/* Meta block: видимость + категория */}
        <div className="editor-meta-block">

          {/* Видимость */}
          <div className="editor-meta-row" style={{ alignItems: 'flex-start' }}>
            <div className="editor-meta-label" style={{ paddingTop: 6 }}>Видимость</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
              <div className="editor-visibility-hint">
                {isPublic
                  ? 'Набор будет опубликован в каталоге и доступен всем пользователям.'
                  : 'Набор виден только вам — хранится в вашем аккаунте.'}
              </div>
            </div>
          </div>

          {/* Категория */}
          <div className="editor-meta-row">
            <div className={`editor-meta-label${catError ? ' editor-meta-label--error' : ''}`}>
              Категория{catError && <span className="editor-cat-required"> — обязательно</span>}
            </div>
            <div className={`editor-cats${catError ? ' editor-cats--error' : ''}`}>
              {CATEGORIES.map(cat => (
                <button key={cat.id}
                  className={`editor-cat-btn${category === cat.id ? ' active' : ''}`}
                  onClick={() => { setCategory(cat.id); setCatError(false) }}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Название */}
        <div className="editor-field-block editor-field-block--overflow">
          <div className="editor-field-label">
            Название набора
            <span className={`editor-char-count${title.length > 90 ? ' warn' : ''}`}> {title.length}/100</span>
          </div>
          <textarea className="editor-excerpt-input cs-title-input" placeholder="Например: Базовый гардероб на лето"
            value={title} onChange={e => setTitle(e.target.value.slice(0, 100))} rows={1}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }} />
        </div>

        {/* Краткое описание */}
        <div className="editor-field-block editor-field-block--overflow">
          <div className="editor-field-label">
            Краткое описание
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}> — видно в карточке</span>
            <span className={`editor-char-count${shortDesc.length > 240 ? ' warn' : ''}`}> {shortDesc.length}/250</span>
          </div>
          <textarea className="editor-excerpt-input"
            placeholder="Одно-два предложения: для кого набор и что в нём..."
            value={shortDesc} onChange={e => setShortDesc(e.target.value.slice(0, 250))} rows={2}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }} />
        </div>

        {/* Позиции набора */}
        <div className="editor-field-block editor-field-block--overflow">
          <div className="editor-field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Позиции набора{items.length > 0 && ` · ${items.length} поз.`}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
              {totalPerMonth > 0 && (
                <span style={{ fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--mono)', textTransform: 'none', letterSpacing: 0, fontSize: 14 }}>
                  {Math.round(totalPerMonth).toLocaleString('ru')} ₽/мес
                </span>
              )}
              <button className="editor-html-prompt-btn" onClick={() => setShowItemsHelp(p => !p)}>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Справка по позициям
              </button>
              {showItemsHelp && (
                <div className="md-help-panel items-help-panel">
                  <div className="items-help-type">
                    <div className="items-help-type-header">
                      <span className="items-help-type-pill consumable">Расходник</span>
                      <span className="items-help-type-desc">товар, который тратится со временем</span>
                    </div>
                    <p className="items-help-body">Укажите объём и расход в день — система сама посчитает стоимость в месяц по формуле: <code>(цена / объём) × расход × 30</code></p>
                    <div className="items-help-examples">
                      <div className="items-help-ex">
                        <span className="items-help-badge ok">OK</span>
                        <span>Оливковое масло · 500 г · 10 г/день → <strong>~600 ₽/мес</strong></span>
                      </div>
                      <div className="items-help-ex">
                        <span className="items-help-badge ok">OK</span>
                        <span>Шампунь · 400 мл · 8 мл/день → <strong>~360 ₽/мес</strong></span>
                      </div>
                      <div className="items-help-ex">
                        <span className="items-help-badge bad">—</span>
                        <span>Цена или расход не заполнены → расчёт недоступен</span>
                      </div>
                    </div>
                  </div>
                  <div className="items-help-divider" />
                  <div className="items-help-type">
                    <div className="items-help-type-header">
                      <span className="items-help-type-pill wear">Вещь (износ)</span>
                      <span className="items-help-type-desc">одежда, техника, инвентарь</span>
                    </div>
                    <p className="items-help-body">Укажите цену и срок службы в неделях — система посчитает амортизацию: <code>цена / недели × 4.33</code></p>
                    <div className="items-help-examples">
                      <div className="items-help-ex">
                        <span className="items-help-badge ok">OK</span>
                        <span>Кроссовки · 3 500 ₽ · 52 нед → <strong>~291 ₽/мес</strong></span>
                      </div>
                      <div className="items-help-ex">
                        <span className="items-help-badge ok">OK</span>
                        <span>Смартфон · 35 000 ₽ · 104 нед → <strong>~1 456 ₽/мес</strong></span>
                      </div>
                      <div className="items-help-ex">
                        <span className="items-help-badge bad">—</span>
                        <span>Срок службы не указан → расчёт недоступен</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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

        {/* Подробное описание — полный редактор */}
        <div className="editor-field-block editor-field-block--overflow">
          <div className="editor-field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              Подробное описание
              {activeText.length > 0 && <span className={`editor-char-count${activeText.length > 27000 ? ' warn' : ''}`}> {wordCount} сл. · {activeText.length.toLocaleString('ru')}/30 000</span>}
            </span>
            <div className="editor-mode-toggle">
              <button className={`editor-mode-btn${editorMode === 'md' ? ' active' : ''}`} onClick={() => setEditorMode('md')}>Markdown</button>
              <button className={`editor-mode-btn${editorMode === 'html' ? ' active' : ''}`} onClick={() => setEditorMode('html')}>HTML</button>
            </div>
          </div>

          {editorMode === 'md' ? (
            <>
              <div className="editor-html-hint" style={{ borderTop: '1px solid var(--border)' }}>
                <span>Поддерживается Markdown-разметка</span>
                <div style={{ position: 'relative' }}>
                  <button className="editor-html-prompt-btn" onClick={() => setShowMdHelp(p => !p)}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Справка по разметке
                  </button>
                  {showMdHelp && (
                    <div className="md-help-panel">
                      <div className="md-help-row"><code>**текст**</code><span>жирный</span></div>
                      <div className="md-help-row"><code>*текст*</code><span>курсив</span></div>
                      <div className="md-help-row"><code>## Заголовок</code><span>заголовок раздела</span></div>
                      <div className="md-help-row"><code>### Подзаголовок</code><span>подзаголовок</span></div>
                      <div className="md-help-row"><code>&gt; текст</code><span>цитата / заметка</span></div>
                      <div className="md-help-row"><code>- пункт</code><span>маркированный список</span></div>
                      <div className="md-help-row"><code>1. пункт</code><span>нумерованный список</span></div>
                      <div className="md-help-row"><code>![alt](photo-код)</code><span>изображение</span></div>
                    </div>
                  )}
                </div>
              </div>
              <textarea ref={bodyRef} className="editor-body-input"
                placeholder={'Расскажите подробнее: принципы подбора, расчёт стоимости, для кого подойдёт...\n\nMarkdown: **жирный**, *курсив*, ## Заголовок, > Цитата'}
                value={body}
                onChange={e => setBody(e.target.value.slice(0, 30000))}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }} />
            </>
          ) : (
            <>
              <div className="editor-html-hint" style={{ borderTop: '1px solid var(--border)' }}>
                <span>Вставьте HTML, сгенерированный по промту</span>
                <button className="editor-html-prompt-btn" onClick={() => setShowPrompt(true)}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  Промт для GPT
                </button>
              </div>
              <textarea className="editor-body-input editor-body-input--html"
                placeholder={'1. Напишите текст описания\n2. Скопируйте промт для GPT\n3. Отправьте текст в GPT — он добавит HTML-оформление\n4. Вставьте результат сюда'}
                value={htmlBody}
                onChange={e => { setHtmlBody(e.target.value.slice(0, 30000)); setHtmlWarnings([]) }}
                onBlur={handleHtmlBlur}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }} />
              {htmlWarnings.length > 0 && (
                <div className="editor-html-warnings">
                  <div className="editor-html-warnings-title">
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Обнаружены и удалены запрещённые элементы:
                  </div>
                  <ul className="editor-html-warnings-list">
                    {htmlWarnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Photos */}
        <div className="photo-section">
          <div className="photo-section-title">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Фотографии{images.length > 0 && ` · ${images.length}`}
          </div>
          <div className={`photo-drop-zone${dragOver ? ' drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInput.current?.click()}>
            <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div className="drop-zone-text">{dragOver ? 'Отпустите для загрузки' : 'Перетащите фото или нажмите для выбора'}</div>
            <div className="drop-zone-hint">PNG, JPG, GIF, WebP</div>
            <input ref={fileInput} type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
          </div>
          {images.length > 0 && (
            <div className="photo-gallery">
              {images.map(img => (
                <div key={img.id} className="photo-thumb" onClick={() => copyImageCode(img)} title="Нажмите, чтобы скопировать код">
                  <img src={img.url} alt={img.name} />
                  <div className="photo-thumb-overlay">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    Скопировать код
                  </div>
                  <button className="photo-thumb-remove"
                    onClick={e => { e.stopPropagation(); removeImage(img.id) }} title="Удалить">
                    <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                  <div className="photo-thumb-name">{img.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`toast${toast ? ' show' : ''}`}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast}
        </div>
        {showPrompt && <GptPromptModal images={images} onClose={() => setShowPrompt(false)} onCopied={() => showToast('Промт скопирован')} />}
      </main>
    </Layout>
  )
}
