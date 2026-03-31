import { useEffect, useRef, useState } from 'react'
import LottieEmoji from './LottieEmoji'

const REACTION_EMOJIS = [
  '🔥','💡','😍','🤯','💸','🤮','🤔','👏',
  '😮','💪','🎯','🙏','❤️','😂','🥰','😅',
  '💯','✨','🎉','👀','🥲','😤','🫡','🤝',
]

export default function EmojiPickerPopup({ onPick, onClose }) {
  const [popping, setPopping] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  function handlePick(emoji) {
    setPopping(emoji)
    setTimeout(() => { onPick(emoji); onClose() }, 220)
  }

  return (
    <div className="emoji-picker" ref={ref}>
      {REACTION_EMOJIS.map(emoji => (
        <button
          key={emoji}
          className={`ep-btn${popping === emoji ? ' ep-pop' : ''}`}
          onClick={() => handlePick(emoji)}
        >
          <LottieEmoji emoji={emoji} size={28} autoplay={false} loop={false} />
        </button>
      ))}
    </div>
  )
}
