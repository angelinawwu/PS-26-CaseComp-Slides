import type { SlideDef } from '../slides/registry'
import { FilmGlyph, PhoneGlyph } from './ClipTags'
import { useEdit, type Clip, type ClipKind, type SaveState } from './EditContext'
import { clock, parseDuration, useTimeline } from './timing'
import './NotesPanel.css'

const SAVED: Record<SaveState, string> = {
  loading: 'Loading notes…',
  saving: 'Saving…',
  saved: 'Saved to notes/slide-notes.json',
  local: 'Saved in this browser only (run npm run dev to save to the repo)',
  error: "Couldn't reach the file. Kept in this browser for now",
}

const KIND: Record<ClipKind, { title: string; hint: string; add: string; placeholder: string }> = {
  footage: {
    title: 'Footage',
    hint: 'Interview clips, street footage, anything filmed. Full-bleed.',
    add: 'Add footage',
    placeholder: 'F1',
  },
  prototype: {
    title: 'MVP',
    hint: 'Duolingo Connect screen recordings. Always inside the phone.',
    add: 'Add MVP clip',
    placeholder: 'P1',
  },
}

type ClipListProps = {
  kind: ClipKind
  clips: Clip[]
  onChange: (clips: Clip[]) => void
}

function ClipList({ kind, clips, onChange }: ClipListProps) {
  const copy = KIND[kind]
  const set = (i: number, patch: Partial<Clip>) =>
    onChange(clips.map((clip, at) => (at === i ? { ...clip, ...patch } : clip)))

  return (
    <section className={`notes-block is-${kind}`}>
      <h3>
        {kind === 'footage' ? <FilmGlyph /> : <PhoneGlyph />}
        {copy.title}
        <span>{clips.length}</span>
      </h3>
      <p className="notes-hint">{copy.hint}</p>

      {clips.map((clip, i) => (
        <div className={['notes-clip', clip.done ? 'is-done' : ''].filter(Boolean).join(' ')} key={i}>
          <label className="notes-check" title={clip.done ? 'In hand' : 'Still to make'}>
            <input
              type="checkbox"
              checked={clip.done}
              onChange={(event) => set(i, { done: event.target.checked })}
            />
            <span aria-hidden="true" />
            <span className="notes-sr">Clip is in hand</span>
          </label>
          <input
            className="notes-id"
            value={clip.id}
            placeholder={copy.placeholder}
            aria-label={`${copy.title} clip label`}
            onChange={(event) => set(i, { id: event.target.value })}
          />
          <textarea
            className="notes-label"
            value={clip.label}
            rows={1}
            placeholder="What's in it, how long, where it sits"
            aria-label={`${copy.title} clip description`}
            onChange={(event) => set(i, { label: event.target.value })}
          />
          <button
            type="button"
            className="notes-remove"
            aria-label={`Remove ${clip.id || copy.title.toLowerCase()} clip`}
            onClick={() => onChange(clips.filter((_, at) => at !== i))}
          >
            ×
          </button>
        </div>
      ))}

      <button
        type="button"
        className="notes-add"
        onClick={() => onChange([...clips, { id: '', label: '', done: false }])}
      >
        + {copy.add}
      </button>
    </section>
  )
}

/**
 * Where this slide sits in the talk: the deck's running length as an XP bar
 * against the slot, with this slide's share lit. Over the slot, the bar goes
 * red, the way a lesson's hearts do.
 */
function TimeBar({ id }: { id: string }) {
  const { at, total, unset, target } = useTimeline()
  const here = at.get(id)
  const span = Math.max(target, total)
  const over = total > target
  const pct = (n: number) => `${(n / span) * 100}%`

  return (
    <div className={over ? 'notes-time is-over' : 'notes-time'}>
      <div className="notes-time-bar" aria-hidden="true">
        <span className="notes-time-fill" style={{ width: pct(total) }} />
        {here && here.length ? (
          <span className="notes-time-here" style={{ left: pct(here.start), width: pct(here.length) }} />
        ) : null}
        {over ? <span className="notes-time-limit" style={{ left: pct(target) }} /> : null}
      </div>
      <p>
        {here ? <>Starts at <b>{clock(here.start)}</b> · </> : <>Hidden · </>}
        Deck <b>{clock(total)}</b> of {clock(target)}
        {over ? <> · <b>{clock(total - target)} over</b></> : null}
        {unset ? <> · {unset} untimed</> : null}
      </p>
    </div>
  )
}

type NotesPanelProps = {
  slide: SlideDef
  position: string
}

/**
 * Edit mode's side panel: who presents, for how long, what to say, and which
 * clips land on this slide.
 *
 * Arrow keys still turn the page from here (the deck ignores keys typed into a
 * field), so the run sheet can be walked slide by slide without leaving it.
 */
export function NotesPanel({ slide, position }: NotesPanelProps) {
  const { note, update, saveState, setMode, showTags, setShowTags } = useEdit()
  const current = note(slide.id)
  const edit = (patch: Partial<typeof current>) =>
    update(slide.id, (prev) => ({ ...prev, ...patch }))
  const badTime = current.time.trim() !== '' && parseDuration(current.time) === null

  return (
    <aside className="notes" aria-label="Slide notes">
      <header className="notes-head">
        <div className="notes-mode">
          <span className="notes-mode-dot" aria-hidden="true" />
          Edit mode
        </div>
        <button type="button" className="notes-present" onClick={() => setMode('present')}>
          Present <kbd>E</kbd>
        </button>
      </header>

      <div className="notes-scroll">
        <div className="notes-title">
          <span className="notes-position">{position}</span>
          <h2>{slide.title}</h2>
        </div>

        <div className="notes-meta">
          <label>
            <span>Presenter</span>
            <input
              value={current.narrator}
              placeholder="Who"
              onChange={(event) => edit({ narrator: event.target.value })}
            />
          </label>
          <label>
            <span>Time on slide</span>
            <input
              value={current.time}
              placeholder="0:45"
              aria-invalid={badTime || undefined}
              onChange={(event) => edit({ time: event.target.value })}
            />
          </label>
        </div>

        <TimeBar id={slide.id} />

        <section className="notes-block">
          <h3>Speaker notes</h3>
          <textarea
            className="notes-speaker"
            value={current.notes}
            rows={4}
            placeholder="The line to say, or a reminder"
            aria-label="Speaker notes"
            onChange={(event) => edit({ notes: event.target.value })}
          />
        </section>

        <ClipList kind="footage" clips={current.footage} onChange={(footage) => edit({ footage })} />
        <ClipList
          kind="prototype"
          clips={current.prototype}
          onChange={(prototype) => edit({ prototype })}
        />
      </div>

      <footer className="notes-foot">
        <label className="notes-toggle">
          <input
            type="checkbox"
            checked={showTags}
            onChange={(event) => setShowTags(event.target.checked)}
          />
          Tags on slide
        </label>
        <span className={`notes-saved is-${saveState}`}>{SAVED[saveState]}</span>
      </footer>
    </aside>
  )
}
