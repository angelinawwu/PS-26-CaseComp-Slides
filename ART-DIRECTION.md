# Visual direction

Duolingo is the client, so the deck looks like Duolingo. It should feel like one of their lessons,
not a deck about them.

- **Field:** white. One typeface: Nunito, standing in for Duolingo's Feather Bold and DIN Next
  Rounded, which are licensed to Duolingo. Titles are 76px at weight 900, Eel `#4b4b4b`, sentence
  case. Body text is 30px at weight 600, Wolf `#777`. Use only two text sizes: body (30) and small
  (22).
- **Kicker:** a small uppercase unit label in the unit's colour sits over each title, the way Duo
  labels a unit. Highlight one key word with `<em>`, which picks up the unit colour.
- **Palette:** use Duolingo's colour names, from `src/index.css`. Feather `#58cc02`, Macaw
  `#1cb0f6`, Beetle `#ce82ff`, Fox `#ff9600`, Bee `#ffc800`, Cardinal `#ff4b4b`. Swan `#e5e5e5`
  is for borders. Each unit has one colour: Intro feather, Problem beetle, Solution macaw, Demo
  cardinal, Growth fox, Close feather.
- **Depth comes from the lip, not shadows:** cards, chips and nodes sit on a darker band of their
  own colour (`--x-lip`), like Duo's buttons. White cards get a 3px Swan border with a 7px Swan
  bottom.
- **Characters:** the owl (`<Owl>`) is our own drawing in Duo's colours. Swap in the real mascot if
  Duolingo gives us brand assets. Lily and the learner avatars are Ansu's drawings from the
  Duolingo Connect prototype (`avatars.tsx`), so the slides and the demo show the same people.
  Characters speak in `<Bubble>`s, as they do in lessons.
- **The product:** always show it as the real prototype in its phone, either a photographed
  `<Phone>` or the live `<LiveConnect>`, never a redrawn mock. The phone is the one thing on a slide
  that gets a soft drop shadow, because it's an object in the room and not a piece of the page.
- **Serious slides:** these drop all of the above for plain Helvetica, light weight, black on white,
  with no colour. Use one or two, at the turn where we stop being playful (the problem
  statement). The contrast does the work, so don't dilute it.
- **Stubs:** placeholder slides use dashed cards and a yellow "To build" sticker. Nothing dashed
  should reach the final deck.
- **Motion:** slides drift. Things that arrive on a click fade up. Stickers and bubbles pop with a
  slight overshoot (`--motion-pop`), which is Duo's springiness. Reduced motion only fades.
- **Avoid:** gradients, drop shadows (except under the phone), more than one unit colour on a slide (except the agenda and
  the team), centred text-heavy layouts, and emoji (use `<Glyph>`).
