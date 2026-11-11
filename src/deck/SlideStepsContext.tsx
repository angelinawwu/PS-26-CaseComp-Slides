import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'

export type SlideSteps = {
  tryNext: () => boolean
  tryPrev: () => boolean
}

/**
 * One slot, claimed by the active slide.
 *
 * `release` is deliberately not the mirror of `claim`. Slides leave through an
 * exit animation, so the outgoing one unmounts *after* the incoming one has
 * already claimed the slot — a blind `claim(null)` on cleanup would wipe the new
 * slide's handlers and the next arrow key would skip the slide's own steps
 * entirely. Only the current owner may clear the slot.
 */
type Registry = {
  claim: (steps: SlideSteps | null) => void
  release: (steps: SlideSteps | null) => void
}

const RegisterContext = createContext<Registry>({ claim: () => {}, release: () => {} })
const StepsContext = createContext<SlideSteps | null>(null)

export function SlideStepsProvider({
  children,
}: {
  children: ReactNode
}) {
  const stepsRef = useRef<SlideSteps | null>(null)
  const registry = useMemo<Registry>(
    () => ({
      claim: (steps) => {
        stepsRef.current = steps
      },
      release: (steps) => {
        if (stepsRef.current === steps) stepsRef.current = null
      },
    }),
    [],
  )

  const api: SlideSteps = {
    tryNext: () => stepsRef.current?.tryNext() ?? false,
    tryPrev: () => stepsRef.current?.tryPrev() ?? false,
  }

  return (
    <RegisterContext.Provider value={registry}>
      <StepsContext.Provider value={api}>{children}</StepsContext.Provider>
    </RegisterContext.Provider>
  )
}

export function useSlideSteps() {
  return useContext(StepsContext)
}

/**
 * True while the deck's chrome has taken over the screen — today, while the
 * side-nav index is open.
 *
 * Several slides listen on `window` rather than on their own elements, because
 * the deck's prev/next hit zones sit above the stage and would otherwise eat
 * every in-slide hover, drag and click. That makes them deaf to the scrim the
 * side nav lays over the deck: a wheel or a drag aimed at the open index would
 * still pan the wall underneath it. So the gate is a signal rather than an
 * overlay — a slide with window listeners bails out while this is true, which
 * leaves the panel the only thing on screen that scrolls.
 */
const InertContext = createContext(false)

export function SlideInert({ inert, children }: { inert: boolean; children: ReactNode }) {
  return <InertContext.Provider value={inert}>{children}</InertContext.Provider>
}

/** Slides must ignore pointer, wheel and key input while this is true. */
export function useSlideInert() {
  return useContext(InertContext)
}

/**
 * Move the deck on, from inside the slide.
 *
 * A slide normally only *consumes* an arrow with `useRegisterSlideSteps`; the
 * deck decides when to turn the page. The thank-you card needs both at once —
 * the press has to sweep its cards away and then land on the next slide, which
 * is one beat to the audience and two to the code. So the deck hands down the
 * plain "go to the next slide" it would have run itself, and the slide calls it
 * when its own animation is done. It skips the slide's steps, so a slide that
 * calls this must already have stopped consuming the key, or the two will loop.
 */
const AdvanceContext = createContext<() => void>(() => {})

export function SlideAdvance({ advance, children }: { advance: () => void; children: ReactNode }) {
  return <AdvanceContext.Provider value={advance}>{children}</AdvanceContext.Provider>
}

export function useSlideAdvance() {
  return useContext(AdvanceContext)
}

const PreviewContext = createContext(false)

/** Miniature copies of slides (the side nav) must not steal deck arrow steps. */
export function SlidePreview({ children }: { children: ReactNode }) {
  return <PreviewContext.Provider value={true}>{children}</PreviewContext.Provider>
}

export function useSlidePreview() {
  return useContext(PreviewContext)
}

/** Register next/prev handlers for the active slide. Returns true when consumed. */
export function useRegisterSlideSteps(steps: SlideSteps | null) {
  const registry = useContext(RegisterContext)
  const preview = useContext(PreviewContext)

  useEffect(() => {
    if (preview) return
    registry.claim(steps)
    return () => registry.release(steps)
  }, [preview, registry, steps])
}
