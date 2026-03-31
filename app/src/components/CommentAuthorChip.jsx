import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'

function CommentAuthorPopover({ name, ini, style }) {
  return createPortal(
    <div className="author-popover" style={style} onClick={e => e.stopPropagation()}>
      <div className="ap-top">
        <div className="ap-avatar" style={{ background: '#8B7B6B' }}>{ini}</div>
      </div>
      <div className="ap-name" style={{ cursor: 'default' }}>{name}</div>
      <div className="ap-meta">Пользователь SmartSpend</div>
    </div>,
    document.body
  )
}

// Renders: avatar (flex sibling outside c-body) + name (inside c-header) + popover logic
// Usage in JSX:
//   <div className="comment-item">
//     <CommentAuthorChip .../>   ← renders avatar + name as siblings via context
//     ...
//   </div>
//
// Because React Fragments can't span across different flex parents, we use a wrapper
// approach: the component renders avatar only, and exposes a NameLabel sub-component.
// Instead we use a single unified component that renders:
//   [avatar] [c-body [ [name + date] [text] [actions] ]]
// Caller passes children (date, text, actions) and we compose the full item.

export default function CommentItem({ name, ini, navigate, avatarClass = 'c-avatar', nameClass = 'c-name', date, children }) {
  const [showCard, setShowCard] = useState(false)
  const [showSheet, setShowSheet] = useState(false)
  const [popPos, setPopPos] = useState(null)
  const avatarRef = useRef(null)
  const showTimer = useRef(null)
  const hideTimer = useRef(null)
  const isTouch = () => window.matchMedia('(hover: none)').matches

  function openPopover() {
    clearTimeout(showTimer.current)
    clearTimeout(hideTimer.current)
    if (avatarRef.current) {
      const r = avatarRef.current.getBoundingClientRect()
      setPopPos({ top: r.bottom + 8, left: r.left })
    }
    setShowCard(true)
  }
  function onEnter() {
    if (isTouch()) return
    clearTimeout(hideTimer.current)
    showTimer.current = setTimeout(openPopover, 350)
  }
  function onLeave() {
    if (isTouch()) return
    clearTimeout(showTimer.current)
    hideTimer.current = setTimeout(() => setShowCard(false), 180)
  }
  function handleClick(e) {
    e.stopPropagation()
    if (isTouch()) { setShowSheet(true); return }
    openPopover()
  }

  return (
    <>
      <div
        ref={avatarRef}
        className={avatarClass}
        style={{ cursor: 'pointer', flexShrink: 0 }}
        onClick={handleClick}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >{ini}</div>
      <div className={avatarClass === 'sd-c-avatar' ? 'sd-c-body' : 'c-body'}>
        <div className={avatarClass === 'sd-c-avatar' ? 'sd-c-header' : 'c-header'}>
          <span
            className={nameClass}
            style={{ cursor: 'pointer' }}
            onClick={handleClick}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >{name}</span>
          <span className={avatarClass === 'sd-c-avatar' ? 'sd-c-date' : 'c-date'}>{date}</span>
        </div>
        {children}
      </div>
      {showCard && popPos && <CommentAuthorPopover name={name} ini={ini} style={{ position: 'fixed', top: popPos.top, left: popPos.left }} />}
      {showSheet && createPortal(
        <>
          <div className="abs-backdrop" onClick={() => setShowSheet(false)} />
          <div className="author-bottom-sheet">
            <div className="abs-handle" />
            <div className="ap-top">
              <div className="ap-avatar" style={{ background: '#8B7B6B' }}>{ini}</div>
            </div>
            <div className="ap-name" style={{ cursor: 'default' }}>{name}</div>
            <div className="ap-meta">Пользователь SmartSpend</div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
