import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'
import ReactionPill from '../components/ReactionPill'

const SET_CATEGORIES = {
  other: 'Прочие расходы', food: 'Еда и Супермаркеты', cafe: 'Кафе, Бары, Рестораны',
  transport: 'Авто и Транспорт', home: 'Дом и Техника', clothes: 'Одежда и Обувь',
  leisure: 'Развлечения и Хобби', health: 'Красота и Здоровье',
  education: 'Образование и Дети', travel: 'Путешествия и Отдых',
}

const ACC_SPOTLIGHT = [
  { targetId: 'sp-acc-header', btnId: 'sp-acc-edit',   title: 'Профиль',        desc: 'Твоё имя, аватар и биография. Нажми «Редактировать», чтобы обновить информацию о себе.' },
  { targetId: 'sp-acc-tabs',   btnId: null,             title: 'Разделы аккаунта', desc: 'Статьи, наборы и подписки — три раздела твоего профиля. Переключайся между ними.' },
]

// ── helpers ─────────────────────────────────────────────────────────────────

function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}

// Russian → Latin transliteration for auto-username
function toLatinUsername(name) {
  const map = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh',
    'з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
    'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts',
    'ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
  }
  return name.toLowerCase()
    .split('').map(c => map[c] ?? (c.match(/[a-z0-9]/) ? c : ' '))
    .join('').trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 20)
}

function initProfile() {
  // Seed displayName from registration username if not set
  const regName = localStorage.getItem('ss_username') || ''
  const saved = readLS('ss_account_profile', null)
  if (saved) return { followers: 0, avatar: '', ...saved }
  return {
    displayName: regName, pseudonym: '', username: toLatinUsername(regName),
    bio: '', followers: 0, avatar: '',
  }
}

// ── Confirm delete modal ─────────────────────────────────────────────────────

function ConfirmModal({ open, title, desc, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="acc-confirm-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="acc-confirm-modal">
        <div className="acc-confirm-icon">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </div>
        <div className="acc-confirm-title">{title}</div>
        <div className="acc-confirm-desc">{desc}</div>
        <div className="acc-confirm-actions">
          <button className="acc-confirm-cancel" onClick={onCancel}>Отмена</button>
          <button className="acc-confirm-delete" onClick={onConfirm}>Удалить</button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
  const [msg, setMsg] = useState(null)
  function show(text) { setMsg(text); setTimeout(() => setMsg(null), 2200) }
  return [msg, show]
}

// ── Set card action buttons (mirrors Catalog.jsx) ────────────────────────────

function SLikeBtn({ liked, count, onToggle }) {
  const [anim, setAnim] = useState(false)
  const [sparks, setSparks] = useState([])
  function handleClick(e) {
    e.stopPropagation()
    setAnim(true); setTimeout(() => setAnim(false), 480)
    if (!liked) {
      const s = Array.from({ length: 6 }, (_, i) => ({ id: Date.now() + i, angle: i * 60 + Math.random() * 18 - 9, dist: 16 + Math.random() * 8 }))
      setSparks(s); setTimeout(() => setSparks([]), 560)
    }
    onToggle()
  }
  return (
    <div className="action-wrap">
      <button className={`fa-action-btn${liked ? ' liked' : ''}${anim ? ' like-pop' : ''}`} onClick={handleClick} title="Нравится">
        <svg width="16" height="16" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
        </svg>
        {count}
      </button>
      {sparks.map(s => <span key={s.id} className="like-spark" style={{ '--angle': `${s.angle}deg`, '--dist': `${s.dist}px` }}>✦</span>)}
    </div>
  )
}

function SDislikeBtn({ disliked, onToggle }) {
  const [anim, setAnim] = useState(false)
  function handleClick(e) { e.stopPropagation(); setAnim(true); setTimeout(() => setAnim(false), 420); onToggle() }
  return (
    <button className={`fa-action-btn fa-action-dislike${disliked ? ' active' : ''}${anim ? ' dislike-shake' : ''}`} onClick={handleClick} title="Не нравится">
      <svg width="16" height="16" fill={disliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
        <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
      </svg>
    </button>
  )
}

function SBookmarkBtn({ bookmarked, onToggle }) {
  const [anim, setAnim] = useState(false)
  const [fly,  setFly]  = useState(false)
  function handleClick(e) {
    e.stopPropagation(); setAnim(true); setTimeout(() => setAnim(false), 420)
    if (!bookmarked) { setFly(true); setTimeout(() => setFly(false), 520) }
    onToggle()
  }
  return (
    <div className="action-wrap">
      <button className={`fa-action-btn fa-action-bookmark${bookmarked ? ' active' : ''}${anim ? ' bookmark-snap' : ''}`} onClick={handleClick} title="В избранное">
        <svg width="16" height="16" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
      {fly && <span className="bookmark-fly">🔖</span>}
    </div>
  )
}

// ── AccSetCard — public-style catalog card with interactions ──────────────────

function AccSetCard({ s, onDelete, onEdit, navigate }) {
  const [liked,       setLiked]      = useState(false)
  const [disliked,    setDisliked]   = useState(false)
  const [myReactions, setMyReactions] = useState(new Set())

  const items    = s.items || []
  const setName  = s.title || s.name || 'Без названия'
  const setDesc  = s.shortDesc || s.desc || ''
  const catLabel = SET_CATEGORIES[s.category] || ''
  const monthly  = s.amount || items.reduce((sum, it) => {
    if (it.type === 'consumable' && it.price && it.qty && it.dailyUse)
      return sum + (it.price / it.qty) * it.dailyUse * 30
    if (it.type === 'wear' && it.price && it.wearLifeWeeks)
      return sum + (it.price / it.wearLifeWeeks) * 4.33
    return sum
  }, 0)
  const totalCost = items.reduce((sum, it) => sum + (it.price || 0), 0)

  const reactions = (s.reactions || [
    { emoji: '🔥', count: 3 }, { emoji: '💡', count: 1 },
  ])
  function toggleReaction(emoji) {
    setMyReactions(prev => {
      const next = new Set(prev)
      next.has(emoji) ? next.delete(emoji) : next.add(emoji)
      return next
    })
  }

  const likes    = (s.likes || 0) + (liked ? 1 : 0)
  const comments = s.comments || 0

  return (
    <div className="catalog-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/set/${s.id}`)}>
      <div className="card-body">
        <div className="card-badges">
          {catLabel && <span className="card-item-tag">{catLabel}</span>}
          <span className={`visibility-badge ${s.draft ? 'draft' : s.pub ? 'public' : 'private'}`} style={{ fontSize: 9 }}>
            {s.draft ? 'Черновик' : s.pub ? 'Публичный' : 'Личный'}
          </span>
        </div>
        <div>
          <div className="card-title">{setName}</div>
          {setDesc && <div className="card-desc">{setDesc}</div>}
        </div>
        {items.length > 0 && (
          <div className="card-items">
            {items.slice(0, 4).map((it, j) => <span key={j} className="card-item-tag">{it.name}</span>)}
            {items.length > 4 && <span className="card-item-more">+{items.length - 4}</span>}
          </div>
        )}
      </div>

      {/* Cost row — shown when there are items */}
      {items.length > 0 && (
        <div className="card-cost-row">
          {monthly > 0 && (
            <>
              <div className="card-cost-item card-cost-monthly">
                <div className="card-cost-val">{Math.round(monthly).toLocaleString('ru')} ₽</div>
                <div className="card-cost-lbl">в месяц</div>
              </div>
              <div className="card-cost-sep" />
            </>
          )}
          <div className="card-cost-item">
            <div className="card-cost-val">{items.length}</div>
            <div className="card-cost-lbl">позиций</div>
          </div>
          {totalCost > 0 && (
            <>
              <div className="card-cost-sep" />
              <div className="card-cost-item">
                <div className="card-cost-val">{totalCost.toLocaleString('ru')} ₽</div>
                <div className="card-cost-lbl">общая стоимость</div>
              </div>
            </>
          )}
          {s.pub && (
            <>
              <div className="card-cost-sep" />
              <div className="card-cost-item">
                <div className="card-cost-val">{(s.users || 0).toLocaleString('ru')}</div>
                <div className="card-cost-lbl">подписчиков</div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="card-bottom" onClick={e => { e.stopPropagation(); e.preventDefault() }}>
        {s.pub && (
          <>
            <SLikeBtn liked={liked} count={likes} onToggle={() => { if (disliked) setDisliked(false); setLiked(v => !v) }} />
            <button className="fa-action-stat fa-action-stat--btn" onClick={() => navigate(`/set/${s.id}`)}>
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {comments > 0 ? comments : ''}
            </button>
            <SDislikeBtn disliked={disliked} onToggle={() => { if (liked) setLiked(false); setDisliked(v => !v) }} />
            {reactions.length > 0 && (
              <>
                <span className="fa-reactions-sep" />
                {reactions.map(r => (
                  <ReactionPill key={r.emoji} emoji={r.emoji} count={r.count + (myReactions.has(r.emoji) ? 1 : 0)}
                    active={myReactions.has(r.emoji)} onToggle={toggleReaction} stopProp />
                ))}
              </>
            )}
          </>
        )}
        <div className="f-spacer" />
        {!s.pub && !s.draft && (
          <button className="fa-action-btn" onClick={e => { e.stopPropagation(); onEdit(s) }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Редактировать
          </button>
        )}
        <button className="acc-btn-visibility acc-btn-delete-gray" onClick={e => { e.stopPropagation(); onDelete(s) }}>
          Удалить
        </button>
      </div>
    </div>
  )
}

// ── Inline whisper card with expandable comments ──────────────────────────────

function AccWhisperCard({ w, onDelete }) {
  const [myVote,       setMyVote]       = useState(null)
  const [showComments, setShowComments] = useState(false)
  const [comments,     setComments]     = useState(w.comments || [])
  const [commentText,  setCommentText]  = useState('')
  const [copied,       setCopied]       = useState(false)

  const hist = w.history || []
  const displayHistory = myVote ? [...hist, myVote === 'works' ? 'w' : 'n'] : hist
  const works    = displayHistory.filter(v => v === 'w').length
  const notWorks = displayHistory.filter(v => v === 'n').length

  function copyCode(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(w.code).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function addComment() {
    const text = commentText.trim()
    if (!text) return
    setComments(prev => [...prev, { author: localStorage.getItem('ss_username') || 'вы', text, ts: Date.now() }])
    setCommentText('')
  }

  return (
    <div className="acc-article-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px' }}>
        <div className="acc-whisper-header">
          <div className="promo-logo" style={{ background: w.companyColor, width: 32, height: 32, fontSize: 11 }}>{w.companyAbbr}</div>
          <div>
            <div className="acc-whisper-company">{w.companyName}</div>
            <div className="acc-whisper-meta">{w.expires ? `до ${w.expires}` : 'бессрочно'} · {w.addedAt ? new Date(w.addedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : ''}</div>
          </div>
          {w.draft && <span className="visibility-badge badge-draft" style={{ marginLeft: 'auto' }}>Черновик</span>}
        </div>
        <div className="acc-article-title" style={{ marginTop: 8 }}>{w.title}</div>
        {w.code && (
          <div className="whisper-code-row" style={{ marginTop: 8 }}>
            <div className="whisper-code">{w.code}</div>
            <button className={`fa-action-btn pc-copy-btn${copied ? ' copied' : ''}`} onClick={copyCode}>
              {copied
                ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Скопировано</>
                : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Скопировать</>
              }
            </button>
          </div>
        )}
      </div>

      {/* History bar */}
      {displayHistory.length > 0 && (
        <div className="whisper-history" style={{ margin: '0 16px 10px' }}>
          {displayHistory.slice(-40).map((v, i) => (
            <div key={i} className="wvh-stripe" style={{ background: v === 'w' ? '#5E9478' : '#B85555' }} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="fa-bottom whisper-actions" style={{ padding: '0 12px 10px', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        <button className={`fa-action-btn wvb-works${myVote === 'works' ? ' active' : ''}`}
          onClick={() => setMyVote(v => v === 'works' ? null : 'works')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill={myVote === 'works' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          Работает{works > 0 ? ` · ${works}` : ''}
        </button>
        <button className={`fa-action-btn wvb-not${myVote === 'not' ? ' active' : ''}`}
          onClick={() => setMyVote(v => v === 'not' ? null : 'not')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill={myVote === 'not' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
            <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
          </svg>
          Не работает{notWorks > 0 ? ` · ${notWorks}` : ''}
        </button>
        <div className="f-spacer" />
        <button className={`fa-action-btn${showComments ? ' wv-comments-open' : ''}`}
          onClick={() => setShowComments(v => !v)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {comments.length > 0 ? comments.length : 'Комментарии'}
        </button>
        <button className="acc-btn-visibility acc-btn-delete-gray" onClick={() => onDelete(w)}>
          Удалить
        </button>
      </div>

      {/* Comments panel */}
      {showComments && (
        <div className="whisper-comments" style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
          {comments.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>Пока нет комментариев</div>
          )}
          {comments.map((c, i) => (
            <div key={i} className="acc-wmodal-comment">
              <span className="acc-wmodal-comment-author">{c.author}</span>
              <span className="acc-wmodal-comment-text">{c.text}</span>
            </div>
          ))}
          <div className="acc-wmodal-comment-input-row" style={{ marginTop: 8 }}>
            <input className="acc-wmodal-comment-input" placeholder="Написать комментарий..."
              value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addComment()} />
            <button className="acc-wmodal-send" onClick={addComment} disabled={!commentText.trim()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Popular authors mock data ─────────────────────────────────────────────────

const POPULAR_AUTHORS = [
  { id: 'pa1',  name: 'Алина Морозова',    handle: '@alina_m',      ini: 'АМ', color: '#4E8268', category: 'other',     bio: 'Рационализирую быт и бюджет. Веду учёт расходов уже 4 года.',              followers: 4812, articles: 38, sets: 12, rating: 98 },
  { id: 'pa2',  name: 'Дмитрий Ковалёв',  handle: '@dm_kovalev',    ini: 'ДК', color: '#5B8FD4', category: 'other',     bio: 'Финансовый аналитик. Пишу про инвестиции и осознанные покупки.',          followers: 3240, articles: 55, sets: 8,  rating: 95 },
  { id: 'pa3',  name: 'Мария Иванова',     handle: '@mari_smart',    ini: 'МИ', color: '#B08840', category: 'food',      bio: 'Составляю наборы для семейного бюджета и экономии на продуктах.',        followers: 2890, articles: 22, sets: 19, rating: 92 },
  { id: 'pa4',  name: 'Сергей Попов',      handle: '@s_popov',       ini: 'СП', color: '#7B5EA7', category: 'clothes',   bio: 'Минимализм и осознанное потребление. Каталогизирую вещи и расходы.',     followers: 2150, articles: 17, sets: 31, rating: 89 },
  { id: 'pa5',  name: 'Ольга Смирнова',    handle: '@olga_saves',    ini: 'ОС', color: '#B85555', category: 'education', bio: 'Мама троих детей. Делюсь лайфхаками по экономии и планированию.',       followers: 1920, articles: 41, sets: 14, rating: 86 },
  { id: 'pa6',  name: 'Артём Зайцев',      handle: '@artem_z',       ini: 'АЗ', color: '#4E7090', category: 'leisure',   bio: 'IT-специалист. Автоматизирую личные финансы и делюсь инструментами.',   followers: 1680, articles: 29, sets: 7,  rating: 83 },
  { id: 'pa7',  name: 'Наталья Фёдорова',  handle: '@natasha_food',  ini: 'НФ', color: '#C07840', category: 'food',      bio: 'Готовлю вкусно и экономно. Делюсь рецептами и списками покупок.',        followers: 1540, articles: 33, sets: 22, rating: 81 },
  { id: 'pa8',  name: 'Павел Орлов',       handle: '@pavel_wear',    ini: 'ПО', color: '#6B8E6B', category: 'clothes',   bio: 'Мужской гардероб без переплат. Качественные базовые вещи надолго.',      followers: 1320, articles: 19, sets: 27, rating: 78 },
  { id: 'pa9',  name: 'Екатерина Белова',  handle: '@kate_home',     ini: 'ЕБ', color: '#9E6B9E', category: 'home',      bio: 'Обустраиваю дом с умом. Сравниваю технику и товары для быта.',          followers: 1180, articles: 26, sets: 18, rating: 75 },
  { id: 'pa10', name: 'Иван Соколов',      handle: '@ivan_travel',   ini: 'ИС', color: '#4E8AAA', category: 'travel',    bio: 'Путешествую бюджетно. Составляю наборы для поездок и отпусков.',        followers: 1050, articles: 14, sets: 11, rating: 72 },
  { id: 'pa11', name: 'Юлия Николаева',    handle: '@julia_health',  ini: 'ЮН', color: '#A04868', category: 'health',    bio: 'Здоровый образ жизни без лишних трат. Спорт и питание в рамках бюджета.', followers: 980,  articles: 21, sets: 16, rating: 70 },
  { id: 'pa12', name: 'Максим Козлов',     handle: '@max_finance',   ini: 'МК', color: '#557A55', category: 'other',     bio: 'Веду семейный бюджет 6 лет. Таблицы, приложения, лайфхаки экономии.',   followers: 870,  articles: 18, sets: 9,  rating: 67 },
]

// Only categories that appear in POPULAR_AUTHORS, using SET_CATEGORIES labels
const PA_CATEGORIES = [
  { id: null },
  ...Object.entries(SET_CATEGORIES)
    .filter(([id]) => POPULAR_AUTHORS.some(a => a.category === id))
    .map(([id, label]) => ({ id, label })),
].map(c => c.id === null ? { id: null, label: 'Все' } : c)

function fmtFollowers(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K'
  return String(n)
}

function SubsTab({ subs, onUnsub, navigate }) {
  const [paCatFilter, setPaCatFilter] = useState(null)
  const subsSet = new Set(subs.map(s => s.handle))
  const filteredAuthors = paCatFilter
    ? POPULAR_AUTHORS.filter(a => a.category === paCatFilter)
    : POPULAR_AUTHORS

  return (
    <div className="acc-panel">

      {/* ── Popular authors rating ── */}
      <div className="pa-section-header">
        <div className="pa-section-title">Рейтинг авторов</div>
        <div className="acc-filter-row acc-filter-row--cats">
          {PA_CATEGORIES.map(cat => (
            <button
              key={String(cat.id)}
              className={`acc-filter-pill${paCatFilter === cat.id ? ' active' : ''}`}
              onClick={() => setPaCatFilter(cat.id)}
            >{cat.label}</button>
          ))}
        </div>
      </div>

      <div className="popular-authors-list">
        {filteredAuthors.map((a, i) => {
          const isSubscribed = subsSet.has(a.handle)
          return (
            <div key={a.id} className="popular-author-row"
              onClick={() => navigate('/author/' + a.handle.replace('@', ''), { state: a })}>
              <div className="pa-rank">{i + 1}</div>
              <div className="pa-avatar" style={{ background: a.color }}>{a.ini}</div>
              <div className="pa-info">
                <div className="pa-name">{a.name}</div>
                <div className="pa-handle">{a.handle}</div>
                <div className="pa-bio">{a.bio}</div>
              </div>
              <div className="pa-stats">
                <div className="pa-stat-row">
                  <span className="pa-stat-val">{fmtFollowers(a.followers)}</span>
                  <span className="pa-stat-lbl">подписчиков</span>
                </div>
                <div className="pa-stat-row">
                  <span className="pa-stat-val">{a.articles}</span>
                  <span className="pa-stat-lbl">статей</span>
                </div>
                <div className="pa-stat-row">
                  <span className="pa-stat-val">{a.sets}</span>
                  <span className="pa-stat-lbl">наборов</span>
                </div>
              </div>
              <div className="pa-right" onClick={e => e.stopPropagation()}>
                <div className="pa-stat-row" style={{ alignItems: 'flex-end' }}>
                  <div className="pa-rating">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    {a.rating}
                  </div>
                  <div className="pa-stat-lbl">рейтинг</div>
                </div>
                {isSubscribed ? (
                  <button className="pa-sub-cta pa-sub-cta--active">Подписан</button>
                ) : (
                  <button className="pa-sub-cta">Подписаться</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── My subscriptions ── */}
      <div className="pa-section-header" style={{ marginTop: 8 }}>
        <div className="pa-section-title">Мои подписки</div>
      </div>

      {subs.length === 0 ? (
        <div className="acc-empty" style={{ paddingTop: 16, paddingBottom: 20 }}>
          <div className="acc-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
          <div className="acc-empty-title">Нет подписок</div>
          <div className="acc-empty-desc">Подписывайтесь на авторов из рейтинга выше</div>
        </div>
      ) : (
        <div className="subs-grid">
          {subs.map((s, i) => (
            <div key={i} className="subscription-card"
              onClick={() => navigate('/author/' + (s.handle || '').replace('@', ''), { state: s })}>
              <div className="subscription-top">
                <div className="subscription-avatar" style={{ background: s.color || '#4E8268' }}>
                  {s.ini || (s.name || '?')[0].toUpperCase()}
                </div>
                <div className="subscription-info">
                  <div className="subscription-name">{s.name}</div>
                  {s.handle && <div className="subscription-handle">{s.handle}</div>}
                </div>
              </div>
              {(s.bio || s.desc) && <div className="subscription-bio">{s.bio || s.desc}</div>}
              <div className="subscription-bottom" onClick={e => e.stopPropagation()}>
                <div className="subscription-stats">
                  {s.followers && s.followers !== '—' && <span>{s.followers} подписчиков</span>}
                  {s.articles > 0 && <span>{s.articles} статей</span>}
                  {s.sets > 0 && <span>{s.sets} наборов</span>}
                </div>
                <button className="acc-btn-unsub" onClick={() => onUnsub(s)}>Отменить</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Whisper detail modal ──────────────────────────────────────────────────────

// ── Main component ───────────────────────────────────────────────────────────

export default function Account() {
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(location.state?.tab || 'articles')
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState(initProfile)
  const [draft, setDraft] = useState(initProfile)

  const [articles,  setArticles]  = useState(() => readLS('ss_account_articles', []))
  const [sets,      setSets]      = useState(() => readLS('ss_account_sets', []))
  const [subs,      setSubs]      = useState(() => readLS('ss_account_subs', []))
  const [whispers,  setWhispers]  = useState(() => readLS('ss_account_whispers', []))

  const [confirmArticle, setConfirmArticle] = useState(null)
  const [confirmSet,     setConfirmSet]     = useState(null)
  const [confirmWhisper, setConfirmWhisper] = useState(null)
  const [showSpotlight,  setShowSpotlight]  = useState(false)

  const [artTypeFilter, setArtTypeFilter] = useState(null)  // null | 'public' | 'private' | 'draft'
  const [artCatFilter,  setArtCatFilter]  = useState(null)
  const [setTypeFilter, setSetTypeFilter] = useState(null)
  const [setCatFilter,  setSetCatFilter]  = useState(null)

  const [toast, showToast] = useToast()

  const avatarInputRef = useRef(null)

  // ── Profile ────────────────────────────────────────────────────────────────

  function startEdit() {
    const base = { ...profile }
    if (!base.username && base.displayName) base.username = toLatinUsername(base.displayName)
    setDraft(base)
    setEditing(true)
  }
  function cancelEdit() { setEditing(false) }
  function saveEdit() {
    setProfile({ ...draft })
    localStorage.setItem('ss_account_profile', JSON.stringify({ ...draft }))
    setEditing(false)
    showToast('Профиль обновлён')
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const url = ev.target.result
      const updated = { ...profile, avatar: url }
      setProfile(updated)
      localStorage.setItem('ss_account_profile', JSON.stringify(updated))
      showToast('Фото обновлено')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const initials = (profile.displayName || profile.username || localStorage.getItem('ss_username') || 'U')[0].toUpperCase()

  // ── Article actions ────────────────────────────────────────────────────────

  function handleEditArticle(a) {
    navigate(`/create-article?edit=${a.id}`)
  }

  function handleToggleArticleVisibility(a) {
    const updated = articles.map(x => x.id === a.id ? { ...x, pub: !x.pub } : x)
    setArticles(updated)
    localStorage.setItem('ss_account_articles', JSON.stringify(updated))
    showToast(a.pub ? 'Статья скрыта — теперь личная' : 'Статья опубликована')
  }

  function handleDeleteArticle(a) { setConfirmArticle(a) }

  function confirmDeleteArticle() {
    const updated = articles.filter(a => a.id !== confirmArticle.id)
    setArticles(updated)
    localStorage.setItem('ss_account_articles', JSON.stringify(updated))
    const myIds = readLS('ss_my_article_ids', []).filter(id => id !== confirmArticle.id)
    localStorage.setItem('ss_my_article_ids', JSON.stringify(myIds))
    setConfirmArticle(null)
    showToast('Статья удалена')
  }

  // ── Set actions ────────────────────────────────────────────────────────────

  function handleEditSet(s) {
    navigate(`/create-set?edit=${s.id}`)
  }

  function handleToggleSetVisibility(s) {
    const updated = sets.map(x => x.id === s.id ? { ...x, pub: !x.pub } : x)
    setSets(updated)
    localStorage.setItem('ss_account_sets', JSON.stringify(updated))
    showToast(s.pub ? 'Набор скрыт из каталога' : 'Набор опубликован в каталоге')
  }

  function handleDeleteSet(s) { setConfirmSet(s) }

  function confirmDeleteSet() {
    const updated = sets.filter(s => s.id !== confirmSet.id)
    setSets(updated)
    localStorage.setItem('ss_account_sets', JSON.stringify(updated))
    setConfirmSet(null)
    showToast('Набор удалён')
  }

  // ── Whisper actions ────────────────────────────────────────────────────────

  function confirmDeleteWhisperFn() {
    const updated = whispers.filter(w => w.id !== confirmWhisper.id)
    setWhispers(updated)
    localStorage.setItem('ss_account_whispers', JSON.stringify(updated))
    setConfirmWhisper(null)
    showToast('Запись удалена')
  }

  // ── Sub actions ────────────────────────────────────────────────────────────

  function handleUnsubscribe(s) {
    const updated = subs.filter(x => x.handle !== s.handle)
    setSubs(updated)
    localStorage.setItem('ss_account_subs', JSON.stringify(updated))
    showToast(`Вы отписались от ${s.name}`)
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────

  const TABS = [
    { id: 'articles',  label: `Статьи · ${articles.length}` },
    { id: 'sets',      label: `Наборы · ${sets.length}` },
    { id: 'whispers',  label: `Промо · ${whispers.length}` },
    { id: 'subs',      label: `Подписки · ${subs.length}` },
    { id: 'companies', label: 'Мои компании' },
  ]

  return (
    <Layout>
      <main className="account-main">

        {/* Page title */}
        <div className="inv-page-header">
          <div>
            <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              Аккаунт
              <HelpButton seenKey="ss_spl_account" onOpen={() => setShowSpotlight(true)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button id="sp-acc-edit" className={`btn-edit-mode${editing ? ' active' : ''}`} onClick={editing ? saveEdit : startEdit}>
              {editing ? (
                <>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Готово
                </>
              ) : (
                <>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Редактировать
                </>
              )}
            </button>
            {editing && (
              <button className="btn-edit-mode" onClick={cancelEdit}>Отмена</button>
            )}
          </div>
        </div>


        {/* Profile header */}
        <div id="sp-acc-header" className="user-header">
          <div className="user-avatar-large-wrap">
            <div className="user-avatar-large">
              {profile.avatar
                ? <img src={profile.avatar} alt="avatar" className="user-avatar-img" />
                : <span>{initials}</span>
              }
            </div>
            {editing && profile.avatar && (
              <button className="user-avatar-delete" onClick={() => {
                const updated = { ...profile, avatar: '' }
                setProfile(updated)
                setDraft(d => ({ ...d, avatar: '' }))
                localStorage.setItem('ss_account_profile', JSON.stringify(updated))
                showToast('Фото удалено')
              }} title="Удалить фото">
                <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
            <button className="user-avatar-change" onClick={() => avatarInputRef.current?.click()} title="Сменить фото">
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>

          <div className="user-info">
            <div className="user-name-line">
              {editing
                ? <input className="acc-edit-field large" value={draft.displayName}
                    onChange={e => setDraft(d => ({ ...d, displayName: e.target.value }))}
                    placeholder="Имя и фамилия" />
                : <span className="user-display-name">{profile.displayName || <span className="acc-placeholder acc-placeholder--name">Имя не указано</span>}</span>
              }
            </div>
            <div className="user-nickname-line">
              {editing
                ? <div className="acc-username-input-wrap">
                    <span className="acc-username-at">@</span>
                    <input className="acc-edit-field" value={draft.username} style={{ width: 160 }}
                      onChange={e => setDraft(d => ({ ...d, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                      placeholder="username" />
                  </div>
                : <span className="user-username">{profile.username ? '@' + profile.username : <span className="acc-placeholder" style={{ fontSize: 13 }}>username не задан</span>}</span>
              }
            </div>

            <div className="user-meta">
              {profile.followers > 0 && (
                <span className="user-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14"/><path d="M22 3h-6a4 4 0 0 0-4 4v14"/>
                  </svg>
                  {profile.followers} подписчиков
                </span>
              )}
            </div>

            {editing ? (
              <textarea className="user-bio-input" rows={3} value={draft.bio}
                onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
                placeholder="О себе..." />
            ) : (
              <div className="user-bio">{profile.bio || <span className="acc-placeholder acc-placeholder--bio">О себе...</span>}</div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div id="sp-acc-tabs" className="acc-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`acc-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Articles */}
        {tab === 'articles' && (() => {
          // ── filter logic ──
          const TYPE_FILTERS = [
            { id: null,      label: 'Все' },
            { id: 'public',  label: 'Публичный' },
            { id: 'private', label: 'Личное' },
            { id: 'draft',   label: 'Черновик' },
          ]
          const byType = artTypeFilter === null ? articles
            : artTypeFilter === 'public'  ? articles.filter(a => a.pub && !a.draft)
            : artTypeFilter === 'private' ? articles.filter(a => !a.pub && !a.draft)
            : articles.filter(a => !!a.draft)

          const availCats = [...new Set(byType.map(a => a.category).filter(Boolean))]
          const filtered = artCatFilter ? byType.filter(a => a.category === artCatFilter) : byType

          return (
          <div className="acc-panel">
            <div className="panel-header">
              <span className="panel-title">Статьи, которые вы написали</span>
              <button className="acc-btn-primary" onClick={() => navigate('/create-article')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Написать статью
              </button>
            </div>

            {articles.length > 0 && (
              <div className="acc-filters">
                <div className="acc-filter-row">
                  {TYPE_FILTERS.map(f => (
                    <button key={String(f.id)} className={`acc-filter-pill${artTypeFilter === f.id ? ' active' : ''}`}
                      onClick={() => { setArtTypeFilter(f.id); setArtCatFilter(null) }}>
                      {f.label}
                    </button>
                  ))}
                </div>
                {artTypeFilter !== null && availCats.length > 0 && (
                  <div className="acc-filter-row acc-filter-row--cats">
                    {availCats.map(cat => (
                      <button key={cat} className={`acc-filter-pill acc-filter-pill--cat${artCatFilter === cat ? ' active' : ''}`}
                        onClick={() => setArtCatFilter(prev => prev === cat ? null : cat)}>
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {articles.length === 0 && (
              <div className="acc-empty">
                <div className="acc-empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </div>
                <div className="acc-empty-title">Нет статей</div>
                <div className="acc-empty-desc">Напишите первую статью и поделитесь опытом с сообществом</div>
              </div>
            )}

            {filtered.length === 0 && articles.length > 0 && (
              <div className="acc-empty">
                <div className="acc-empty-title">Ничего не найдено</div>
                <div className="acc-empty-desc">Нет статей, соответствующих выбранным фильтрам</div>
              </div>
            )}

            {filtered.map((a) => {
              const isDraft  = !!a.draft
              const isPublic = !!a.pub
              const commentCount = Array.isArray(a.comments) ? a.comments.length : (a.comments ?? 0)

              if (isPublic) {
                return (
                  <article key={a.id} className="feed-article acc-feed-article"
                    onClick={() => navigate(`/article/${a.id}`)}>
                    <div className="fa-author-row">
                      {a.category && <><span className="fa-category">{a.category}</span><span className="fa-sep">·</span></>}
                      <span className="visibility-badge public">Публичный</span>
                    </div>
                    <h2 className="fa-title">{a.title}</h2>
                    <p className="fa-preview">{a.excerpt}</p>
                    <div className="fa-bottom" onClick={e => e.stopPropagation()}>
                      <div className="fa-action-stat">
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                        </svg>
                        {a.likes ?? 0}
                      </div>
                      <div className="fa-action-stat">
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        {commentCount}
                      </div>
                      <div className="fa-action-stat">
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                          <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                        </svg>
                        {a.dislikes ?? 0}
                      </div>
                      {Array.isArray(a.reactions) && a.reactions.length > 0 && (
                        <><span className="fa-reactions-sep" />
                          {a.reactions.slice(0, 4).map(r => (
                            <span key={r.emoji} className="acc-reaction-pill">{r.emoji} {r.count}</span>
                          ))}</>
                      )}
                      <div className="f-spacer" />
                      <span className="fa-time">{a.meta}</span>
                      <button className="acc-btn-visibility acc-btn-delete-gray"
                        onClick={e => { e.stopPropagation(); handleDeleteArticle(a) }}>
                        Удалить
                      </button>
                    </div>
                  </article>
                )
              }

              // ── Личная / черновик ──
              const badgeClass = isDraft ? 'draft' : 'private'
              const badgeLabel = isDraft ? 'Черновик' : 'Личное'
              const handleCardClick = () => isDraft ? handleEditArticle(a) : navigate(`/article/${a.id}`)
              return (
                <div key={a.id} className="acc-article-card acc-article-card--clickable"
                  onClick={handleCardClick}>
                  <div className="acc-article-title-row">
                    <span className="acc-article-title">{a.title}</span>
                    <span className={`visibility-badge ${badgeClass}`}>{badgeLabel}</span>
                  </div>
                  <div className="acc-article-excerpt">{a.excerpt}</div>
                  <div className="acc-card-actions" onClick={e => e.stopPropagation()}>
                    <span className="acc-card-meta">{a.meta}</span>
                    <div className="acc-card-actions-right">
                      <button className="acc-btn-edit" onClick={() => handleEditArticle(a)}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                        Редактировать
                      </button>
                      <button className="acc-btn-visibility acc-btn-delete-gray"
                        onClick={e => { e.stopPropagation(); handleDeleteArticle(a) }}>
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          )
        })()}

        {/* Sets */}
        {tab === 'sets' && (
          <div className="acc-panel">
            <div className="panel-header">
              <span className="panel-title">Наборы, которые вы создали</span>
              <button className="acc-btn-primary" onClick={() => navigate('/create-set')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Создать набор
              </button>
            </div>


            {sets.length > 0 && (() => {
              const SET_TYPE_FILTERS = [
                { id: null,      label: 'Все' },
                { id: 'public',  label: 'Публичный' },
                { id: 'private', label: 'Личный' },
                { id: 'draft',   label: 'Черновик' },
              ]
              const byType = setTypeFilter === null ? sets
                : setTypeFilter === 'public'  ? sets.filter(s => s.pub && !s.draft)
                : setTypeFilter === 'private' ? sets.filter(s => !s.pub && !s.draft)
                : sets.filter(s => !!s.draft)
              const availCats = [...new Set(byType.map(s => s.category).filter(Boolean))]
              return (
                <div className="acc-filters">
                  <div className="acc-filter-row">
                    {SET_TYPE_FILTERS.map(f => (
                      <button key={String(f.id)} className={`acc-filter-pill${setTypeFilter === f.id ? ' active' : ''}`}
                        onClick={() => { setSetTypeFilter(f.id); setSetCatFilter(null) }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {setTypeFilter !== null && availCats.length > 0 && (
                    <div className="acc-filter-row acc-filter-row--cats">
                      {availCats.map(cat => (
                        <button key={cat} className={`acc-filter-pill acc-filter-pill--cat${setCatFilter === cat ? ' active' : ''}`}
                          onClick={() => setSetCatFilter(prev => prev === cat ? null : cat)}>
                          {SET_CATEGORIES[cat] || cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            {sets.length === 0 && (
              <div className="acc-empty">
                <div className="acc-empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="9" height="9" rx="1.5"/><rect x="13" y="3" width="9" height="9" rx="1.5"/><rect x="2" y="13" width="9" height="9" rx="1.5"/><rect x="13" y="13" width="9" height="9" rx="1.5"/>
                  </svg>
                </div>
                <div className="acc-empty-title">Нет наборов</div>
                <div className="acc-empty-desc">Создайте первый набор или добавьте готовый из каталога</div>
              </div>
            )}

            <div className="catalog-grid">
              {(() => {
                const byType = setTypeFilter === null ? sets
                  : setTypeFilter === 'public'  ? sets.filter(s => s.pub && !s.draft)
                  : setTypeFilter === 'private' ? sets.filter(s => !s.pub && !s.draft)
                  : sets.filter(s => !!s.draft)
                const filtered = setCatFilter ? byType.filter(s => s.category === setCatFilter) : byType
                return filtered
              })().map(s => (
                <AccSetCard key={s.id} s={s}
                  onDelete={handleDeleteSet}
                  onEdit={handleEditSet}
                  navigate={navigate} />
              ))}
            </div>
          </div>
        )}

        {/* Whispers */}
        {tab === 'whispers' && (
          <div className="acc-panel">
            <div className="panel-header">
              <span className="panel-title">Скидки и промокоды, которые вы добавили</span>
              <button className="acc-btn-primary" onClick={() => navigate('/create-whisper')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Создать купон
              </button>
            </div>

            {whispers.length === 0 && (
              <div className="acc-empty">
                <div className="acc-empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
                  </svg>
                </div>
                <div className="acc-empty-title">Нет записей</div>
                <div className="acc-empty-desc">Делитесь скидками и промокодами в разделе Промо → Промо</div>
              </div>
            )}

            {whispers.map(w => (
              <AccWhisperCard key={w.id} w={w} onDelete={wh => setConfirmWhisper(wh)} />
            ))}
          </div>
        )}

        {/* Subscriptions */}
        {tab === 'subs' && (
          <SubsTab subs={subs} onUnsub={handleUnsubscribe} navigate={navigate} />
        )}

        {/* Companies */}
        {tab === 'companies' && (
          <div className="acc-panel">
            <div className="panel-header">
              <span className="panel-title">Компании, чьи акции и рассылку вы видите в ленте</span>
              <button className="acc-btn-primary" onClick={() => navigate('/company-picker', { state: { edit: true } })}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Изменить
              </button>
            </div>
            <div className="acc-companies-empty">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <div className="acc-companies-empty-title">Компании не выбраны</div>
              <div className="acc-companies-empty-desc">Нажмите «Изменить», чтобы добавить компании в список</div>
            </div>
          </div>
        )}

      </main>

      {/* Delete article confirm */}
      <ConfirmModal
        open={!!confirmArticle}
        title="Удалить статью?"
        desc={confirmArticle ? `«${confirmArticle.title}» будет безвозвратно удалена.` : ''}
        onConfirm={confirmDeleteArticle}
        onCancel={() => setConfirmArticle(null)}
      />

      {/* Delete set confirm */}
      <ConfirmModal
        open={!!confirmSet}
        title="Удалить набор?"
        desc={confirmSet ? `«${confirmSet.name}» будет удалён из вашего профиля.` : ''}
        onConfirm={confirmDeleteSet}
        onCancel={() => setConfirmSet(null)}
      />

      {/* Delete whisper confirm */}
      <ConfirmModal
        open={!!confirmWhisper}
        title="Удалить запись?"
        desc={confirmWhisper ? `«${confirmWhisper.title}» будет удалена из раздела Промо.` : ''}
        onConfirm={confirmDeleteWhisperFn}
        onCancel={() => setConfirmWhisper(null)}
      />

      {/* Toast */}
      <div className={`toast${toast ? ' show' : ''}`}>
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {toast}
      </div>

      {showSpotlight && <SpotlightTour steps={ACC_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
    </Layout>
  )
}
