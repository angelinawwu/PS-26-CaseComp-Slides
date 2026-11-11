import { useLayoutEffect, useRef, useState } from 'react'
import type { SlideDef } from '../slides/registry'
import { isSeamlessPair, SlideNavProvider } from './SlideNavContext'
import { TURN_STYLE } from './config'
import { blend, drift, fadesOf, iris, irisTop, kindOf, LAND_BY_KIND, morph, progressOf, sharedPins, slide as turn, travel, tuck, TURN, type Vec } from './turn'

type SlidePresenceProps = {
  slide: SlideDef
}

/** One slide on the stage. `key` is fresh per mount, so a slide we come back to starts clean. */
type Shell = { slide: SlideDef; key: string }

/** The turn in flight: where the incoming slide started, and its animations (page first). */
type Run = { start: Vec; animations: Animation[] }

const ZERO: Vec = { x: 0, y: 0 }
const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y })
const scale = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k })

const calm = () =>
  TURN_STYLE === 'fade' || (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

let mounts = 0
const shellOf = (slide: SlideDef): Shell => ({ slide, key: `${slide.id}:${++mounts}` })

export function SlidePresence({ slide }: SlidePresenceProps) {
  const [incoming, setIncoming] = useState(() => shellOf(slide))
  const [outgoing, setOutgoing] = useState<Shell | null>(null)
  const [fromId, setFromId] = useState<string | null>(null)
  const inRef = useRef<HTMLDivElement>(null)
  const outRef = useRef<HTMLDivElement>(null)
  const run = useRef<Run | null>(null)

  if (slide.id !== incoming.slide.id) {
    setFromId(incoming.slide.id)
    setOutgoing(isSeamlessPair(incoming.slide.id, slide.id) ? null : incoming)
    setIncoming(shellOf(slide))
  }

  useLayoutEffect(() => {
    const inEl = inRef.current
    const outEl = outRef.current
    if (!inEl || !outEl || !outgoing) return

    // Interrupted mid-turn: the slide that was arriving leaves from wherever it
    // has got to, and the new one comes in joined to its edge, so a quick
    // second press reads as one continuous push instead of a jump.
    const prev = run.current
    const fade = prev ? fadesOf(outEl) : undefined
    const start = prev ? scale(prev.start, 1 - progressOf(prev.animations[0])) : ZERO
    prev?.animations.forEach((animation) => animation.cancel())

    const kind = kindOf(outgoing.slide.id, incoming.slide.id)
    let animations: Animation[]
    if (calm()) {
      // Nothing travels: the new slide fades in on top of the old one, which
      // stays fully opaque underneath, so the field never dips to black.
      animations = [
        inEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: TURN.fadeMs, easing: 'linear', fill: 'backwards' }),
      ]
      run.current = { start: ZERO, animations }
    } else if (kind === 'iris') {
      // These don't travel, so an interrupted push hands over nothing: the page simply settles.
      const opening = irisTop(outgoing.slide.id, incoming.slide.id) === incoming.slide.id
      animations = opening ? iris(inEl, outEl, true) : iris(outEl, inEl, false)
      run.current = { start: ZERO, animations }
    } else if (kind === 'drift') {
      animations = drift(inEl, outEl, travel(outgoing.slide, incoming.slide), fade)
      run.current = { start: ZERO, animations }
    } else if (kind === 'morph') {
      animations = morph(inEl, outEl)
      run.current = { start: ZERO, animations }
    } else {
      const v = travel(outgoing.slide, incoming.slide)
      const pins = sharedPins(inEl, outEl)
      // Where the arriving page sits against the leaving one, the whole way across.
      const gap = add(v, scale(tuck(inEl, outEl, v), -1))
      animations = [
        ...turn(inEl, add(start, gap), ZERO, false, pins),
        ...turn(outEl, start, scale(gap, -1), true, pins),
        ...blend(inEl, outEl, start, v),
      ]
      run.current = { start: add(start, gap), animations }
    }

    const mine = run.current
    let live = true
    void animations[0]!.finished
      .then(() => {
        if (!live || run.current !== mine) return
        run.current = null
        setOutgoing(null)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [incoming.key, outgoing])

  const shells = outgoing ? [outgoing, incoming] : [incoming]
  const kind = fromId ? kindOf(fromId, incoming.slide.id) : 'push'
  // A morph clears the old slide off the top; an iris keeps the slide it opens into on top.
  const top =
    outgoing && kind === 'morph'
      ? outgoing.key
      : outgoing && kind === 'iris' && irisTop(outgoing.slide.id, incoming.slide.id) === outgoing.slide.id
        ? outgoing.key
        : null

  return (
    <SlideNavProvider value={{ id: incoming.slide.id, fromId, land: fromId ? (calm() ? 0 : LAND_BY_KIND[kind]) : null }}>
      {shells.map((shell) => {
        const leaving = shell === outgoing
        const Slide = shell.slide.Component
        return (
          <div
            key={shell.key}
            ref={leaving ? outRef : inRef}
            className={leaving ? 'slide-shell slide-shell-leave' : 'slide-shell slide-shell-enter'}
            style={top === shell.key ? { zIndex: 1 } : top ? { zIndex: 0 } : undefined}
            data-slide={shell.slide.id}
            aria-hidden={leaving || undefined}
          >
            <Slide />
          </div>
        )
      })}
    </SlideNavProvider>
  )
}
