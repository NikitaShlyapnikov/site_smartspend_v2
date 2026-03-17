import { useState, useEffect } from 'react'

export function HelpButton({ seenKey, onOpen }) {
  const [seen, setSeen] = useState(() => !!localStorage.getItem(seenKey))
  function handleClick() {
    if (!seen) { localStorage.setItem(seenKey, '1'); setSeen(true) }
    onOpen()
  }
  return (
    <button className={`help-btn${!seen ? ' help-btn--new' : ''}`} onClick={handleClick} title="Как устроена страница">?</button>
  )
}

export default function SpotlightTour({ steps, onClose }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)
  const PAD = 10

  useEffect(() => {
    setRect(null)
    const el = document.getElementById(steps[step].targetId)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const t = setTimeout(() => setRect(el.getBoundingClientRect()), 380)
    return () => clearTimeout(t)
  }, [step])

  useEffect(() => {
    const { btnId } = steps[step]
    if (!btnId) return
    const btn = document.getElementById(btnId)
    if (!btn) return
    btn.classList.add('spotlight-pulse')
    return () => btn.classList.remove('spotlight-pulse')
  }, [step])

  const isLast = step === steps.length - 1
  const current = steps[step]

  const MAX_HIGHLIGHT_H = rect ? Math.min(window.innerHeight * 0.45, rect.height + PAD * 2) : 0
  const clampedH = rect ? (rect.height + PAD * 2 > window.innerHeight * 0.45 ? MAX_HIGHLIGHT_H : rect.height + PAD * 2) : 0
  const effectiveBottom = rect ? rect.top - PAD + clampedH : 0

  const highlightStyle = rect ? {
    position: 'fixed',
    top:    rect.top    - PAD,
    left:   rect.left   - PAD,
    width:  rect.width  + PAD * 2,
    height: clampedH,
    borderRadius: 14,
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.58)',
    zIndex: 1100,
    pointerEvents: 'none',
    transition: 'top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease',
  } : null

  const tooltipBelow = rect && (effectiveBottom + 10 + 190 < window.innerHeight)
  const tooltipLeft  = rect ? Math.max(16, Math.min(rect.left - PAD, window.innerWidth - 340)) : 0
  const arrowLeft    = rect ? Math.min(Math.max(rect.left - tooltipLeft + PAD + 16, 16), 280) : 16

  const tooltipStyle = rect ? {
    position: 'fixed',
    left: tooltipLeft,
    top: tooltipBelow ? effectiveBottom + 10 : rect.top - PAD - 175,
    width: 320,
    zIndex: 1101,
    transition: 'top 0.3s ease, left 0.3s ease',
  } : null

  return (
    <>
      <div style={{ position:'fixed', inset:0, zIndex:1099 }} onClick={onClose} />

      {highlightStyle && <div style={highlightStyle} />}

      {tooltipStyle && (
        <div className="spotlight-tooltip" style={tooltipStyle}>
          <div className={`spotlight-arrow ${tooltipBelow ? 'arrow-top' : 'arrow-bottom'}`} style={{ left: arrowLeft }} />
          <div className="spotlight-step">{step + 1} / {steps.length}</div>
          <div className="spotlight-title">{current.title}</div>
          <div className="spotlight-desc">{current.desc}</div>
          <div className="spotlight-actions">
            {step > 0
              ? <button className="spl-btn-back" onClick={() => setStep(s => s - 1)}>Назад</button>
              : <button className="spl-btn-back" onClick={onClose}>Закрыть</button>
            }
            <button className="spl-btn-next" onClick={isLast ? onClose : () => setStep(s => s + 1)}>
              {isLast ? 'Готово' : 'Далее →'}
            </button>
          </div>
        </div>
      )}

      {!rect && (
        <div style={{ position:'fixed', inset:0, zIndex:1099, background:'rgba(0,0,0,0.58)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:32, height:32, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.2)', borderTopColor:'#fff', animation:'spin 0.7s linear infinite' }} />
        </div>
      )}
    </>
  )
}
