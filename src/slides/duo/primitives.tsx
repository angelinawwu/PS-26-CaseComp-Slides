import type { CSSProperties, ElementType, ReactNode } from 'react'
import { useShown } from './useSteps'
import './duo.css'

/*
 * What every slide is made of, in Duolingo's own idiom: a white field, a heavy
 * round title, and pieces that stand up off the page on a darker lip (cards,
 * chips, lesson nodes). Positions are in slide pixels on the 1920 x 1080
 * canvas. ART-DIRECTION.md has the rules.
 */

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

/** A palette name from index.css. Anything that takes `color` reads `--{color}` and `--{color}-lip`. */
export type Hue = 'feather' | 'macaw' | 'cardinal' | 'bee' | 'fox' | 'beetle'

export const hue = (color: Hue) =>
  ({ '--hue': `var(--${color})`, '--hue-lip': `var(--${color}-lip)` }) as CSSProperties

/** The slide itself. `serious` drops the Duo costume (registry `serious`). */
export function Field({
  className,
  serious,
  children,
}: {
  className?: string
  serious?: boolean
  children?: ReactNode
}) {
  return <article className={cx('field', serious && 'is-serious', className)}>{children}</article>
}

type AppearProps = {
  on?: boolean
  delay?: number
  /** Waits for the page to land, then pops in (stickers, bubbles). Otherwise it rides in with the page. */
  draw?: boolean
  as?: ElementType
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Fades in (with a short rise) when `on`; `draw` pieces pop instead, with Duo's overshoot. */
export function Appear({ on = true, delay = 0, draw = false, as: Tag = 'div', className, style, children }: AppearProps) {
  const shown = useShown(on, draw)
  return (
    <Tag
      className={cx(draw ? 'pop' : 'appear', shown && 'is-on', className)}
      style={{ ...style, transitionDelay: shown ? `${delay}ms` : '0ms' }}
    >
      {children}
    </Tag>
  )
}

/** A slide's title, top left, with an optional unit label over it and body text under it. */
export function Head({
  title,
  kicker,
  color = 'feather',
  children,
  width = 900,
  x = 120,
  y = 110,
  size,
}: {
  title: ReactNode
  /** Duo's unit label: small caps in the unit's colour. */
  kicker?: ReactNode
  color?: Hue
  children?: ReactNode
  width?: number
  x?: number
  y?: number
  size?: 'large' | 'small'
}) {
  return (
    <div className={cx('head', size && `head-${size}`)} style={{ left: x, top: y, width, ...hue(color) }}>
      {kicker ? <p className="t-kicker">{kicker}</p> : null}
      <h1 className="t-title">{title}</h1>
      {children ? <div className="t-body">{children}</div> : null}
    </div>
  )
}

/** A white card on a grey lip, like a Duo lesson tile. `color` fills it instead. */
export function Card({
  color,
  filled,
  className,
  style,
  children,
}: {
  color?: Hue
  filled?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  return (
    <div
      className={cx('card', color && 'has-hue', filled && 'is-filled', className)}
      style={{ ...(color ? hue(color) : null), ...style }}
    >
      {children}
    </div>
  )
}

/** A Duo button, drawn (slides don't take clicks): a pill on its lip. */
export function Chip({ color = 'feather', outline, children }: { color?: Hue; outline?: boolean; children: ReactNode }) {
  return (
    <span className={cx('chip', outline && 'is-outline')} style={hue(color)}>
      {children}
    </span>
  )
}

/** A speech bubble, as Duo's characters talk in lessons. The tail points `toward` the speaker. */
export function Bubble({
  toward = 'left',
  className,
  style,
  children,
}: {
  toward?: 'left' | 'right' | 'up' | 'down'
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <div className={cx('bubble', `bubble-${toward}`, className)} style={style}>
      {children}
    </div>
  )
}

/**
 * The owl: our own drawing in Duo's colours, not Duolingo's artwork. Swap in
 * the real mascot from Duolingo's brand kit if they share it.
 */
export function Owl({ size = 320, look = 'ahead', className, style }: { size?: number; look?: 'ahead' | 'left' | 'right' | 'up'; className?: string; style?: CSSProperties }) {
  const [dx, dy] = { ahead: [0, 0], left: [-6, 1], right: [6, 1], up: [0, -6] }[look]
  return (
    <svg
      className={cx('owl', className)}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Owl"
    >
      {/* Feet, behind the body. */}
      <g fill="var(--fox)">
        <ellipse cx="78" cy="188" rx="15" ry="8" />
        <ellipse cx="122" cy="188" rx="15" ry="8" />
      </g>
      {/* Body with ear tufts. */}
      <path
        d="M36 78 C34 44 48 30 62 28 L64 8 L86 26 C95 24 105 24 114 26 L136 8 L138 28 C152 30 166 44 164 78 L166 136 C166 170 140 186 100 186 C60 186 34 170 34 136 Z"
        fill="var(--feather)"
      />
      {/* Wings. */}
      <g fill="var(--feather-lip)">
        <path d="M34 104 C18 118 18 146 34 160 C40 146 40 120 34 104 Z" />
        <path d="M166 104 C182 118 182 146 166 160 C160 146 160 120 166 104 Z" />
      </g>
      {/* Belly. */}
      <ellipse cx="100" cy="146" rx="46" ry="34" fill="var(--mask)" />
      {/* Eyes. */}
      <g fill="#fff">
        <circle cx="70" cy="80" r="27" />
        <circle cx="130" cy="80" r="27" />
      </g>
      <g fill="var(--eel)">
        <circle cx={73 + dx} cy={82 + dy} r="13" />
        <circle cx={127 + dx} cy={82 + dy} r="13" />
      </g>
      <g fill="#fff">
        <circle cx={77 + dx} cy={77 + dy} r="4" />
        <circle cx={131 + dx} cy={77 + dy} r="4" />
      </g>
      {/* Beak. */}
      <path d="M86 104 C92 98 108 98 114 104 L103 122 C101 125 99 125 97 122 Z" fill="var(--fox)" />
      <path d="M86 104 C92 98 108 98 114 104 C108 108 92 108 86 104 Z" fill="var(--bee)" />
    </svg>
  )
}

/** Small glyphs for Duo's game pieces, drawn in the palette. */
export function Glyph({ name, size = 56 }: { name: 'flame' | 'bolt' | 'heart' | 'gem' | 'mic' | 'mask' | 'chat' | 'shield' | 'lock' | 'flag'; size?: number }) {
  const shapes: Record<typeof name, ReactNode> = {
    flame: (
      <>
        <path d="M24 4c3 9 14 13 14 26a14 14 0 0 1-28 0c0-7 4-11 6-14 1 4 3 6 5 6 0-7 0-13 3-18Z" fill="var(--fox)" />
        <path d="M24 26c2 4 7 6 7 11a7 7 0 0 1-14 0c0-4 4-6 7-11Z" fill="var(--bee)" />
      </>
    ),
    bolt: <path d="M27 3 9 27h13l-3 18 18-25H24l3-17Z" fill="var(--bee)" stroke="var(--bee-lip)" strokeWidth="2.5" strokeLinejoin="round" />,
    heart: (
      <path d="M24 42S5 30 5 17a10 10 0 0 1 19-4 10 10 0 0 1 19 4c0 13-19 25-19 25Z" fill="var(--cardinal)" stroke="var(--cardinal-lip)" strokeWidth="2.5" />
    ),
    gem: (
      <>
        <path d="M24 44 4 18l8-12h24l8 12-20 26Z" fill="var(--macaw)" stroke="var(--macaw-lip)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M12 6l6 12h12l6-12M4 18h40M18 18l6 26 6-26" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="2" strokeLinejoin="round" />
      </>
    ),
    mic: (
      <>
        <rect x="16" y="4" width="16" height="26" rx="8" fill="var(--beetle)" />
        <path d="M10 22a14 14 0 0 0 28 0M24 36v8M16 44h16" fill="none" stroke="var(--beetle-lip)" strokeWidth="4" strokeLinecap="round" />
      </>
    ),
    mask: (
      <>
        <path d="M4 14c10-4 30-4 40 0 0 14-6 22-14 22-3 0-4-5-6-5s-3 5-6 5C10 36 4 28 4 14Z" fill="var(--beetle)" stroke="var(--beetle-lip)" strokeWidth="2.5" strokeLinejoin="round" />
        <ellipse cx="15" cy="21" rx="5" ry="4" fill="#fff" />
        <ellipse cx="33" cy="21" rx="5" ry="4" fill="#fff" />
      </>
    ),
    chat: (
      <>
        <path d="M6 8h28a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H18l-8 7v-7H6a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z" fill="var(--macaw)" />
        <path d="M44 18v12a4 4 0 0 1-4 4h-2v6l-7-6" fill="none" stroke="var(--macaw-lip)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
      </>
    ),
    shield: (
      <>
        <path d="M24 3 6 10v12c0 12 8 20 18 23 10-3 18-11 18-23V10L24 3Z" fill="var(--feather)" stroke="var(--feather-lip)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="m16 23 6 6 11-12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    lock: (
      <>
        <path d="M15 21v-6a9 9 0 0 1 18 0v6" fill="none" stroke="var(--hare)" strokeWidth="5" strokeLinecap="round" />
        <rect x="8" y="20" width="32" height="24" rx="6" fill="var(--cardinal)" stroke="var(--cardinal-lip)" strokeWidth="2.5" />
        <circle cx="24" cy="31" r="3.5" fill="#fff" />
      </>
    ),
    flag: (
      <>
        <path d="M11 6v38" stroke="var(--eel)" strokeWidth="4" strokeLinecap="round" />
        <path d="M13 8h24l-6 9 6 9H13Z" fill="var(--bee)" stroke="var(--bee-lip)" strokeWidth="2.5" strokeLinejoin="round" />
      </>
    ),
  }
  return (
    <svg className="glyph" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      {shapes[name]}
    </svg>
  )
}
