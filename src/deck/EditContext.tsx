import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import seedUrl from '../../notes/slide-notes.json?url'

/**
 * Edit mode: the deck as a production board.
 *
 * Presenting, the deck shows nothing but slides. Editing, the stage shrinks to
 * make room for a notes panel: who presents the slide, how long it gets (the
 * timeline, timing.ts), speaker notes, and tags for the footage and MVP clips
 * that belong on it. It's the team's run sheet, kept beside the slide it is
 * for, so "who says what, for how long" is never a separate doc that drifts.
 *
 * The notes live in `notes/slide-notes.json`. Run through `npm run dev`, every
 * edit is written back to that file (vite.config.ts), so they can be committed
 * and pulled like the rest of the deck. Anywhere else (a build, a preview) the
 * file is read once and edits stay in this browser.
 *
 * `E` switches modes from anywhere outside a text field.
 */

export type Mode = 'present' | 'edit'
export type ClipKind = 'footage' | 'prototype'

export type Clip = { id: string; label: string; done: boolean }

export type SlideNote = {
  /** Who presents this slide. */
  narrator: string
  /** How long it's on screen, as typed (`0:45`). timing.ts reads it. */
  time: string
  footage: Clip[]
  prototype: Clip[]
  notes: string
}

type NotesFile = { version: 1; slides: Record<string, SlideNote> }

/** Where the last edit went. `local` = this browser only, no dev server to write to. */
export type SaveState = 'loading' | 'saved' | 'saving' | 'local' | 'error'

type Edit = {
  mode: Mode
  setMode: (mode: Mode) => void
  toggleMode: () => void
  showTags: boolean
  setShowTags: (show: boolean) => void
  saveState: SaveState
  note: (id: string) => SlideNote
  update: (id: string, change: (note: SlideNote) => SlideNote) => void
}

const MODE_KEY = 'duo-deck.mode.v1'
const TAGS_KEY = 'duo-deck.tags.v1'
const NOTES_KEY = 'duo-deck.notes.v1'
const ENDPOINT = '/__notes'
const SAVE_DELAY = 450

export function blankNote(): SlideNote {
  return { narrator: '', time: '', footage: [], prototype: [], notes: '' }
}

function readStored(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // A private window: the setting simply isn't remembered.
  }
}

function asClips(value: unknown): Clip[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const clip = item as Partial<Clip>
    return [
      {
        id: typeof clip.id === 'string' ? clip.id : '',
        label: typeof clip.label === 'string' ? clip.label : '',
        done: clip.done === true,
      },
    ]
  })
}

/** Accept whatever is on disk, keep what has the right shape, drop the rest. */
function asNotes(value: unknown): NotesFile {
  const slides: Record<string, SlideNote> = {}
  const raw =
    value && typeof value === 'object' ? (value as { slides?: unknown }).slides : undefined
  if (raw && typeof raw === 'object') {
    for (const [id, entry] of Object.entries(raw as Record<string, unknown>)) {
      if (!entry || typeof entry !== 'object') continue
      const note = entry as Partial<Record<keyof SlideNote, unknown>>
      slides[id] = {
        narrator: typeof note.narrator === 'string' ? note.narrator : '',
        time: typeof note.time === 'string' ? note.time : '',
        footage: asClips(note.footage),
        prototype: asClips(note.prototype),
        notes: typeof note.notes === 'string' ? note.notes : '',
      }
    }
  }
  return { version: 1, slides }
}

async function getJson(url: string) {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`${response.status}`)
  return (await response.json()) as unknown
}

const EditContext = createContext<Edit | null>(null)

export function EditProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>(() =>
    typeof window !== 'undefined' && readStored(MODE_KEY) === 'edit' ? 'edit' : 'present',
  )
  const [showTags, setShowTagsState] = useState(
    () => typeof window === 'undefined' || readStored(TAGS_KEY) !== 'off',
  )
  const [file, setFile] = useState<NotesFile>({ version: 1, slides: {} })
  const [saveState, setSaveState] = useState<SaveState>('loading')

  /** True once the dev server has answered: edits go to the repo, not the browser. */
  const toDisk = useRef(false)
  const pending = useRef<NotesFile | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const setMode = useCallback((next: Mode) => {
    setModeState(next)
    writeStored(MODE_KEY, next)
  }, [])

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'edit' ? 'present' : 'edit'
      writeStored(MODE_KEY, next)
      return next
    })
  }, [])

  const setShowTags = useCallback((show: boolean) => {
    setShowTagsState(show)
    writeStored(TAGS_KEY, show ? 'on' : 'off')
  }, [])

  // Load: the repo file through the dev server, else this browser's copy, else the seed.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getJson(ENDPOINT)
        if (cancelled) return
        toDisk.current = true
        setFile(asNotes(data))
        setSaveState('saved')
        return
      } catch {
        // No dev server (a build or a preview): fall through.
      }
      const stored = readStored(NOTES_KEY)
      if (stored) {
        try {
          if (!cancelled) {
            setFile(asNotes(JSON.parse(stored)))
            setSaveState('local')
          }
          return
        } catch {
          // A corrupt copy: start again from the seed.
        }
      }
      try {
        const seed = await getJson(seedUrl)
        if (cancelled) return
        setFile(asNotes(seed))
        setSaveState('local')
      } catch {
        if (!cancelled) setSaveState('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const flush = useCallback(async (keepalive = false) => {
    const next = pending.current
    if (!next) return
    pending.current = null
    window.clearTimeout(timer.current)
    const body = JSON.stringify(next)

    if (!toDisk.current) {
      writeStored(NOTES_KEY, body)
      setSaveState('local')
      return
    }

    try {
      const response = await fetch(ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive,
      })
      if (!response.ok) throw new Error(`${response.status}`)
      // A newer edit may have queued while this one was in flight.
      setSaveState(pending.current ? 'saving' : 'saved')
    } catch {
      // Keep the words somewhere: this browser, until the server is back.
      writeStored(NOTES_KEY, body)
      setSaveState('error')
    }
  }, [])

  // Last keystrokes before closing the tab still reach the file.
  useEffect(() => {
    const onHide = () => {
      void flush(true)
    }
    window.addEventListener('pagehide', onHide)
    return () => window.removeEventListener('pagehide', onHide)
  }, [flush])

  const update = useCallback(
    (id: string, change: (note: SlideNote) => SlideNote) => {
      setFile((prev) => {
        const next: NotesFile = {
          version: 1,
          slides: { ...prev.slides, [id]: change(prev.slides[id] ?? blankNote()) },
        }
        pending.current = next
        return next
      })
      setSaveState('saving')
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        void flush()
      }, SAVE_DELAY)
    },
    [flush],
  )

  const note = useCallback((id: string) => file.slides[id] ?? blankNote(), [file])

  // E switches modes, unless the key is going into a text field.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key !== 'e' && event.key !== 'E') return
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return
      }
      event.preventDefault()
      toggleMode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleMode])

  const value = useMemo<Edit>(
    () => ({ mode, setMode, toggleMode, showTags, setShowTags, saveState, note, update }),
    [mode, setMode, toggleMode, showTags, setShowTags, saveState, note, update],
  )

  return <EditContext.Provider value={value}>{children}</EditContext.Provider>
}

export function useEdit() {
  const edit = useContext(EditContext)
  if (!edit) throw new Error('useEdit needs an EditProvider')
  return edit
}
