import { useEdit, type ClipKind } from './EditContext'
import './ClipTags.css'

/** A frame of film: what was shot with a camera. */
export function FilmGlyph() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="2.5" y="4" width="15" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 7.2h15M2.5 12.8h15" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 4v3.2M10 4v3.2M14 4v3.2M6 12.8V16M10 12.8V16M14 12.8V16" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

/** A plain phone: what was recorded off the MVP. */
export function PhoneGlyph() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="5.5" y="2" width="9" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.6 15.2h2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const WORD: Record<ClipKind, string> = { footage: 'Footage', prototype: 'MVP' }

/**
 * Edit mode's layer over the slide: one tag per clip that belongs on it.
 *
 * Drawn in slide pixels inside the stage, so the tags scale with the slide and
 * sit where they would on the 1920 x 1080 canvas. Nothing here takes a click;
 * the words are edited in the notes panel.
 */
export function ClipTags({ slideId }: { slideId: string }) {
  const { mode, showTags, note } = useEdit()
  if (mode !== 'edit' || !showTags) return null

  const { footage, prototype } = note(slideId)
  const rows = [
    ...footage.map((clip) => ({ kind: 'footage' as const, clip })),
    ...prototype.map((clip) => ({ kind: 'prototype' as const, clip })),
  ]

  return (
    <div className="clip-tags" aria-hidden="true">
      {rows.length === 0 ? (
        <div className="clip-tag is-empty">
          <span className="clip-tag-kind">Slide only</span>
          <span className="clip-tag-label">No footage or MVP clip on this one</span>
        </div>
      ) : (
        rows.map(({ kind, clip }, i) => (
          <div
            key={`${kind}-${i}`}
            className={['clip-tag', `is-${kind}`, clip.done ? 'is-done' : ''].filter(Boolean).join(' ')}
          >
            <span className="clip-tag-kind">
              {kind === 'footage' ? <FilmGlyph /> : <PhoneGlyph />}
              {WORD[kind]}
              {clip.id ? <b>{clip.id}</b> : null}
              {clip.done ? <span className="clip-tag-done">In hand</span> : null}
            </span>
            {clip.label ? <span className="clip-tag-label">{clip.label}</span> : null}
          </div>
        ))
      )}
    </div>
  )
}
