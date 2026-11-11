import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { slides } from '../slides/registry'
import { chapters } from './chapters'
import { useKeep } from './KeepContext'
import { Thumb } from './Thumb'
import './KeepPanel.css'

const EASE = [0.2, 0, 0, 1] as const

/** Figma's eye, near enough: a lid, a pupil, and a stroke through it when shut. */
function Eye({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M2.5 12S6 6.2 12 6.2 21.5 12 21.5 12 18 17.8 12 17.8 2.5 12 2.5 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
      {open ? null : (
        <path d="M4 20 20 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  )
}

/**
 * A thumbnail that does not mount its slide until it is scrolled to.
 *
 * Every thumbnail is the live component, and the panel lists the whole deck at
 * once — sixty-odd slides with their observers, timers and video elements is
 * not something to mount for a glance at the first section. Once a card has
 * been seen it stays mounted, so scrolling back is instant.
 */
function Lazy({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    if (seen) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setSeen(true)
      },
      { root: el.closest('.keep-scroll'), rootMargin: '400px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [seen])

  return (
    <span className="keep-slot" ref={ref}>
      {seen ? children : null}
    </span>
  )
}

type KeepPanelProps = {
  open: boolean
  currentId: string
  onOpenChange: (open: boolean) => void
}

/**
 * The cut: every slide in the deck, by section, each one a switch.
 *
 * The handle is deliberately almost invisible — top right, opposite the index
 * icon, drawn only as a faint trim when the pointer finds it. It is a tool for
 * the person building the deck, not part of the deck, and it must not read as
 * chrome from the back of a room.
 */
export function KeepPanel({ open, currentId, onOpenChange }: KeepPanelProps) {
  const reduce = useReducedMotion() ?? false
  const { hidden, toggle, showAll } = useKeep()
  const list = useMemo(chapters, [])
  const kept = slides.length - hidden.size

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onOpenChange, open])

  return (
    <div className="keep">
      <button
        type="button"
        className="keep-handle"
        aria-label={open ? 'Close the cut' : 'Choose which slides to keep'}
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <Eye open={hidden.size === 0} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="keep-sheet"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: EASE }}
          >
            <button
              type="button"
              className="keep-dismiss"
              aria-label="Close the cut"
              onClick={() => onOpenChange(false)}
            />

            <motion.section
              className="keep-panel"
              aria-label="Which slides to keep"
              initial={reduce ? false : { opacity: 0, y: 14, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: reduce ? 0 : 0.28, ease: EASE }}
            >
              <header className="keep-head">
                <h2>The cut</h2>
                <p>
                  {kept} of {slides.length} slides in play
                  {hidden.size ? ` · ${hidden.size} set aside` : ''}
                </p>
                <button
                  type="button"
                  className="keep-reset"
                  onClick={showAll}
                  disabled={hidden.size === 0}
                >
                  Show all
                </button>
              </header>

              <div className="keep-scroll">
                {list.map((chapter) => {
                  const off = chapter.slides.filter(({ def }) => hidden.has(def.id)).length
                  return (
                    <section className="keep-group" key={chapter.label}>
                      <h3>
                        {chapter.label}
                        <span>
                          {chapter.slides.length - off}/{chapter.slides.length}
                        </span>
                      </h3>
                      <div className="keep-grid">
                        {chapter.slides.map(({ def, index }) => {
                          const off = hidden.has(def.id)
                          return (
                            <button
                              type="button"
                              key={def.id}
                              className={[
                                'keep-card',
                                off ? 'is-off' : '',
                                def.id === currentId ? 'is-current' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              aria-pressed={!off}
                              aria-label={`${def.title}: ${off ? 'hidden' : 'in play'}`}
                              onClick={() => toggle(def.id)}
                            >
                              <Lazy>
                                <Thumb def={def} className="keep-thumb" />
                              </Lazy>
                              <span className="keep-badge" aria-hidden="true">
                                <Eye open={!off} />
                              </span>
                              <span className="keep-n" aria-hidden="true">
                                {index + 1}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
