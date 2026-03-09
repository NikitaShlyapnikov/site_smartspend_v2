import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { notifications as INIT_NOTIFS } from '../data/mock'

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

// ── icons ─────────────────────────────────────────────────────────────────────

const TYPE_META = {
  'subscriber-article': { color: '#5A8A70', bg: 'rgba(90,138,112,0.12)' },
  'subscriber-set':     { color: '#6878A8', bg: 'rgba(104,120,168,0.12)' },
  'comment-reply':      { color: '#A07848', bg: 'rgba(160,120,72,0.12)' },
  'new-set':            { color: '#5A8AA0', bg: 'rgba(90,138,160,0.12)' },
  'article':            { color: '#8A6898', bg: 'rgba(138,104,152,0.12)' },
  'reminder':           { color: '#A05050', bg: 'rgba(160,80,80,0.12)' },
  'system':             { color: '#8A8A7A', bg: 'rgba(138,138,122,0.1)' },
}

function TypeIcon({ type }) {
  const meta = TYPE_META[type] || TYPE_META.system
  return (
    <div className="notif-icon" style={{ background: meta.bg, borderColor: 'transparent' }}>
      <svg width="16" height="16" fill="none" stroke={meta.color} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {type === 'subscriber-article' && <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>}
        {type === 'subscriber-set' && <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>}
        {type === 'comment-reply' && <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>}
        {type === 'new-set' && <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>}
        {type === 'article' && <><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></>}
        {type === 'reminder' && <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
        {type === 'system' && <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
      </svg>
    </div>
  )
}

function AuthorAvatar({ author }) {
  if (!author) return null
  return (
    <div className="notif-author-avatar" style={{ background: author.color }}>
      {author.initials}
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

// ── page ──────────────────────────────────────────────────────────────────────

export default function Notifications() {
  const navigate = useNavigate()
  const [readIds, setReadIds] = useState(loadRead)
  const [filter, setFilter] = useState('all')

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
        <div className="notif-header">
          <div>
            <div className="page-title">Уведомления</div>
            <div className="page-subtitle">Новости, ответы и напоминания</div>
          </div>
          {totalUnread > 0 && (
            <button className="notif-mark-all-btn" onClick={markAllRead}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Прочитать все
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="notif-filters">
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`notif-filter-btn${filter === f.id ? ' active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              {f.id === 'all' && totalUnread > 0 && (
                <span className="notif-filter-badge">{totalUnread}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="notif-scroll">
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
        <TypeIcon type={n.type} />
        {n.author && <AuthorAvatar author={n.author} />}
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
