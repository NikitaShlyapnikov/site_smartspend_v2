import { createPortal } from 'react-dom'

export function FilterIconBtn({ active, onClick }) {
  return (
    <button className={`header-filter-btn${active ? ' active' : ''}`} onClick={onClick} title="Фильтры">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="6" x2="20" y2="6"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
        <line x1="11" y1="18" x2="13" y2="18"/>
      </svg>
      {active && <span className="filter-dot" />}
    </button>
  )
}

export default function FilterDrawer({ onClose, children }) {
  return createPortal(
    <div className="filter-drawer-overlay" onClick={onClose}>
      <div className="filter-drawer" onClick={e => e.stopPropagation()}>
        <div className="filter-drawer-handle" />
        <div className="filter-drawer-head">
          <span className="filter-drawer-label">Фильтры</span>
          <button className="filter-drawer-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}
