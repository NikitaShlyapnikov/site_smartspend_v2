import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import SpotlightTour, { HelpButton } from '../components/SpotlightTour'
import { notifications as INIT_NOTIFS, articleRequests as INIT_REQUESTS } from '../data/mock'

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
  { id: 'requests',  label: 'Запросы' },
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
  const [deletedIds, setDeletedIds] = useState(new Set())
  const toastTimer = useRef(null)
  const [requests, setRequests] = useState(() =>
    INIT_REQUESTS.map(r => ({ ...r, messages: [...(r.messages || [])] }))
  )

  function deleteNotif(id, e) {
    e.stopPropagation()
    setDeletedIds(prev => new Set([...prev, id]))
  }

  function restoreDeleted() {
    setDeletedIds(new Set())
  }

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

  const [deletedReqIds, setDeletedReqIds] = useState(new Set())

  function updateRequest(id, patch) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  }
  function approveRequest(id) { updateRequest(id, { status: 'approved' }) }
  function rejectRequest(id)  { updateRequest(id, { status: 'rejected' }) }
  function withdrawRequest(id){ updateRequest(id, { status: 'withdrawn' }) }
  function deleteRequest(id)  { setDeletedReqIds(prev => new Set([...prev, id])) }
  function clearDeletedRequests() { setDeletedReqIds(new Set()) }
  function sendMessage(id, text) {
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, messages: [...r.messages, { from: 'me', text, time: 'только что' }] } : r
    ))
  }

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length
  const closedRequests  = requests.filter(r => r.status !== 'pending' && !deletedReqIds.has(r.id))
  const deletedRequests = requests.filter(r => deletedReqIds.has(r.id))

  const withRead = INIT_NOTIFS.map(n => ({ ...n, unread: n.unread && !readIds.has(n.id) }))
  const visible = withRead.filter(n => !deletedIds.has(n.id))
  const filtered = filterNotifs(visible, filter)
  const unreadFiltered = filtered.filter(n => n.unread)
  const readFiltered   = filtered.filter(n => !n.unread)
  const totalUnread    = visible.filter(n => n.unread).length

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
              {f.id === 'requests' && pendingRequestsCount > 0 && (
                <span className="notif-filter-badge">{pendingRequestsCount}</span>
              )}
            </button>
          ))}
          {deletedIds.size > 0 && (
            <button className="notif-deleted-pill" onClick={restoreDeleted}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
              </svg>
              Удалено: {deletedIds.size}
            </button>
          )}
        </div>

        {/* List */}
        <div id="sp-notif-list" className="notif-scroll">

          {filter === 'requests' ? (
            <>
              {requests.length === 0 ? (
                <div className="notif-empty">
                  <div className="notif-empty-icon">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div className="notif-empty-title">Нет запросов</div>
                  <div className="notif-empty-desc">Здесь появятся запросы на добавление статей в разделы дополнений</div>
                </div>
              ) : (
                <>
                  {requests.filter(r => r.status === 'pending').length > 0 && (
                    <>
                      <div className="notif-group-label">Ожидают решения</div>
                      {requests.filter(r => r.status === 'pending').map(r => (
                        <RequestCard
                          key={r.id} req={r}
                          onApprove={() => approveRequest(r.id)}
                          onReject={() => rejectRequest(r.id)}
                          onWithdraw={() => withdrawRequest(r.id)}
                          onSendMessage={text => sendMessage(r.id, text)}
                        />
                      ))}
                    </>
                  )}
                  {closedRequests.length > 0 && (
                    <>
                      <div className="notif-group-label" style={{ marginTop: requests.some(r => r.status === 'pending') ? 20 : 0 }}>Завершённые</div>
                      {closedRequests.map(r => (
                        <RequestCard
                          key={r.id} req={r}
                          onApprove={() => approveRequest(r.id)}
                          onReject={() => rejectRequest(r.id)}
                          onWithdraw={() => withdrawRequest(r.id)}
                          onSendMessage={text => sendMessage(r.id, text)}
                          onDelete={() => deleteRequest(r.id)}
                        />
                      ))}
                    </>
                  )}

                  {deletedRequests.length > 0 && (
                    <>
                      <div className="notif-group-label" style={{ marginTop: 20 }}>Удалённые</div>
                      <div className="req-trash-banner">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                        <span>Корзина автоматически очистится через 2 недели</span>
                        <button className="req-trash-clear-btn" onClick={clearDeletedRequests}>Очистить все</button>
                      </div>
                      {deletedRequests.map(r => (
                        <RequestCard
                          key={r.id} req={r}
                          onApprove={() => approveRequest(r.id)}
                          onReject={() => rejectRequest(r.id)}
                          onWithdraw={() => withdrawRequest(r.id)}
                          onSendMessage={text => sendMessage(r.id, text)}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {unreadFiltered.length > 0 && (
                <>
                  <div className="notif-group-label">Новые</div>
                  {unreadFiltered.map(n => (
                    <NotifItem key={n.id} n={n} onRead={() => markRead(n.id)} onDelete={e => deleteNotif(n.id, e)} navigate={navigate} />
                  ))}
                </>
              )}

              {readFiltered.length > 0 && (
                <>
                  <div className="notif-group-label" style={{ marginTop: unreadFiltered.length > 0 ? 20 : 0 }}>
                    {unreadFiltered.length > 0 ? 'Ранее' : 'Прочитанные'}
                  </div>
                  {readFiltered.map(n => (
                    <NotifItem key={n.id} n={n} onRead={() => markRead(n.id)} onDelete={e => deleteNotif(n.id, e)} navigate={navigate} />
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
            </>
          )}
        </div>
      {showSpotlight && <SpotlightTour steps={NOTIF_SPOTLIGHT} onClose={() => setShowSpotlight(false)} />}
      {showToast && <div className="disco-toast">С первым уведомлением!</div>}
      </main>
    </Layout>
  )
}

function UserPopup({ user }) {
  return (
    <div className="req-user-popup">
      <div className="req-user-popup-avatar" style={{ background: user.color }}>{user.initials}</div>
      <div className="req-user-popup-name">{user.name}</div>
      <div className="req-user-popup-nick">@{user.name.toLowerCase().replace(/\s+/, '.')}</div>
    </div>
  )
}

function ConfirmModal({ type, setTitle, onConfirm, onCancel }) {
  return createPortal(
    <div className="req-confirm-overlay" onClick={onCancel}>
      <div className="req-confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="req-confirm-icon">
          {type === 'approve'
            ? <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          }
        </div>
        <div className="req-confirm-title">
          {type === 'approve' ? 'Добавить статью?' : 'Отклонить статью?'}
        </div>
        <div className="req-confirm-desc">
          {type === 'approve'
            ? <>Статья будет добавлена в раздел дополнений набора <strong>«{setTitle}»</strong></>
            : <>Запрос будет отклонён. Автор получит уведомление.</>
          }
        </div>
        <div className="req-confirm-btns">
          <button className="req-confirm-cancel" onClick={onCancel}>Отмена</button>
          <button className={`req-confirm-ok${type === 'reject' ? ' req-confirm-ok--reject' : ''}`} onClick={onConfirm}>
            {type === 'approve' ? 'Добавить' : 'Отклонить'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function RequestCard({ req, onApprove, onReject, onWithdraw, onSendMessage, onDelete }) {
  const [showDiscuss, setShowDiscuss] = useState(false)
  const [msgInput, setMsgInput] = useState('')
  const [showUserPopup, setShowUserPopup] = useState(false)
  const [confirm, setConfirm] = useState(null) // 'approve' | 'reject' | null
  const inputRef = useRef(null)

  const isPending  = req.status === 'pending'
  const isIncoming = req.direction === 'incoming'
  const user = isIncoming ? req.fromUser : req.toUser

  function handleSend() {
    if (!msgInput.trim()) return
    onSendMessage(msgInput.trim())
    setMsgInput('')
  }

  function handleDiscussToggle() {
    setShowDiscuss(v => {
      if (!v) setTimeout(() => inputRef.current?.focus(), 80)
      return !v
    })
  }

  function handleConfirm() {
    if (confirm === 'approve') onApprove()
    else if (confirm === 'reject') onReject()
    setConfirm(null)
  }

  return (
    <div className={`req-card${isPending ? ' req-card--pending' : ' req-card--closed'}`}>

      {/* Status badge — top */}
      {!isPending && (
        <div className={`req-status-badge req-status-${req.status}`}>
          {req.status === 'approved'  && <>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Одобрено
          </>}
          {req.status === 'rejected'  && <>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            Отклонено
          </>}
          {req.status === 'withdrawn' && <>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 100-6"/></svg>
            Запрос отозван
          </>}
        </div>
      )}

      {/* Header */}
      <div className="req-card-header">
        <div
          className="req-avatar"
          style={{ background: user.color, cursor: 'pointer', position: 'relative' }}
          onMouseEnter={() => setShowUserPopup(true)}
          onMouseLeave={() => setShowUserPopup(false)}
        >
          {user.initials}
          {showUserPopup && <UserPopup user={user} />}
        </div>
        <div className="req-card-meta">
          <div className="req-card-title">
            {isIncoming ? (
              <>
                <span
                  className="req-user-name-link"
                  onMouseEnter={() => setShowUserPopup(true)}
                  onMouseLeave={() => setShowUserPopup(false)}
                  style={{ position: 'relative' }}
                >
                  {user.name}
                </span>
                {' '}предлагает статью для вашего набора
              </>
            ) : (
              <><strong>{user.name}</strong>. Отправлен запрос на добавление статьи к набору автора</>
            )}
          </div>
          <div className="req-card-set">{req.set.title}</div>
        </div>
        <div className="req-card-time">{req.time}</div>
        {onDelete && (
          <button className="req-card-delete-btn" onClick={onDelete} title="Удалить">
            <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Article — just title as link */}
      <div className="req-article-preview">
        <button className="req-article-link">{req.article.title}</button>
      </div>

      {/* Actions row */}
      <div className="req-actions-row">
        {isPending && (
          <button
            className={`req-discuss-btn${showDiscuss ? ' active' : ''}`}
            onClick={handleDiscussToggle}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            Обсудить
            {req.messages.length > 0 && <span className="req-msg-count">{req.messages.length}</span>}
          </button>
        )}

        {isPending && (
          <div className="req-action-btns">
            {isIncoming ? (
              <>
                <button className="req-reject-btn" onClick={() => setConfirm('reject')}>Отклонить</button>
                <button className="req-approve-btn" onClick={() => setConfirm('approve')}>Добавить</button>
              </>
            ) : (
              <button className="req-withdraw-btn" onClick={onWithdraw}>Отозвать запрос</button>
            )}
          </div>
        )}
      </div>

      {/* Discussion thread */}
      {showDiscuss && (
        <div className="req-discuss">
          {req.messages.length > 0 && (
            <div className="req-messages">
              {req.messages.map((m, i) => (
                <div key={i} className={`req-msg${m.from === 'me' ? ' req-msg--mine' : ''}`}>
                  <div className="req-msg-bubble">{m.text}</div>
                  <div className="req-msg-time">{m.time}</div>
                </div>
              ))}
            </div>
          )}
          <div className="req-msg-input-row">
            <input
              ref={inputRef}
              className="req-msg-input"
              placeholder="Написать сообщение..."
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button className="req-msg-send-btn" onClick={handleSend} disabled={!msgInput.trim()}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {confirm && (
        <ConfirmModal
          type={confirm}
          setTitle={req.set.title}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

function NotifItem({ n, onRead, onDelete, navigate }) {
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
      <button className="notif-delete-btn" onClick={onDelete} title="Удалить">
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}
