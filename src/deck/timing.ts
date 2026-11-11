import { useMemo } from 'react'
import { slides } from '../slides/registry'
import { TALK_SECONDS } from './config'
import { useEdit } from './EditContext'
import { useKeep } from './KeepContext'

/**
 * The talk as a timeline.
 *
 * Each slide's note carries how long it is on screen (`time`, typed as `0:45`
 * or `45`). Laid end to end over the slides in play, that gives every slide a
 * start time and the whole deck a running length to hold against the slot
 * (TALK_SECONDS). Set-aside slides take no time, so cutting a slide in the
 * cut panel shows straight away what it buys back.
 */

/** `1:30`, `90`, `1m30s` → 90. Anything else (blank included) → null. */
export function parseDuration(text: string): number | null {
  const t = text.trim()
  if (!t) return null
  const clock = /^(\d+):([0-5]?\d)$/.exec(t)
  if (clock) return Number(clock[1]) * 60 + Number(clock[2])
  const units = /^(?:(\d+)\s*m)?\s*(?:(\d+)\s*s?)?$/.exec(t)
  if (units && (units[1] || units[2])) return Number(units[1] ?? 0) * 60 + Number(units[2] ?? 0)
  return null
}

/** 90 → `1:30`. */
export function clock(seconds: number) {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export type Timeline = {
  /** By slide id, for slides in play: when it comes up, and for how long (null if unset). */
  at: ReadonlyMap<string, { start: number; length: number | null }>
  /** Sum of every budget in play. */
  total: number
  /** Slides in play with no budget yet. */
  unset: number
  target: number
}

export function useTimeline(): Timeline {
  const { note } = useEdit()
  const { hidden } = useKeep()

  return useMemo(() => {
    const at = new Map<string, { start: number; length: number | null }>()
    let total = 0
    let unset = 0
    for (const def of slides) {
      if (hidden.has(def.id)) continue
      const length = parseDuration(note(def.id).time)
      at.set(def.id, { start: total, length })
      if (length === null) unset++
      else total += length
    }
    return { at, total, unset, target: TALK_SECONDS }
  }, [hidden, note])
}
