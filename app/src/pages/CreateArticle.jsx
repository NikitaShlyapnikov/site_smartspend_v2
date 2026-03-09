import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const CATEGORIES = ['Финансы', 'Одежда', 'Питание', 'Здоровье', 'Дом', 'Техника', 'Транспорт', 'Досуг']

const FORMAT_BTNS = [
  { label: 'B',  title: 'Жирный',    wrap: ['**', '**'] },
  { label: 'I',  title: 'Курсив',    wrap: ['*', '*'] },
  { label: 'H2', title: 'Заголовок', wrap: ['## ', ''] },
  { label: '"',  title: 'Цитата',    wrap: ['> ', ''] },
]

// ── Markdown → JSX preview ────────────────────────────────────────────────────
function renderPreview(text, images) {
  const imgMap = {}
  images.forEach(img => { imgMap[img.id] = img })

  return text.split('\n\n').filter(Boolean).map((block, i) => {
    const imgMatch = block.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imgMatch) {
      const img = imgMap[imgMatch[2]]
      if (img) {
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
            <img src={img.url} alt={imgMatch[1]}
              style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 10, objectFit: 'contain' }} />
          </div>
        )
      }
      return <div key={i} className="preview-img-placeholder">[изображение: {imgMatch[1]}]</div>
    }

    if (block.startsWith('## '))  return <h2 key={i} className="preview-h2">{block.slice(3)}</h2>
    if (block.startsWith('> '))   return <blockquote key={i} className="preview-quote">{block.slice(2)}</blockquote>

    const inline = block.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>')
    return <p key={i} className="preview-p" dangerouslySetInnerHTML={{ __html: inline }} />
  })
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CreateArticle() {
  const navigate  = useNavigate()
  const bodyRef   = useRef(null)
  const fileInput = useRef(null)

  const [title,    setTitle]    = useState('')
  const [excerpt,  setExcerpt]  = useState('')
  const [body,     setBody]     = useState('')
  const [category, setCategory] = useState('Финансы')
  const [isPublic, setIsPublic] = useState(true)
  const [preview,  setPreview]  = useState(false)
  const [images,   setImages]   = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [toast,    setToast]    = useState(null)

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0
  const readMin   = Math.max(1, Math.round(wordCount / 200))

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
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  function removeImage(id) {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  function copyImageCode(img) {
    const code = `![${img.name}](${img.id})`
    navigator.clipboard.writeText(code).catch(() => {})
    showToast('Код скопирован — вставьте в текст статьи')
  }

  // ── Toast ────────────────────────────────────────────────────────────────────
  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  return (
    <Layout>
      <main className="editor-main">

        {/* Toolbar */}
        <div className="editor-toolbar">
          <div className="editor-format-bar">
            {FORMAT_BTNS.map(btn => (
              <button key={btn.label} className="fmt-btn" title={btn.title}
                onClick={() => insertFormat(btn.wrap)} disabled={preview}>
                {btn.label}
              </button>
            ))}
            <div className="fmt-divider" />
            <span className="fmt-hint">**жирный** *курсив* ## заголовок &gt; цитата</span>
          </div>
          <div className="editor-toolbar-right">
            <span className="editor-counter">{wordCount} сл. · ~{readMin} мин</span>
            <button
              className={`btn-preview-toggle${preview ? ' active' : ''}`}
              onClick={() => setPreview(p => !p)}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {preview ? 'Редактор' : 'Предпросмотр'}
            </button>
            <button className="btn-publish" onClick={() => navigate('/feed')}>Опубликовать</button>
          </div>
        </div>

        <div className="editor-scroll">
          {/* Meta */}
          {!preview && (
            <div className="editor-meta-block">
              <div className="editor-meta-row">
                <div className="editor-meta-label">Категория</div>
                <div className="editor-cats">
                  {CATEGORIES.map(cat => (
                    <button key={cat} className={`editor-cat-btn${category === cat ? ' active' : ''}`}
                      onClick={() => setCategory(cat)}>{cat}</button>
                  ))}
                </div>
              </div>
              <div className="editor-meta-row">
                <div className="editor-meta-label">Видимость</div>
                <div className="visibility-toggle">
                  <button className={`visibility-btn${isPublic ? ' active' : ''}`} onClick={() => setIsPublic(true)}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                    </svg>
                    Публичная
                  </button>
                  <button className={`visibility-btn${!isPublic ? ' active' : ''}`} onClick={() => setIsPublic(false)}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    Приватная
                  </button>
                </div>
              </div>
            </div>
          )}

          {preview ? (
            /* ── Preview mode ── */
            <div className="editor-preview-wrap">
              <div className="editor-preview-title">{title || 'Без заголовка'}</div>
              {excerpt && <div className="editor-preview-excerpt">{excerpt}</div>}
              <div className="editor-preview-body">
                {body.trim()
                  ? renderPreview(body, images)
                  : <div className="preview-empty">Текст статьи пуст</div>
                }
              </div>
              {images.length > 0 && (
                <div className="photo-gallery" style={{ marginTop: 24 }}>
                  {images.map(img => (
                    <div key={img.id} className="photo-thumb" style={{ cursor: 'default' }}>
                      <img src={img.url} alt={img.name} />
                      <div className="photo-thumb-name">{img.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── Editor mode ── */
            <>
              {/* Title block */}
              <div className="editor-field-block">
                <div className="editor-field-label">Заголовок</div>
                <textarea
                  className="editor-title-input"
                  placeholder="Введите заголовок статьи..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Excerpt block */}
              <div className="editor-field-block">
                <div className="editor-field-label">Краткое описание</div>
                <textarea
                  className="editor-excerpt-input"
                  placeholder="Короткий анонс статьи, который будет виден в ленте..."
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Body block */}
              <div className="editor-field-block editor-field-block--body">
                <div className="editor-field-label">Текст статьи</div>
                <textarea
                  ref={bodyRef}
                  className="editor-body-input"
                  placeholder={`Начните писать статью...\n\nMarkdown: **жирный**, *курсив*, ## Заголовок, > Цитата\nФото: загрузите изображение, кликните по нему — код скопируется`}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                />
                {body.length > 0 && (
                  <div className={`editor-char-count${body.length > 10000 ? ' warn' : ''}`}>
                    {body.length.toLocaleString('ru')} символов
                    {body.length > 10000 && ' — рекомендуем сократить'}
                  </div>
                )}
              </div>

              {/* Photo upload section */}
              <div className="photo-section">
                <div className="photo-section-title">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Фотографии{images.length > 0 && ` · ${images.length}`}
                </div>

                <div
                  className={`photo-drop-zone${dragOver ? ' drag-over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInput.current?.click()}
                >
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
                            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                          </svg>
                          Скопировать код
                        </div>
                        <button className="photo-thumb-remove"
                          onClick={e => { e.stopPropagation(); removeImage(img.id) }}
                          title="Удалить">
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

      </main>
    </Layout>
  )
}
