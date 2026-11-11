import { useCallback, useEffect, useRef, useState } from 'react'
import { slides } from '../slides/registry'
import { ClipTags } from './ClipTags'
import { EditProvider, useEdit } from './EditContext'
import { useFullscreen } from './fullscreen'
import { readSlideIndex, writeSlideIndex } from './hash'
import { KeepPanel } from './KeepPanel'
import { KeepProvider, useKeep } from './KeepContext'
import { NotesPanel } from './NotesPanel'
import { SlidePresence } from './SlidePresence'
import { SlideRoute } from './SlideRoute'
import { SlideAdvance, SlideInert, SlideStepsProvider, useSlideSteps } from './SlideStepsContext'
import { Stage } from './Stage'
import { releaseVideos, toggleVideos } from './videoHold'
import './Deck.css'

function DeckInner() {
  const steps = useSlideSteps()
  const stepsRef = useRef(steps)
  stepsRef.current = steps

  const [index, setIndex] = useState(() =>
    typeof window === 'undefined' ? 0 : readSlideIndex(slides.length),
  )
  const view = useRef<HTMLDivElement>(null)
  const [keepOpen, setKeepOpen] = useState(false)
  const { hidden } = useKeep()
  const { mode, toggleMode } = useEdit()
  const fullscreen = useFullscreen()
  const toggleFullscreen = fullscreen.toggle
  const editing = mode === 'edit'
  const slide = slides[index]
  const last = slides.length - 1
  const busy = keepOpen

  /**
   * The next slide in play, in `step`'s direction.
   *
   * Hidden slides are stepped over rather than removed: the hash still numbers
   * the whole registry, so a link to a slide keeps working even once it is set
   * aside, and showing it again does not renumber anything. If there is nothing
   * in play ahead, the deck stays where it is.
   */
  const nextInPlay = useCallback(
    (from: number, step: 1 | -1) => {
      for (let i = from + step; i >= 0 && i <= last; i += step) {
        if (!hidden.has(slides[i]!.id)) return i
      }
      return from
    },
    [hidden, last],
  )

  const kept = slides.length - hidden.size
  const place = slides.slice(0, index + 1).filter((def) => !hidden.has(def.id)).length

  const go = useCallback(
    (next: number, mode: 'push' | 'replace' = 'push') => {
      const clamped = Math.max(0, Math.min(last, next))
      setIndex(clamped)
      writeSlideIndex(clamped, mode)
    },
    [last],
  )

  const goNext = useCallback(() => {
    if (stepsRef.current?.tryNext()) return
    go(nextInPlay(index, 1))
  }, [go, index, nextInPlay])

  const goPrev = useCallback(() => {
    if (stepsRef.current?.tryPrev()) return
    go(nextInPlay(index, -1))
  }, [go, index, nextInPlay])

  /** The plain page turn, for a slide that has finished its own exit. */
  const advance = useCallback(() => go(nextInPlay(index, 1)), [go, index, nextInPlay])

  useEffect(() => {
    writeSlideIndex(index, 'replace')
  }, [index])

  /** A hold belongs to the slide it was taken on; the next one plays. */
  useEffect(
    () => () => {
      releaseVideos()
    },
    [index],
  )

  useEffect(() => {
    const onHash = () => setIndex(readSlideIndex(slides.length))
    window.addEventListener('hashchange', onHash)
    window.addEventListener('popstate', onHash)
    return () => {
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('popstate', onHash)
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (busy) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return
      }

      if (event.key === ' ') {
        // On a video slide space holds the clip; everywhere else it is next.
        event.preventDefault()
        if (!toggleVideos(view.current)) goNext()
      } else if (
        event.key === 'ArrowRight' ||
        event.key === 'ArrowDown' ||
        event.key === 'PageDown'
      ) {
        event.preventDefault()
        goNext()
      } else if (
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowUp' ||
        event.key === 'PageUp'
      ) {
        event.preventDefault()
        goPrev()
      } else if (event.key === 'Home') {
        event.preventDefault()
        go(0)
      } else if (event.key === 'End') {
        event.preventDefault()
        go(last)
      } else if (event.key === 'f' || event.key === 'F') {
        event.preventDefault()
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, go, goNext, goPrev, last, toggleFullscreen])

  if (!slide) return null

  return (
    <div className={editing ? 'deck is-edit' : 'deck'}>
      <div className="deck-view" ref={view}>
        {/* While the cut is open the slide takes no input at all. */}
        <SlideInert inert={busy}>
          <SlideAdvance advance={advance}>
            <Stage>
              <SlidePresence slide={slide} />
              <ClipTags slideId={slide.id} />
            </Stage>
          </SlideAdvance>
        </SlideInert>

        {/* Click zones at the edges turn the page, except on a slide that takes clicks anywhere. */}
        {!slide.handsOn && (
          <>
            <button
              type="button"
              className="hit hit-prev"
              aria-label="Previous slide"
              disabled={busy || index === nextInPlay(index, -1)}
              onClick={goPrev}
            />
            <button
              type="button"
              className="hit hit-next"
              aria-label="Next slide"
              disabled={busy || index === nextInPlay(index, 1)}
              onClick={goNext}
            />
          </>
        )}

        {/* For screen readers only: where you are. The path says it for everyone else. */}
        <p className="sr-only" aria-live="polite">
          {slide.title}, {hidden.has(slide.id) ? 'hidden' : `${place} of ${kept}`}
        </p>

        <SlideRoute index={index} disabled={busy} onPick={go} />
      </div>

      <KeepPanel open={keepOpen} currentId={slide.id} onOpenChange={setKeepOpen} />

      {/* Gone once fullscreen: Esc is the way out, and nothing sits on the slide. */}
      {fullscreen.supported && !fullscreen.active && (
        <button
          type="button"
          className="fullscreen-handle"
          aria-label="Full screen (F)"
          title="Full screen (F) · Esc to exit"
          onClick={toggleFullscreen}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {editing ? (
        <NotesPanel
          slide={slide}
          position={hidden.has(slide.id) ? `Slide ${index + 1} · hidden` : `Slide ${place} of ${kept}`}
        />
      ) : (
        // Presenting: the way into edit mode is as quiet as the keep handle.
        <button
          type="button"
          className="edit-handle"
          aria-label="Edit mode: notes, timing and clip labels (E)"
          title="Edit mode (E)"
          onClick={toggleMode}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

export function Deck() {
  return (
    <KeepProvider>
      <EditProvider>
        <SlideStepsProvider>
          <DeckInner />
        </SlideStepsProvider>
      </EditProvider>
    </KeepProvider>
  )
}
