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
