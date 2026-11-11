import { useEffect, useRef, useState, type ReactNode } from 'react'
import { STAGE } from './config'

type StageProps = {
  children: ReactNode
}

export function Stage({ children }: StageProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const update = () => {
      const { width, height } = frame.getBoundingClientRect()
      setScale(Math.min(width / STAGE.width, height / STAGE.height))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={frameRef} className="stage-frame">
      <div
        className="stage"
        style={{
          width: STAGE.width,
          height: STAGE.height,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
