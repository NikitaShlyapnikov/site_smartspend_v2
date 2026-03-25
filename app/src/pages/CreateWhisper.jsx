import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'
import { companies } from '../data/mock'

const ALL_COMPANIES = Object.entries(companies).flatMap(([catId, cat]) =>
  cat.list.map(c => ({ ...c, catId, catLabel: cat.label }))
)

const CATEGORY_LIST = Object.entries(companies).map(([id, cat]) => ({ id, label: cat.label }))

const CW_SPOTLIGHT = [
  {
    targetId: 'sp-cw-company',
    title: 'Выбор компании',
    desc: 'Найдите компанию через строку поиска — начните вводить название и выберите из результатов. Или выберите категорию и нажмите на компанию из списка.',
  },
  {
    targetId: 'sp-cw-desc',
    title: 'Описание акции',
    desc: 'Опишите скидку, промокод или акцию. Укажите размер скидки, условие получения и на что распространяется. Минимум 5 символов.',
  },
  {
    targetId: 'sp-cw-code',
    title: 'Промокод и срок',
    desc: 'Если есть промокод — введите его. Другие пользователи смогут проверить и проголосовать, работает ли он. Укажите срок действия, если знаете.',
  },
]

export default function CreateWhisper() {
  const navigate = useNavigate()

  const [showSpotlight, setShowSpotlight] = useState(false)
  const [coSearch,      setCoSearch]      = useState('')
  const [selCat,        setSelCat]        = useState(null)
  const [selCo,         setSelCo]         = useState(null)

  const [title,   setTitle]   = useState('')
  const [code,    setCode]    = useState('')
  const [expires, setExpires] = useState('')
  const [source,  setSource]  = useState('')
  const [toast,   setToast]   = useState(null)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2200) }

  // Search results — shown when 2+ chars typed
  const searchResults = coSearch.trim().length >= 2
    ? ALL_COMPANIES.filter(c => c.name.toLowerCase().includes(coSearch.trim().toLowerCase()))
    : []

  // Companies in selected category
  const catCompanies = selCat
    ? ALL_COMPANIES.filter(c => c.catId === selCat)
    : []

  const canSubmit = selCo && title.trim().length >= 5

  function selectCompany(c) {
    setSelCo(c)
    setSelCat(c.catId)
    setCoSearch('')
  }

  function resetCo() { setSelCo(null); setSelCat(null); setCoSearch('') }

  function buildItem(isDraft) {
    return {
      id:           'wh-u-' + Date.now(),
      companyId:    selCo?.id || null,
      companyName:  selCo?.name || '',
      companyAbbr:  selCo?.abbr || '',
      companyColor: selCo?.color || '',
      category:     selCo?.catId || null,
      title:        title.trim(),
      code:         code.trim() || null,
      expires:      expires || null,
      source:       source.trim() || null,
      addedBy:      localStorage.getItem('ss_username') || 'вы',
      addedAt:      Date.now(),
      draft:        isDraft,
      history:      [],
      comments:     [],
    }
  }

  function saveItem(isDraft) {
    try {
      const saved = JSON.parse(localStorage.getItem('ss_account_whispers') || '[]')
      localStorage.setItem('ss_account_whispers', JSON.stringify([buildItem(isDraft), ...saved]))
      return true
    } catch { return false }
  }

  function publish() {
    if (!canSubmit) { showToast(!selCo ? 'Выберите компанию' : 'Добавьте описание'); return }
    if (saveItem(false)) navigate('/account', { state: { tab: 'whispers' } })
  }

  function handleDraft() {
    if (!title.trim() && !selCo) { showToast('Добавьте хотя бы компанию или описание'); return }
    if (saveItem(true)) { showToast('Черновик сохранён'); setTimeout(() => navigate('/account', { state: { tab: 'whispers' } }), 1000) }
  }

  return (
    <Layout>
      <main className="inventory-main">

        {/* Header */}
        <div className="inv-page-header">
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Поделиться скидкой
            <HelpButton seenKey="ss_spl_createwhisper" onOpen={() => setShowSpotlight(true)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-draft" onClick={handleDraft}>Сохранить черновик</button>
            <button className="btn-publish" disabled={!canSubmit} onClick={publish}>Опубликовать</button>
          </div>
        </div>

        {/* Company picker */}
        <div id="sp-cw-company" className="editor-field-block editor-field-block--overflow">
          <div className="editor-field-label">
            Компания
            <span style={{ color: '#C84848', fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>обязательно</span>
          </div>

          {selCo ? (
            /* Selected */
            <div className="cw-selected-co">
              <div className="promo-logo" style={{ background: selCo.color }}>{selCo.abbr}</div>
              <div className="cw-selected-co-info">
                <div className="cw-selected-co-name">{selCo.name}</div>
                <div className="cw-selected-co-cat">{selCo.catLabel}</div>
              </div>
              <button className="cw-change-co" onClick={resetCo}>Изменить</button>
            </div>
          ) : (
            <div style={{ padding: '0 0 4px' }}>
              {/* Search bar */}
              <div className="cw-co-search-wrap" style={{ borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  className="cw-co-search"
                  placeholder="Поиск по названию компании..."
                  value={coSearch}
                  onChange={e => setCoSearch(e.target.value)}
                />
                {coSearch && (
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 0 }}
                    onClick={() => setCoSearch('')}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Search results */}
              {coSearch.trim().length >= 2 && (
                <div className="cw-co-list" style={{ borderBottom: searchResults.length > 0 ? '1px solid var(--border)' : 'none' }}>
                  {searchResults.length > 0 ? searchResults.map(c => (
                    <button key={c.id} className="cw-co-item" onClick={() => selectCompany(c)}>
                      <div className="promo-logo" style={{ background: c.color, width: 28, height: 28, fontSize: 10 }}>{c.abbr}</div>
                      <div className="cw-co-item-info">
                        <div className="cw-co-item-name">{c.name}</div>
                        <div className="cw-co-item-cat">{c.catLabel}</div>
                      </div>
                    </button>
                  )) : (
                    <div className="cw-co-empty">Компания не найдена</div>
                  )}
                </div>
              )}

              {/* Category chips */}
              <div style={{ padding: '10px 12px 6px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginBottom: 8 }}>
                  Выбрать по категории
                </div>
                <div className="editor-cats">
                  {CATEGORY_LIST.map(cat => (
                    <button
                      key={cat.id}
                      className={`editor-cat-btn${selCat === cat.id ? ' active' : ''}`}
                      onClick={() => setSelCat(prev => prev === cat.id ? null : cat.id)}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Companies in category */}
              {selCat && (
                <div className="cw-co-list" style={{ borderTop: '1px solid var(--border)' }}>
                  {catCompanies.map(c => (
                    <button key={c.id} className="cw-co-item" onClick={() => selectCompany(c)}>
                      <div className="promo-logo" style={{ background: c.color, width: 28, height: 28, fontSize: 10 }}>{c.abbr}</div>
                      <div className="cw-co-item-info">
                        <div className="cw-co-item-name">{c.name}</div>
                        <div className="cw-co-item-cat">{c.catLabel}</div>
                      </div>
                    </button>
                  ))}
                  {catCompanies.length === 0 && <div className="cw-co-empty">Нет компаний в этой категории</div>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div id="sp-cw-desc" className="editor-field-block">
          <div className="editor-field-label">
            Описание скидки или акции
            <span style={{ color: '#C84848', fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>обязательно</span>
            {title.trim().length > 0 && title.trim().length < 5 && (
              <span style={{ color: 'var(--text-3)', fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>
                · ещё {5 - title.trim().length} символа
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
        <div id="sp-cw-code" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
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
        {showSpotlight && <SpotlightTour steps={CW_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
      </main>
    </Layout>
  )
}
