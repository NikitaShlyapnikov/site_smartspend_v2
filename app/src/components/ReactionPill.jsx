import { useState, useRef, useEffect } from 'react'
import LottieEmoji from './LottieEmoji'

export default function ReactionPill({ emoji, count, active, onToggle, autoAnimate, stopProp = false }) {
  const [popping, setPopping] = useState(false)
  const [particles, setParticles] = useState([])
  const lottieRef = useRef(null)

  function triggerAnim(isNew) {
    setPopping(true)
    setTimeout(() => setPopping(false), 400)
    lottieRef.current?.goToAndPlay(0)
    if (isNew) {
      const newP = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        angle: i * 60 + Math.random() * 20 - 10,
        dist: 20 + Math.random() * 10,
      }))
      setParticles(newP)
      setTimeout(() => setParticles([]), 600)
    }
  }

  useEffect(() => {
    if (autoAnimate) triggerAnim(true)
  }, [autoAnimate])

  function handleClick(e) {
    if (stopProp) e.stopPropagation()
    triggerAnim(!active)
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
      {particles.map(p => (
        <span
          key={p.id}
          className="r-particle"
          style={{ '--angle': `${p.angle}deg`, '--dist': `${p.dist}px` }}
        >{emoji}</span>
      ))}
    </div>
  )
}
