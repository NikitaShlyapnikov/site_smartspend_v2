import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'

const CA_SPOTLIGHT = [
  { targetId: 'sp-ca-toolbar', btnId: 'sp-ca-publish', title: 'Панель редактора',    desc: 'Кнопки форматирования текста: жирный, курсив, заголовок, цитата. Справа — предпросмотр и публикация статьи.' },
  { targetId: 'sp-ca-meta',    btnId: null,            title: 'Категория и настройки', desc: 'Укажи тему статьи и видимость. Можно прикрепить свой набор — он появится в конце статьи.' },
  { targetId: 'sp-ca-photo',   btnId: null,            title: 'Фотографии',           desc: 'Загружай фото перетаскиванием или кликом. Нажми на фото — скопируется код для вставки в текст.' },
]

const CATEGORIES = [
  null,
  'Прочие расходы', 'Еда и Супермаркеты', 'Кафе, Бары, Рестораны',
  'Авто и Транспорт', 'Дом и Техника', 'Одежда и Обувь',
  'Развлечения и Хобби', 'Красота и Здоровье', 'Образование и Дети', 'Путешествия и Отдых',
]

const FORMAT_BTNS = [
  { label: 'B',  title: 'Жирный',    wrap: ['**', '**'] },
  { label: 'I',  title: 'Курсив',    wrap: ['*', '*'] },
  { label: 'H2', title: 'Заголовок', wrap: ['## ', ''] },
  { label: '"',  title: 'Цитата',    wrap: ['> ', ''] },
]

// Наборы автора (мок)
const MY_SETS = [
  { id: 's1', name: 'Базовое питание',       color: '#8DBFA8', amount: '7 500 ₽',  period: '/ мес',     tags: ['18 поз.', 'еженедельно'], category: 'Еда и Супермаркеты' },
  { id: 's2', name: 'Вкусняшки',             color: '#C4A882', amount: '2 500 ₽',  period: '/ мес',     tags: ['6 поз.',  'еженедельно'], category: 'Еда и Супермаркеты' },
  { id: 's3', name: 'Домашняя аптечка',      color: '#B89AAE', amount: '1 200 ₽',  period: '/ квартал', tags: ['12 поз.', 'квартально'],  category: 'Красота и Здоровье' },
  { id: 's4', name: 'Базовый уход за кошкой',color: '#9AB8A8', amount: '3 800 ₽',  period: '/ мес',     tags: ['9 поз.', 'ежемесячно'],   category: 'Прочие расходы' },
  { id: 's5', name: 'Домашний офис',         color: '#8A9EB8', amount: '65 000 ₽', period: 'разово',    tags: ['8 поз.', 'разово'],       category: 'Дом и Техника' },
]

// ── Разбивает строку на части: текст + картинки ───────────────────────────────
function inlineWithImages(text, imgMap) {
  const parts = []
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g
  let last = 0, m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'text', value: text.slice(last, m.index) })
    const img = imgMap[m[2]]
    parts.push(img
      ? { type: 'img', url: img.url, alt: m[1] }
      : { type: 'text', value: `[изображение: ${m[1]}]` }
    )
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) })
  return parts
}

// ── Markdown → JSX (для превью внутри hero) ───────────────────────────────────
function renderMarkdown(text, images) {
  const imgMap = {}
  images.forEach(img => { imgMap[img.id] = img })

  return text.split('\n\n').filter(Boolean).map((block, i) => {
    if (block.startsWith('## '))  return <h2 key={i}>{block.slice(3)}</h2>
    if (block.startsWith('> '))   return <blockquote key={i} className="content-note">{block.slice(2)}</blockquote>

    // Если весь блок — одна картинка, рендерим по центру
    const soloImg = block.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (soloImg) {
      const img = imgMap[soloImg[2]]
      if (img) return (
        <div key={i} style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
          <img src={img.url} alt={soloImg[1]}
            style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 10, objectFit: 'contain' }} />
        </div>
      )
      return <div key={i} className="preview-img-placeholder">[изображение: {soloImg[1]}]</div>
    }

    // Параграф с возможными инлайн-картинками
    const parts = inlineWithImages(block, imgMap)
    const hasImg = parts.some(p => p.type === 'img')
    if (!hasImg) {
      const inline = block.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>')
      return <p key={i} dangerouslySetInnerHTML={{ __html: inline }} />
    }
    return (
      <p key={i}>
        {parts.map((p, j) => p.type === 'img'
          ? <img key={j} src={p.url} alt={p.alt}
              style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 10, objectFit: 'contain', display: 'block', margin: '12px auto' }} />
          : <span key={j} dangerouslySetInnerHTML={{ __html: p.value.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>') }} />
        )}
      </p>
    )
  })
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CreateArticle() {
  const navigate  = useNavigate()
  const bodyRef   = useRef(null)
  const fileInput = useRef(null)

  const [title,     setTitle]     = useState('')
  const [excerpt,   setExcerpt]   = useState('')
  const [body,      setBody]      = useState('')
  const [category,  setCategory]  = useState(null)
  const [catError,  setCatError]  = useState(false)
  const [isPublic,  setIsPublic]  = useState(false)
  const [preview,   setPreview]   = useState(false)
  const [images,    setImages]    = useState([])
  const [dragOver,  setDragOver]  = useState(false)
  const [toast,     setToast]     = useState(null)
  const [linkedSet, setLinkedSet] = useState(null)   // выбранный набор
  const [setPickerOpen, setSetPickerOpen] = useState(false)
  const [showSpotlight, setShowSpotlight] = useState(false)

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0
  const readMin   = Math.max(1, Math.round(wordCount / 200))
  const today = new Date().toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── Text formatting ──────────────────────────────────────────────────────────
  function insertFormat(wrap) {
    const ta = bodyRef.current
    if (!ta) return
    const start = ta.selectionStart, end = ta.selectionEnd
    const selected = body.slice(start, end)
    const newText = body.slice(0, start) + wrap[0] + (selected || 'текст') + wrap[1] + body.slice(end)
    setBody(newText)
    setTimeout(() => {
      ta.focus()
      const cur = start + wrap[0].length + (selected || 'текст').length + wrap[1].length
      ta.setSelectionRange(cur, cur)
    }, 0)
  }

  // ── Images ───────────────────────────────────────────────────────────────────
  function addFiles(files) {
    Array.from(files).filter(f => f.type.startsWith('image/')).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        const id = 'photo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
        const name = file.name.replace(/\.[^.]+$/, '')
        setImages(prev => [...prev, { id, name, url: e.target.result }])
      }
      reader.readAsDataURL(file)
    })
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files)
  }

  function removeImage(id) { setImages(prev => prev.filter(img => img.id !== id)) }

  function copyImageCode(img) {
    navigator.clipboard.writeText(`![${img.name}](${img.id})`).catch(() => {})
    showToast('Код скопирован — вставьте в текст статьи')
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2200) }

  // ── Publish ──────────────────────────────────────────────────────────────────
  function handlePublish() {
    if (!title.trim()) { showToast('Введите заголовок статьи'); return }
    if (category === null) { setCatError(true); showToast('Выберите категорию'); return }
    setCatError(false)
    const article = {
      id:      'a' + Date.now(),
      title:   title.trim(),
      excerpt: excerpt.trim() || body.trim().slice(0, 120) || '',
      body:    body,
      meta:    today + ' · ' + readMin + ' мин',
      views:   0,
      pub:     isPublic,
    }
    try {
      const saved = JSON.parse(localStorage.getItem('ss_account_articles') || '[]')
      saved.unshift(article)
      localStorage.setItem('ss_account_articles', JSON.stringify(saved))
    } catch {}
    navigate('/account')
  }

  // ── Set picker ───────────────────────────────────────────────────────────────
  // Наборы, доступные для прикрепления: фильтруем по выбранной категории
  const availableSets = category === null
    ? MY_SETS
    : MY_SETS.filter(s => s.category === category)

  function selectSet(s) { setLinkedSet(s); setSetPickerOpen(false) }
  function clearSet()   { setLinkedSet(null) }

  // Сбросить прикреплённый набор, если он не подходит под новую категорию
  function handleCategoryChange(cat) {
    setCategory(cat)
    setCatError(false)
    if (linkedSet && cat !== null && linkedSet.category !== cat) {
      setLinkedSet(null)
    }
  }

  return (
    <Layout>
      <main className="editor-main">

        {/* ── Toolbar ── */}
        <div id="sp-ca-toolbar" className="editor-toolbar">
          <span className="page-title" style={{ fontSize: 18, lineHeight: 1 }}>Создание статьи</span>
          <div className="editor-toolbar-top-right">
            <span className="editor-counter">{wordCount} сл. · ~{readMin} мин</span>
            <HelpButton seenKey="ss_spl_createarticle" onOpen={() => setShowSpotlight(true)} />
            <button className={`btn-preview-toggle${preview ? ' active' : ''}`} onClick={() => setPreview(p => !p)}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {preview ? 'Редактор' : 'Предпросмотр'}
            </button>
            <button id="sp-ca-publish" className="btn-publish" onClick={handlePublish}>Опубликовать</button>
          </div>
        </div>

        <div className="editor-scroll">

          {preview ? (
            /* ══════════════════ PREVIEW MODE ══════════════════ */
            <div className="editor-preview-article" style={{ paddingTop: 24 }}>

              {/* Hero card */}
              <div className="hero-card">
                <div className="hero-body">
                  <div className="hero-badges">
                    <span className="article-type-badge">Статья</span>
                    {category && <span className="cat-badge">{category}</span>}
                  </div>
                  <div className="hero-title">{title || 'Без заголовка'}</div>
                  {excerpt && <div className="hero-desc">{excerpt}</div>}

                  <div className="hero-stats">
                    <div className="hstat">
                      <div className="hstat-val">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                        0
                      </div>
                      <div className="hstat-lbl">просмотров</div>
                    </div>
                    <div className="hstat">
                      <div className="hstat-val">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        0
                      </div>
                      <div className="hstat-lbl">лайков</div>
                    </div>
                    <div className="hstat">
                      <div className="hstat-val" style={{ fontSize: 15, color: 'var(--text-2)' }}>{today}</div>
                      <div className="hstat-lbl">дата публикации</div>
                    </div>
                  </div>

                  <div className="hero-actions">
                    <button className="btn-liked">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      Нравится
                    </button>
                    <button className="btn-secondary">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                      Поделиться
                    </button>
                    <button className="btn-secondary">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                      </svg>
                      Сохранить
                    </button>
                  </div>
                </div>

                {/* Author */}
                <div className="hero-author">
                  <div className="author-avatar" style={{ background: '#4E8268' }}>НО</div>
                  <div className="author-info">
                    <div className="author-name">Никита Орлов</div>
                    <div className="author-bio">Интересуюсь личными финансами, инвестициями и оптимизацией бюджета. Создаю наборы для разных жизненных сценариев.</div>
                  </div>
                  <button className="btn-follow">Подписаться</button>
                </div>
              </div>

              {/* Content */}
              <div className="content-card">
                <div className="content-body">
                  {body.trim()
                    ? renderMarkdown(body, images)
                    : <p style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Текст статьи пуст</p>
                  }
                </div>
              </div>

              {/* Linked set */}
              {linkedSet && (
                <div className="catalog-card" style={{ cursor: 'default' }}>
                  <div className="card-accent-bar" style={{ background: linkedSet.color }} />
                  <div className="card-body">
                    <div className="card-badges">
                      <span className="source-badge community">Моё</span>
                    </div>
                    <div className="card-title">{linkedSet.name}</div>
                    <div className="card-desc">Прикреплённый набор</div>
                  </div>
                  <div className="card-footer">
                    <div className="card-amount-left">
                      <div className="card-amount">{linkedSet.amount}</div>
                      <div className="card-amount-label">{linkedSet.period}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          ) : (
            /* ══════════════════ EDITOR MODE ══════════════════ */
            <>
              {/* Meta */}
              <div id="sp-ca-meta" className="editor-meta-block">
                <div className="editor-meta-row">
                  <div className="editor-meta-label">Видимость</div>
                  <div className="visibility-toggle">
                    <button className={`visibility-btn${!isPublic ? ' active' : ''}`} onClick={() => setIsPublic(false)}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                      Личное
                    </button>
                    <button className={`visibility-btn${isPublic ? ' active' : ''}`} onClick={() => setIsPublic(true)}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                      </svg>
                      Публичная
                    </button>
                  </div>
                </div>
                <div className="editor-meta-row">
                  <div className={`editor-meta-label${catError ? ' editor-meta-label--error' : ''}`}>
                    Категория{catError && <span className="editor-cat-required"> — обязательно</span>}
                  </div>
                  <div className={`editor-cats${catError ? ' editor-cats--error' : ''}`}>
                    {CATEGORIES.map(cat => (
                      <button key={cat ?? '__none__'}
                        className={`editor-cat-btn${category === cat ? ' active' : ''}${cat === null ? ' editor-cat-btn--none' : ''}`}
                        onClick={() => handleCategoryChange(cat)}>
                        {cat ?? 'Без категории'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="editor-meta-row" style={{ alignItems: 'flex-start' }}>
                  <div className="editor-meta-label" style={{ paddingTop: 6 }}>Набор</div>
                  <div style={{ flex: 1 }}>
                    {linkedSet ? (
                      <div className="linked-set-chip">
                        <div className="linked-set-dot" style={{ background: linkedSet.color }} />
                        <span className="linked-set-name">{linkedSet.name}</span>
                        <span className="linked-set-amount">{linkedSet.amount} {linkedSet.period}</span>
                        <button className="linked-set-remove" onClick={clearSet} title="Открепить">
                          <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button className="linked-set-add" onClick={() => setSetPickerOpen(p => !p)}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Прикрепить набор
                      </button>
                    )}
                    {setPickerOpen && (
                      <div className="set-picker-list">
                        {availableSets.length > 0 ? availableSets.map(s => (
                          <div key={s.id} className="set-picker-item" onClick={() => selectSet(s)}>
                            <div className="set-picker-dot" style={{ background: s.color }} />
                            <div className="set-picker-info">
                              <span className="set-picker-name">{s.name}</span>
                              <span className="set-picker-meta">{s.amount} {s.period} · {s.tags.join(', ')}</span>
                            </div>
                          </div>
                        )) : (
                          <div className="set-picker-empty">Нет наборов для категории «{category}»</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="editor-field-block">
                <div className="editor-field-label">Заголовок</div>
                <textarea className="editor-title-input" placeholder="Введите заголовок статьи..."
                  value={title} onChange={e => setTitle(e.target.value)} rows={2} />
              </div>

              {/* Excerpt */}
              <div className="editor-field-block">
                <div className="editor-field-label">Краткое описание</div>
                <textarea className="editor-excerpt-input" placeholder="Короткий анонс статьи, который будет виден в ленте..."
                  value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} />
              </div>

              {/* Body */}
              <div className="editor-field-block editor-field-block--body">
                <div className="editor-field-label">Текст статьи</div>
                <textarea ref={bodyRef} className="editor-body-input"
                  placeholder={`Начните писать статью...\n\nMarkdown: **жирный**, *курсив*, ## Заголовок, > Цитата\nФото: загрузите изображение, кликните по нему — код скопируется`}
                  value={body} onChange={e => setBody(e.target.value)} />
                {body.length > 0 && (
                  <div className={`editor-char-count${body.length > 10000 ? ' warn' : ''}`}>
                    {body.length.toLocaleString('ru')} символов
                    {body.length > 10000 && ' — рекомендуем сократить'}
                  </div>
                )}
              </div>

              {/* Photo section */}
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
            </>
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
      </main>
    </Layout>
  )
}
