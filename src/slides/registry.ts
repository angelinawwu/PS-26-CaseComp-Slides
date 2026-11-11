import type { ComponentType } from 'react'
import {
  Agenda,
  Cover,
  Demo,
  Ending,
  Heard,
  How,
  Keep,
  Problem,
  Safety,
  Solution,
  Team,
  stubs,
} from './duo/slides'

export type SlideDef = {
  id: string
  title: string
  /**
   * The deck drops the Duo costume: plain type, no colour, no owl. For the
   * moment the talk gets serious (the problem statement), so the contrast with
   * every slide around it does the work. Turns into one come down from above.
   */
  serious?: boolean
  /** Something on the slide takes clicks anywhere, so the edges don't turn the page. (The live demo's phone sits clear of them.) */
  handsOn?: boolean
  Component: ComponentType
}

/**
 * Deck order. A stepped slide counts as one entry. Chapters (deck/chapters.ts)
 * are slices of this list, so a new slide goes in here and nowhere else.
 */
export const slides: SlideDef[] = [
  { id: 'cover', title: 'Duolingo Connect', Component: Cover },
  { id: 'team', title: 'Who we are', Component: Team },
  { id: 'agenda', title: 'Today’s lesson', Component: Agenda },

  { id: 'heard', title: 'What learners told us', Component: Heard },
  { id: 'keep', title: 'What Duolingo gets right', Component: Keep },
  { id: 'unolingo', title: '(Uno)lingo', Component: stubs.Unolingo },
  { id: 'problem', title: 'The problem', serious: true, Component: Problem },

  { id: 'solution', title: 'Talk with Lily or a real learner', Component: Solution },
  { id: 'how', title: 'How a call works', Component: How },
  { id: 'safety', title: 'Safe by design', Component: Safety },

  { id: 'demo', title: 'Live demo', Component: Demo },

  { id: 'growth', title: 'Getting it in front of learners', Component: stubs.Growth },
  { id: 'measure', title: 'How we’d know it works', Component: stubs.Measure },

  { id: 'ending', title: 'Thank you', Component: Ending },
]

/** The slide after `id` in deck order, or null at the end. */
export function nextOf(id: string): string | null {
  const i = slides.findIndex((slide) => slide.id === id)
  return i < 0 ? null : (slides[i + 1]?.id ?? null)
}
