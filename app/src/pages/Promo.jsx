import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'
import { companies, promoItems, whisperItems as whisperItemsMock } from '../data/mock'

const WHISPER_EMOJIS = [
  '🔥','💡','😍','🤯','💸','🤮','🤔','👏',
  '😮','💪','🎯','🙏','❤️','😂','🥰','😅',
  '💯','✨','🎉','👀','🥲','😤','🫡','🤝',
]

function WhisperEmojiPicker({ onPick, onClose }) {
  const [popping, setPopping] = useState(null)
  const ref = useRef(null)
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])
  function handlePick(emoji) {
    setPopping(emoji)
    setTimeout(() => { onPick(emoji); onClose() }, 260)
  }
  return (
    <div className="emoji-picker" ref={ref}>
      {WHISPER_EMOJIS.map(emoji => (
        <button key={emoji} className={`ep-btn${popping === emoji ? ' ep-pop' : ''}`} onClick={() => handlePick(emoji)}>{emoji}</button>
      ))}
    </div>
  )
}

function WhisperReactionPill({ emoji, count, active, onToggle, autoAnimate }) {
  const [popping, setPopping] = useState(false)
  const [particles, setParticles] = useState([])

  function triggerAnim(isNew) {
    setPopping(true)
    setTimeout(() => setPopping(false), 400)
    if (isNew) {
      const newP = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() + i, angle: i * 72 + Math.random() * 20 - 10, dist: 18 + Math.random() * 8,
      }))
      setParticles(newP)
      setTimeout(() => setParticles([]), 600)
    }
  }

  useEffect(() => {
    if (autoAnimate) triggerAnim(true)
  }, [autoAnimate])

  function handleClick() {
    triggerAnim(!active)
    onToggle(emoji)
  }

  return (
    <div className="r-pill-wrap">
      <button className={`fa-reaction${active ? ' active' : ''}${popping ? ' popping' : ''}`} onClick={handleClick}>
        <span className="r-emoji">{emoji}</span>
        <span className="r-count">{count}</span>
      </button>
      {particles.map(p => (
        <span key={p.id} className="r-particle" style={{ '--angle': `${p.angle}deg`, '--dist': `${p.dist}px` }}>{emoji}</span>
      ))}
    </div>
  )
}

const PROMO_SPOTLIGHT = [
  { targetId: 'sp-promo-types', title: 'Фильтр по типу',  desc: 'Рассылка — официальные письма компаний. Акции и Купоны — скидки с промокодами. Сообщество — промокоды от пользователей.' },
  { targetId: 'sp-promo-scope', title: 'Мои компании',    desc: 'Фильтруй по компаниям из вашего списка или смотри все доступные предложения.' },
]

const TYPE_CHIPS = [
  { id: 'all',       label: 'Все' },
  { id: 'broadcast', label: 'Рассылка' },
  { id: 'official',  label: 'Официальные' },
  { id: 'whisper',   label: 'Сообщество' },
]

function getSortKey(item) {
  if (item.addedAt) return item.addedAt
  if (item.ts) {
    const s = String(item.ts)
    return new Date(parseInt(s.slice(0,4)), parseInt(s.slice(4,6))-1, parseInt(s.slice(6,8))).getTime()
  }
  return 0
}

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
const PROMO_CATS_WITH_ITEMS = new Set([...promoItems.map(p => p.category), ...whisperItemsMock.map(w => w.category)])

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

// ── PROMO INTERACTIONS (shared: vote bar + comments) ───────────────────────────

function PromoInteractions({ initHistory = [], initComments = [], extraAction }) {
  const [myVote,       setMyVote]       = useState(null)
  const [worksAnim,    setWorksAnim]    = useState(false)
  const [notAnim,      setNotAnim]      = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments,     setComments]     = useState(initComments)
  const [commentText,  setCommentText]  = useState('')
  const [reactions,    setReactions]    = useState([])
  const [myReactions,  setMyReactions]  = useState(new Set())
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [justAdded,    setJustAdded]    = useState(null)
  const [commentSort,  setCommentSort]  = useState('new')
  const [visibleCount, setVisibleCount] = useState(10)

  const displayHistory = myVote ? [...initHistory, myVote === 'works' ? 'w' : 'n'] : initHistory
  const works    = displayHistory.filter(v => v === 'w').length
  const notWorks = displayHistory.filter(v => v === 'n').length

  function handleVote(vote) {
    if (myVote === vote) { setMyVote(null); return }
    if (vote === 'works') { setWorksAnim(true); setTimeout(() => setWorksAnim(false), 480) }
    else                  { setNotAnim(true);   setTimeout(() => setNotAnim(false), 420) }
    setMyVote(vote)
  }

  function toggleReaction(emoji) {
    setMyReactions(prev => {
      const next = new Set(prev)
      const hadIt = next.has(emoji)
      hadIt ? next.delete(emoji) : next.add(emoji)
      setReactions(rs => {
        const existing = rs.find(r => r.emoji === emoji)
        if (existing) return rs.map(r => r.emoji === emoji ? { ...r, count: r.count + (hadIt ? -1 : 1) } : r).filter(r => r.count > 0)
        return [...rs, { emoji, count: 1 }]
      })
      return next
    })
  }

  return (
    <>
      {displayHistory.length > 0 && (
        <div className="whisper-history">
          {displayHistory.slice(-40).map((v, i, arr) => {
            const isMine = i === arr.length - 1 && !!myVote
            return (
              <div
                key={isMine ? `mine-${myVote}` : i}
                className={`wvh-stripe${isMine ? ' wvh-mine' : ''}`}
                style={{ background: v === 'w' ? '#5E9478' : '#B85555' }}
              />
            )
          })}
        </div>
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
        <div className="f-spacer" />
        {extraAction}
        <button className={`fa-action-btn${showComments ? ' wv-comments-open' : ''}`} onClick={() => setShowComments(v => !v)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {comments.length > 0 ? comments.length : 'Комментарии'}
        </button>
      </div>

      {showComments && (
        <div className="whisper-comments">
          <div className="whisper-reactions-row">
            <span className="art-reactions-label">Что думаете?</span>
            {reactions.map(r => (
              <WhisperReactionPill key={r.emoji} emoji={r.emoji} count={r.count} active={myReactions.has(r.emoji)} onToggle={toggleReaction} autoAnimate={justAdded === r.emoji} />
            ))}
            <div style={{ position: 'relative' }}>
              <button className="ar-add-btn" onClick={() => setShowEmojiPicker(v => !v)}>+</button>
              {showEmojiPicker && (
                <WhisperEmojiPicker
                  onPick={emoji => { toggleReaction(emoji); setJustAdded(emoji); setTimeout(() => setJustAdded(null), 700); setShowEmojiPicker(false) }}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </div>
          </div>

          {comments.length > 0 && (
            <div className="comments-subheader" style={{ marginBottom: 6 }}>
              <div className="csort">
                <button className={`c-sort-btn${commentSort === 'new' ? ' active' : ''}`} onClick={() => { setCommentSort('new'); setVisibleCount(10) }}>Новые</button>
                <button className={`c-sort-btn${commentSort === 'top' ? ' active' : ''}`} onClick={() => { setCommentSort('top'); setVisibleCount(10) }}>Популярные</button>
              </div>
            </div>
          )}

          {(() => {
            const sorted = commentSort === 'top'
              ? [...comments].sort((a, b) => (b.likes || 0) - (a.likes || 0))
              : [...comments].reverse()
            const visible = sorted.slice(0, visibleCount)
            const remaining = sorted.length - visibleCount
            return (
              <>
                {visible.map((c, i) => (
                  <div key={i} className="whisper-comment">
                    <div className="whisper-comment-top">
                      <span className="whisper-comment-author">@{c.author || c.ini}</span>
                      <span className="whisper-comment-time">{c.ts ? fmtCommentTime(c.ts) : c.date}</span>
                    </div>
                    <span className="whisper-comment-text">{c.text}</span>
                  </div>
                ))}
                {remaining > 0 && (
                  <div className="show-more-row">
                    <button className="btn-show" onClick={() => setVisibleCount(v => v + 20)}>
                      Показать ещё {Math.min(remaining, 20)}
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )
          })()}

          <div className="whisper-comment-form">
            <input className="whisper-comment-input" placeholder="Добавить комментарий..." value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && commentText.trim()) {
                  setComments(prev => [...prev, { author: 'вы', text: commentText.trim(), ts: Date.now(), likes: 0 }])
                  setCommentText('')
                }
              }}
            />
            <button className="whisper-comment-submit" disabled={!commentText.trim()} onClick={() => {
              if (!commentText.trim()) return
              setComments(prev => [...prev, { author: 'вы', text: commentText.trim(), ts: Date.now(), likes: 0 }])
              setCommentText('')
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ── BROADCAST CARD ─────────────────────────────────────────────────────────────

function BroadcastCard({ item, onCategoryClick, onCompanyClick }) {
  const company  = COMPANY_MAP[item.companyId]
  const catLabel = CATEGORIES.find(c => c.id === item.category)?.label
  return (
    <div className="broadcast-card">
      <div className="pc-header">
        <button className="promo-co-btn" onClick={() => onCompanyClick(item.companyId, item.category)}>
          <div className="promo-logo" style={{ background: company?.color }}>{company?.abbr}</div>
          <div className="promo-company-info">
            <div className="promo-company-name">{company?.name}</div>
            <div className="promo-expires">{item.channel} · {item.time}</div>
          </div>
        </button>
        {catLabel && catLabel !== 'Все' && (
          <button className="fa-category" onClick={e => { e.stopPropagation(); onCategoryClick(item.category) }}>{catLabel}</button>
        )}
        <div className="promo-type-badge promo-type-badge--broadcast">Рассылка</div>
      </div>
      <div className="broadcast-text">{item.text}</div>
      <PromoInteractions extraAction={
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="fa-action-btn" onClick={e => e.stopPropagation()}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Открыть
        </a>
      } />
    </div>
  )
}

// ── PROMO CARD ─────────────────────────────────────────────────────────────────

function PromoCard({ item, onCategoryClick, onCompanyClick }) {
  const company  = COMPANY_MAP[item.companyId]
  const catLabel = CATEGORIES.find(c => c.id === item.category)?.label
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
          <button className="promo-co-btn" onClick={() => onCompanyClick(item.companyId, item.category)}>
            <div className="promo-logo" style={{ background: company?.color }}>{company?.abbr}</div>
            <div className="promo-company-info">
              <div className="promo-company-name">{company?.name}</div>
              <div className="promo-expires">до {item.expires}</div>
            </div>
          </button>
          {catLabel && catLabel !== 'Все' && (
            <button className="fa-category" onClick={e => { e.stopPropagation(); onCategoryClick(item.category) }}>{catLabel}</button>
          )}
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
      <PromoInteractions />
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

function WhisperCard({ item, myVote, onVote, navigate, onCategoryClick, onCompanyClick }) {
  const company  = COMPANY_MAP[item.companyId]
  const catLabel = CATEGORIES.find(c => c.id === item.category)?.label
  const [copied,       setCopied]       = useState(false)
  const [voteToast,    setVoteToast]    = useState(null)
  const [showComments, setShowComments] = useState(false)
  const [comments,     setComments]     = useState(item.comments || [])
  const [commentText,  setCommentText]  = useState('')
  const [worksAnim,    setWorksAnim]    = useState(false)
  const [notAnim,      setNotAnim]      = useState(false)
  const [reactions,    setReactions]    = useState(item.reactions || [])
  const [myReactions,  setMyReactions]  = useState(new Set())
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [justAdded,    setJustAdded]    = useState(null)
  const [commentSort,  setCommentSort]  = useState('new')
  const [visibleCount, setVisibleCount] = useState(10)
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

  function toggleReaction(emoji) {
    setMyReactions(prev => {
      const next = new Set(prev)
      const hadIt = next.has(emoji)
      hadIt ? next.delete(emoji) : next.add(emoji)
      setReactions(rs => {
        const existing = rs.find(r => r.emoji === emoji)
        if (existing) return rs.map(r => r.emoji === emoji ? { ...r, count: r.count + (hadIt ? -1 : 1) } : r).filter(r => r.count > 0)
        return [...rs, { emoji, count: 1 }]
      })
      return next
    })
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
        <button className="promo-co-btn" onClick={() => onCompanyClick(item.companyId, item.category)}>
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
        </button>
        {catLabel && catLabel !== 'Все' && (
          <button className="fa-category" onClick={e => { e.stopPropagation(); onCategoryClick(item.category) }}>{catLabel}</button>
        )}
        <div className="promo-type-badge promo-type-badge--whisper">Сообщество</div>
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
          {displayHistory.slice(-40).map((v, i, arr) => {
            const isMine = i === arr.length - 1 && !!myVote
            return (
              <div
                key={isMine ? `mine-${myVote}` : i}
                className={`wvh-stripe${isMine ? ' wvh-mine' : ''}`}
                style={{ background: v === 'w' ? '#5E9478' : '#B85555' }}
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
          {/* Emoji reactions */}
          <div className="whisper-reactions-row">
            <span className="art-reactions-label">Что думаете?</span>
            {reactions.map(r => (
              <WhisperReactionPill key={r.emoji} emoji={r.emoji} count={r.count} active={myReactions.has(r.emoji)} onToggle={toggleReaction} autoAnimate={justAdded === r.emoji} />
            ))}
            <div style={{ position: 'relative' }}>
              <button className="ar-add-btn" onClick={() => setShowEmojiPicker(v => !v)}>+</button>
              {showEmojiPicker && (
                <WhisperEmojiPicker
                  onPick={emoji => { toggleReaction(emoji); setJustAdded(emoji); setTimeout(() => setJustAdded(null), 700); setShowEmojiPicker(false) }}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </div>
          </div>

          {comments.length > 0 && (
            <div className="comments-subheader" style={{ marginBottom: 6 }}>
              <div className="csort">
                <button className={`c-sort-btn${commentSort === 'new' ? ' active' : ''}`} onClick={() => { setCommentSort('new'); setVisibleCount(10) }}>Новые</button>
                <button className={`c-sort-btn${commentSort === 'top' ? ' active' : ''}`} onClick={() => { setCommentSort('top'); setVisibleCount(10) }}>Популярные</button>
              </div>
            </div>
          )}

          {(() => {
            const sorted = commentSort === 'top'
              ? [...comments].sort((a, b) => (b.likes || 0) - (a.likes || 0))
              : [...comments].reverse()
            const visible = sorted.slice(0, visibleCount)
            const remaining = sorted.length - visibleCount
            return (
              <>
                {visible.map((c, i) => (
                  <div key={i} className="whisper-comment">
                    <div className="whisper-comment-top">
                      <span className="whisper-comment-author">@{c.author}</span>
                      <span className="whisper-comment-time">{c.ts ? fmtCommentTime(c.ts) : c.time}</span>
                    </div>
                    <span className="whisper-comment-text">{c.text}</span>
                  </div>
                ))}
                {remaining > 0 && (
                  <div className="show-more-row">
                    <button className="btn-show" onClick={() => setVisibleCount(v => v + 20)}>
                      Показать ещё {Math.min(remaining, 20)}
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )
          })()}

          <div className="whisper-comment-form">
            <input className="whisper-comment-input" placeholder="Добавить комментарий..." value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && commentText.trim()) {
                  setComments(prev => [...prev, { author: 'вы', text: commentText.trim(), ts: Date.now(), likes: 0 }])
                  setCommentText('')
                }
              }}
            />
            <button className="whisper-comment-submit" disabled={!commentText.trim()} onClick={() => {
              if (!commentText.trim()) return
              setComments(prev => [...prev, { author: 'вы', text: commentText.trim(), ts: Date.now(), likes: 0 }])
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

// ── PAGE ───────────────────────────────────────────────────────────────────────

export default function Promo() {
  const navigate = useNavigate()
  const [showSpotlight, setShowSpotlight] = useState(false)

  const [followed]    = useState(loadFollowed)
  const hasPromoSetup = !!localStorage.getItem('ss_promo_setup')

  const [typeFilter,   setTypeFilter]   = useState('all')
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

  function handleCompanyClick(companyId, categoryId) {
    setPromoCat(new Set([categoryId]))
    setPromoCompany(new Set([companyId]))
  }

  function voteWhisper(id, vote) {
    setWhisperVotes(prev => {
      const n = new Map(prev)
      n.get(id) === vote ? n.delete(id) : n.set(id, vote)
      return n
    })
  }

  // Unified pool: all items sorted by date descending
  const unifiedPool = [
    ...promoItems.map(p => ({ ...p, kind: p.type })),
    ...localWhispers.map(w => ({ ...w, kind: 'whisper' })),
  ].sort((a, b) => getSortKey(b) - getSortKey(a))

  const filtered = unifiedPool.filter(item => {
    if (item.kind !== 'whisper') {
      if (!hasPromoSetup) return false
      if (promoScope === 'mine' && !followed.has(item.companyId)) return false
    }
    if (promoCat.size > 0 && !promoCat.has(item.category)) return false
    if (promoCompany.size > 0 && !promoCompany.has(item.companyId)) return false
    if (typeFilter === 'official') {
      if (item.kind !== 'event' && item.kind !== 'coupon') return false
    } else if (typeFilter !== 'all') {
      if (item.kind !== typeFilter) return false
    }
    // actsFilter applies to all non-broadcast items
    if (item.kind !== 'broadcast' && actsFilter !== 'all') {
      if ((item.promo_filter || 'regular') !== actsFilter) return false
    }
    return true
  })

  const hasFilters = promoCat.size > 0 || promoCompany.size > 0 ||
    typeFilter !== 'all' || promoScope !== 'mine' || actsFilter !== 'all'

  function resetFilters() {
    setPromoCat(new Set()); setPromoCompany(new Set())
    setPromoScope('mine'); setActsFilter('all')
  }

  // Broadcasts are always "regular", hide sub-filter for broadcast-only view
  const showActsFilter = typeFilter !== 'broadcast'

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
            {/* Type chips */}
            <div id="sp-promo-types" className="cats-scroll promo-type-chips">
              {TYPE_CHIPS.map(chip => (
                <button
                  key={chip.id}
                  className={`cat-pill${typeFilter === chip.id ? ' active' : ''}`}
                  onClick={() => setTypeFilter(chip.id)}
                >{chip.label}</button>
              ))}
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

            {/* Acts sub-filter — only for event/coupon type or "all" */}
            {showActsFilter && (
              <div className="cats-scroll filters-acts-row">
                {ACTS_FILTERS.map(f => (
                  <button key={f.id} className={`cat-pill${actsFilter === f.id ? ' active' : ''}`}
                    onClick={() => setActsFilter(f.id)}>{f.label}</button>
                ))}
              </div>
            )}

            {hasFilters && (
              <div className="filter-summary">
                <span>{filtered.length} {noun(filtered.length)}</span>
                <button className="reset-btn" onClick={resetFilters}>Сбросить</button>
              </div>
            )}
          </div>
        </div>

        <div className="feed-scroll" ref={scrollRef}>
          <button className="whisper-add-cta" onClick={() => navigate('/create-whisper')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Поделиться скидкой или промокодом
          </button>

          {!hasPromoSetup && (typeFilter === 'all' || typeFilter === 'broadcast' || typeFilter === 'event' || typeFilter === 'coupon') && (
            <div className="promo-setup-hint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>Рассылки и акции компаний появятся после <button className="promo-setup-link" onClick={() => navigate('/company-picker')}>выбора компаний</button></span>
            </div>
          )}

          <div className="feed-list">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-title">Ничего не найдено</div>
                <div className="empty-desc">Попробуйте изменить фильтры или переключиться на «Все компании»</div>
              </div>
            ) : filtered.map(item => {
              if (item.kind === 'broadcast') return <BroadcastCard key={item.id} item={item} onCategoryClick={handlePromoCat} onCompanyClick={handleCompanyClick} />
              if (item.kind === 'whisper')   return <WhisperCard key={item.id} item={item} myVote={whisperVotes.get(item.id) || null} onVote={voteWhisper} navigate={navigate} onCategoryClick={handlePromoCat} onCompanyClick={handleCompanyClick} />
              return <PromoCard key={item.id} item={item} onCategoryClick={handlePromoCat} onCompanyClick={handleCompanyClick} />
            })}
          </div>
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
