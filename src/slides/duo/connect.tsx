import { useCallback, useEffect, useRef, type CSSProperties } from 'react'
import { useSlidePreview } from '../../deck/SlideStepsContext'
import { cx } from './primitives'

/*
 * Ansu's Duolingo Connect prototype, on the slides. `npm run connect` copies
 * the prototype into public/assets/connect/ and photographs its screens;
 * these show them.
 */

/** Screens photographed by tools/connect.mjs. */
export type Screen = 'home' | 'precall' | 'matching' | 'call' | 'guardian' | 'recap' | 'lily' | 'safety'

/** The photographs are 390 x 844 phones at 2x. */
const RATIO = 1688 / 780

/** One screen of the prototype, phone and all, `width` stage pixels wide. */
export function Phone({ screen, width = 360, className, style }: { screen: Screen; width?: number; className?: string; style?: CSSProperties }) {
  return (
    <img
      className={cx('phone', className)}
      src={`/assets/connect/${screen}.png`}
      alt=""
      width={width}
      height={Math.round(width * RATIO)}
      style={style}
      draggable={false}
    />
  )
}

/** The prototype's own page size: a 390 x 844 phone plus its 20px padding, so it draws at 1:1. */
const FRAME = { width: 430, height: 884 }

/** Deck keys that should still turn the page while the phone has focus. */
const PASS = new Set(['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'])

/**
 * The prototype itself, running, with every control live: click into the
 * phone and its own shortcuts work (L, P, G, N, Esc, 1–3).
 *
 * It's a same-origin iframe, so the deck reaches in on load: the presenter
 * panel and the dark page behind the phone go, and the arrow keys are handed
 * back up to the deck, so a presenter who has clicked into the phone can still
 * turn the page. Thumbnails get the photograph instead of a running copy.
 */
export function LiveConnect({ height = 884, poster = 'home', className, style }: { height?: number; poster?: Screen; className?: string; style?: CSSProperties }) {
  const preview = useSlidePreview()
  const frame = useRef<HTMLIFrameElement>(null)
  const k = height / FRAME.height

  const dress = useCallback(() => {
    const doc = frame.current?.contentDocument
    // Not the frame's first blank page (its window carries over to the real one), and only
    // once per page: load and the mount check can both land here, and each listener sends a key up.
    if (!doc || doc.URL === 'about:blank' || doc.documentElement.dataset.deck) return
    doc.documentElement.dataset.deck = 'dressed'
    const css = doc.createElement('style')
    // Same dressing as tools/connect.mjs: the phone alone, its shadow left to the deck (the frame would clip it).
    css.textContent =
      'aside { display: none !important } html, body, #root > div { background: transparent !important } [class*="rounded-[56px]"] { box-shadow: none !important }'
    doc.head.append(css)
    doc.addEventListener('keydown', (event) => {
      if (!PASS.has(event.key)) return
      event.preventDefault()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: event.key }))
    })
  }, [])

  // A reload inside the frame (or a cached load before React attached) still gets dressed.
  useEffect(() => {
    if (frame.current?.contentDocument?.readyState === 'complete') dress()
  }, [dress])

  if (preview) return <Phone screen={poster} width={390 * k} className={className} style={style} />

  return (
    <div className={cx('live-connect', className)} style={{ width: FRAME.width * k, height, ...style }}>
      <iframe
        ref={frame}
        src="/assets/connect/connect.html"
        title="Duolingo Connect prototype"
        allow="microphone; autoplay"
        onLoad={dress}
        style={{ width: FRAME.width, height: FRAME.height, scale: String(k) }}
      />
    </div>
  )
}
