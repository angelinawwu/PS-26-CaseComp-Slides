/**
 * Space holds the clip on a video slide, instead of turning the page.
 *
 * A clip is the one thing on this deck that keeps moving while Jen talks over
 * it, so space — the key a presenter's thumb already rests on — stops it and
 * starts it again. The arrows, PageDown and the hit zones still turn the page,
 * including on a video slide, so nothing is stranded.
 *
 * It works on the elements rather than through each slide, because the clips
 * are not all one component: `VideoSlide` carries most of them, but 148b, 158,
 * the DCC wall and Totem each hold their own `<video>`, and Totem's wall has
 * several at once. A sweep of the stage covers all of them and anything added
 * later.
 *
 * THE HOLD DEFENDS ITSELF. Every one of those slides retries `play()` on
 * `keydown`, because autoplay is routinely refused the first time and the
 * viewer's first arrow key is the cheapest moment to recover. Those listeners
 * sit on `document` and so run before the deck's own, on the very keypress
 * that is meant to stop the clip. Rather than teach each slide about the hold,
 * a held clip re-pauses itself whenever something plays it, which also covers
 * the `canplay` and `visibilitychange` retries and any slide written later.
 *
 * Only clips that were actually running are held, and only those resume: the
 * DCC wall deliberately runs one clip and leaves the rest paused, and a hold
 * must not start the others.
 */

type Held = { el: HTMLVideoElement; repause: () => void }

let held: Held[] = []

/** Pause every clip running inside `root`. False if none was. */
function hold(root: HTMLElement) {
  const playing = Array.from(root.querySelectorAll('video')).filter(
    (el) => !el.paused && !el.ended,
  )
  if (!playing.length) return false

  held = playing.map((el) => {
    const repause = () => el.pause()
    el.addEventListener('play', repause)
    el.pause()
    return { el, repause }
  })
  return true
}

/** Start the held clips again. False if nothing was held. */
export function releaseVideos() {
  if (!held.length) return false

  for (const { el, repause } of held) {
    el.removeEventListener('play', repause)
    // A clip whose slide has since been turned away is already detached; the
    // play() is harmless there and the rejection is not worth reporting.
    void el.play().catch(() => {})
  }
  held = []
  return true
}

/**
 * Hold the clips on the slide, or let the held ones go.
 *
 * False when the slide has no clip running and none is held — then the key
 * belongs to the deck, and space turns the page as it always has.
 */
export function toggleVideos(root: HTMLElement | null) {
  if (releaseVideos()) return true
  return root ? hold(root) : false
}
