import { useState, useRef, useEffect } from 'react'
import LottieEmoji from './LottieEmoji'

export default function ReactionPill({ emoji, count, active, onToggle, autoAnimate, stopProp = false }) {
  const [popping, setPopping] = useState(false)
  const lottieRef = useRef(null)

  function triggerAnim() {
    setPopping(true)
    setTimeout(() => setPopping(false), 400)
    lottieRef.current?.goToAndPlay(0)
  }

  useEffect(() => {
    if (autoAnimate) triggerAnim()
  }, [autoAnimate])

  function handleClick(e) {
    if (stopProp) e.stopPropagation()
    triggerAnim()
    onToggle(emoji)
  }

  return (
    <div className="r-pill-wrap">
      <button
        className={`fa-reaction${active ? ' active' : ''}${popping ? ' popping' : ''}`}
        onClick={handleClick}
      >
        <LottieEmoji ref={lottieRef} emoji={emoji} size={20} loop={false} autoplay={false} />
        <span className="r-count">{count}</span>
      </button>
    </div>
  )
}
