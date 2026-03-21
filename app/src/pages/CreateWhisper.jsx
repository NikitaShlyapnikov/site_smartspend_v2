import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { companies } from '../data/mock'

const ALL_COMPANIES = Object.entries(companies).flatMap(([catId, cat]) =>
  cat.list.map(c => ({ ...c, catId, catLabel: cat.label }))
)

export default function CreateWhisper() {
  const navigate = useNavigate()

  const [coSearch, setCoSearch] = useState('')
  const [selCo,    setSelCo]    = useState(null)
  const [title,    setTitle]    = useState('')
  const [code,     setCode]     = useState('')
  const [expires,  setExpires]  = useState('')
  const [source,   setSource]   = useState('')

  const filteredCos = coSearch.trim()
    ? ALL_COMPANIES.filter(c => c.name.toLowerCase().includes(coSearch.trim().toLowerCase()))
    : ALL_COMPANIES

  const canSubmit = selCo && title.trim().length >= 5

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
      expires:      expires.trim() || null,
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
                className="cw-input"
                placeholder="31 марта"
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
