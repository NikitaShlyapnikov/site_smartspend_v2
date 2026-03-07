import Layout from '../components/Layout'
import { notifications } from '../data/mock'

const TYPE_ICONS = {
  'new-set': (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
    </svg>
  ),
  'article': (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  ),
  'reminder': (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  'system': (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
}

export default function Notifications() {
  const unread = notifications.filter(n => n.unread)
  const read = notifications.filter(n => !n.unread)

  return (
    <Layout>
      <main className="notif-main">
        <div className="page-header" style={{ padding: '32px 36px 0', flexShrink: 0 }}>
          <div className="page-title">Уведомления</div>
          <div className="page-subtitle">Новости, напоминания и обновления</div>
        </div>

        <div className="notif-scroll">
          {unread.length > 0 && (
            <>
              <div className="notif-group-label">Новые</div>
              {unread.map(n => (
                <div key={n.id} className="notif-item unread">
                  <div className="notif-icon">{TYPE_ICONS[n.type]}</div>
                  <div className="notif-body">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-desc">{n.desc}</div>
                    <div className="notif-time">{n.time}</div>
                  </div>
                  <div className="notif-dot" />
                </div>
              ))}
            </>
          )}

          {read.length > 0 && (
            <>
              <div className="notif-group-label">Ранее</div>
              {read.map(n => (
                <div key={n.id} className="notif-item">
                  <div className="notif-icon">{TYPE_ICONS[n.type]}</div>
                  <div className="notif-body">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-desc">{n.desc}</div>
                    <div className="notif-time">{n.time}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>
    </Layout>
  )
}
