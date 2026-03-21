import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { companies } from '../data/mock'

const ALL_COMPANIES = Object.entries(companies).flatMap(([catId, cat]) =>
  cat.list.map(c => ({ ...c, catId, catLabel: cat.label }))
)

export default function CreateWhisper() {
  const navigate  = useNavigate()
  const fileInput = useRef(null)

  const [coSearch, setCoSearch] = useState('')
  const [selCo,    setSelCo]    = useState(null)
  const [title,    setTitle]    = useState('')
  const [code,     setCode]     = useState('')
  const [expires,  setExpires]  = useState('')
  const [source,   setSource]   = useState('')
  const [images,   setImages]   = useState([])
  const [dragOver, setDragOver] = useState(false)

  const filteredCos = coSearch.trim()
    ? ALL_COMPANIES.filter(c => c.name.toLowerCase().includes(coSearch.trim().toLowerCase()))
    : ALL_COMPANIES

  const canSubmit = selCo && title.trim().length >= 5

  function addFiles(files) {
    Array.from(files).filter(f => f.type.startsWith('image/')).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        const id = 'wimg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
        setImages(prev => [...prev, { id, url: e.target.result, name: file.name }])
      }
      reader.readAsDataURL(file)
    })
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files)
  }

  function removeImage(id) { setImages(prev => prev.filter(img => img.id !== id)) }

  function publish() {
    if (!canSubmit) return
    const item = {
      id:           'wh-u-' + Date.now(),
      companyId:    selCo.id,
      companyName:  selCo.name,
      companyAbbr:  selCo.abbr,
      companyColor: selCo.color,
      category:     selCo.catId,
      title:        title.trim(),
      code:         code.trim() || null,
      expires:      expires || null,
      source:       source.trim() || null,
      images:       images.map(i => ({ id: i.id, url: i.url })),
      addedBy:      localStorage.getItem('ss_username') || 'вы',
      addedAt:      Date.now(),
      history:      [],
      comments:     [],
    }
    try {
      const saved = JSON.parse(localStorage.getItem('ss_account_whispers') || '[]')
      localStorage.setItem('ss_account_whispers', JSON.stringify([item, ...saved]))
    } catch {}
    navigate('/account', { state: { tab: 'whispers' } })
  }

  return (
    <Layout>
      <main className="cw-main">

        {/* Toolbar */}
        <div className="cw-toolbar">
          <button className="cw-back-btn" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Назад
          </button>
          <div className="cw-toolbar-title">Подслушано</div>
          <button className="cw-publish-btn" disabled={!canSubmit} onClick={publish}>
            Опубликовать
          </button>
        </div>

        <div className="cw-body">

          {/* Company */}
          <div className="cw-section">
            <div className="cw-section-label">Компания <span className="cw-required">*</span></div>
            {selCo ? (
              <div className="cw-selected-co">
                <div className="promo-logo" style={{ background: selCo.color }}>{selCo.abbr}</div>
                <div className="cw-selected-co-info">
                  <div className="cw-selected-co-name">{selCo.name}</div>
                  <div className="cw-selected-co-cat">{selCo.catLabel}</div>
                </div>
                <button className="cw-change-co" onClick={() => { setSelCo(null); setCoSearch('') }}>
                  Изменить
                </button>
              </div>
            ) : (
              <div className="cw-co-picker">
                <div className="cw-co-search-wrap">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    className="cw-co-search"
                    placeholder="Поиск компании..."
                    value={coSearch}
                    onChange={e => setCoSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="cw-co-list">
                  {filteredCos.map(c => (
                    <button key={c.id} className="cw-co-item" onClick={() => setSelCo(c)}>
                      <div className="promo-logo" style={{ background: c.color, width: 28, height: 28, fontSize: 10 }}>{c.abbr}</div>
                      <div className="cw-co-item-info">
                        <div className="cw-co-item-name">{c.name}</div>
                        <div className="cw-co-item-cat">{c.catLabel}</div>
                      </div>
                    </button>
                  ))}
                  {filteredCos.length === 0 && (
                    <div className="cw-co-empty">Компания не найдена</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="cw-section">
            <div className="cw-section-label">Описание скидки или акции <span className="cw-required">*</span></div>
            <textarea
              className="cw-textarea"
              rows={3}
              placeholder="Например: скидка 20% при оплате через СБП, действует только в приложении"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <div className="cw-char-hint">{title.trim().length < 5 ? `ещё ${5 - title.trim().length} симв.` : ''}</div>
          </div>

          {/* Code + Expires */}
          <div className="cw-row">
            <div className="cw-section cw-section-half">
              <div className="cw-section-label">Промокод <span className="cw-optional">необязательно</span></div>
              <input
                className="cw-input cw-input-mono"
                placeholder="SAVE20"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="cw-section cw-section-half">
              <div className="cw-section-label">Действует до <span className="cw-optional">необязательно</span></div>
              <input
                type="date"
                className="cw-input cw-input-date"
                value={expires}
                onChange={e => setExpires(e.target.value)}
              />
            </div>
          </div>

          {/* Source */}
          <div className="cw-section">
            <div className="cw-section-label">Где узнали <span className="cw-optional">необязательно</span></div>
            <input
              className="cw-input"
              placeholder="Телеграм-канал, сайт, друг..."
              value={source}
              onChange={e => setSource(e.target.value)}
            />
          </div>

          {/* Images */}
          <div className="cw-section">
            <div className="cw-section-label">
              Фото <span className="cw-optional">необязательно</span>
            </div>
            <div
              className={`cw-drop-zone${dragOver ? ' drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInput.current?.click()}
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span className="cw-drop-text">
                {dragOver ? 'Отпустите для загрузки' : 'Перетащите или нажмите для выбора фото'}
              </span>
              <input ref={fileInput} type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
            </div>
            {images.length > 0 && (
              <div className="cw-img-gallery">
                {images.map(img => (
                  <div key={img.id} className="cw-img-thumb">
                    <img src={img.url} alt={img.name} />
                    <button className="cw-img-remove" onClick={() => removeImage(img.id)} title="Удалить">
                      <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cw-publish-row">
            <button className="cw-publish-btn-lg" disabled={!canSubmit} onClick={publish}>
              Опубликовать
            </button>
            {!canSubmit && (
              <span className="cw-publish-hint">
                {!selCo ? 'Выберите компанию' : 'Добавьте описание'}
              </span>
            )}
          </div>

        </div>
      </main>
    </Layout>
  )
}
