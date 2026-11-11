import { createContext, useContext, type ReactNode } from 'react'

export type SlideNav = {
  /** Slide id being shown. */
  id: string
  /** Previous slide id, if any (null on first paint / direct hash load). */
  fromId: string | null
  /**
   * Set when the slide arrived by a page turn: ms until the page has mostly
   * landed. Its opening content is then already on the page as it slides in
   * (the turn is the entrance), and only draw-on details wait for this long.
   * Null on first paint, where things fade in as usual.
   */
  land: number | null
}

const SlideNavContext = createContext<SlideNav>({ id: '', fromId: null, land: null })

export function SlideNavProvider({ value, children }: { value: SlideNav; children: ReactNode }) {
  return <SlideNavContext.Provider value={value}>{children}</SlideNavContext.Provider>
}

export function useSlideNav() {
  return useContext(SlideNavContext)
}

/** Pairs that skip leave/rise so one composition can carry across the cut. None yet. */
export function isSeamlessPair(a: string, b: string) {
  void a
  void b
  return false
}