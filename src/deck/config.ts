/** Design size of one slide (16:9). Slides are drawn at this size and the stage scales them. */
export const STAGE = {
  width: 1920,
  height: 1080,
} as const

/**
 * The presentation slot, in seconds. Edit mode adds up every slide's time
 * against it (timing.ts). Set it to the competition's real limit once it's
 * confirmed; Q&A doesn't count.
 */
export const TALK_SECONDS = 10 * 60

/**
 * How slides change (turn.ts). `drift` is a short, layered step in the deck's
 * direction, calm enough for a pitch room; `push` slides whole pages across;
 * `fade` only fades. Reduced motion always fades.
 */
export const TURN_STYLE: 'drift' | 'push' | 'fade' = 'drift'
