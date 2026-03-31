import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import lottie from 'lottie-web'

export const EMOJI_LOTTIE = {
  '🔥': 'fire',
  '❤️': 'love',
  '💸': 'money',
  '💰': 'money',
  '😂': 'big_smile',
  '😄': 'smile',
  '🤔': 'think',
  '🤯': 'boom_head',
  '😍': 'pleashure',
  '🥰': 'pleashure',
  '😮': 'afraid',
  '😱': 'afraid',
  '😤': 'angry',
  '🤮': 'angry',
  '💡': 'think_glass',
  '👏': 'smak',
  '🙏': 'hand',
  '💪': 'like',
  '😅': 'boring',
  '🥲': 'boring',
  '😊': 'smile',
  '✨': 'smile',
  '🎉': 'big_smile',
  '👀': 'distinguesh',
  '🎯': 'distinguesh',
  '💯': 'fire',
  '🤝': 'like',
  '🫡': 'hand',
  '😔': 'disapoint',
  '🤦': 'face_palm',
  '🤷': 'who_known',
  '👍': 'like',
}

const LottieEmoji = forwardRef(function LottieEmoji(
  { emoji, size = 24, autoplay = false, loop = true, className = '', style },
  ref
) {
  const containerRef = useRef(null)
  const animRef = useRef(null)
  const fileName = EMOJI_LOTTIE[emoji]

  useImperativeHandle(ref, () => ({
    play: () => animRef.current?.play(),
    stop: () => animRef.current?.stop(),
    goToAndPlay: (frame = 0) => animRef.current?.goToAndPlay(frame, true),
  }))

  useEffect(() => {
    if (!containerRef.current || !fileName) return
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay,
      path: `/emoji/${fileName}.json`,
    })
    animRef.current = anim
    return () => {
      anim.destroy()
      animRef.current = null
    }
  }, [fileName, loop, autoplay])

  if (!fileName) {
    return (
      <span className={className} style={{ fontSize: size * 0.72, lineHeight: 1, display: 'inline-flex', alignItems: 'center', ...style }}>
        {emoji}
      </span>
    )
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: size, height: size, display: 'inline-flex', flexShrink: 0, verticalAlign: 'middle', ...style }}
    />
  )
})

export default LottieEmoji
