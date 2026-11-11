import { CHAPTERS } from './chapters'
import { STAGE, TURN_STYLE } from './config'
import { slides, type SlideDef } from '../slides/registry'

/**
 * The page turn: both slides stay fully opaque and travel together, so nothing
 * ever shows through between them (no flash, no crossfade). It is real travel,
 * so it gets a smooth curve. The drawer curve moves on
 * the first frame and settles long: a press answers at once, a second press
 * mid-turn keeps the page's momentum instead of stalling it, and the layers
 * have time to drift into place.
 */
export const TURN = {
  ms: 950,
  ease: 'cubic-bezier(0.32, 0.72, 0, 1)',
  /** Reduced motion: the new slide fades in over the old one, which stays opaque. */
  fadeMs: 320,
} as const

/** When a slide's draw-on details (stickers, bubbles) may start: once the page has mostly landed. */
export const LAND_MS = Math.round(TURN.ms * 0.42)

export type Vec = { x: number; y: number }

/**
 * Parallax, as a share of the page's own travel. Type sits closest to you and
 * runs a little ahead of the page; pictures sit deeper and lag behind it.
 */
const DEPTH = {
  front: 0.16,
  back: -0.1,
  pinned: -1,
} as const

const chapterOf = (id: string) => {
  const index = slides.findIndex((slide) => slide.id === id)
  return CHAPTERS.findIndex(({ to }) => index <= slides.findIndex((slide) => slide.id === to))
}

/**
 * Where the incoming slide starts, in stage pixels (it travels from there to 0).
 *
 * Inside a chapter the deck turns sideways. A serious slide drops from above:
 * going into one, it comes down over the Duo page; leaving one, the colour
 * rises back up from below. A new chapter rises from below too. Going back
 * plays every one of these in reverse.
 */
export function travel(from: SlideDef, to: SlideDef): Vec {
  const forward = slides.indexOf(to) > slides.indexOf(from) ? 1 : -1
  const intoSerious = !from.serious && to.serious
  const outOfSerious = from.serious && !to.serious
  if (intoSerious) return { x: 0, y: -STAGE.height * forward }
  if (outOfSerious || chapterOf(from.id) !== chapterOf(to.id)) return { x: 0, y: STAGE.height * forward }
  return { x: STAGE.width * forward, y: 0 }
}

const MEDIA = 'img, video, canvas, svg, .phone, .card, .owl'
const TYPE = '.t-title, .t-body, p'

type Layer = { el: Element; k: number; clip?: boolean }

/** The `data-pin` names on a slide. */
const pinsOf = (shell: HTMLElement) =>
  new Set([...shell.querySelectorAll<HTMLElement>('[data-pin]')].map((el) => el.dataset.pin!))

/**
 * Pieces two slides both carry under the same `data-pin` name: during a turn
 * between them they stay where they are, so the page travels over a strip
 * that never moves.
 */
export function sharedPins(a: HTMLElement, b: HTMLElement): string[] {
  const other = pinsOf(b)
  return [...pinsOf(a)].filter((pin) => other.has(pin))
}

/**
 * The slide's depth layers. Each top-level piece of the field is type (front),
 * product image (back) or neither (rides with the page). A piece holding both
 * is split into its own children, so an outer and an inner element never both
 * move and add up.
 */
export function layersOf(shell: HTMLElement, pins: string[] = []): Layer[] {
  const field = shell.querySelector('.field')
  if (!field) return []
  const out: Layer[] = []
  const sort = (el: Element, depth: number) => {
    if (pins.some((pin) => el.matches(`[data-pin="${pin}"]`))) return out.push({ el, k: DEPTH.pinned, clip: true })
    const media = el.matches(MEDIA) || el.querySelector(MEDIA) !== null
    const type = el.matches(TYPE) || el.querySelector(TYPE) !== null
    if (type && !media) return out.push({ el, k: DEPTH.front })
    if (media && !type) return out.push({ el, k: DEPTH.back })
    if (media && type && depth < 3) {
      for (const child of el.children) sort(child, depth + 1)
    }
  }
  for (const child of field.children) sort(child, 0)
  // Inline boxes ignore transforms; they simply ride with whatever holds them.
  return out.filter(({ el }) => getComputedStyle(el).display !== 'inline')
}

const at = ({ x, y }: Vec, k = 1) => `translate3d(${x * k}px, ${y * k}px, 0)`

/** An element's box on its slide, in stage pixels. */
function boxOf(el: Element, shell: HTMLElement) {
  const s = shell.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  const k = STAGE.width / s.width
  return { x: (r.left - s.left) * k, y: (r.top - s.top) * k, w: r.width * k, h: r.height * k }
}

/**
 * Clip a pinned piece to its own page while the page is at `page`, so it shows
 * only where its page has reached: the new strip wipes in at the page's edge.
 * Every inset is linear in the page's offset, so it tracks the turn exactly.
 */
const clipTo = (page: Vec, b: ReturnType<typeof boxOf>) =>
  `inset(${page.y - b.y}px ${b.x + b.w - page.x - STAGE.width}px ${b.y + b.h - page.y - STAGE.height}px ${page.x - b.x}px)`

/**
 * Move one slide (and its layers, by their depth) from `from` to `to`. Layers
 * add onto whatever transform they already have (a sticker's tilt, a card's
 * drift), so nothing about their resting place changes.
 */
export function slide(shell: HTMLElement, from: Vec, to: Vec, hold: boolean, pins: string[] = []): Animation[] {
  const timing: KeyframeAnimationOptions = {
    duration: TURN.ms,
    easing: TURN.ease,
    fill: hold ? 'both' : 'backwards',
  }
  const page = shell.animate([{ transform: at(from) }, { transform: at(to) }], timing)
  const layers = layersOf(shell, pins).flatMap(({ el, k, clip }) => {
    // Measured before it starts moving, so the box is where it rests on the page.
    const b = clip ? boxOf(el, shell) : null
    const move = el.animate([{ transform: at(from, k) }, { transform: at(to, k) }], { ...timing, composite: 'add' })
    if (!b) return [move]
    return [move, el.animate([{ clipPath: clipTo(from, b) }, { clipPath: clipTo(to, b) }], timing)]
  })
  return [page, ...layers]
}

/**
 * How far, in stage pixels, the two pages of a push between one colour overlap, the arriving one
 * on top. Edge to edge they'd meet on a sub-pixel seam the stage shows through; overlapped, the
 * page on top always lands on more page. (A push between colours meets over one backdrop, so it
 * has no gap to cover.)
 */
const TUCK = 6

/** The overlap, as a vector along the push `v`: nothing when the two pages differ. */
export function tuck(inEl: HTMLElement, outEl: HTMLElement, v: Vec): Vec {
  const colour = (shell: HTMLElement) => {
    const field = shell.querySelector('.field')
    return field ? getComputedStyle(field).backgroundColor : null
  }
  const k = colour(inEl) === colour(outEl) ? TUCK : 0
  return { x: Math.sign(v.x) * k, y: Math.sign(v.y) * k }
}

const rgb = (colour: string) => colour.match(/[\d.]+/g)!.slice(0, 3).map(Number)

/** One colour into another along a smoothstep, so the blend has no visible start or stop. */
function smooth(dir: string, a: string, b: string) {
  const [p, q] = [rgb(a), rgb(b)]
  const stops = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12
    const s = t * t * (3 - 2 * t)
    return `rgb(${p.map((x, j) => (x + (q[j]! - x) * s).toFixed(2)).join(' ')}) ${(t * 100).toFixed(2)}%`
  })
  return `linear-gradient(${dir}, ${stops.join(', ')})`
}

/**
 * A push between two field colours meets on a gradient, not an edge. For the turn both fields go
 * clear and the old page carries one backdrop under both, old colour to new, with a band round
 * the seam that blends the two. The band is only as wide as the seam is far from the stage's
 * nearer edge, so it opens from nothing as the page leaves and closes to nothing as the new one
 * lands; halfway, the whole stage is one gradient. The backdrop lives in the leaving shell, so it
 * goes when that shell does.
 *
 * Anything a field draws on its `::before` is feathered to nothing at the seam over the same
 * width as the band (`--seam`, `--seam-to`), so the two pages meet at zero from either side.
 */
export function blend(inEl: HTMLElement, outEl: HTMLElement, start: Vec, v: Vec): Animation[] {
  const inField = inEl.querySelector<HTMLElement>('.field')
  const outField = outEl.querySelector<HTMLElement>('.field')
  if (!inField || !outField) return []
  const from = getComputedStyle(outField).backgroundColor
  const to = getComputedStyle(inField).backgroundColor
  const across = v.x !== 0
  // A turn caught mid-push at an angle has no straight seam to soften, and sideways between
  // one colour there's no seam at all.
  if ((across ? start.y : start.x) !== 0 || (from === to && across)) return []

  const span = across ? STAGE.width : STAGE.height
  const d = across ? v.x : v.y
  // The seam, as a share of the stage, from where the turn starts (f0) to where it lands (f1).
  const f0 = (d > 0 ? 0 : 1) + ((across ? start.x : start.y) + d) / span
  const f1 = d > 0 ? 0 : 1
  const width = (f: number) => Math.max(0, Math.min(1, 2 * Math.min(f, 1 - f)))
  // The band's width through the turn, as a share of its widest (the whole stage).
  const mid = (f0 - 0.5) / (f0 - f1)
  const spread = (frame: (k: number) => Keyframe): Keyframe[] => [
    { ...frame(width(f0)), offset: 0 },
    ...(mid > 0 && mid < 1 ? [{ ...frame(1), offset: mid }] : []),
    { ...frame(0), offset: 1 },
  ]
  const timing: KeyframeAnimationOptions = { duration: TURN.ms, easing: TURN.ease, fill: 'both' }

  // `--seam-to` points away from the seam; a field's ::before can mask along it.
  const toward = across ? ['left', 'right'] : ['top', 'bottom']
  outField.style.setProperty('--seam-to', `to ${toward[d > 0 ? 0 : 1]}`)
  inField.style.setProperty('--seam-to', `to ${toward[d > 0 ? 1 : 0]}`)
  const feather = spread((k) => ({ '--seam': `${(k * span) / 2}px` }))
  const light = { ...timing, pseudoElement: '::before' }
  const out = [outField.animate(feather, light), inField.animate(feather, { ...light, fill: 'backwards' })]
  if (from === to) return out

  const axis = across ? 'scaleX' : 'scaleY'
  const frames = spread((k) => ({ transform: `${axis}(${k})` }))

  const [first, second] = d > 0 ? [from, to] : [to, from]
  const dir = across ? '90deg' : '180deg'
  const seam = d > 0 ? span : 0
  const place = (lo: number, len: number) =>
    across
      ? { left: `${lo}px`, top: '0', width: `${len}px`, height: '100%' }
      : { left: '0', top: `${lo}px`, width: '100%', height: `${len}px` }
  const backdrop = document.createElement('div')
  Object.assign(backdrop.style, place(Math.min(0, d), 2 * span), {
    position: 'absolute',
    zIndex: '-1',
    pointerEvents: 'none',
    background: `linear-gradient(${dir}, ${first} 50%, ${second} 50%)`,
  })
  const band = document.createElement('div')
  Object.assign(band.style, place(seam - Math.min(0, d) - span / 2, span), {
    position: 'absolute',
    background: smooth(dir, first, second),
  })
  backdrop.append(band)
  outEl.append(backdrop)

  const clear = { backgroundColor: 'transparent' }
  out.push(
    band.animate(frames, timing),
    inField.animate([clear, clear], { duration: TURN.ms, fill: 'backwards' }),
    outField.animate([clear, clear], { duration: TURN.ms, fill: 'both' }),
  )
  return out
}

/**
 * Turns that aren't a push. Each is named by the pair it joins (either way round):
 *
 * - `iris`: the second slide opens out of a dot (`data-iris`) on the first, in a growing circle.
 *   Going back, the page closes down into the dot again.
 * - `morph`: the two slides share pieces under one `data-morph` name, and each glides and scales
 *   from where it sat on the old slide to where it sits on the new one (Keynote's magic move).
 *   Everything else fades out, then in. Both slides must share a field colour.
 */
export type TurnKind = 'push' | 'drift' | 'iris' | 'morph'

/** `'from>to': kind`, by slide id. Anything not listed takes TURN_STYLE. */
const KINDS: Record<string, TurnKind> = {
  'agenda>heard': 'iris',
}

export function kindOf(a: string, b: string): TurnKind {
  return KINDS[`${a}>${b}`] ?? KINDS[`${b}>${a}`] ?? (TURN_STYLE === 'drift' ? 'drift' : 'push')
}

/** Of an iris pair, the slide the dot opens into: it sits on top either way. */
export function irisTop(a: string, b: string) {
  return KINDS[`${a}>${b}`] === 'iris' ? b : a
}

/** When draw-on details may start, by kind: an iris has to open far enough to show them. */
export const LAND_BY_KIND: Record<TurnKind, number> = { push: LAND_MS, drift: 380, iris: 640, morph: 520 }

const MORPH = { ms: 900, ease: 'cubic-bezier(0.65, 0, 0.35, 1)' } as const
const IRIS = { ms: 1050, ease: 'cubic-bezier(0.65, 0, 0.35, 1)' } as const

/**
 * The iris opening (or closing): the page on top is clipped to a circle round the dot that grows
 * past the far corner. The first animation is the clip, so the turn ends when it does.
 */
export function iris(top: HTMLElement, dark: HTMLElement, opening: boolean): Animation[] {
  const dot = dark.querySelector('[data-iris]')
  const b = dot ? boxOf(dot, dark) : { x: STAGE.width / 2, y: STAGE.height / 2, w: 0, h: 0 }
  const x = b.x + b.w / 2
  const y = b.y + b.h / 2
  const far = Math.hypot(Math.max(x, STAGE.width - x), Math.max(y, STAGE.height - y))
  // Starts the size of the dot itself, so the dot is what grows.
  const shut = `circle(${b.w / 2}px at ${x}px ${y}px)`
  const open = `circle(${Math.ceil(far)}px at ${x}px ${y}px)`
  const frames = opening ? [{ clipPath: shut }, { clipPath: open }] : [{ clipPath: open }, { clipPath: shut }]
  return [top.animate(frames, { duration: IRIS.ms, easing: IRIS.ease, fill: opening ? 'backwards' : 'both' })]
}

/**
 * The magic move. The old slide stays on top with its field gone clear, its shared pieces hidden
 * and the rest fading out fast; underneath, each shared piece on the new slide flies in from the
 * old one's box, and the rest of the new slide fades up once the old has cleared, so the two never
 * read as one muddle.
 */
export function morph(inEl: HTMLElement, outEl: HTMLElement): Animation[] {
  const timing = { duration: MORPH.ms, easing: MORPH.ease }
  const olds = new Map([...outEl.querySelectorAll<HTMLElement>('[data-morph]')].map((el) => [el.dataset.morph!, el]))
  const field = inEl.querySelector('.field')
  const outField = outEl.querySelector('.field')
  const flying: Element[] = []
  // The old slide clears first: it drives the turn, so it runs the whole length.
  const out: Animation[] = [outEl.animate([{ opacity: 1 }, { opacity: 0, offset: 0.36 }, { opacity: 0 }], { duration: MORPH.ms, easing: 'linear', fill: 'both' })]
  if (outField) out.push(outField.animate([{ backgroundColor: 'transparent' }, { backgroundColor: 'transparent' }], { duration: MORPH.ms, fill: 'both' }))

  for (const el of inEl.querySelectorAll<HTMLElement>('[data-morph]')) {
    const from = olds.get(el.dataset.morph!)
    if (!from) continue
    const a = boxOf(from, outEl)
    const b = boxOf(el, inEl)
    // Text keeps its proportions (height decides); a box can stretch to fit both ways.
    const kx = el.dataset.morphFit === 'box' ? a.w / b.w : a.h / b.h
    const ky = a.h / b.h
    const dx = a.x + a.w / 2 - (b.x + b.w / 2)
    const dy = a.y + a.h / 2 - (b.y + b.h / 2)
    flying.push(el)
    out.push(
      el.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${kx}, ${ky})` }, { transform: 'none' }], { ...timing, fill: 'backwards' }),
      from.animate([{ visibility: 'hidden' }, { visibility: 'hidden' }], { duration: MORPH.ms, fill: 'both' }),
    )
  }

  // The rest of the new slide: its top-level pieces that hold nothing flying.
  for (const child of field?.children ?? []) {
    if (flying.some((el) => child === el || child.contains(el))) continue
    // Up to whatever it rests at: a piece waiting for a later step stays hidden.
    const rest = getComputedStyle(child).opacity
    out.push(
      child.animate([{ opacity: 0 }, { opacity: rest }], {
        duration: 420,
        delay: MORPH.ms * 0.55,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
        fill: 'backwards',
        composite: 'replace',
      }),
    )
  }
  return out
}

/**
 * The drift: the everyday turn, a push that only goes a few steps. Nothing
 * crosses the screen. The old slide's pieces step back and fade fast; the new
 * one's arrive from a short way off along the deck's direction (sideways inside
 * a chapter, up from below into a new one), type from further than pictures and
 * a beat ahead of them, so the page settles in depth.
 *
 * A picture both slides hold in the same place (the phone across the demo
 * slides) doesn't move or fade at all: it is the same object, and only what's
 * said about it changes.
 */
const DRIFT = {
  ms: 760,
  ease: 'cubic-bezier(0.19, 1, 0.22, 1)',
  outMs: 200,
  fadeMs: 420,
  /** The new slide waits this long, so the two titles never sit on top of each other. */
  inDelay: 110,
  /** Pictures follow the type by this much. */
  lag: 70,
  /** How far each depth comes from, in stage pixels. */
  front: 56,
  back: 24,
  /** A new chapter rises from a little further. */
  chapter: 1.5,
} as const

const FRONT = '.head, p'

/** The field's top-level pieces. */
const piecesOf = (shell: HTMLElement) => [...(shell.querySelector('.field')?.children ?? [])]

/** Same kind of piece, in the same box: one object that both slides show. */
function same(a: Element, b: Element, sa: HTMLElement, sb: HTMLElement) {
  if (a.tagName !== b.tagName || a.classList[0] !== b.classList[0]) return false
  if (a.matches(`${FRONT}, .appear`)) return false
  const p = boxOf(a, sa)
  const q = boxOf(b, sb)
  return Math.abs(p.x - q.x) < 1 && Math.abs(p.y - q.y) < 1 && Math.abs(p.w - q.w) < 1 && Math.abs(p.h - q.h) < 1
}

/**
 * `v` is the push it stands in for (travel()); `fade` is each leaving piece's
 * opacity right now, when a turn is caught mid-drift. The first animation is
 * the clock: the turn ends when it does.
 */
export function drift(inEl: HTMLElement, outEl: HTMLElement, v: Vec, fade?: Map<Element, string>): Animation[] {
  const k = v.y !== 0 ? DRIFT.chapter : 1
  const dir: Vec = { x: Math.sign(v.x) * k, y: Math.sign(v.y) * k }
  const shift = (n: number) => `${dir.x * n}px ${dir.y * n}px`
  const total = DRIFT.inDelay + DRIFT.lag + DRIFT.ms
  const clear = { backgroundColor: 'transparent' }
  const inField = inEl.querySelector('.field')
  if (!inField) return []
  // The new field goes clear, so the old one's paper carries both.
  const out: Animation[] = [inField.animate([clear, clear], { duration: total, fill: 'backwards' })]

  const olds = piecesOf(outEl)
  const kept = new Set<Element>()
  for (const el of piecesOf(inEl)) {
    const twin = olds.find((old) => !kept.has(old) && same(old, el, outEl, inEl))
    if (twin) {
      kept.add(twin)
      // Hidden under its double, which is already in place on top.
      out.push(twin.animate([{ visibility: 'hidden' }, { visibility: 'hidden' }], { duration: total, fill: 'both' }))
      continue
    }
    const front = el.matches(FRONT)
    const delay = DRIFT.inDelay + (front ? 0 : DRIFT.lag)
    // Up to whatever it rests at: a piece waiting for a later step stays hidden.
    const rest = getComputedStyle(el).opacity
    out.push(
      el.animate([{ opacity: 0 }, { opacity: rest }], { duration: DRIFT.fadeMs, delay, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' }),
      el.animate([{ translate: shift(front ? DRIFT.front : DRIFT.back) }, { translate: '0px 0px' }], {
        duration: DRIFT.ms,
        delay,
        easing: DRIFT.ease,
        fill: 'backwards',
        composite: 'add',
      }),
    )
  }

  for (const el of olds) {
    if (kept.has(el)) continue
    const front = el.matches(FRONT)
    const timing: KeyframeAnimationOptions = { duration: DRIFT.outMs, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'both' }
    out.push(
      el.animate([{ opacity: fade?.get(el) ?? getComputedStyle(el).opacity }, { opacity: 0 }], timing),
      el.animate([{ translate: '0px 0px' }, { translate: shift(-(front ? DRIFT.front : DRIFT.back) / 4) }], { ...timing, composite: 'add' }),
    )
  }
  return out
}

/** Each piece's opacity right now, before a turn caught mid-drift is cancelled. */
export function fadesOf(shell: HTMLElement) {
  return new Map(piecesOf(shell).map((el) => [el, getComputedStyle(el).opacity]))
}

/** How far along (eased, 0 to 1) a running turn is. */
export function progressOf(animation: Animation | undefined) {
  const p = animation?.effect?.getComputedTiming().progress
  return p == null ? 1 : p
}
