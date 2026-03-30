export function HappyCube({ size = 48, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 80 80" fill="none">
      <rect width="80" height="80" rx="18" fill="#0E0E0C"/>
      <rect x="14" y="14" width="52" height="52" rx="10" fill="#EEEDE9"/>
      <path d="M26 36 Q29 31 32 36" stroke="#0E0E0C" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M48 36 Q51 31 54 36" stroke="#0E0E0C" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M29 48 Q40 58 51 48" stroke="#0E0E0C" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export default function FeedEndBlock({ onScrollTop }) {
  return (
    <div className="feed-end-block">
      <div className="feed-end-cube-wrap" onClick={onScrollTop} style={{ cursor: 'pointer' }}>
        <HappyCube size={48} className="feed-end-cube" />
        <div className="feed-end-shadow" />
      </div>
      <div className="feed-end-title">Это всё</div>
      <div className="feed-end-sub">Ты прочитал всё что было.<br/>Загляни позже — появится новое.</div>
    </div>
  )
}
