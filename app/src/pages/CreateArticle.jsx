import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const CATEGORIES = ['Финансы', 'Одежда', 'Питание', 'Здоровье', 'Дом', 'Техника', 'Транспорт', 'Досуг']

const FORMAT_BTNS = [
  { label: 'B', title: 'Жирный', wrap: ['**', '**'] },
  { label: 'I', title: 'Курсив', wrap: ['*', '*'] },
  { label: 'H2', title: 'Заголовок', wrap: ['## ', ''] },
  { label: '"', title: 'Цитата', wrap: ['> ', ''] },
]

export default function CreateArticle() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('Финансы')
  const [isPublic, setIsPublic] = useState(true)
  const [isDraft, setIsDraft] = useState(false)
  const bodyRef = useRef(null)

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0
  const charCount = body.length
  const readMin = Math.max(1, Math.round(wordCount / 200))

  function insertFormat(wrap) {
    const ta = bodyRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = body.slice(start, end)
    const before = body.slice(0, start)
    const after = body.slice(end)
    const newText = before + wrap[0] + (selected || 'текст') + wrap[1] + after
    setBody(newText)
    setTimeout(() => {
      ta.focus()
      const newCursor = start + wrap[0].length + (selected || 'текст').length + wrap[1].length
      ta.setSelectionRange(newCursor, newCursor)
    }, 0)
  }

  return (
    <Layout>
      <main className="editor-main">
        {/* Тулбар */}
        <div className="editor-toolbar">
          <div className="editor-format-bar">
            {FORMAT_BTNS.map(btn => (
              <button key={btn.label} className="fmt-btn" title={btn.title} onClick={() => insertFormat(btn.wrap)}>
                {btn.label}
              </button>
            ))}
            <div className="fmt-divider" />
            <span className="fmt-hint">**жирный** *курсив* ## заголовок &gt; цитата</span>
          </div>
          <div className="editor-toolbar-right">
            <span className="editor-counter">{wordCount} сл. · ~{readMin} мин</span>
            <button className="btn-draft" onClick={() => { setIsDraft(true); navigate('/feed') }}>
              Черновик
            </button>
            <button className="btn-cancel" onClick={() => navigate('/feed')}>Отмена</button>
            <button className="btn-publish" onClick={() => navigate('/feed')}>Опубликовать</button>
          </div>
        </div>

        <div className="editor-scroll">
          {/* Мета-блок */}
          <div className="editor-meta-block">
            <div className="editor-meta-row">
              <div className="editor-meta-label">Категория</div>
              <div className="editor-cats">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`editor-cat-btn${category === cat ? ' active' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </button>
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

          {/* Заголовок */}
          <textarea
            className="editor-title-input"
            placeholder="Заголовок статьи..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            rows={2}
          />

          {/* Тело */}
          <textarea
            ref={bodyRef}
            className="editor-body-input"
            placeholder={`Начните писать свою статью...\n\nПоддерживается базовый Markdown:\n**жирный**, *курсив*, ## Заголовок, > Цитата`}
            value={body}
            onChange={e => setBody(e.target.value)}
          />

          {charCount > 0 && (
            <div className={`editor-char-count${charCount > 10000 ? ' warn' : ''}`}>
              {charCount.toLocaleString('ru')} символов
              {charCount > 10000 && ' — рекомендуем сократить'}
            </div>
          )}
        </div>
      </main>
    </Layout>
  )
}
