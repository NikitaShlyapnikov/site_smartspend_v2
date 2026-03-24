import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'

const CA_SPOTLIGHT = [
  { targetId: 'sp-ca-meta',  btnId: null, title: 'Категория и настройки', desc: 'Укажи тему статьи и видимость. Можно прикрепить набор — он появится в конце статьи.' },
  { targetId: 'sp-ca-photo', btnId: null, title: 'Фотографии',            desc: 'Загружай фото перетаскиванием или кликом. Нажми на фото — скопируется код для вставки в текст.' },
]

const CATEGORIES = [
  'Прочие расходы', 'Еда и Супермаркеты', 'Кафе, Бары, Рестораны',
  'Авто и Транспорт', 'Дом и Техника', 'Одежда и Обувь',
  'Развлечения и Хобби', 'Красота и Здоровье', 'Образование и Дети', 'Путешествия и Отдых',
]

const MY_SETS = [
  { id: 's1', name: 'Базовое питание',        color: '#8DBFA8', amount: '7 500 ₽',  period: '/ мес',     tags: ['18 поз.', 'еженедельно'], category: 'Еда и Супермаркеты' },
  { id: 's2', name: 'Вкусняшки',              color: '#C4A882', amount: '2 500 ₽',  period: '/ мес',     tags: ['6 поз.',  'еженедельно'], category: 'Еда и Супермаркеты' },
  { id: 's3', name: 'Домашняя аптечка',       color: '#B89AAE', amount: '1 200 ₽',  period: '/ квартал', tags: ['12 поз.', 'квартально'],  category: 'Красота и Здоровье' },
  { id: 's4', name: 'Базовый уход за кошкой', color: '#9AB8A8', amount: '3 800 ₽',  period: '/ мес',     tags: ['9 поз.',  'ежемесячно'],  category: 'Прочие расходы' },
  { id: 's5', name: 'Домашний офис',          color: '#8A9EB8', amount: '65 000 ₽', period: 'разово',    tags: ['8 поз.',  'разово'],       category: 'Дом и Техника' },
]

const PUBLIC_SETS = [
  { id: 'p1', name: 'Базовая аптечка',    color: '#7DAABD', amount: '2 800 ₽', period: '/ квартал', tags: ['14 поз.', 'квартально'],  category: 'Красота и Здоровье' },
  { id: 'p2', name: 'Рацион на неделю',   color: '#A8BD8D', amount: '4 500 ₽', period: '/ неделю',  tags: ['22 поз.', 'еженедельно'], category: 'Еда и Супермаркеты' },
  { id: 'p3', name: 'Уход за авто',       color: '#BDA88D', amount: '8 200 ₽', period: '/ год',     tags: ['11 поз.', 'ежегодно'],    category: 'Авто и Транспорт' },
]

export default function CreateArticle() {
  const navigate  = useNavigate()
  const bodyRef   = useRef(null)
  const fileInput = useRef(null)

  const [title,         setTitle]         = useState('')
  const [excerpt,       setExcerpt]       = useState('')
  const [body,          setBody]          = useState('')
  const [htmlBody,      setHtmlBody]      = useState('')
  const [editorMode,    setEditorMode]    = useState('md')
  const [category,      setCategory]      = useState(null)
  const [catError,      setCatError]      = useState(false)
  const [isPublic,      setIsPublic]      = useState(false)
  const [images,        setImages]        = useState([])
  const [dragOver,      setDragOver]      = useState(false)
  const [toast,         setToast]         = useState(null)
  const [linkedSets,    setLinkedSets]    = useState([])
  const [setPickerOpen, setSetPickerOpen] = useState(false)
  const [setType,       setSetType]       = useState('personal')
  const [showSpotlight, setShowSpotlight] = useState(false)
  const [showPrompt,    setShowPrompt]    = useState(false)
  const [htmlWarnings,  setHtmlWarnings]  = useState([])

  const activeText = editorMode === 'md' ? body : htmlBody
  const wordCount  = activeText.trim() ? activeText.trim().split(/\s+/).length : 0
  const readMin    = Math.max(1, Math.round(wordCount / 200))
  const today      = new Date().toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── Images ───────────────────────────────────────────────────────────────────
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

  function handleDrop(e)    { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }
  function removeImage(id)  { setImages(prev => prev.filter(img => img.id !== id)) }

  function copyImageCode(img) {
    if (editorMode === 'md') {
      navigator.clipboard.writeText(`![${img.name}](${img.id})`).catch(() => {})
      showToast('Markdown-код скопирован — вставьте в текст')
    } else {
      navigator.clipboard.writeText(img.id).catch(() => {})
      showToast('Код фото скопирован — вставьте в src=""')
    }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2200) }

  // ── HTML sanitize on blur ─────────────────────────────────────────────────
  function handleHtmlBlur() {
    if (!htmlBody.trim()) return
    const { clean, warnings } = sanitizeHtml(htmlBody)
    setHtmlWarnings(warnings)
    if (clean !== htmlBody) setHtmlBody(clean)
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  function saveArticle(pub) {
    if (!title.trim()) { showToast('Введите заголовок статьи'); return false }
    if (pub && category === null) { setCatError(true); showToast('Выберите категорию'); return false }
    setCatError(false)

    let finalHtml = htmlBody
    if (editorMode === 'html' && htmlBody.trim()) {
      const { clean, warnings } = sanitizeHtml(htmlBody)
      finalHtml = clean
      setHtmlBody(clean)
      if (warnings.length) { setHtmlWarnings(warnings); showToast('HTML очищен от запрещённых элементов'); return false }
    }

    const article = {
      id:         'a' + Date.now(),
      title:      title.trim(),
      excerpt:    excerpt.trim() || (editorMode === 'md' ? body : htmlBody).trim().replace(/<[^>]+>/g, '').slice(0, 120) || '',
      body:       editorMode === 'md' ? body : '',
      htmlBody:   editorMode === 'html' ? finalHtml : '',
      images:     images.map(img => ({ id: img.id, url: img.url })),
      editorMode,
      category,
      linkedSets: linkedSets.map(s => s.id),
      meta:       today + ' · ' + readMin + ' мин',
      views:      0,
      pub,
      draft:      !pub,
    }
    try {
      const saved = JSON.parse(localStorage.getItem('ss_account_articles') || '[]')
      saved.unshift(article)
      localStorage.setItem('ss_account_articles', JSON.stringify(saved))
    } catch {}
    return true
  }

  function handlePublish() { if (saveArticle(true))  navigate('/account') }
  function handleDraft()   { if (saveArticle(false)) { showToast('Черновик сохранён'); setTimeout(() => navigate('/account'), 1000) } }

  // ── Sets ──────────────────────────────────────────────────────────────────
  const personalSets = category === null ? MY_SETS     : MY_SETS.filter(s => s.category === category)
  const publicSets   = category === null ? PUBLIC_SETS : PUBLIC_SETS.filter(s => s.category === category)
  const pickerSets   = setType === 'personal' ? personalSets : publicSets

  function selectSet(s) {
    if (linkedSets.some(l => l.id === s.id)) return
    if (linkedSets.length >= 5) { showToast('Можно прикрепить не более 5 наборов'); return }
    setLinkedSets(prev => [...prev, s])
    setSetPickerOpen(false)
  }
  function removeSet(id) { setLinkedSets(prev => prev.filter(s => s.id !== id)) }

  function handleCategoryChange(cat) {
    setCategory(cat)
    setCatError(false)
    if (cat !== null) setLinkedSets(prev => prev.filter(s => s.category === cat))
  }

  return (
    <Layout>
      <main className="inventory-main">

        {/* ── Header ── */}
        <div className="inv-page-header">
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Создание статьи
            <HelpButton seenKey="ss_spl_createarticle" onOpen={() => setShowSpotlight(true)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-draft" onClick={handleDraft}>Сохранить черновик</button>
            <button id="sp-ca-publish" className="btn-publish" onClick={handlePublish}>Опубликовать</button>
          </div>
        </div>


          {/* ── Meta ── */}
          <div id="sp-ca-meta" className="editor-meta-block">

            {/* Видимость */}
            <div className="editor-meta-row">
              <div className="editor-meta-label">Видимость</div>
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
                ? 'Статья будет опубликована в ленте и на странице вашего аккаунта, доступна всем пользователям.'
                : 'Статья будет доступна на странице вашего аккаунта и видна пользователям в зависимости от настроек конфиденциальности.'}
            </div>
            </div>

            {/* Категория */}
            <div className="editor-meta-row">
              <div className={`editor-meta-label${catError ? ' editor-meta-label--error' : ''}`}>
                Категория{catError && <span className="editor-cat-required"> — обязательно</span>}
              </div>
              <div className={`editor-cats${catError ? ' editor-cats--error' : ''}`}>
                {CATEGORIES.map(cat => (
                  <button key={cat}
                    className={`editor-cat-btn${category === cat ? ' active' : ''}`}
                    onClick={() => handleCategoryChange(cat)}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Наборы */}
            <div className="editor-meta-row" style={{ alignItems: 'flex-start' }}>
              <div className="editor-meta-label" style={{ paddingTop: 6 }}>
                Наборы{linkedSets.length > 0 && ` · ${linkedSets.length}/5`}
              </div>
              <div className="set-picker-wrap">
                {linkedSets.map(s => (
                  <div className="linked-set-chip" key={s.id}>
                    <div className="linked-set-dot" style={{ background: s.color }} />
                    <span className="linked-set-name">{s.name}</span>
                    <span className="linked-set-amount">{s.amount} {s.period}</span>
                    <button className="linked-set-remove" onClick={() => removeSet(s.id)} title="Открепить">
                      <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}

                {linkedSets.length < 5 && (
                  <div className="set-picker-anchor">
                    <button className="linked-set-add" onClick={() => setSetPickerOpen(p => !p)}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                      Прикрепить набор
                    </button>
                    {setPickerOpen && (
                      <div className="set-picker-panel">
                        <div className="set-picker-tabs">
                          <button className={`set-picker-tab${setType === 'personal' ? ' active' : ''}`} onClick={() => setSetType('personal')}>Личные</button>
                          <button className={`set-picker-tab${setType === 'public'   ? ' active' : ''}`} onClick={() => setSetType('public')}>Публичные</button>
                        </div>
                        <div className="set-picker-list">
                          {pickerSets.length > 0 ? pickerSets.map(s => {
                            const already = linkedSets.some(l => l.id === s.id)
                            return (
                              <div key={s.id}
                                className={`set-picker-item${already ? ' set-picker-item--added' : ''}`}
                                onClick={() => !already && selectSet(s)}>
                                <div className="set-picker-dot" style={{ background: s.color }} />
                                <div className="set-picker-info">
                                  <span className="set-picker-name">{s.name}</span>
                                  <span className="set-picker-meta">{s.amount} {s.period} · {s.tags.join(', ')}</span>
                                </div>
                                {already && <span className="set-picker-check">✓</span>}
                              </div>
                            )
                          }) : (
                            <div className="set-picker-empty">
                              {category ? `Нет наборов для «${category}»` : 'Сначала выберите категорию'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Title ── */}
          <div className="editor-field-block">
            <div className="editor-field-label editor-field-label--body">
              <span>Заголовок</span>
              <span className={`editor-char-count${title.length > 90 ? ' warn' : ''}`}>{title.length}/100</span>
            </div>
            <textarea className="editor-title-input" placeholder="Введите заголовок статьи..."
              value={title} onChange={e => setTitle(e.target.value.slice(0, 100))} rows={2} />
          </div>

          {/* ── Excerpt ── */}
          <div className="editor-field-block">
            <div className="editor-field-label editor-field-label--body">
              <span>Краткое описание</span>
              <span className={`editor-char-count${excerpt.length > 220 ? ' warn' : ''}`}>{excerpt.length}/250</span>
            </div>
            <textarea className="editor-excerpt-input" placeholder="Короткий анонс статьи, который будет виден в ленте..."
              value={excerpt} onChange={e => setExcerpt(e.target.value.slice(0, 250))} rows={2} />
          </div>

          {/* ── Body ── */}
          <div className="editor-field-block editor-field-block--body">
            <div className="editor-field-label editor-field-label--body">
              <span>Текст статьи</span>
              <div className="editor-mode-toggle">
                <button className={`editor-mode-btn${editorMode === 'md' ? ' active' : ''}`} onClick={() => setEditorMode('md')}>Markdown</button>
                <button className={`editor-mode-btn${editorMode === 'html' ? ' active' : ''}`} onClick={() => setEditorMode('html')}>HTML</button>
              </div>
            </div>
            {editorMode === 'md' ? (
              <textarea ref={bodyRef} className="editor-body-input"
                placeholder={`Начните писать статью...\n\nMarkdown: **жирный**, *курсив*, ## Заголовок, > Цитата\nФото: загрузите изображение, кликните по нему — код скопируется`}
                value={body} onChange={e => setBody(e.target.value.slice(0, 30000))} />
            ) : (
              <>
                <div className="editor-html-hint">
                  <span>Вставьте HTML, сгенерированный по промту</span>
                  <button className="editor-html-prompt-btn" onClick={() => setShowPrompt(true)}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    Промт для GPT
                  </button>
                </div>
                <textarea className="editor-body-input editor-body-input--html"
                  placeholder="Вставьте HTML-разметку статьи..."
                  value={htmlBody}
                  onChange={e => { setHtmlBody(e.target.value.slice(0, 30000)); setHtmlWarnings([]) }}
                  onBlur={handleHtmlBlur} />
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
            <div className={`editor-body-meta${activeText.length > 27000 ? ' warn' : ''}`}>
              <span>{wordCount} сл. · ~{readMin} мин</span>
              {activeText.length > 0 && <span>{activeText.length.toLocaleString('ru')} / 30 000 симв.{activeText.length > 27000 ? ' — почти лимит' : ''}</span>}
            </div>
          </div>

          {/* ── Photos ── */}
          <div id="sp-ca-photo" className="photo-section">
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
              <div className="drop-zone-text">
                {dragOver ? 'Отпустите для загрузки' : 'Перетащите фото или нажмите для выбора'}
              </div>
              <div className="drop-zone-hint">PNG, JPG, GIF, WebP</div>
              <input ref={fileInput} type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
            </div>
            {images.length > 0 && (
              <div className="photo-gallery">
                {images.map(img => (
                  <div key={img.id} className="photo-thumb" onClick={() => copyImageCode(img)}
                    title="Нажмите, чтобы скопировать код">
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

        {/* Toast */}
        <div className={`toast${toast ? ' show' : ''}`}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast}
        </div>

        {showSpotlight && <SpotlightTour steps={CA_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
        {showPrompt && <GptPromptModal images={images} onClose={() => setShowPrompt(false)} onCopied={() => showToast('Промт скопирован')} />}

      </main>
    </Layout>
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

  FORBIDDEN_TAGS.forEach(tag => {
    doc.querySelectorAll(tag).forEach(el => {
      warnings.push(`Удалён запрещённый тег <${el.tagName.toLowerCase()}>`)
      el.remove()
    })
  })

  const walk = (node) => {
    Array.from(node.childNodes).forEach(walk)
    if (node.nodeType !== 1) return
    const tag = node.tagName.toLowerCase()

    if (!ALLOWED_TAGS.has(tag)) {
      const parent = node.parentNode
      if (parent) {
        warnings.push(`Удалён недопустимый тег <${tag}>`)
        while (node.firstChild) parent.insertBefore(node.firstChild, node)
        parent.removeChild(node)
      }
      return
    }

    Array.from(node.attributes).forEach(attr => {
      const name  = attr.name.toLowerCase()
      const value = attr.value

      if (name.startsWith('on')) {
        warnings.push(`Удалён обработчик "${attr.name}" — попытка выполнения скрипта`)
        node.removeAttribute(attr.name); return
      }
      if (/javascript\s*:/i.test(value)) {
        warnings.push(`Удалён атрибут "${name}" — обнаружен javascript:`)
        node.removeAttribute(attr.name); return
      }
      if (/data\s*:/i.test(value) && name !== 'alt') {
        warnings.push(`Удалён атрибут "${name}" — data: URI не разрешены`)
        node.removeAttribute(attr.name); return
      }
      if (name === 'style') {
        warnings.push('Удалён атрибут style — встроенные стили запрещены')
        node.removeAttribute('style'); return
      }
      if (name === 'class') {
        if (!ALLOWED_CLASSES.has(value.trim())) {
          warnings.push(`Удалён класс "${value}" — допустимы только content-note и content-highlight`)
          node.removeAttribute('class')
        }
        return
      }
      if (tag === 'img' && name === 'src') {
        let srcVal = value.trim()
        try {
          const url = new URL(srcVal)
          srcVal = url.pathname.split('/').pop()
        } catch {} // not an absolute URL — keep as-is
        if (/^photo-[a-z0-9_-]+$/.test(srcVal)) {
          node.setAttribute('src', srcVal)
        } else {
          warnings.push('Удалён внешний src в <img> — используй только коды загруженных фото')
          node.removeAttribute('src')
        }
        return
      }
      if (tag === 'img' && name === 'alt') return
      warnings.push(`Удалён атрибут "${name}" в <${tag}>`)
      node.removeAttribute(attr.name)
    })
  }

  Array.from(doc.body.childNodes).forEach(walk)
  return { clean: doc.body.innerHTML, warnings }
}

// ── GPT Prompt Modal ──────────────────────────────────────────────────────────
const GPT_PROMPT = `Напиши HTML-разметку статьи по тексту который я пришлю в следующем сообщении. Правила:

СТРУКТУРА
• Не включай теги <html>, <head>, <body> — только содержимое статьи
• Начинай сразу с контента, без обёрток

ДОПУСТИМЫЕ ТЕГИ
• <h2>Заголовок раздела</h2>
• <h3>Подзаголовок</h3>
• <p>Текст абзаца</p>
• <ul><li>Пункт</li></ul> — маркированный список
• <ol><li>Пункт</li></ol> — нумерованный список
• <strong>жирный</strong>
• <em>курсив</em>
• <blockquote class="content-note">Важная заметка или цитата</blockquote>
• <div class="content-highlight">Ключевая мысль или совет</div>

ИЗОБРАЖЕНИЯ
• Изображения загружаются отдельно, каждое получает код вида photo-1234567890-abc
• Для вставки: <img src="PHOTO_CODE" alt="описание">
• Замени PHOTO_CODE на реальный код после загрузки фото

ЗАПРЕЩЕНО
• Теги: <script>, <style>, <iframe>, <form>, <input>, <link> и другие
• Атрибут style на любых элементах
• Внешние URL в src изображений
• Любые классы, кроме content-note и content-highlight
• Атрибуты-обработчики событий (onclick, onerror и т.д.)

ВАЖНО
• Текст статьи менять нельзя — только добавить HTML-оформление
• Не сокращай, не перефразируй, не добавляй новый контент`

function GptPromptModal({ images, onClose, onCopied }) {
  const hasImages = images.length > 0

  function handleCopy() {
    let text = GPT_PROMPT
    if (hasImages) {
      const codes = images.map(img => `  ${img.id}  — ${img.name}`).join('\n')
      text += `\n\nЗАГРУЖЕННЫЕ ФОТО (используй эти коды)\n${codes}`
    }
    navigator.clipboard.writeText(text).catch(() => {})
    onCopied()
    onClose()
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
            <li>Напишите текст статьи. В местах где нужны фото — загрузите их в раздел «Фотографии» и вставьте коды в текст</li>
            <li>Скопируйте этот промт, откройте любой GPT-сервис и отправьте его</li>
            <li>В следующем сообщении отправьте ваш текст — GPT добавит HTML-оформление, не меняя содержание</li>
            <li>Скопируйте результат, замените исходный текст на HTML-версию и опубликуйте</li>
          </ol>
          {hasImages && (
            <div className="gpt-prompt-img-note">
              В промт будут добавлены коды загруженных фото ({images.length} шт.)
            </div>
          )}
        </div>
        <pre className="gpt-prompt-text">
          {GPT_PROMPT}
          {hasImages && `\n\nЗАГРУЖЕННЫЕ ФОТО (используй эти коды)\n${images.map(img => `  ${img.id}  — ${img.name}`).join('\n')}`}
        </pre>
        <div className="gpt-prompt-actions">
          <button className="gpt-prompt-cancel" onClick={onClose}>Закрыть</button>
          <button className="gpt-prompt-copy" onClick={handleCopy}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            Скопировать промт
          </button>
        </div>
      </div>
    </div>
  )
}
