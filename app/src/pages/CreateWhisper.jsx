import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { companies } from '../data/mock'

const ALL_COMPANIES = Object.entries(companies).flatMap(([catId, cat]) =>
  cat.list.map(c => ({ ...c, catId, catLabel: cat.label }))
)

const CATEGORY_LIST = Object.entries(companies).map(([id, cat]) => ({ id, label: cat.label }))

export default function CreateWhisper() {
  const navigate = useNavigate()

  const [pickerMode, setPickerMode] = useState('category') // 'category' | 'search'
  const [selCat,     setSelCat]     = useState(null)
  const [coSearch,   setCoSearch]   = useState('')
  const [selCo,      setSelCo]      = useState(null)

  const [title,   setTitle]   = useState('')
  const [code,    setCode]    = useState('')
  const [expires, setExpires] = useState('')
  const [source,  setSource]  = useState('')
  const [toast,   setToast]   = useState(null)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2200) }

  // Companies to show in category mode
  const catCompanies = selCat
    ? ALL_COMPANIES.filter(c => c.catId === selCat)
    : []

  // Companies to show in search mode
  const searchCompanies = coSearch.trim().length >= 2
    ? ALL_COMPANIES.filter(c => c.name.toLowerCase().includes(coSearch.trim().toLowerCase()))
    : []

  const canSubmit = selCo && title.trim().length >= 5

  function publish() {
    if (!canSubmit) { showToast(!selCo ? 'Выберите компанию' : 'Добавьте описание'); return }
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

  function resetCo() { setSelCo(null); setSelCat(null); setCoSearch('') }

  return (
    <Layout>
      <main className="inventory-main">

        {/* Header */}
        <div className="inv-page-header">
          <div className="page-title">Поделиться скидкой</div>
          <button className="btn-publish" disabled={!canSubmit} onClick={publish}>
            Опубликовать
          </button>
        </div>

        {/* Company */}
        <div className="editor-field-block editor-field-block--overflow">
          <div className="editor-field-label">
            Компания
            <span className="cw-required" style={{ color: '#C84848', fontWeight: 400, marginLeft: 6 }}>обязательно</span>
          </div>

          {selCo ? (
            /* Selected company */
            <div className="cw-selected-co">
              <div className="promo-logo" style={{ background: selCo.color }}>{selCo.abbr}</div>
              <div className="cw-selected-co-info">
                <div className="cw-selected-co-name">{selCo.name}</div>
                <div className="cw-selected-co-cat">{selCo.catLabel}</div>
              </div>
              <button className="cw-change-co" onClick={resetCo}>Изменить</button>
            </div>
          ) : (
            /* Picker */
            <div className="cw-co-picker">
              {/* Mode tabs */}
              <div className="cw-picker-tabs">
                <button
                  className={`cw-picker-tab${pickerMode === 'category' ? ' active' : ''}`}
                  onClick={() => setPickerMode('category')}>
                  По категории
                </button>
                <button
                  className={`cw-picker-tab${pickerMode === 'search' ? ' active' : ''}`}
                  onClick={() => setPickerMode('search')}>
                  Поиск
                </button>
              </div>

              {pickerMode === 'category' ? (
                <>
                  {/* Category chips */}
                  <div className="cw-cat-chips">
                    {CATEGORY_LIST.map(cat => (
                      <button
                        key={cat.id}
                        className={`editor-cat-btn${selCat === cat.id ? ' active' : ''}`}
                        onClick={() => setSelCat(prev => prev === cat.id ? null : cat.id)}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  {/* Companies for selected category */}
                  {selCat && (
                    <div className="cw-co-list">
                      {catCompanies.map(c => (
                        <button key={c.id} className="cw-co-item" onClick={() => setSelCo(c)}>
                          <div className="promo-logo" style={{ background: c.color, width: 28, height: 28, fontSize: 10 }}>{c.abbr}</div>
                          <div className="cw-co-item-info">
                            <div className="cw-co-item-name">{c.name}</div>
                            <div className="cw-co-item-cat">{c.catLabel}</div>
                          </div>
                        </button>
                      ))}
                      {catCompanies.length === 0 && (
                        <div className="cw-co-empty">Нет компаний в этой категории</div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Search input */}
                  <div className="cw-co-search-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input
                      className="cw-co-search"
                      placeholder="Введите название компании..."
                      value={coSearch}
                      onChange={e => setCoSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {coSearch.trim().length >= 2 && (
                    <div className="cw-co-list">
                      {searchCompanies.map(c => (
                        <button key={c.id} className="cw-co-item" onClick={() => setSelCo(c)}>
                          <div className="promo-logo" style={{ background: c.color, width: 28, height: 28, fontSize: 10 }}>{c.abbr}</div>
                          <div className="cw-co-item-info">
                            <div className="cw-co-item-name">{c.name}</div>
                            <div className="cw-co-item-cat">{c.catLabel}</div>
                          </div>
                        </button>
                      ))}
                      {searchCompanies.length === 0 && (
                        <div className="cw-co-empty">Компания не найдена</div>
                      )}
                    </div>
                  )}
                  {coSearch.trim().length > 0 && coSearch.trim().length < 2 && (
                    <div className="cw-co-empty">Введите минимум 2 символа</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="editor-field-block">
          <div className="editor-field-label">
            Описание скидки или акции
            <span className="cw-required" style={{ color: '#C84848', fontWeight: 400, marginLeft: 6 }}>обязательно</span>
            {title.trim().length > 0 && title.trim().length < 5 && (
              <span style={{ color: 'var(--text-3)', fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>
                ещё {5 - title.trim().length} символа
              </span>
            )}
          </div>
          <textarea
            className="editor-excerpt-input"
            rows={3}
            placeholder="Например: скидка 20% при оплате через СБП, действует только в приложении"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
          />
        </div>

        {/* Promo code + Expires */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div className="editor-field-block" style={{ margin: 0 }}>
            <div className="editor-field-label">
              Промокод
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-3)', marginLeft: 6 }}>необязательно</span>
            </div>
            <input
              className="editor-excerpt-input"
              style={{ fontFamily: 'var(--mono)', letterSpacing: '0.05em', padding: '10px 14px' }}
              placeholder="SAVE20"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <div className="editor-field-block" style={{ margin: 0 }}>
            <div className="editor-field-label">
              Действует до
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-3)', marginLeft: 6 }}>необязательно</span>
            </div>
            <input
              type="date"
              className="editor-excerpt-input"
              style={{ padding: '10px 14px' }}
              value={expires}
              onChange={e => setExpires(e.target.value)}
            />
          </div>
        </div>

        {/* Source */}
        <div className="editor-field-block">
          <div className="editor-field-label">
            Где узнали
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-3)', marginLeft: 6 }}>необязательно</span>
          </div>
          <input
            className="editor-excerpt-input"
            style={{ padding: '10px 14px' }}
            placeholder="Телеграм-канал, сайт, друг..."
            value={source}
            onChange={e => setSource(e.target.value)}
          />
        </div>

        {toast && <div className="editor-toast">{toast}</div>}
      </main>
    </Layout>
  )
}
