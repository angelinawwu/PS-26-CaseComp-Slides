import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { slides } from '../slides/registry'
import { chapters } from './chapters'
import { useKeep } from './KeepContext'
import { clock, useTimeline } from './timing'
import './SlideRoute.css'

/** How long the pointer has to rest on the peek before the path comes up. */
const DWELL = 350
/** Grace before it goes again, so a pointer drifting out by a hair doesn't flicker it. */
const LINGER = 500

const pad = (n: number) => String(n).padStart(2, '0')

/** Duo's path never runs straight: each node sits a little up or down the wave. */
const wave = (n: number) => Math.round(Math.sin(n * 1.1) * 7)

type SlideRouteProps = {
  index: number
  /** While the cut is open the path stays down and takes no keys. */
  disabled: boolean
  onPick: (index: number) => void
}

/**
 * The deck as a Duolingo path: every slide a lesson node, chapters as units
 * in their own colour, the ring on the lesson you're in. Nodes behind you are
 * filled in, nodes ahead are grey, the way a course fills as you work through
 * it.
 *
 * Nothing shows at rest but the peek. The path comes up when the pointer rests
 * on the peek (passing through the bottom edge is not enough), on a click of
 * it, or with G (which pins it until G or Escape). Digits jump straight to a
 * unit. Set-aside slides are left off the path.
 */
export function SlideRoute({ index, disabled, onPick }: SlideRouteProps) {
  const { hidden } = useKeep()
  const timeline = useTimeline()
  const [near, setNear] = useState(false)
  const [pinned, setPinned] = useState(false)
  const open = !disabled && (near || pinned)

  const list = useMemo(
    () =>
      chapters()
        .map((item) => ({
          ...item,
          slides: item.slides.filter(({ def }) => !hidden.has(def.id)),
        }))
        .filter((item) => item.slides.length > 0),
    [hidden],
  )

  const current = slides[index]
  const kept = list.flatMap((item) => item.slides)
  const place = kept.findIndex((entry) => entry.index === index)
  const unit = list.findIndex((item) => item.slides.some((entry) => entry.index === index))
  const here = list[unit]
  const timed = timeline.total > 0
  const now = current ? timeline.at.get(current.id) : undefined

  // One timer, either waiting to open (dwell on the peek) or to close (linger
  // after leaving the panel). Whichever the pointer did last wins.
  const timer = useRef<number | undefined>(undefined)
  const later = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(fn, ms)
  }
  const cancel = () => window.clearTimeout(timer.current)

  useEffect(() => {
    const onLeave = () => {
      cancel()
      setNear(false)
    }
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancel()
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  useEffect(() => {
    if (disabled) return
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return
      }

      if (event.key === 'g' || event.key === 'G') {
        event.preventDefault()
        setPinned((was) => !was)
      } else if (event.key === 'Escape' && pinned) {
        event.preventDefault()
        setPinned(false)
      } else if (/^[1-9]$/.test(event.key)) {
        const chapter = list[Number(event.key) - 1]
        if (!chapter) return
        event.preventDefault()
        onPick(chapter.slides[0]!.index)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [disabled, list, onPick, pinned])

  // The ring sits on the current node. It is one element that travels, so a
  // jump reads as a move down the path rather than a node lighting elsewhere.
  const trail = useRef<HTMLDivElement>(null)
  const dots = useRef(new Map<number, HTMLElement>())
  const [at, setAt] = useState<{ x: number; y: number } | null>(null)

  useLayoutEffect(() => {
    const el = trail.current
    if (!el) return
    const apply = () => {
      const dot = dots.current.get(index)
      setAt(dot ? { x: dot.offsetLeft + dot.offsetWidth / 2, y: dot.offsetTop + dot.offsetHeight / 2 } : null)
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [index, list])

  const unitStyle = (color: string) =>
    ({ '--unit': `var(--${color})`, '--unit-lip': `var(--${color}-lip)` }) as CSSProperties

  return (
    <>
      {/*
        The path at rest: one tiny dot per slide, always there at the bottom
        edge, so the panel is never a surprise. A click on it pins the panel
        open.
      */}
      <button
        type="button"
        className={open || disabled ? 'route-peek is-away' : 'route-peek'}
        aria-label="Show all slides (G)"
        tabIndex={open || disabled ? -1 : 0}
        onClick={() => setPinned(true)}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') later(() => setNear(true), DWELL)
        }}
        onPointerLeave={cancel}
      >
        {list.map((item) => (
          <span key={item.label} className="route-peek-leg">
            {item.slides.map(({ def, index: at }) => (
              <i
                key={def.id}
                className={at === index ? 'is-current' : at < index ? 'is-past' : undefined}
              />
            ))}
          </span>
        ))}
      </button>

      <nav
        className={open ? 'route is-open' : 'route'}
        aria-label="Slides"
        aria-hidden={!open}
        inert={!open}
        onPointerEnter={cancel}
        onPointerLeave={() => later(() => setNear(false), LINGER)}
      >
        {/* Duo's unit banner: the unit's colour, its number and name, and the lesson you're on. */}
        <div className="route-where" style={here ? unitStyle(here.color) : undefined}>
          <span className="route-chapter">{here ? `Unit ${unit + 1} · ${here.label}` : 'Set aside'}</span>
          <span className="route-title">{current?.title}</span>
        </div>

        <div className="route-trail" ref={trail}>
          {list.map((item, u) => (
            <div
              key={item.label}
              className={item === here ? 'route-leg is-here' : 'route-leg'}
              style={unitStyle(item.color)}
            >
              <button
                type="button"
                className="route-leg-label"
                onClick={() => onPick(item.slides[0]!.index)}
              >
                <span className="route-key" aria-hidden="true">
                  {u + 1}
                </span>
                {item.label}
              </button>
              <div className="route-dots">
                {item.slides.map(({ def, index: at }) => {
                  const state = at === index ? 'is-current' : at < index ? 'is-past' : 'is-ahead'
                  const start = timeline.at.get(def.id)?.start
                  const n = kept.findIndex((entry) => entry.index === at)
                  return (
                    <button
                      key={def.id}
                      type="button"
                      ref={(el) => {
                        if (el) dots.current.set(at, el)
                        else dots.current.delete(at)
                      }}
                      className={`route-dot ${state}`}
                      style={{ top: wave(n) }}
                      aria-label={def.title}
                      aria-current={at === index ? 'step' : undefined}
                      onClick={() => onPick(at)}
                    >
                      <span className="route-tip" aria-hidden="true">
                        <span className="route-tip-n">{pad(n + 1)}</span>
                        {def.title}
                        {timed && start !== undefined ? <span className="route-tip-n">{clock(start)}</span> : null}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {at === null ? null : (
            <span
              className="route-you"
              aria-hidden="true"
              style={{ transform: `translate(${at.x}px, ${at.y}px) translate(-50%, -50%)` }}
            />
          )}
        </div>

        <div className="route-count">
          <p>
            <span className="route-num">{place < 0 ? '--' : pad(place + 1)}</span>
            <span className="route-slash">/</span>
            <span className="route-num">{pad(kept.length)}</span>
          </p>
          {/* Once slides have times (edit mode), the path also says where in the talk you are. */}
          {timed ? (
            <p className={timeline.total > timeline.target ? 'route-clock is-over' : 'route-clock'}>
              {now ? clock(now.start) : '--'} · {clock(timeline.total)} of {clock(timeline.target)}
            </p>
          ) : null}
        </div>
      </nav>
    </>
  )
}
