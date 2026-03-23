import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
  {
    targetId: 'sp-promo-types',
    title: 'Типы предложений',
    desc: 'Три типа: Рассылки — письма компаний с персональными акциями; Официальные — скидки и купоны напрямую от брендов; Сообщество — промокоды и лайфхаки от других пользователей.',
  },
  {
    targetId: 'sp-promo-acts',
    title: 'Условия получения',
    desc: 'У каждого предложения может быть условие. Фильтруйте: «Новым клиентам» — только при первой покупке, «Приведи друга» — реферальные бонусы, «День рождения» — именинные скидки.',
  },
  {
    targetId: 'sp-promo-scope',
    title: 'Ваши компании',
    desc: 'Показывать только предложения от компаний из вашего списка или сразу от всех. Нажмите «Изменить компании» чтобы добавить или убрать бренды — это влияет на раздел Рассылки и Официальные.',
  },
  {
    targetId: 'sp-promo-cats',
    title: 'Категории расходов',
    desc: 'Отфильтруйте предложения по категории: еда, транспорт, одежда, развлечения и т.д. Выбранный фильтр категории можно снять нажав на него повторно.',
  },
  {
    targetId: 'sp-promo-card',
    title: 'Карточка предложения',
    desc: 'Нажмите на логотип или название компании — применится фильтр по ней. Нажмите на категорию рядом с названием — останутся только предложения этой категории. Цветная полоса показывает голоса «Работает / Не работает» от других пользователей.',
  },
  {
    targetId: 'sp-promo-add',
    title: 'Поделитесь скидкой',
    desc: 'Нашли выгодный промокод или лайфхак? Поделитесь с сообществом — другие пользователи проголосуют и подтвердят, работает ли предложение.',
  },
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

function ConditionBadge({ filter }) {
  const f = filter || 'regular'
  if (f === 'regular') return null
  return <div className={`promo-type-badge promo-type-badge--cond promo-type-badge--cond-${f}`}>{ACTS_FILTERS.find(a => a.id === f)?.label}</div>
}

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

// ── EXTERNAL LINK MODAL ────────────────────────────────────────────────────────

function ExternalLinkModal({ url, onClose }) {
  let domain = url
  try { domain = new URL(url).hostname.replace(/^www\./, '') } catch {}

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="ext-modal-backdrop" onClick={onClose}>
      <div className="ext-modal" onClick={e => e.stopPropagation()}>
        <div className="ext-modal-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div className="ext-modal-title">Переход на внешний сайт</div>
        <div className="ext-modal-domain">{domain}</div>
        <div className="ext-modal-desc">
          Вы покидаете SmartSpend и переходите на сторонний ресурс. Будьте осторожны при вводе личных данных и паролей — мы не несём ответственности за содержимое внешних сайтов.
        </div>
        <div className="ext-modal-actions">
          <button className="ext-modal-cancel" onClick={onClose}>Отмена</button>
          <a className="ext-modal-go" href={url} target="_blank" rel="noopener noreferrer" onClick={onClose}>
            Перейти
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
      </div>
    </div>,
    document.body
  )
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

function getIni(author) {
  if (!author || author === 'вы') return 'ВЫ'
  const parts = author.trim().split(/[\s_]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return author.slice(0, 2).toUpperCase()
}

function PromoInteractions({ initHistory = [], initComments = [], extraAction }) {
  const [myVote,          setMyVote]          = useState(null)
  const [worksAnim,       setWorksAnim]       = useState(false)
  const [notAnim,         setNotAnim]         = useState(false)
  const [showComments,    setShowComments]    = useState(false)
  const [comments,        setComments]        = useState(initComments)
  const [commentText,     setCommentText]     = useState('')
  const [reactions,       setReactions]       = useState([])
  const [myReactions,     setMyReactions]     = useState(new Set())
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [justAdded,       setJustAdded]       = useState(null)
  const [commentSort,     setCommentSort]     = useState('new')
  const [visibleCount,    setVisibleCount]    = useState(10)
  const [likedComments,   setLikedComments]   = useState(new Set())
  const [dislikedComments,setDislikedComments]= useState(new Set())

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

  function toggleCommentLike(i) {
    setLikedComments(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })
    setDislikedComments(prev => { const n = new Set(prev); n.delete(i); return n })
  }
  function toggleCommentDislike(i) {
    setDislikedComments(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })
    setLikedComments(prev => { const n = new Set(prev); n.delete(i); return n })
  }

  function submitComment(e) {
    e?.preventDefault()
    if (!commentText.trim()) return
    setComments(prev => [...prev, { author: 'вы', text: commentText.trim(), ts: Date.now(), likes: 0 }])
    setCommentText('')
  }

  const sorted = commentSort === 'top'
    ? [...comments].sort((a, b) => (b.likes || 0) - (a.likes || 0))
    : [...comments].reverse()
  const visible   = sorted.slice(0, visibleCount)
  const remaining = sorted.length - visibleCount

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

          {/* Comment list */}
          <div className="comments-list">
            {visible.map((c, idx) => (
              <div key={idx} className="comment-item">
                <div className="c-avatar">{getIni(c.author || c.ini)}</div>
                <div className="c-body">
                  <div className="c-header">
                    <span className="c-name">{c.name || `@${c.author || 'вы'}`}</span>
                    <span className="c-date">{c.ts ? fmtCommentTime(c.ts) : (c.date || c.time || '')}</span>
                  </div>
                  <div className="c-text">{c.text}</div>
                  <div className="c-actions">
                    <button className={`c-like${likedComments.has(idx) ? ' liked' : ''}`} onClick={() => toggleCommentLike(idx)}>
                      <svg width="11" height="11" fill={likedComments.has(idx) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                      </svg>
                      {(c.likes || 0) + (likedComments.has(idx) ? 1 : 0)}
                    </button>
                    <button className={`c-like c-dislike${dislikedComments.has(idx) ? ' disliked' : ''}`} onClick={() => toggleCommentDislike(idx)}>
                      <svg width="11" height="11" fill={dislikedComments.has(idx) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                        <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                      </svg>
                      {(c.dislikes || 0) + (dislikedComments.has(idx) ? 1 : 0)}
                    </button>
                  </div>
                </div>
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
          </div>

          {/* Input */}
          <form className="comments-input" onSubmit={submitComment}>
            <input className="c-input" placeholder="Написать комментарий..." value={commentText} onChange={e => setCommentText(e.target.value)} />
            <button type="submit" className="c-submit">Отправить</button>
          </form>
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
        <button className="promo-co-btn" onClick={() => onCompanyClick(item.companyId)}>
          <div className="promo-logo" style={{ background: company?.color }}>{company?.abbr}</div>
          <div className="promo-company-info">
            <div className="promo-company-name">
              {company?.name}
              {catLabel && catLabel !== 'Все' && (
                <button className="fa-category" onClick={e => { e.stopPropagation(); onCategoryClick(item.category) }}>{catLabel}</button>
              )}
            </div>
            <div className="promo-expires">{item.channel} · {item.time}</div>
          </div>
        </button>
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

function PromoCard({ item, onCategoryClick, onCompanyClick, onSourceClick }) {
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
    <div className="whisper-card">
      <div className="pc-header">
        <button className="promo-co-btn" onClick={() => onCompanyClick(item.companyId)}>
          <div className="promo-logo" style={{ background: company?.color }}>{company?.abbr}</div>
          <div className="whisper-company-info">
            <div className="whisper-company-name">
              {company?.name}
              {catLabel && catLabel !== 'Все' && (
                <button className="fa-category" onClick={e => { e.stopPropagation(); onCategoryClick(item.category) }}>{catLabel}</button>
              )}
            </div>
            <div className="whisper-meta">
              <span>{item.expires ? `до ${item.expires}` : ''}</span>
            </div>
          </div>
        </button>
        <ConditionBadge filter={item.promo_filter} />
      </div>

      <div className="whisper-title">{item.title}</div>
      {item.desc && <div className="whisper-desc">{item.desc}</div>}

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

      <PromoInteractions extraAction={item.sourceUrl ? (
        <button className="fa-action-btn" onClick={() => onSourceClick(item.sourceUrl)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Источник
        </button>
      ) : null} />
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

// ── WHISPER AUTHOR CHIP ────────────────────────────────────────────────────────

const AUTHOR_COLORS = ['#7B9E8A','#8A7B9E','#9E8A7B','#7B8A9E','#9E7B8A','#8A9E7B','#7B9E9E']

function authorFromUsername(username) {
  const parts = username.split(/[_\s]/)
  const name = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : username.slice(0, 2).toUpperCase()
  const colorIdx = username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AUTHOR_COLORS.length
  return {
    name,
    initials,
    color: AUTHOR_COLORS[colorIdx],
    followers: 80 + (username.length * 17),
    articles: username.length % 6,
    sets: username.length % 9,
  }
}

function WhisperAuthorChip({ username, navigate }) {
  const [showCard, setShowCard]   = useState(false)
  const [following, setFollowing] = useState(false)
  const [followAnim, setFollowAnim] = useState(false)
  const showTimer = useRef(null)
  const hideTimer = useRef(null)
  const author = authorFromUsername(username)

  function isTouch() { return window.matchMedia('(hover: none)').matches }

  function onEnter() {
    if (isTouch()) return
    clearTimeout(hideTimer.current)
    showTimer.current = setTimeout(() => setShowCard(true), 350)
  }
  function onLeave() {
    if (isTouch()) return
    clearTimeout(showTimer.current)
    hideTimer.current = setTimeout(() => setShowCard(false), 180)
  }
  function handleNameClick(e) {
    e.stopPropagation()
    navigate(`/author/${username}`, { state: { name: author.name, initials: author.initials, color: author.color, followers: author.followers } })
  }
  function handleFollow(e) {
    e.stopPropagation()
    setFollowAnim(true)
    setTimeout(() => setFollowAnim(false), 450)
    setFollowing(f => !f)
  }

  return (
    <span className="author-chip-wrap" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button className="whisper-author" onClick={handleNameClick}>@{username}</button>
      {showCard && (
        <div
          className="author-popover"
          onMouseEnter={() => clearTimeout(hideTimer.current)}
          onMouseLeave={onLeave}
          onClick={e => e.stopPropagation()}
        >
          <div className="ap-top">
            <div className="ap-avatar" style={{ background: author.color, cursor: 'pointer' }} onClick={handleNameClick}>
              {author.initials}
            </div>
            <button
              className={`ap-follow-btn${following ? ' following' : ''}${followAnim ? ' follow-pop' : ''}`}
              onClick={handleFollow}
            >
              {following ? 'Отменить подписку' : 'Подписаться'}
            </button>
          </div>
          <button className="ap-name" onClick={handleNameClick}>{author.name}</button>
          <div className="ap-meta">
            {author.followers} подписчиков
            {author.articles > 0 && <> · {author.articles} статей</>}
            {author.sets > 0 && <> · {author.sets} наборов</>}
          </div>
        </div>
      )}
    </span>
  )
}

// ── WHISPER CARD ───────────────────────────────────────────────────────────────

function WhisperCard({ item, myVote, onVote, navigate, onCategoryClick, onCompanyClick, onSourceClick }) {
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
  const [commentSort,      setCommentSort]      = useState('new')
  const [visibleCount,     setVisibleCount]     = useState(10)
  const [likedComments,    setLikedComments]    = useState(new Set())
  const [dislikedComments, setDislikedComments] = useState(new Set())
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

  function toggleCommentLike(i) {
    setLikedComments(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })
    setDislikedComments(prev => { const n = new Set(prev); n.delete(i); return n })
  }
  function toggleCommentDislike(i) {
    setDislikedComments(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })
    setLikedComments(prev => { const n = new Set(prev); n.delete(i); return n })
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
        <div className="whisper-co-block">
          <button className="promo-co-btn" onClick={() => onCompanyClick(item.companyId)}>
            <div className="promo-logo" style={{ background: company?.color }}>{company?.abbr}</div>
            <div className="whisper-company-name">
              {company?.name}
              {catLabel && catLabel !== 'Все' && (
                <button className="fa-category" onClick={e => { e.stopPropagation(); onCategoryClick(item.category) }}>{catLabel}</button>
              )}
            </div>
          </button>
          <div className="whisper-meta">
            {item.addedBy && <WhisperAuthorChip username={item.addedBy} navigate={navigate} />}
            <span>{timeAgo(item.addedAt)}{item.expires ? ` · до ${item.expires}` : ''}</span>
          </div>
        </div>
        <ConditionBadge filter={item.promo_filter} />
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
        {item.sourceUrl && (
          <button className="fa-action-btn" onClick={() => onSourceClick(item.sourceUrl)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Источник
          </button>
        )}
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

          {(() => {
            const sorted = [...comments].reverse()
            const visible = sorted.slice(0, visibleCount)
            const remaining = sorted.length - visibleCount
            return (
              <>
                <div className="comments-list">
                  {visible.map((c, idx) => (
                    <div key={idx} className="comment-item">
                      <div className="c-avatar">{getIni(c.author)}</div>
                      <div className="c-body">
                        <div className="c-header">
                          <span className="c-name">@{c.author || 'вы'}</span>
                          <span className="c-date">{c.ts ? fmtCommentTime(c.ts) : c.time}</span>
                        </div>
                        <div className="c-text">{c.text}</div>
                        <div className="c-actions">
                          <button className={`c-like${likedComments.has(idx) ? ' liked' : ''}`} onClick={() => toggleCommentLike(idx)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={likedComments.has(idx) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                            </svg>
                            {(c.likes || 0) + (likedComments.has(idx) ? 1 : 0)}
                          </button>
                          <button className={`c-like c-dislike${dislikedComments.has(idx) ? ' disliked' : ''}`} onClick={() => toggleCommentDislike(idx)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={dislikedComments.has(idx) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                              <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                            </svg>
                            {(c.dislikes || 0) + (dislikedComments.has(idx) ? 1 : 0)}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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

          <form className="comments-input" onSubmit={e => {
            e.preventDefault()
            if (!commentText.trim()) return
            setComments(prev => [...prev, { author: 'вы', text: commentText.trim(), ts: Date.now(), likes: 0 }])
            setCommentText('')
          }}>
            <input className="c-input" placeholder="Написать комментарий..." value={commentText}
              onChange={e => setCommentText(e.target.value)}
            />
            <button type="submit" className="c-submit" disabled={!commentText.trim()}>Отправить</button>
          </form>
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
  const [extUrl,        setExtUrl]        = useState(null)

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

  function handleCompanyClick(companyId) {
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
    // broadcasts have no promo_filter (always 'regular'), so hide them when actsFilter is active
    if (actsFilter !== 'all') {
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
            {/* Row 1: Type chips */}
            <div id="sp-promo-types" className="cats-scroll promo-type-chips">
              {TYPE_CHIPS.map(chip => (
                <button
                  key={chip.id}
                  className={`cat-pill${typeFilter === chip.id ? ' active' : ''}`}
                  onClick={() => setTypeFilter(chip.id)}
                >{chip.label}</button>
              ))}
            </div>

            {/* Row 2: Acts sub-filter */}
            {showActsFilter && (
              <div id="sp-promo-acts" className="cats-scroll filters-acts-row">
                {ACTS_FILTERS.map(f => (
                  <button key={f.id} className={`cat-pill${actsFilter === f.id ? ' active' : ''}`}
                    onClick={() => setActsFilter(f.id)}>{f.label}</button>
                ))}
              </div>
            )}

            {/* Scope */}
            <div id="sp-promo-scope" className="cats-scroll promo-type-chips">
              <button className={`cat-pill${promoScope === 'mine' ? ' active' : ''}`} onClick={() => setPromoScope('mine')}>Мои компании</button>
              <button className={`cat-pill${promoScope === 'all' ? ' active' : ''}`} onClick={() => setPromoScope('all')}>Все компании</button>
              <button className="cat-pill cat-pill--edit" onClick={() => navigate('/company-picker', { state: { edit: true } })}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Изменить компании
              </button>
            </div>

            {/* Categories */}
            <div id="sp-promo-cats">
              <FilterSelect
                items={CATEGORIES.filter(c => c.id === 'all' || PROMO_CATS_WITH_ITEMS.has(c.id))}
                value={promoCat}
                onChange={handlePromoCat}
                placeholder="Категории"
              />
            </div>

            {hasFilters && (
              <div className="filter-summary">
                <span>{filtered.length} {noun(filtered.length)}</span>
                <button className="reset-btn" onClick={resetFilters}>Сбросить</button>
              </div>
            )}
          </div>
        </div>

        <div className="feed-scroll" ref={scrollRef}>
          <button id="sp-promo-add" className="whisper-add-cta" onClick={() => navigate('/create-whisper')}>
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
            ) : filtered.map((item, index) => {
              let card
              if (item.kind === 'broadcast') card = <BroadcastCard key={item.id} item={item} onCategoryClick={handlePromoCat} onCompanyClick={handleCompanyClick} />
              else if (item.kind === 'whisper') card = <WhisperCard key={item.id} item={item} myVote={whisperVotes.get(item.id) || null} onVote={voteWhisper} navigate={navigate} onCategoryClick={handlePromoCat} onCompanyClick={handleCompanyClick} onSourceClick={setExtUrl} />
              else card = <PromoCard key={item.id} item={item} onCategoryClick={handlePromoCat} onCompanyClick={handleCompanyClick} onSourceClick={setExtUrl} />
              return index === 0 ? <div key={item.id} id="sp-promo-card">{card}</div> : card
            })}
          </div>
        </div>
      </main>
      {showSpotlight && <SpotlightTour steps={PROMO_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
      {extUrl && <ExternalLinkModal url={extUrl} onClose={() => setExtUrl(null)} />}
    </Layout>
  )
}

function noun(n) {
  const m = n % 10, c = n % 100
  if (m === 1 && c !== 11) return 'предложение'
  if (m >= 2 && m <= 4 && (c < 10 || c >= 20)) return 'предложения'
  return 'предложений'
}
