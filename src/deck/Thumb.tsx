import { useEffect, useRef, useState } from 'react'
import type { SlideDef } from '../slides/registry'
import { STAGE } from './config'
import { SlidePreview } from './SlideStepsContext'
import './Thumb.css'

/**
 * A live slide, scaled to fit whatever box it is given.
 *
 * It is the real component, not a picture of one, so a thumbnail is never out
 * of date — `SlidePreview` is what stops the copies from stealing the deck's
 * arrow keys or running their own entrances. The frame's look belongs to
 * whoever is listing the slides, so that comes in as `className`; only the
 * fitting is here.
 */
export function Thumb({ def, className }: { def: SlideDef; className?: string }) {
  const Slide = def.Component
  const box = useRef<HTMLSpanElement>(null)
  const [scale, setScale] = useState(0.1)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const apply = () => {
      const width = el.clientWidth
      const height = el.clientHeight
      if (!width || !height) return
      setScale(Math.min(width / STAGE.width, height / STAGE.height) * 1.004)
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <span className={className ? `thumb ${className}` : 'thumb'} ref={box}>
      <span
        className="thumb-stage"
        style={{
          width: STAGE.width,
          height: STAGE.height,
          transform: `scale(${scale})`,
        }}
      >
        <SlidePreview>
          <Slide />
        </SlidePreview>
      </span>
    </span>
  )
}
