import { slides, type SlideDef } from '../slides/registry'

/**
 * Inclusive slices of `slides`, in deck order. `to` is the last id of the
 * chapter. On the path (SlideRoute) each chapter is a unit with its own colour,
 * the way Duolingo colours the units of a course.
 */
export const CHAPTERS: { label: string; from: string; to: string; color: Unit }[] = [
  { label: 'Intro', from: 'cover', to: 'agenda', color: 'feather' },
  { label: 'Problem', from: 'heard', to: 'problem', color: 'beetle' },
  { label: 'Solution', from: 'solution', to: 'safety', color: 'macaw' },
  { label: 'Demo', from: 'demo', to: 'demo', color: 'cardinal' },
  { label: 'Growth', from: 'growth', to: 'measure', color: 'fox' },
  { label: 'Close', from: 'ending', to: 'ending', color: 'feather' },
]

/** A palette name from index.css; the path reads `--{name}` and `--{name}-lip`. */
export type Unit = 'feather' | 'beetle' | 'macaw' | 'fox' | 'cardinal' | 'bee'

export type Chapter = { label: string; color: Unit; slides: { def: SlideDef; index: number }[] }

/** Chapters as slices of the registry; anything unclaimed lands under "Elsewhere". */
export function chapters(): Chapter[] {
  const claimed = new Set<number>()
  const list = CHAPTERS.map(({ label, from, to, color }) => {
    const start = slides.findIndex((slide) => slide.id === from)
    const end = slides.findIndex((slide) => slide.id === to)
    const slice = slides.slice(start, end + 1).map((def) => {
      const index = slides.indexOf(def)
      claimed.add(index)
      return { def, index }
    })
    return { label, color, slides: slice }
  })

  const rest = slides
    .map((def, index) => ({ def, index }))
    .filter(({ index }) => !claimed.has(index))

  return rest.length ? [...list, { label: 'Elsewhere', color: 'bee' as const, slides: rest }] : list
}
