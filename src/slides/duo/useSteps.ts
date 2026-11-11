import { useEffect, useMemo, useRef, useState } from 'react'
import { useSlideNav } from '../../deck/SlideNavContext'
import { useRegisterSlideSteps, useSlidePreview } from '../../deck/SlideStepsContext'
import { nextOf } from '../registry'

/**
 * Arrow-key steps inside one slide (the clicks in the talk that stay on the
 * same slide): right reveals the next step, left takes it back, and past either
 * end the deck turns the page.
 *
 * Coming back from the next slide lands on the last step, so stepping
 * backwards un-builds the slide instead of starting it over. Thumbnails always
 * show the finished slide.
 */
export function useSteps(self: string, count: number) {
  const last = count - 1
  const { id, fromId } = useSlideNav()
  const preview = useSlidePreview()
  const nextId = nextOf(self)
  // `?final` in the address opens every stepped slide finished (handy for stills and printing).
  const final = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('final')
  const [step, setStep] = useState(() =>
    preview || final || (nextId !== null && (fromId === nextId || id === nextId)) ? last : 0,
  )

  const steps = useMemo(
    () => ({
      tryNext: () => {
        if (step >= last) return false
        setStep(step + 1)
        return true
      },
      tryPrev: () => {
        if (step <= 0) return false
        setStep(step - 1)
        return true
      },
    }),
    [step, last],
  )
  useRegisterSlideSteps(steps)

  return preview ? last : step
}

/**
 * True one frame after `on` turns true (false at once when it turns off), so a
 * thing that is already "on" when the slide mounts still plays its entrance as
 * a CSS transition. Previews skip the wait and render finished.
 *
 * When the slide arrives by a page turn, the turn is its entrance: whatever is
 * on from the start is simply there as the page slides in, instead of the page
 * arriving empty and filling. `draw` things (stickers, speech bubbles) are the
 * exception: they still draw on, once the page has landed.
 */
export function useShown(on: boolean, draw = false) {
  const preview = useSlidePreview()
  const { land } = useSlideNav()
  const first = useRef(true)
  const [shown, setShown] = useState(() => land !== null && on && !draw)
  useEffect(() => {
    const wait = first.current && land !== null && draw ? land : 0
    first.current = false
    if (!on) return
    let b = 0
    let t = 0
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => {
        if (wait) t = window.setTimeout(() => setShown(true), wait)
        else setShown(true)
      })
    })
    return () => {
      cancelAnimationFrame(a)
      cancelAnimationFrame(b)
      clearTimeout(t)
      setShown(false)
    }
    // `land` is read on the first run only: it describes how this slide arrived.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on])
  return preview ? on : on && shown
}
