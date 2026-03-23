import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'
import { companies, promoItems, whisperItems as whisperItemsMock } from '../data/mock'

const PROMO_SPOTLIGHT = [
  { targetId: 'sp-promo-tabs',  title: 'Разделы промо',   desc: 'Рассылка — письма от компаний. Акции — скидки и купоны. Подслушано — промокоды от сообщества.' },
  { targetId: 'sp-promo-scope', title: 'Мои компании',    desc: 'Фильтруй по компаниям из вашего списка или смотри все доступные предложения.' },
]

const ACTS_FILTERS = [
  { id: 'all',         label: 'Все' },
  { id: 'new_clients', label: 'Новым клиентам' },
  { id: 'referral',    label: 'Приведи друга' },
  { id: 'birthday',    label: 'День рождения' },
  { id: 'holiday',     label: 'Праздник' },
  { id: 'regular',     label: 'Обычная' },
]

const CATEGORIES = [
  { id: 'all',        label: 'Все'                   },
  { id: 'food',       label: 'Еда и Супермаркеты'    },
  { id: 'cafe',       label: 'Кафе, Бары, Рестораны' },
  { id: 'transport',  label: 'Авто и Транспорт'      },
  { id: 'home',       label: 'Дом и Техника'         },
  { id: 'clothes',    label: 'Одежда и Обувь'        },
  { id: 'leisure',    label: 'Развлечения и Хобби'   },
  { id: 'health',     label: 'Красота и Здоровье'    },
  { id: 'education',  label: 'Образование и Дети'    },
  { id: 'travel',     label: 'Путешествия и Отдых'   },
  { id: 'other',      label: 'Прочие расходы'        },
]

const COMPANY_MAP = Object.values(companies).flatMap(c => c.list).reduce((m, c) => { m[c.id] = c; return m }, {})
const ALL_COMPANIES_LIST = Object.entries(companies).flatMap(([catId, cat]) =>
  cat.list.map(c => ({ ...c, catId, catLabel: cat.label }))
)
const PROMO_CATS_WITH_ITEMS = new Set(promoItems.map(p => p.category))

function loadFollowed() {
  try { return new Set(JSON.parse(localStorage.getItem('ss_companies') || '[]')) }
  catch { return new Set() }
}

// ── FILTER SELECT ──────────────────────────────────────────────────────────────

function FilterSelect({ items, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open])

  const selectable = items.filter(i => i.id !== 'all')
  const selected   = selectable.filter(i => value.has(i.id))

  return (
    <div className="fsel-wrap" ref={ref}>
      <div className="fsel-bar">
        {selected.map(item => (
          <button key={item.id} className="fsel-chip" onClick={() => onChange(item.id)}>
            {item.label}
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/>
            </svg>
          </button>
        ))}
        <button className={`fsel-btn${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
          {selected.length === 0 && <span>{placeholder}</span>}
          <svg className="fsel-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
      {open && (
        <div className="fsel-panel">
          {value.size > 0 && (
            <button className="fsel-clear" onClick={() => onChange('__clear__')}>Сбросить выбор</button>
          )}
          {selectable.map(item => (
            <button
              key={item.id}
              className={`fsel-option${value.has(item.id) ? ' active' : ''}`}
              onClick={() => onChange(item.id)}
            >
              {item.label}
              {value.has(item.id) && (
                <svg className="fsel-check" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── BROADCAST CARD ─────────────────────────────────────────────────────────────

function BroadcastCard({ item }) {
  const company = COMPANY_MAP[item.companyId]
  return (
    <div className="broadcast-card">
      <div className="pc-header">
        <div className="promo-logo" style={{ background: company?.color }}>{company?.abbr}</div>
        <div className="promo-company-info">
          <div className="promo-company-name">{company?.name}</div>
          <div className="promo-expires">{item.channel} · {item.time}</div>
        </div>
      </div>
      <div className="broadcast-text">{item.text}</div>
      <div className="fa-bottom">
        <div className="f-spacer" />
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="fa-action-btn" onClick={e => e.stopPropagation()}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Открыть
        </a>
      </div>
    </div>
  )
}

// ── PROMO CARD ─────────────────────────────────────────────────────────────────

function PromoCard({ item }) {
  const company = COMPANY_MAP[item.companyId]
  const [copied, setCopied] = useState(false)

  function copyCode(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(item.code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="promo-card">
      <div className="promo-card-top">
        <div className="pc-header">
          <div className="promo-logo" style={{ background: company?.color }}>{company?.abbr}</div>
          <div className="promo-company-info">
            <div className="promo-company-name">{company?.name}</div>
            <div className="promo-expires">до {item.expires}</div>
          </div>
          <div className={`promo-type-badge promo-type-badge--${item.type}`}>
            {item.type === 'event' ? 'Акция' : 'Купон'}
          </div>
        </div>
        <div className="promo-title">{item.title}</div>
        {item.desc && <div className="promo-desc">{item.desc}</div>}
      </div>
      {item.type === 'coupon' && item.code && (
        <div className="promo-code-row">
          <div className="promo-code">{item.code}</div>
          <button className={`fa-action-btn pc-copy-btn${copied ? ' copied' : ''}`} onClick={copyCode}>
            {copied ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Скопировано
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Скопировать
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ── PROMO SECTION ──────────────────────────────────────────────────────────────

function PromoSection({ navigate, followed, hasSetup, promoCat, promoCompany, promoType, promoScope, actsFilter }) {
  if (!hasSetup || (promoScope === 'mine' && followed.size === 0)) {
    return (
      <div className="promo-empty-state">
        <div className="promo-empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div className="promo-empty-title">Выберите компании</div>
        <div className="promo-empty-desc">Подпишитесь на компании, чьи акции и купоны хотите видеть</div>
        <button className="promo-empty-btn" onClick={() => navigate('/company-picker')}>Подобрать компании</button>
      </div>
    )
  }

  const pool   = promoScope === 'mine' ? promoItems.filter(p => followed.has(p.companyId)) : promoItems
  const byCat  = promoCat.size === 0     ? pool  : pool.filter(p => promoCat.has(p.category))
  const byCo   = promoCompany.size === 0 ? byCat : byCat.filter(p => promoCompany.has(p.companyId))

  if (promoType === 'broadcast') {
    const items = byCo.filter(p => p.type === 'broadcast')
    return (
      <div className="feed-list">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-title">Рассылок нет</div>
            <div className="empty-desc">Компании из выбранных категорий пока не публиковали рассылку</div>
          </div>
        ) : items.map(item => <BroadcastCard key={item.id} item={item} />)}
      </div>
    )
  }

  const events   = byCo.filter(p => p.type !== 'broadcast')
  const filtered = actsFilter === 'all' ? events : events.filter(p => p.promo_filter === actsFilter)
  return (
    <div className="feed-list">
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Пока ничего нет</div>
          <div className="empty-desc">Акций и купонов по выбранным фильтрам не найдено</div>
        </div>
      ) : filtered.map(item => <PromoCard key={item.id} item={item} />)}
    </div>
  )
}

// ── WHISPER HELPERS ────────────────────────────────────────────────────────────

function timeAgo(ts) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m || 1} мин назад`
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `${h} ч назад`
  return `${Math.floor(diff / 86400000)} д назад`
}

function fmtCommentTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return `сегодня в ${time}`
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `вчера в ${time}`
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ` в ${time}`
}

// ── WHISPER CARD ───────────────────────────────────────────────────────────────

function WhisperCard({ item, myVote, onVote, navigate }) {
  const company = COMPANY_MAP[item.companyId]
  const [copied,       setCopied]       = useState(false)
  const [voteToast,    setVoteToast]    = useState(null)
  const [showComments, setShowComments] = useState(false)
  const [comments,     setComments]     = useState(item.comments || [])
  const [commentText,  setCommentText]  = useState('')
  const [worksAnim,    setWorksAnim]    = useState(false)
  const [notAnim,      setNotAnim]      = useState(false)
  const toastTimer = useRef(null)

  const displayHistory = myVote ? [...item.history, myVote === 'works' ? 'w' : 'n'] : item.history
  const works    = displayHistory.filter(v => v === 'w').length
  const notWorks = displayHistory.filter(v => v === 'n').length
  const cardMood = myVote === 'works' ? 'works' : myVote === 'not' ? 'not' : null

  function handleVote(vote) {
    const isToggleOff = myVote === vote
    onVote(item.id, vote)
    if (!isToggleOff) {
      if (vote === 'works') { setWorksAnim(true); setTimeout(() => setWorksAnim(false), 480) }
      else                  { setNotAnim(true);   setTimeout(() => setNotAnim(false), 420) }
      setVoteToast(vote)
      clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setVoteToast(null), 2000)
    }
  }

  function copyCode(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(item.code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`whisper-card${cardMood ? ` whisper-card--${cardMood}` : ''}`}>
      <div className="pc-header">
        <div className="promo-logo" style={{ background: company?.color }}>{company?.abbr}</div>
        <div className="whisper-company-info">
          <div className="whisper-company-name">{company?.name}</div>
          <div className="whisper-meta">
            {item.addedBy && (
              <button className="whisper-author" onClick={e => { e.stopPropagation(); navigate(`/author/${item.addedBy}`, { state: { name: item.addedBy, handle: `@${item.addedBy}` } }) }}>
                @{item.addedBy}
              </button>
            )}
            <span>{timeAgo(item.addedAt)}{item.expires ? ` · до ${item.expires}` : ''}</span>
          </div>
        </div>
      </div>

      <div className="whisper-title">{item.title}</div>
      {item.desc && <div className="whisper-desc">{item.desc.slice(0, 140)}</div>}

      {item.code && (
        <div className="whisper-code-row">
          <div className="whisper-code">{item.code}</div>
          <button className={`fa-action-btn pc-copy-btn${copied ? ' copied' : ''}`} onClick={copyCode}>
            {copied ? (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Скопировано</>
            ) : (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Скопировать</>
            )}
          </button>
        </div>
      )}

      {displayHistory.length > 0 && (
        <div className="whisper-history">
          {displayHistory.slice(-40).map((v, i) => {
            const isMine = i === displayHistory.length - 1 && !!myVote
            return (
              <div
                key={isMine ? `mine-${myVote}` : i}
                className={`wvh-stripe${isMine ? ' wvh-mine' : ''}`}
                style={{ background: v === 'w' ? '#8EBA9E' : '#C89090' }}
              />
            )
          })}
        </div>
      )}

      {displayHistory.length === 0 && !myVote && (
        <div className="whisper-first-check">Будь первым, кто проверит</div>
      )}

      <div className="fa-bottom whisper-actions">
        <button className={`fa-action-btn wvb-works${myVote === 'works' ? ' active' : ''}${worksAnim ? ' wv-works-pop' : ''}`} onClick={() => handleVote('works')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill={myVote === 'works' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          Работает{works > 0 ? ` · ${works}` : ''}
        </button>
        <button className={`fa-action-btn wvb-not${myVote === 'not' ? ' active' : ''}${notAnim ? ' wv-not-shake' : ''}`} onClick={() => handleVote('not')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill={myVote === 'not' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
            <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
          </svg>
          Не работает{notWorks > 0 ? ` · ${notWorks}` : ''}
        </button>
        {voteToast && (
          <span className={`whisper-vote-toast${voteToast === 'works' ? ' wvt-works' : ' wvt-not'}`}>
            {voteToast === 'works' ? 'Голос учтён' : 'Спасибо за проверку'}
          </span>
        )}
        <div className="f-spacer" />
        <button className={`fa-action-btn${showComments ? ' wv-comments-open' : ''}`} onClick={() => setShowComments(v => !v)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {comments.length > 0 ? comments.length : 'Комментарии'}
        </button>
      </div>

      {showComments && (
        <div className="whisper-comments">
          {comments.map((c, i) => (
            <div key={i} className="whisper-comment">
              <div className="whisper-comment-top">
                <span className="whisper-comment-author">@{c.author}</span>
                <span className="whisper-comment-time">{c.ts ? fmtCommentTime(c.ts) : c.time}</span>
              </div>
              <span className="whisper-comment-text">{c.text}</span>
            </div>
          ))}
          <div className="whisper-comment-form">
            <input className="whisper-comment-input" placeholder="Добавить комментарий..." value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && commentText.trim()) {
                  setComments(prev => [...prev, { author: 'вы', text: commentText.trim(), ts: Date.now() }])
                  setCommentText('')
                }
              }}
            />
            <button className="whisper-comment-submit" disabled={!commentText.trim()} onClick={() => {
              if (!commentText.trim()) return
              setComments(prev => [...prev, { author: 'вы', text: commentText.trim(), ts: Date.now() }])
              setCommentText('')
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ADD WHISPER MODAL ──────────────────────────────────────────────────────────

function AddWhisperModal({ onClose, onAdd }) {
  const [coSearch, setCoSearch] = useState('')
  const [selCo,    setSelCo]    = useState(null)
  const [title,    setTitle]    = useState('')
  const [code,     setCode]     = useState('')
  const [expires,  setExpires]  = useState('')

  const filteredCos = coSearch.trim()
    ? ALL_COMPANIES_LIST.filter(c => c.name.toLowerCase().includes(coSearch.trim().toLowerCase()))
    : ALL_COMPANIES_LIST

  const canSubmit = selCo && title.trim().length >= 5

  function submit() {
    if (!canSubmit) return
    onAdd({
      id: 'wh-u-' + Date.now(),
      companyId: selCo.id,
      category:  selCo.catId,
      title:     title.trim(),
      code:      code.trim() || null,
      expires:   expires.trim() || null,
      addedBy:   localStorage.getItem('ss_username') || 'вы',
      addedAt:   Date.now(),
      history:   [],
      comments:  [],
    })
  }

  return (
    <div className="wm-overlay" onClick={onClose}>
      <div className="wm-panel" onClick={e => e.stopPropagation()}>
        <div className="wm-header">
          <div className="wm-title">Поделиться скидкой</div>
          <button className="wm-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="wm-body">
          <div className="wm-field">
            <label className="wm-label">Компания <span className="wm-req">*</span></label>
            {selCo ? (
              <div className="wm-selected-co">
                <div className="promo-logo" style={{ background: selCo.color }}>{selCo.abbr}</div>
                <span>{selCo.name}</span>
                <button className="wm-change" onClick={() => { setSelCo(null); setCoSearch('') }}>изменить</button>
              </div>
            ) : (
              <>
                <input className="wm-input" placeholder="Поиск..." value={coSearch} onChange={e => setCoSearch(e.target.value)} autoFocus />
                <div className="wm-co-list">
                  {filteredCos.slice(0, 12).map(c => (
                    <button key={c.id} className="wm-co-item" onClick={() => setSelCo(c)}>
                      <div className="promo-logo" style={{ background: c.color, width: 22, height: 22, fontSize: 9 }}>{c.abbr}</div>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="wm-field">
            <label className="wm-label">Описание <span className="wm-req">*</span></label>
            <textarea className="wm-input" placeholder="Скидка 20% при оплате через СБП..." value={title}
              onChange={e => setTitle(e.target.value)} rows={2} />
          </div>

          <div className="wm-field">
            <label className="wm-label">Промокод <span className="wm-optional">необязательно</span></label>
            <input className="wm-input wm-mono" placeholder="SAVE20" value={code}
              onChange={e => setCode(e.target.value.toUpperCase())} />
          </div>

          <div className="wm-field">
            <label className="wm-label">Действует до <span className="wm-optional">необязательно</span></label>
            <input className="wm-input" placeholder="31 марта" value={expires}
              onChange={e => setExpires(e.target.value)} />
          </div>
        </div>

        <div className="wm-footer">
          <button className="wm-submit" disabled={!canSubmit} onClick={submit}>Поделиться</button>
        </div>
      </div>
    </div>
  )
}

// ── WHISPER SECTION ────────────────────────────────────────────────────────────

function WhisperSection({ items, promoCat, promoCompany, promoScope, followed, votes, onVote, onAdd, navigate }) {
  const [showModal, setShowModal] = useState(false)

  let filtered = items.filter(item => {
    if (promoScope === 'mine' && !followed.has(item.companyId)) return false
    if (promoCat.size > 0 && !promoCat.has(item.category)) return false
    if (promoCompany.size > 0 && !promoCompany.has(item.companyId)) return false
    return true
  })
  filtered = [...filtered].sort((a, b) => b.addedAt - a.addedAt)

  return (
    <>
      <button className="whisper-add-cta" onClick={() => setShowModal(true)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Поделиться скидкой или промокодом
      </button>
      <div className="feed-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
              </svg>
            </div>
            <div className="empty-title">Пока ничего нет</div>
            <div className="empty-desc">Будьте первым — поделитесь скидкой или промокодом</div>
          </div>
        ) : filtered.map(item => (
          <WhisperCard key={item.id} item={item} myVote={votes.get(item.id) || null} onVote={onVote} navigate={navigate} />
        ))}
      </div>
      {showModal && (
        <AddWhisperModal onClose={() => setShowModal(false)} onAdd={item => { onAdd(item); setShowModal(false) }} />
      )}
    </>
  )
}

// ── PAGE ───────────────────────────────────────────────────────────────────────

export default function Promo() {
  const navigate = useNavigate()
  const [showSpotlight, setShowSpotlight] = useState(false)

  const [followed]      = useState(loadFollowed)
  const hasPromoSetup   = !!localStorage.getItem('ss_promo_setup')

  const [promoType,    setPromoType]    = useState('broadcast')
  const [promoScope,   setPromoScope]   = useState('mine')
  const [promoCat,     setPromoCat]     = useState(new Set())
  const [promoCompany, setPromoCompany] = useState(new Set())
  const [actsFilter,   setActsFilter]   = useState('all')
  const [localWhispers, setLocalWhispers] = useState(whisperItemsMock)
  const [whisperVotes,  setWhisperVotes]  = useState(new Map())

  const [filtersScrolled, setFiltersScrolled] = useState(false)
  const scrollRef = useCallback(el => {
    if (!el) return
    setFiltersScrolled(false)
    el.addEventListener('scroll', () => setFiltersScrolled(el.scrollTop > 8), { passive: true })
  }, [])

  function handlePromoCat(id) {
    if (id === '__clear__') { setPromoCat(new Set()); setPromoCompany(new Set()); return }
    const isRemoving = promoCat.has(id)
    setPromoCat(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
    if (isRemoving) {
      const catCoIds = new Set((companies[id]?.list || []).map(c => c.id))
      setPromoCompany(prev => { const n = new Set(prev); catCoIds.forEach(cid => n.delete(cid)); return n })
    }
  }

  function handlePromoCompany(id) {
    if (id === '__clear__') { setPromoCompany(new Set()); return }
    setPromoCompany(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function voteWhisper(id, vote) {
    setWhisperVotes(prev => {
      const n = new Map(prev)
      n.get(id) === vote ? n.delete(id) : n.set(id, vote)
      return n
    })
  }

  function addWhisper(item) {
    const co = COMPANY_MAP[item.companyId]
    const enriched = { ...item, companyName: co?.name, companyAbbr: co?.abbr, companyColor: co?.color }
    setLocalWhispers(prev => [enriched, ...prev])
    try {
      const saved = JSON.parse(localStorage.getItem('ss_account_whispers') || '[]')
      localStorage.setItem('ss_account_whispers', JSON.stringify([enriched, ...saved]))
    } catch {}
  }

  const promoPool  = hasPromoSetup && (promoScope !== 'mine' || followed.size > 0)
    ? (promoScope === 'mine' ? promoItems.filter(p => followed.has(p.companyId)) : promoItems) : []
  const promoByCat = promoCat.size === 0 ? promoPool : promoPool.filter(p => promoCat.has(p.category))
  const promoByCo  = promoCompany.size === 0 ? promoByCat : promoByCat.filter(p => promoCompany.has(p.companyId))
  const whisperFiltered = localWhispers.filter(item =>
    (promoCat.size === 0 || promoCat.has(item.category)) &&
    (promoCompany.size === 0 || promoCompany.has(item.companyId)) &&
    (promoScope !== 'mine' || followed.has(item.companyId))
  )
  const promoCount = promoType === 'whisper'
    ? whisperFiltered.length
    : promoType === 'broadcast'
      ? promoByCo.filter(p => p.type === 'broadcast').length
      : (actsFilter === 'all' ? promoByCo.filter(p => p.type !== 'broadcast').length
        : promoByCo.filter(p => p.type !== 'broadcast' && p.promo_filter === actsFilter).length)

  const hasFilters = promoCat.size > 0 || promoCompany.size > 0 ||
    promoType !== 'broadcast' || promoScope !== 'mine' || actsFilter !== 'all'

  function resetFilters() {
    setPromoCat(new Set()); setPromoCompany(new Set())
    setPromoType('broadcast'); setPromoScope('mine'); setActsFilter('all')
  }

  return (
    <Layout>
      <main className="feed-main">
        <div className="page-header">
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Промо
            <HelpButton seenKey="ss_spl_promo" onOpen={() => setShowSpotlight(true)} />
          </div>
        </div>

        <div className={`filters-sticky${filtersScrolled ? ' scrolled' : ''}`}>
          <div className="filters-block">
            {/* Section tabs */}
            <div id="sp-promo-tabs" className="promo-type-tabs">
              <button className={`promo-type-tab${promoType === 'broadcast' ? ' active' : ''}`} onClick={() => setPromoType('broadcast')}>Рассылка</button>
              <button className={`promo-type-tab${promoType === 'events' ? ' active' : ''}`} onClick={() => setPromoType('events')}>Акции</button>
              <button className={`promo-type-tab${promoType === 'whisper' ? ' active' : ''}`} onClick={() => setPromoType('whisper')}>Подслушано</button>
            </div>

            {/* Scope */}
            <div id="sp-promo-scope" className="promo-scope-row">
              <div className="tab-group">
                <button className={`tab-btn${promoScope === 'mine' ? ' active' : ''}`} onClick={() => setPromoScope('mine')}>Мои компании</button>
                <button className={`tab-btn${promoScope === 'all' ? ' active' : ''}`} onClick={() => setPromoScope('all')}>Все компании</button>
              </div>
              <button className="promo-settings-btn" onClick={() => navigate('/company-picker', { state: { edit: true } })}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Изменить
              </button>
            </div>

            {/* Categories */}
            <FilterSelect
              items={CATEGORIES.filter(c => c.id === 'all' || PROMO_CATS_WITH_ITEMS.has(c.id))}
              value={promoCat}
              onChange={handlePromoCat}
              placeholder="Категории"
            />

            {/* Companies */}
            {promoCat.size > 0 && (() => {
              const coItems = [...promoCat].flatMap(catId => companies[catId]?.list || [])
                .map(c => ({ id: c.id, label: c.name, color: c.color }))
              return coItems.length > 0 ? (
                <FilterSelect items={coItems} value={promoCompany} onChange={handlePromoCompany} placeholder="Компании" />
              ) : null
            })()}

            {/* Acts sub-filter */}
            {promoType === 'events' && (
              <div className="cats-scroll filters-acts-row">
                {ACTS_FILTERS.map(f => (
                  <button key={f.id} className={`cat-pill${actsFilter === f.id ? ' active' : ''}`}
                    onClick={() => setActsFilter(f.id)}>{f.label}</button>
                ))}
              </div>
            )}

            {hasFilters && (
              <div className="filter-summary">
                <span>{promoCount} {noun(promoCount)}</span>
                <button className="reset-btn" onClick={resetFilters}>Сбросить</button>
              </div>
            )}
          </div>
        </div>

        <div className="feed-scroll" ref={scrollRef}>
          {promoType === 'whisper' ? (
            <WhisperSection
              items={localWhispers}
              promoCat={promoCat}
              promoCompany={promoCompany}
              promoScope={promoScope}
              followed={followed}
              votes={whisperVotes}
              onVote={voteWhisper}
              onAdd={addWhisper}
              navigate={navigate}
            />
          ) : (
            <PromoSection
              navigate={navigate}
              followed={followed}
              hasSetup={hasPromoSetup}
              promoCat={promoCat}
              promoCompany={promoCompany}
              promoType={promoType}
              promoScope={promoScope}
              actsFilter={actsFilter}
            />
          )}
        </div>
      </main>
      {showSpotlight && <SpotlightTour steps={PROMO_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
    </Layout>
  )
}

function noun(n) {
  const m = n % 10, c = n % 100
  if (m === 1 && c !== 11) return 'предложение'
  if (m >= 2 && m <= 4 && (c < 10 || c >= 20)) return 'предложения'
  return 'предложений'
}
