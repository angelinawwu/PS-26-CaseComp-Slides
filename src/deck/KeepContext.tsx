import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

const KEY = 'duo-deck.hidden.v1'

/**
 * Which slides are kept, and which are set aside.
 *
 * A deck is cut differently for every round — the five-minute version of this
 * one is not a different deck, it is this one with half of it hidden. So hiding is
 * not a build-time decision: it is a set of slide ids in `localStorage`, on this
 * machine, which survives a reload and never reaches the repository. Nothing is
 * deleted; a hidden slide is still in the registry, still reachable by its hash,
 * and comes back the moment it is shown again.
 */
type Keep = {
  hidden: ReadonlySet<string>
  toggle: (id: string) => void
  showAll: () => void
}

const KeepContext = createContext<Keep>({
  hidden: new Set(),
  toggle: () => {},
  showAll: () => {},
})

function read(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [])
  } catch {
    // A private window, or storage the browser will not hand over: show everything.
    return new Set()
  }
}

function write(hidden: Set<string>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...hidden]))
  } catch {
    // Not being able to remember the cut is no reason to break the deck.
  }
}

export function KeepProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState<Set<string>>(read)

  const toggle = useCallback((id: string) => {
    setHidden((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      write(next)
      return next
    })
  }, [])

  const showAll = useCallback(() => {
    setHidden(() => {
      const next = new Set<string>()
      write(next)
      return next
    })
  }, [])

  const value = useMemo<Keep>(() => ({ hidden, toggle, showAll }), [hidden, toggle, showAll])

  return <KeepContext.Provider value={value}>{children}</KeepContext.Provider>
}

export function useKeep() {
  return useContext(KeepContext)
}
