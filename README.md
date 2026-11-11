# Duolingo Connect deck

The web slideshow for our Duolingo case competition pitch. **Duolingo Connect** lets learners talk
with Lily (AI) or a real learner, and their avatar does the talking. The MVP is Ansu's prototype in
`Duolingo-PS-2026-CaseComp/Ansu's MVP`, and it runs live inside the deck. The team's research and
problem statement are in [BRIEF.md](BRIEF.md),
and the visual rules are in [ART-DIRECTION.md](ART-DIRECTION.md). Duolingo is the client, so the deck
uses Duolingo's look.

The deck engine (stage scaling, page turns, stepped slides, the path, edit mode, the cut) is the
same one as svsd-deck and the DESMA 141 deck, re-skinned for Duolingo.

## Run

    npm install
    npm run dev      # http://localhost:5196

| Key | Does |
| --- | --- |
| → ↓ space PageDown | next step, or next slide |
| ← ↑ PageUp | back |
| Home / End | first / last slide |
| `G` | the path: every slide as a lesson node, by unit (also: rest the pointer on the dots at the bottom) |
| `1`–`9` | jump to a unit |
| `F` | fullscreen (`Esc` leaves) |
| `E` | edit mode |

The screen edges also turn the page. `#N` in the address is the slide number. `?final` opens every
stepped slide already finished.

## Edit mode: the run sheet

Press `E` (or the faint pencil, top left). A panel opens on the right for the current slide:

- **Presenter**: who presents it.
- **Time on slide**: `0:45` or `45`. The bar under it adds every slide's time against the slot
  (`TALK_SECONDS` in `src/deck/config.ts`, 10:00 for now) and shows this slide's share. It turns red
  when the deck runs over. The path shows the running clock too.
- **Speaker notes**.
- **Footage** and **MVP** clips that belong on the slide, each with an "in hand" checkbox. They
  show as tags on the slide. Untick "Tags on slide" to see it clean.

While `npm run dev` is running, every edit is written to `notes/slide-notes.json`. Commit it, and
teammates get the same run sheet on `git pull`.

## The prototype

The demo slide runs Ansu's Duolingo Connect prototype live. Click into the phone and drive it:
`L` calls Lily, `P` starts a real-person call, `G` fires the safety filter, `N` skips to the next
partner, `Esc` ends the call, and `1`–`3` switch language. The arrow keys still move the deck while
the phone has focus. Keep a mouse handy to click back into it.

The other phone screens on the slides (home, before-you-connect, the call, Duo Guardian, the recap)
are photographs of the same prototype. They're also what the cut panel and `npm run export` show for
the demo slide. To refresh both the live copy and the photographs after the prototype changes, run:

    npm run connect

That copies `Ansu's MVP/demo/duolingo-connect-demo.html` into `public/assets/connect/` and
photographs the phone through a scripted call (`tools/connect.mjs`). If the prototype's source
changed, rebuild it first (`npx vite build` in Ansu's MVP). The characters on the cover (Lily and
Maya) are Ansu's drawings, ported to `src/slides/duo/avatars.tsx`.

## The cut

The faint eye (top right) opens every slide as a thumbnail. Click one to set it aside: it stays in
the repo, but the deck skips it, the path leaves it off, and its time drops out of the total. This
is how to make the 5-minute version without deleting anything. It's saved per browser.

## Adding a slide

1. Write the component in `src/slides/duo/slides.tsx`. Draw it at 1920×1080 with the primitives in
   `primitives.tsx` (`Field`, `Head`, `Card`, `Chip`, `Bubble`, `Owl`, `Glyph`, `Appear`). Put its
   layout in `slides.css`.
2. Add one entry to `src/slides/registry.ts`, in deck order.
3. If it starts or ends a unit, update `src/deck/chapters.ts`.
4. Put assets under `public/assets/`.

For click-through builds, call `useSteps('id', count)` and gate pieces with
`<Appear on={step > n}>`. "What learners told us" is an example. To replace a stub, swap
`stubs.X` in the registry for a real component.

**Serious slides.** Set `serious: true` on a registry entry, and wrap it in
`<Field serious>`. Duolingo's styling goes away (plain Helvetica, black on white), and the slide
drops in from above. The problem statement uses this for the "remove it when we get serious"
moment.

**Special turns.** `KINDS` in `src/deck/turn.ts` sets the transition for a pair of slides:
`iris` opens the next slide out of a `data-iris` dot, and `morph` flies shared `data-morph` pieces
between slides. The agenda currently opens into the problem section through its first lesson node.

## Stills

    npm run export   # with npm run dev running

This saves one PNG per slide to `export/`, which works as a backup deck or a PDF. If Vite picked
another port, use `DECK_URL=http://localhost:5197 npm run export`.
