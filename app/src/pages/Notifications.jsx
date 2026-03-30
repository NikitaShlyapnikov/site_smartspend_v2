import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'
import { notifications as INIT_NOTIFS } from '../data/mock'

const NOTIF_SPOTLIGHT = [
  { targetId: 'sp-notif-header',  btnId: 'sp-notif-mark',   title: 'Заголовок',           desc: 'Кнопка «Прочитать все» отмечает все уведомления как прочитанные сразу.' },
  { targetId: 'sp-notif-filters', btnId: null,               title: 'Фильтры',             desc: 'Переключайся между типами: подписки, ответы на статьи и напоминания от инвентаря.' },
  { targetId: 'sp-notif-list',    btnId: null,               title: 'Уведомления',         desc: 'Новые уведомления выделены точкой. Нажми на уведомление — перейдёшь к нужному разделу.' },
]

// ── helpers ───────────────────────────────────────────────────────────────────

function loadRead() {
  try { return new Set(JSON.parse(localStorage.getItem('ss_notif_read') || '[]')) } catch { return new Set() }
}
function saveRead(set) {
  try {
    localStorage.setItem('ss_notif_read', JSON.stringify([...set]))
    window.dispatchEvent(new Event('notif-update'))
  } catch {}
}

// ── avatar ────────────────────────────────────────────────────────────────────

function NotifAvatar({ n }) {
  if (n.author) {
    return (
      <div className="notif-avatar" style={{ background: n.author.color }}>
        {n.author.initials}
      </div>
    )
  }
  return (
    <div className="notif-avatar notif-avatar-sys">
      <svg viewBox="0 0 16 16" fill="none" width="18" height="18">
        <rect x="2" y="2" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.8"/>
        <rect x="9" y="2" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.4"/>
        <rect x="2" y="9" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.4"/>
        <rect x="9" y="9" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.8"/>
      </svg>
    </div>
  )
}

// ── filter tabs ───────────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'all',       label: 'Все' },
  { id: 'subs',      label: 'Подписки' },
  { id: 'replies',   label: 'Ответы' },
  { id: 'reminders', label: 'Напоминания' },
]

function filterNotifs(list, tab) {
  if (tab === 'all') return list
  if (tab === 'subs')      return list.filter(n => n.type === 'subscriber-article' || n.type === 'subscriber-set' || n.type === 'new-set' || n.type === 'article')
  if (tab === 'replies')   return list.filter(n => n.type === 'comment-reply')
  if (tab === 'reminders') return list.filter(n => n.type === 'reminder')
  return list
}

// ── disco cube ────────────────────────────────────────────────────────────────

function DiscoCube({ onToast }) {
  return (
    <div className="disco-stage" onClick={onToast}>
      <div className="particles">
        <div className="beam" style={{'--bx':'48%','--bh':'180px','--bclr':'#FF6B9D44','--bd':'2.1s','--bdelay':'0s','--br1':'-20deg','--br2':'0deg','--br3':'20deg'}} />
        <div className="beam" style={{'--bx':'44%','--bh':'160px','--bclr':'#45D4FF44','--bd':'1.9s','--bdelay':'0.3s','--br1':'10deg','--br2':'-10deg','--br3':'5deg'}} />
        <div className="beam" style={{'--bx':'52%','--bh':'200px','--bclr':'#A78BFF44','--bd':'2.4s','--bdelay':'0.7s','--br1':'5deg','--br2':'25deg','--br3':'-5deg'}} />
        <div className="beam" style={{'--bx':'40%','--bh':'140px','--bclr':'#6BFF8E44','--bd':'1.7s','--bdelay':'1s','--br1':'-15deg','--br2':'5deg','--br3':'-25deg'}} />
        <div className="beam" style={{'--bx':'56%','--bh':'170px','--bclr':'#FFE04544','--bd':'2.2s','--bdelay':'0.5s','--br1':'20deg','--br2':'-5deg','--br3':'15deg'}} />
        <div className="spark" style={{left:'30%',top:'25%','--sz':'6px','--clr':'#FF6B9D','--d':'1.8s','--delay':'0s','--tx':'-20px','--ty':'-30px','--tx2':'-35px','--ty2':'-55px','--tx3':'-20px','--ty3':'-80px'}} />
        <div className="spark" style={{left:'65%',top:'30%','--sz':'5px','--clr':'#45D4FF','--d':'2.1s','--delay':'0.4s','--tx':'25px','--ty':'-25px','--tx2':'40px','--ty2':'-50px','--tx3':'20px','--ty3':'-75px'}} />
        <div className="spark" style={{left:'25%',top:'50%','--sz':'7px','--clr':'#FFE045','--d':'1.6s','--delay':'0.8s','--tx':'-30px','--ty':'-20px','--tx2':'-50px','--ty2':'-40px','--tx3':'-30px','--ty3':'-65px'}} />
        <div className="spark" style={{left:'70%',top:'45%','--sz':'5px','--clr':'#A78BFF','--d':'2.3s','--delay':'0.2s','--tx':'20px','--ty':'-35px','--tx2':'35px','--ty2':'-60px','--tx3':'15px','--ty3':'-85px'}} />
        <div className="spark" style={{left:'50%',top:'20%','--sz':'4px','--clr':'#FF9F45','--d':'1.9s','--delay':'1.1s','--tx':'15px','--ty':'-20px','--tx2':'25px','--ty2':'-45px','--tx3':'10px','--ty3':'-70px'}} />
        <div className="spark" style={{left:'38%',top:'60%','--sz':'6px','--clr':'#6BFF8E','--d':'2.0s','--delay':'0.6s','--tx':'-25px','--ty':'-15px','--tx2':'-40px','--ty2':'-35px','--tx3':'-20px','--ty3':'-60px'}} />
        <div className="spark" style={{left:'62%',top:'55%','--sz':'5px','--clr':'#FF4560','--d':'1.7s','--delay':'1.4s','--tx':'30px','--ty':'-18px','--tx2':'45px','--ty2':'-38px','--tx3':'25px','--ty3':'-62px'}} />
      </div>
      <div className="cell">
        <div style={{position:'relative',overflow:'visible'}}>
          <svg className="cube-svg cube-dance" width="80" height="80" viewBox="0 0 80 80" fill="none">
            <defs>
              <clipPath id="innerClip">
                <rect x="14" y="14" width="52" height="52" rx="10"/>
              </clipPath>
            </defs>
            <rect width="80" height="80" rx="18" fill="#0E0E0C"/>
            <rect className="inner-square" x="14" y="14" width="52" height="52" rx="10" fill="#EEEDE9"/>
            <g clipPath="url(#innerClip)" opacity="0.18">
              <line x1="14" y1="30" x2="66" y2="30" stroke="#0E0E0C" strokeWidth="0.8"/>
              <line x1="14" y1="46" x2="66" y2="46" stroke="#0E0E0C" strokeWidth="0.8"/>
              <line x1="30" y1="14" x2="30" y2="66" stroke="#0E0E0C" strokeWidth="0.8"/>
              <line x1="46" y1="14" x2="46" y2="66" stroke="#0E0E0C" strokeWidth="0.8"/>
            </g>
          </svg>
        </div>
        <div className="shadow-disco" />
      </div>
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function Notifications() {
  const navigate = useNavigate()
  const [readIds, setReadIds] = useState(loadRead)
  const [filter, setFilter] = useState('all')
  const [showSpotlight, setShowSpotlight] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const toastTimer = useRef(null)

  function handleCubeClick() {
    clearTimeout(toastTimer.current)
    setShowToast(true)
    toastTimer.current = setTimeout(() => setShowToast(false), 3000)
  }

  // On unmount — persist reads
  useEffect(() => {
    return () => saveRead(readIds)
  }, [readIds])

  function markRead(id) {
    setReadIds(prev => {
      const next = new Set(prev)
      next.add(id)
      saveRead(next)
      return next
    })
  }

  function markAllRead() {
    const next = new Set(INIT_NOTIFS.map(n => n.id))
    setReadIds(next)
    saveRead(next)
  }

  const withRead = INIT_NOTIFS.map(n => ({ ...n, unread: n.unread && !readIds.has(n.id) }))
  const filtered = filterNotifs(withRead, filter)
  const unreadFiltered = filtered.filter(n => n.unread)
  const readFiltered   = filtered.filter(n => !n.unread)
  const totalUnread    = withRead.filter(n => n.unread).length

  return (
    <Layout>
      <main className="notif-main">

        {/* Header */}
        <div id="sp-notif-header" className="notif-header">
          <div>
            <div className="page-title" style={{display:'flex',alignItems:'center',gap:10}}>
              Уведомления
              <HelpButton seenKey="ss_spl_notif" onOpen={() => setShowSpotlight(true)} />
            </div>
            <div className="page-subtitle">Новости, ответы и напоминания</div>
          </div>
          {totalUnread > 0 && (
            <button id="sp-notif-mark" className="notif-mark-all-btn" onClick={markAllRead}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Прочитать все
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div id="sp-notif-filters" className="notif-filters">
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`notif-filter-btn${filter === f.id ? ' active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Disco cube */}
        <DiscoCube onToast={handleCubeClick} />

        {/* List */}
        <div id="sp-notif-list" className="notif-scroll">
          {unreadFiltered.length > 0 && (
            <>
              <div className="notif-group-label">Новые</div>
              {unreadFiltered.map(n => (
                <NotifItem key={n.id} n={n} onRead={() => markRead(n.id)} navigate={navigate} />
              ))}
            </>
          )}

          {readFiltered.length > 0 && (
            <>
              <div className="notif-group-label" style={{ marginTop: unreadFiltered.length > 0 ? 20 : 0 }}>
                {unreadFiltered.length > 0 ? 'Ранее' : 'Прочитанные'}
              </div>
              {readFiltered.map(n => (
                <NotifItem key={n.id} n={n} onRead={() => markRead(n.id)} navigate={navigate} />
              ))}
            </>
          )}

          {filtered.length === 0 && (
            <div className="notif-empty">
              <div className="notif-empty-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
              </div>
              <div className="notif-empty-title">Нет уведомлений</div>
              <div className="notif-empty-desc">В этой категории пока ничего нет</div>
            </div>
          )}
        </div>
      {showSpotlight && <SpotlightTour steps={NOTIF_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
      {showToast && <div className="disco-toast">С первым уведомлением!</div>}
      </main>
    </Layout>
  )
}

function NotifItem({ n, onRead, navigate }) {
  function handleClick() {
    if (n.unread) onRead()
    if (n.type === 'reminder') navigate('/inventory')
    else if (n.type === 'subscriber-article' || n.type === 'article') navigate('/feed')
    else if (n.type === 'subscriber-set' || n.type === 'new-set') navigate('/catalog')
    else if (n.type === 'comment-reply') navigate('/feed')
  }

  return (
    <div className={`notif-item${n.unread ? ' unread' : ''}`} onClick={handleClick}>
      <div className="notif-item-icons">
        <NotifAvatar n={n} />
      </div>
      <div className="notif-body">
        <div className="notif-title">{n.title}</div>
        <div className="notif-desc">{n.desc}</div>
        <div className="notif-time">{n.time}</div>
      </div>
      {n.unread && <div className="notif-dot" />}
    </div>
  )
}
