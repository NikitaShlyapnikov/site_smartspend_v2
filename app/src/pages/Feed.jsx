import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'
import { feedItems, feedAuthors, companies, promoItems } from '../data/mock'

const FEED_SPOTLIGHT = [
  { targetId: 'sp-feed-filters', btnId: null,              title: 'Фильтры и категории',  desc: 'Выбирай категории, тип контента и сортировку — лента подстроится под твои интересы.' },
  { targetId: 'sp-feed-list',    btnId: null,              title: 'Лента статей и наборов', desc: 'Статьи от авторов и готовые наборы из каталога. Нажми на карточку, чтобы открыть подробности.' },
]

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const MODES = [
  { id: 'unread',        label: 'Непрочитанное' },
  { id: 'subscriptions', label: 'Подписки' },
  { id: 'my-sets',       label: 'Мои наборы' },
  { id: 'liked',         label: 'Понравившиеся' },
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

const SORT_OPTIONS = [
  { group: 'Новизна',         id: 'newest',      label: 'Сначала новые' },
  { group: 'По популярности', id: 'popular_7d',  label: 'За 7 дней' },
  { group: 'По популярности', id: 'popular_30d', label: 'За месяц' },
  { group: 'По популярности', id: 'popular_all', label: 'За всё время' },
]

const ACTS_FILTERS = [
  { id: 'all',         label: 'Все' },
  { id: 'new_clients', label: 'Новым клиентам' },
  { id: 'referral',    label: 'Приведи друга' },
  { id: 'birthday',    label: 'День рождения' },
  { id: 'holiday',     label: 'Праздник' },
  { id: 'regular',     label: 'Обычная' },
]

// Build a flat lookup: companyId → company object
const COMPANY_MAP = Object.values(companies).flatMap(c => c.list).reduce((m, c) => { m[c.id] = c; return m }, {})

function loadFollowed() {
  try { return new Set(JSON.parse(localStorage.getItem('ss_companies') || '[]')) }
  catch { return new Set() }
}

const MY_SET_TITLES = new Set([
  'Корейский уход за кожей',
  'Базовый гардероб на сезон',
  'Базовое питание',
  'Базовый уход за кошкой',
])

// ── ARTICLE CARD ──────────────────────────────────────────────────────────────

function AuthorChip({ author, authorId, navigate }) {
  if (!author) return null

  function handleAuthorClick(e) {
    e.stopPropagation()
    navigate(`/author/${authorId}`, { state: { ...author, id: authorId } })
  }

  if (author.type === 'anonymous') {
    return (
      <button className="author-chip" onClick={handleAuthorClick}>
        <div className="author-avatar-sm" style={{ background: author.color }}>{author.initials}</div>
        <span className="author-name-inline">{author.name}</span>
      </button>
    )
  }

  if (author.type === 'deleted') {
    return (
      <button className="author-chip author-chip--ghost" onClick={handleAuthorClick} title="Аккаунт удалён">
        <span className="author-avatar-sm author-avatar-ghost">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a8 8 0 0 0-8 8v10l3-3 3 3 3-3 3 3 3-3V10a8 8 0 0 0-8-8zm-2.5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
          </svg>
        </span>
        <span className="author-name-inline author-name--special">Привидение</span>
      </button>
    )
  }

  return (
    <button className="author-chip" onClick={handleAuthorClick}>
      <div className="author-avatar-sm" style={{ background: author.color }}>{author.initials}</div>
      <span className="author-name-inline">{author.name}</span>
    </button>
  )
}

function ArticleCard({ item, isRead, isLiked, isDisliked, onLikeToggle, onDislikeToggle, onClick, navigate }) {
  const author = feedAuthors[item.authorId]
  return (
    <div className={`card${isRead ? ' read' : ''}`} onClick={() => onClick(item)}>
      <div className="article-body">
        <div className="article-header">
          <div className="article-header-top">
            <AuthorChip author={author} authorId={item.authorId} navigate={navigate} />
            <span className="article-time-chip">{item.time}</span>
          </div>
          <div className="article-title">{item.title}</div>
        </div>
        <div className="article-preview">{item.preview}</div>
      </div>
      <div className="article-footer">
        <div className="vote-row">
          <button
            className={`liked-btn${isLiked ? ' liked' : ''}`}
            onClick={e => { e.stopPropagation(); onLikeToggle(item.id) }}
          >
            <svg width="13" height="13" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
            {item.likes + (isLiked ? 1 : 0)}
          </button>
          <button
            className={`liked-btn disliked-btn${isDisliked ? ' disliked' : ''}`}
            onClick={e => { e.stopPropagation(); onDislikeToggle(item.id) }}
          >
            <svg width="13" height="13" fill={isDisliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
              <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
            </svg>
            {(item.dislikes || 0) + (isDisliked ? 1 : 0)}
          </button>
        </div>
        {item.comments != null && (
          <div className="a-stat">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {item.comments}
          </div>
        )}
        <div className="a-stat">
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          {item.views.toLocaleString('ru')}
        </div>
        <div className="f-spacer" />
        {item.setLink && (
          <div className="set-link">
            <div className="set-dot" style={{ background: item.setLink.color }} />
            <span className="set-link-label">Набор: {item.setLink.title}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── SORT DROPDOWN ─────────────────────────────────────────────────────────────

function SortDropdown({ sort, onSort }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = SORT_OPTIONS.find(o => o.id === sort)
  const groups = [...new Set(SORT_OPTIONS.map(o => o.group))]

  function pick(id) { onSort(id); setOpen(false) }

  return (
    <div className="sort-wrap" ref={ref}>
      <span className="sort-label-txt">Сортировка:</span>
      <button className={`sort-btn${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span>{current?.label || 'По популярности'}</span>
        <svg className="sort-btn-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div className={`sort-dropdown${open ? ' open' : ''}`}>
        {groups.map((grp, gi) => (
          <div key={grp}>
            {gi > 0 && <div className="sort-divider" />}
            <div className="sort-group-label">{grp}</div>
            {SORT_OPTIONS.filter(o => o.group === grp).map(opt => (
              <div
                key={opt.id}
                className={`sort-option${sort === opt.id ? ' active' : ''}`}
                onClick={() => pick(opt.id)}
              >
                {opt.label}
                <svg className="sort-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── BROADCAST CARD ────────────────────────────────────────────────────────────

function BroadcastCard({ item }) {
  const company = COMPANY_MAP[item.companyId]
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="broadcast-card"
      onClick={e => e.stopPropagation()}
    >
      <div className="broadcast-company-row">
        <div className="promo-logo" style={{ background: company?.color }}>{company?.abbr}</div>
        <div className="promo-company-info">
          <div className="promo-company-name">{company?.name}</div>
          <div className="promo-expires">{item.channel} · {item.time}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </div>
      <div className="broadcast-text">{item.text}</div>
    </a>
  )
}

// ── PROMO CARD ────────────────────────────────────────────────────────────────

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
        <div className="promo-company-row">
          <div className="promo-logo" style={{ background: company?.color }}>
            {company?.abbr}
          </div>
          <div className="promo-company-info">
            <div className="promo-company-name">{company?.name}</div>
            <div className="promo-expires">до {item.expires}</div>
          </div>
          <div className={`promo-type-badge promo-type-badge--${item.type}`}>
            {item.type === 'event' ? 'Акция' : 'Купон'}
          </div>
        </div>
        <div className="promo-title">{item.title}</div>
        <div className="promo-desc">{item.desc}</div>
      </div>
      {item.type === 'coupon' && item.code && (
        <div className="promo-code-row">
          <div className="promo-code">{item.code}</div>
          <button className="promo-copy-btn" onClick={copyCode}>
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Скопировано
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

// ── PROMO SECTION (content only, filters live in Feed) ────────────────────────

function PromoSection({ navigate, followed, hasSetup, promoCat, promoType, promoScope, actsFilter }) {
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
        <div className="promo-empty-desc">
          Подпишитесь на компании, чьи акции и купоны хотите видеть в ленте
        </div>
        <button className="promo-empty-btn" onClick={() => navigate('/company-picker')}>
          Подобрать компании
        </button>
      </div>
    )
  }

  const pool  = promoScope === 'mine' ? promoItems.filter(p => followed.has(p.companyId)) : promoItems
  const byCat = promoCat === 'all'    ? pool        : pool.filter(p => p.category === promoCat)

  if (promoType === 'broadcast') {
    const items = byCat.filter(p => p.type === 'broadcast')
    return (
      <div className="feed-list">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📬</div>
            <div className="empty-title">Рассылок нет</div>
            <div className="empty-desc">Компании из выбранных категорий пока не публиковали рассылку</div>
          </div>
        ) : items.map(item => <BroadcastCard key={item.id} item={item} />)}
      </div>
    )
  }

  const events   = byCat.filter(p => p.type !== 'broadcast')
  const filtered = actsFilter === 'all' ? events : events.filter(p => p.promo_filter === actsFilter)
  return (
    <div className="feed-list">
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏷️</div>
          <div className="empty-title">Пока ничего нет</div>
          <div className="empty-desc">Акций и купонов по выбранным фильтрам не найдено</div>
        </div>
      ) : filtered.map(item => (
        <PromoCard key={item.id} item={item} />
      ))}
    </div>
  )
}

// ── WELCOME TOUR ───────────────────────────────────────────────────────────────

function WMockup({ title, children }) {
  return (
    <div className="tour-mockup">
      <div className="tour-mockup-bar">
        <span className="tour-mockup-dot"/><span className="tour-mockup-dot"/><span className="tour-mockup-dot"/>
        <span className="tour-mockup-label">{title}</span>
      </div>
      <div className="tour-mockup-body">{children}</div>
    </div>
  )
}

const WIllust1 = () => (
  <WMockup title="SmartSpend / Профиль">
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      {[['#B8A0C8','Одежда и обувь','12 000 ₽'],['#8DBFA8','Еда и супермаркеты','22 000 ₽'],['#9EA8C0','Дом и техника','8 000 ₽'],['#B8C49A','Здоровье','5 000 ₽']].map(([c,n,a])=>(
        <div key={n} className="tour-mk-env-item" style={{borderLeft:`3px solid ${c}`}}>
          <span className="tour-mk-env-dot" style={{background:c}}/>
          {n}
          <span className="tour-mk-env-amt">{a}</span>
        </div>
      ))}
    </div>
    <div style={{fontSize:10,color:'var(--text-3)',textAlign:'center',paddingTop:2}}>4 конверта · 47 000 ₽/мес</div>
  </WMockup>
)

const WIllust2 = () => (
  <WMockup title="Конверт: Одежда и обувь">
    <div className="tour-mk-env-card" style={{borderColor:'#B8A0C8'}}>
      <div className="tour-mk-env-head"><span className="tour-mk-env-dot" style={{background:'#B8A0C8'}}/>Одежда и обувь<span className="tour-mk-env-amt">12 000 ₽/мес</span></div>
      <div style={{height:4,background:'var(--border)',borderRadius:4,overflow:'hidden',margin:'2px 0 4px'}}>
        <div style={{width:'75%',height:'100%',background:'#B8A0C8',borderRadius:4}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--text-3)'}}>
        <span>9 000 ₽ отложено</span><span>осталось 3 000 ₽</span>
      </div>
    </div>
    <div className="tour-mk-fin-rows" style={{marginTop:2}}>
      {[['Январь','100%','#4E8268'],['Февраль','100%','#4E8268'],['Март','60%','#B08840']].map(([m,w,c])=>(
        <div key={m} className="tour-mk-fin-row">
          <span className="tour-mk-fin-lbl">{m}</span>
          <span className="tour-mk-fin-bar"><span style={{width:w,background:c}}/></span>
          <span className="tour-mk-fin-val">{w}</span>
        </div>
      ))}
    </div>
  </WMockup>
)

const WIllust3 = () => (
  <WMockup title="SmartSpend / Каталог">
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      {[['Базовый гардероб на сезон','Одежда','8 000 ₽',true],['Здоровое питание на месяц','Еда','18 000 ₽',false],['Домашняя аптечка','Здоровье','3 500 ₽',false]].map(([n,c,a,added])=>(
        <div key={n} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 10px',display:'flex',alignItems:'center',gap:8}}>
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--text)',letterSpacing:'-0.01em'}}>{n}</div>
            <div style={{fontSize:9,color:'var(--text-3)',marginTop:2}}>{c} · {a}</div>
          </div>
          <div style={{fontSize:9,fontWeight:600,padding:'3px 8px',borderRadius:6,
            background: added ? 'var(--accent-green-light)' : 'var(--surface-2)',
            color: added ? 'var(--accent-green)' : 'var(--text-3)',
            border: `1px solid ${added ? 'var(--accent-green-border)' : 'var(--border)'}`,
            whiteSpace:'nowrap'}}>
            {added ? '✓ Добавлен' : '+ Добавить'}
          </div>
        </div>
      ))}
    </div>
  </WMockup>
)

const WIllust4 = () => (
  <WMockup title="SmartSpend / Инвентарь">
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      {[
        {name:'Кроссовки Nike',days:'через 180 дней',pct:15,c:'var(--status-ok)'},
        {name:'Зимняя куртка',days:'через 42 дня',pct:72,c:'var(--status-soon)'},
        {name:'Протеин Whey',days:'через 3 дня',pct:92,c:'var(--status-urgent)'},
      ].map(({name,days,pct,c})=>(
        <div key={name} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'7px 10px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{fontSize:10,fontWeight:600,color:'var(--text)'}}>{name}</span>
            <span style={{fontSize:9,color:c,fontWeight:500}}>{days}</span>
          </div>
          <div style={{height:3,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
            <div style={{width:`${pct}%`,height:'100%',background:c,borderRadius:3}}/>
          </div>
        </div>
      ))}
    </div>
    <div style={{fontSize:10,color:'var(--text-3)',textAlign:'center',paddingTop:2}}>Инвентарь предупредит о покупке заранее</div>
  </WMockup>
)

const WIllust5 = () => (
  <WMockup title="SmartSpend / Профиль">
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8}}>
        <div style={{flex:1,fontSize:10,color:'var(--text-2)'}}>Конверты (47 000 ₽)</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        <div style={{fontSize:10,color:'var(--text-2)'}}>расходы</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'var(--accent-green-light)',border:'1px solid var(--accent-green-border)',borderRadius:8}}>
        <div style={{flex:1,fontSize:10,fontWeight:600,color:'var(--accent-green)'}}>Остаток (24 000 ₽)</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        <div style={{fontSize:10,fontWeight:600,color:'var(--accent-green)'}}>накопления</div>
      </div>
      <div className="tour-mk-block" style={{textAlign:'center'}}>
        <div className="tour-mk-block-lbl">Размер капитала</div>
        <div className="tour-mk-block-num" style={{fontSize:16}}>186 400 ₽</div>
        <div className="tour-mk-block-sub" style={{color:'var(--accent-green)'}}>↑ растёт каждый месяц</div>
      </div>
    </div>
  </WMockup>
)

const WIllust6 = () => (
  <WMockup title="SmartSpend / EmoSpend">
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <div style={{display:'flex',gap:6}}>
        <div className="tour-mk-block" style={{flex:1}}>
          <div className="tour-mk-block-lbl">Капитал</div>
          <div className="tour-mk-block-num">186 400 ₽</div>
          <div className="tour-mk-block-sub">доходность 5%</div>
        </div>
        <div style={{display:'flex',alignItems:'center',color:'var(--text-3)'}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
        <div className="tour-mk-block tour-mk-block--emo" style={{flex:1}}>
          <div className="tour-mk-block-lbl">EmoSpend</div>
          <div className="tour-mk-block-num">775 ₽</div>
          <div className="tour-mk-block-sub">в месяц</div>
        </div>
      </div>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 10px',fontSize:10,color:'var(--text-2)',lineHeight:1.5}}>
        Трать на <strong style={{color:'var(--text)'}}>импульсивные покупки</strong> и <strong style={{color:'var(--text)'}}>непредвиденные расходы</strong> — капитал продолжит расти
      </div>
    </div>
  </WMockup>
)

const WIllust7 = () => {
  const points = [18,22,20,26,24,30,28,36,34,42]
  const max = 42, min = 18, w = 300, h = 70
  const xs = points.map((_,i) => (i/(points.length-1))*w)
  const ys = points.map(v => h - ((v-min)/(max-min))*(h-8) - 4)
  const d = points.map((_, i) => `${i===0?'M':'L'}${xs[i].toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const fill = `${d} L${w},${h} L0,${h} Z`
  return (
    <WMockup title="Рост накоплений">
      <div style={{position:'relative',borderRadius:8,overflow:'hidden',background:'var(--surface)',border:'1px solid var(--border)',padding:'10px 12px 8px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
          <div><div style={{fontSize:9,color:'var(--text-3)'}}>Капитал через 3 года</div><div style={{fontFamily:'var(--mono)',fontSize:14,fontWeight:600,color:'var(--accent-green)',letterSpacing:'-0.02em'}}>320 000 ₽</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:9,color:'var(--text-3)'}}>Ежемес. взнос</div><div style={{fontFamily:'var(--mono)',fontSize:14,fontWeight:600,color:'var(--text)',letterSpacing:'-0.02em'}}>24 000 ₽</div></div>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height:70,display:'block'}}>
          <defs>
            <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={fill} fill="url(#wg)"/>
          <path d={d} fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="4" fill="var(--accent-green)"/>
        </svg>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'var(--text-3)',marginTop:2}}>
          <span>Сейчас</span><span>+1 год</span><span>+2 года</span><span>+3 года</span>
        </div>
      </div>
    </WMockup>
  )
}

const WELCOME_STEPS = [
  { illust: <WIllust1/>, title: 'Система конвертов', desc: 'SmartSpend построен на конвертах. Конверт — это направление трат: еда, одежда, техника и другие. Каждый месяц вы откладываете нужную сумму в каждый конверт.' },
  { illust: <WIllust2/>, title: 'Откладывайте регулярно', desc: 'Каждый месяц пополняйте конверты в рамках запланированной суммы. Система покажет, сколько уже отложено и сколько осталось до цели.' },
  { illust: <WIllust3/>, title: 'Наборы определяют суммы', desc: 'Выбирайте наборы из каталога, которые описывают ваш образ жизни, или создавайте собственные. Наборы автоматически рассчитают нужную сумму для каждого конверта.' },
  { illust: <WIllust4/>, title: 'Планирование покупок', desc: 'Наборы и инвентарь помогают планировать покупки заранее. Система предупредит, когда подходит время заменить вещь — никаких сюрпризов и импульсивных трат.' },
  { illust: <WIllust5/>, title: 'Остаток идёт в накопления', desc: 'Всё, что остаётся после конвертов, автоматически уходит в накопления. Чем точнее спланированы конверты — тем быстрее растёт ваш капитал.' },
  { illust: <WIllust6/>, title: 'EmoSpend — доход от капитала', desc: 'Накопления приносят доход. Этот доход называется EmoSpend — его можно смело тратить на импульсивные желания или непредвиденные расходы, не трогая капитал.' },
  { illust: <WIllust7/>, title: 'Капитал растёт предсказуемо', desc: 'Придерживайтесь системы — и накопления будут расти стабильно каждый месяц. Через несколько лет капитал начнёт работать на вас самостоятельно.' },
]

function WelcomeTour({ onClose }) {
  const [step, setStep] = useState(0)
  const current = WELCOME_STEPS[step]
  const isLast = step === WELCOME_STEPS.length - 1

  function finish() {
    localStorage.setItem('ss_tour_welcome', '1')
    onClose()
  }

  return (
    <div className="tour-overlay" onClick={finish}>
      <div className="tour-modal tour-modal--wide" onClick={e => e.stopPropagation()}>
        <button className="tour-close" onClick={finish} aria-label="Закрыть">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/>
          </svg>
        </button>
        <div className="tour-illust">{current.illust}</div>
        <div className="tour-step-dots">
          {WELCOME_STEPS.map((_, i) => (
            <span key={i} className={`tour-dot${i === step ? ' active' : ''}`} onClick={() => setStep(i)} />
          ))}
        </div>
        <div className="tour-title">{current.title}</div>
        <div className="tour-desc">{current.desc}</div>
        <div className="tour-actions">
          {step > 0
            ? <button className="tour-btn-back" onClick={() => setStep(s => s - 1)}>Назад</button>
            : <button className="tour-btn-back" onClick={finish}>Пропустить всё</button>
          }
          <button className="tour-btn-next" onClick={isLast ? finish : () => setStep(s => s + 1)}>
            {isLast ? 'Начать' : 'Далее'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function Feed() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('ss_tour_welcome'))
  const [showSpotlight, setShowSpotlight] = useState(false)
  const [section,     setSection]     = useState(() => location.state?.promo ? 'promo' : 'articles')
  const [mode,        setMode]        = useState(null)
  const [cat,         setCat]         = useState('all')
  const [sort,        setSort]        = useState('popular_7d')
  // promo state
  const [followed]                    = useState(loadFollowed)
  const hasPromoSetup                 = !!localStorage.getItem('ss_promo_setup')
  const [promoCat,    setPromoCat]    = useState('all')
  const [promoType,   setPromoType]   = useState('broadcast')
  const [promoScope,  setPromoScope]  = useState('mine')
  const [actsFilter,  setActsFilter]  = useState('all')
  const [readIds, setReadIds] = useState(new Set())
  const [likedIds, setLikedIds] = useState(new Set())
  const [dislikedIds, setDislikedIds] = useState(new Set())

  function markRead(id) {
    setReadIds(prev => new Set([...prev, id]))
  }

  function toggleLike(id) {
    setLikedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setDislikedIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  function toggleDislike(id) {
    setDislikedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setLikedIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  function toggleMode(m) {
    setMode(prev => prev === m ? null : m)
  }

  let filtered = feedItems.filter(item => {
    if (mode === 'liked')         return item.type === 'article' && likedIds.has(item.id)
    if (mode === 'subscriptions') return !!(item.authorId && feedAuthors[item.authorId]?.following)
    if (mode === 'my-sets')       return item.type === 'article' && item.setLink && MY_SET_TITLES.has(item.setLink.title)
    if (mode === 'unread')        { if (readIds.has(item.id)) return false }

    if (cat !== 'all' && item.category !== cat) return false
    return true
  })

  filtered = [...filtered].sort(
    sort === 'newest' ? (a, b) => b.ts - a.ts : (a, b) => b.pop - a.pop
  )

  const hasFilters = mode || cat !== 'all' || sort !== 'popular_7d'

  function resetFilters() {
    setMode(null); setCat('all'); setSort('popular_7d')
  }

  const hasPromoFilters = promoCat !== 'all' || promoType !== 'broadcast' || promoScope !== 'mine' || actsFilter !== 'all'

  function resetPromoFilters() {
    setPromoCat('all'); setPromoType('broadcast'); setPromoScope('mine'); setActsFilter('all')
  }

  const promoPool    = hasPromoSetup && (promoScope !== 'mine' || followed.size > 0)
    ? (promoScope === 'mine' ? promoItems.filter(p => followed.has(p.companyId)) : promoItems)
    : []
  const promoByCat   = promoCat === 'all' ? promoPool : promoPool.filter(p => p.category === promoCat)
  const promoCount   = promoType === 'broadcast'
    ? promoByCat.filter(p => p.type === 'broadcast').length
    : (actsFilter === 'all'
      ? promoByCat.filter(p => p.type !== 'broadcast').length
      : promoByCat.filter(p => p.type !== 'broadcast' && p.promo_filter === actsFilter).length)

  function handleItemClick(item) {
    markRead(item.id)
    if (item.type === 'set') navigate(`/set/${item.id}`)
    else navigate(`/article/${item.id}`)
  }

  return (
    <Layout>
      <main className="feed-main">
        <div className="page-header">
          <div className="page-title" style={{display:'flex',alignItems:'center',gap:10}}>
            Лента
            <HelpButton seenKey="ss_spl_feed" onOpen={() => setShowSpotlight(true)} />
          </div>
        </div>

        {/* Section switcher */}
        <div className="feed-section-switcher">
          <button
            className={`feed-section-card${section === 'articles' ? ' active' : ''} articles`}
            onClick={() => setSection('articles')}
          >
            <div className="feed-section-icon articles">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <div className="feed-section-text">
              <div className="feed-section-title">Статьи</div>
              <div className="feed-section-sub">авторы сообщества</div>
            </div>
          </button>
          <button
            className={`feed-section-card${section === 'promo' ? ' active' : ''} promo`}
            onClick={() => setSection('promo')}
          >
            <div className="feed-section-icon promo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <div className="feed-section-text">
              <div className="feed-section-title">Промо</div>
              <div className="feed-section-sub">акции и купоны</div>
            </div>
          </button>
        </div>

        {section === 'articles' ? (
          <>
            <div id="sp-feed-filters" className="filters-sticky">
              <div className="filters-block">
                {/* Row 1: categories */}
                <div className="cats-scroll">
                  {CATEGORIES.map(c => (
                    <button key={c.id} className={`cat-pill${cat === c.id ? ' active' : ''}`}
                      onClick={() => setCat(c.id)}>{c.label}</button>
                  ))}
                </div>

                {/* Row 2: modes + sort in one row */}
                <div className="filters-mode-row">
                  <div className="tab-group">
                    {MODES.map(m => (
                      <button key={m.id} className={`tab-btn${mode === m.id ? ' active' : ''}`}
                        onClick={() => toggleMode(m.id)}>{m.label}</button>
                    ))}
                  </div>
                  <SortDropdown sort={sort} onSort={setSort} />
                </div>
              </div>
            </div>

            <div className="feed-scroll">
              {hasFilters && (
                <div className="filter-summary">
                  <span>{filtered.length} {noun(filtered.length)}</span>
                  <button className="reset-btn" onClick={resetFilters}>Сбросить</button>
                </div>
              )}

              <div id="sp-feed-list" className="feed-list">
                {filtered.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <div className="empty-title">Ничего не найдено</div>
                    <div className="empty-desc">Попробуйте изменить фильтры</div>
                  </div>
                ) : filtered.map(item => (
                  <ArticleCard key={item.id} item={item}
                    isRead={readIds.has(item.id)}
                    isLiked={likedIds.has(item.id)}
                    isDisliked={dislikedIds.has(item.id)}
                    onLikeToggle={toggleLike}
                    onDislikeToggle={toggleDislike}
                    onClick={handleItemClick}
                    navigate={navigate}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="filters-sticky">
              <div className="filters-block">
                {/* Row 1: categories */}
                <div className="cats-scroll">
                  {CATEGORIES.map(c => (
                    <button key={c.id} className={`cat-pill${promoCat === c.id ? ' active' : ''}`}
                      onClick={() => setPromoCat(c.id)}>{c.label}</button>
                  ))}
                </div>

                {/* Row 2: content type + company scope */}
                <div className="filters-mode-row">
                  <div className="tab-group">
                    <button className={`tab-btn${promoType === 'broadcast' ? ' active' : ''}`}
                      onClick={() => setPromoType('broadcast')}>Рассылка</button>
                    <button className={`tab-btn${promoType === 'events' ? ' active' : ''}`}
                      onClick={() => setPromoType('events')}>Акции</button>
                  </div>
                  <div className="promo-scope-row">
                    <div className="tab-group">
                      <button className={`tab-btn${promoScope === 'mine' ? ' active' : ''}`}
                        onClick={() => setPromoScope('mine')}>Мои компании</button>
                      <button className={`tab-btn${promoScope === 'all' ? ' active' : ''}`}
                        onClick={() => setPromoScope('all')}>Все компании</button>
                    </div>
                    <button
                      className="promo-settings-btn"
                      onClick={() => navigate('/company-picker', { state: { edit: true } })}
                      title="Изменить список компаний"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Row 3: acts filters (only for Акции) */}
                {promoType === 'events' && (
                  <div className="cats-scroll">
                    {ACTS_FILTERS.map(f => (
                      <button key={f.id} className={`cat-pill${actsFilter === f.id ? ' active' : ''}`}
                        onClick={() => setActsFilter(f.id)}>{f.label}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="feed-scroll">
              {hasPromoFilters && (
                <div className="filter-summary">
                  <span>{promoCount} {noun(promoCount)}</span>
                  <button className="reset-btn" onClick={resetPromoFilters}>Сбросить</button>
                </div>
              )}
              <PromoSection
                navigate={navigate}
                followed={followed}
                hasSetup={hasPromoSetup}
                promoCat={promoCat}
                promoType={promoType}
                promoScope={promoScope}
                actsFilter={actsFilter}
              />
            </div>
          </>
        )}
      </main>
      {showWelcome && <WelcomeTour onClose={() => setShowWelcome(false)} />}
      {showSpotlight && <SpotlightTour steps={FEED_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
    </Layout>
  )
}

function noun(n) {
  const m = n % 10, c = n % 100
  if (m === 1 && c !== 11) return 'материал'
  if (m >= 2 && m <= 4 && (c < 10 || c >= 20)) return 'материала'
  return 'материалов'
}
