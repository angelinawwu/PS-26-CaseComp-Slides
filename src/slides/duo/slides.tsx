import { LilyAvatar, PeerAvatar } from './avatars'
import { LiveConnect, Phone, type Screen } from './connect'
import { Appear, Bubble, Card, Chip, Field, Glyph, Head, hue, Owl, type Hue } from './primitives'
import { useSteps } from './useSteps'
import './slides.css'

/*
 * The deck, in registry order. Intro and problem slides are drafted from the
 * team's research notes, the solution and demo from Ansu's Duolingo Connect
 * prototype (BRIEF.md). The rest are stubs: a title, the ideas already on the
 * table, and a "to build" sticker so nobody presents one by accident.
 */

// ---------------------------------------------------------------- Intro

/** Edit to the real team. Colours run in Duo's order, one per person. */
const TEAM: { name: string; role: string; color: Hue }[] = [
  { name: 'Angelina', role: 'Role', color: 'feather' },
  { name: 'Annabella', role: 'Role', color: 'macaw' },
  { name: 'Elisa', role: 'Role', color: 'fox' },
  { name: 'Ansu', role: 'Role', color: 'beetle' },
]

export function Cover() {
  return (
    <Field className="cover">
      <Head
        kicker="Duolingo case competition · 2026"
        title={
          <>
            Duolingo
            <br />
            <em>Connect</em>
          </>
        }
        y={250}
        width={900}
        size="large"
      >
        <p>Real speaking practice, without the fear of talking to strangers.</p>
      </Head>
      <Appear className="cover-chip" delay={120}>
        <Chip>Let’s talk</Chip>
      </Appear>
      <Owl className="cover-owl" size={520} look="left" />
      <Appear draw className="cover-bubble" delay={150}>
        <Bubble toward="down">¡Hola!</Bubble>
      </Appear>
      {/* Who you could be talking to: Lily (AI) and a real learner, as Connect draws them. */}
      <div className="cover-tile cover-lily">
        <LilyAvatar isCardIcon />
      </div>
      <div className="cover-tile cover-peer">
        <PeerAvatar preset={0} />
      </div>
    </Field>
  )
}

export function Team() {
  return (
    <Field>
      <Head kicker="Intro" title="Who we are" />
      <div className="team">
        {TEAM.map((person, i) => (
          <Appear key={person.name} delay={60 * i}>
            <Card className="team-card">
              <span className="team-avatar" style={hue(person.color)}>
                {person.name[0]}
              </span>
              <h3>{person.name}</h3>
              <p>{person.role}</p>
            </Card>
          </Appear>
        ))}
      </div>
    </Field>
  )
}

/** Today's lesson: the talk as a Duo path, one node per unit. The problem node is what the next slide opens out of. */
const LESSON: { label: string; color: Hue; iris?: boolean }[] = [
  { label: 'Problem', color: 'beetle', iris: true },
  { label: 'Solution', color: 'macaw' },
  { label: 'Demo', color: 'cardinal' },
  { label: 'Growth', color: 'fox' },
]

export function Agenda() {
  return (
    <Field>
      <Head kicker="Intro" title="Today’s lesson" />
      <div className="lesson">
        {LESSON.map((unit, i) => (
          <div key={unit.label} className="lesson-stop" style={{ ...hue(unit.color), top: i % 2 ? 90 : 0 }}>
            <span className="lesson-node" data-iris={unit.iris || undefined}>
              {i + 1}
            </span>
            <span className="lesson-label">{unit.label}</span>
          </div>
        ))}
      </div>
      <Owl className="agenda-owl" size={300} look="left" />
    </Field>
  )
}

// ---------------------------------------------------------------- Problem

const HEARD: { title: string; body: string; glyph: Parameters<typeof Glyph>[0]['name'] }[] = [
  { title: 'Tries to do too much', body: 'Every skill at once, none of them deep.', glyph: 'gem' },
  { title: 'Misses spoken words', body: 'Speech recognition fails on real speech.', glyph: 'mic' },
  { title: 'Practice, not teaching', body: 'Drills without the why behind them.', glyph: 'bolt' },
  { title: 'Game over learning', body: 'The streak matters more than the skill.', glyph: 'flame' },
  { title: 'No real conversation', body: 'Nobody to actually talk to.', glyph: 'chat' },
  { title: 'Slang and tones', body: 'Textbook phrases; Mandarin tones go unchecked.', glyph: 'heart' },
]

export function Heard() {
  const step = useSteps('heard', HEARD.length + 1)
  return (
    <Field>
      <Head kicker="Problem" color="beetle" title="What learners told us" />
      <div className="heard">
        {HEARD.map((item, i) => (
          <Appear key={item.title} on={step > i}>
            <Card className="heard-card">
              <Glyph name={item.glyph} size={52} />
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </Card>
          </Appear>
        ))}
      </div>
    </Field>
  )
}

const KEEP: { title: string; body: string; glyph: Parameters<typeof Glyph>[0]['name']; color: Hue }[] = [
  { title: 'Instant rewards', body: 'XP the moment a lesson ends.', glyph: 'bolt', color: 'bee' },
  { title: 'A clear reason to come back', body: 'Streaks, leagues, gems.', glyph: 'flame', color: 'fox' },
  { title: 'The owl', body: 'A mascot people actually like.', glyph: 'heart', color: 'cardinal' },
]

export function Keep() {
  return (
    <Field>
      <Head kicker="Problem" color="beetle" title="What Duolingo gets right">
        <p>Whatever we add has to keep all three.</p>
      </Head>
      <div className="strengths">
        {KEEP.map((item, i) => (
          <Appear key={item.title} delay={80 * i}>
            <Card color={item.color} className="strength-card">
              <Glyph name={item.glyph} size={96} />
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </Card>
          </Appear>
        ))}
      </div>
    </Field>
  )
}

/** The serious one: the costume comes off for the problem statement. */
export function Problem() {
  return (
    <Field serious>
      <Head
        kicker="The problem"
        y={300}
        width={1500}
        title={
          <>
            Real speaking skill — <b>natural conversation, slang, confidence</b> — is hard to
            build without losing what makes Duolingo fun.
          </>
        }
      />
    </Field>
  )
}

// ---------------------------------------------------------------- Solution

const HOW: { title: string; body: string }[] = [
  { title: 'Tap Connect', body: 'Pick Lily (AI) or a real learner.' },
  { title: 'Your avatar speaks for you', body: 'Face hidden by default.' },
  { title: 'Your voice, your call', body: 'Real or synthetic, switch anytime.' },
]

export function Solution() {
  return (
    <Field>
      <Head kicker="Solution" color="macaw" title={<>Talk with Lily or a <em>real learner</em></>} width={860}>
        <p>Your avatar does the talking.</p>
      </Head>
      <ol className="how-list">
        {HOW.map((item, i) => (
          <Appear as="li" key={item.title} delay={80 * i} style={hue('macaw')}>
            <span className="how-n">{i + 1}</span>
            <span>
              <b>{item.title}</b>
              {item.body}
            </span>
          </Appear>
        ))}
      </ol>
      <Phone screen="lily" width={330} className="solution-back" />
      <Phone screen="home" width={390} className="solution-front" />
    </Field>
  )
}

/** A call, screen by screen: each click brings the next phone forward. */
const CALL: { screen: Screen; caption: string }[] = [
  { screen: 'precall', caption: 'Choose how you look and sound' },
  { screen: 'call', caption: 'Talk; your avatar speaks for you' },
  { screen: 'recap', caption: 'Earn XP for a real conversation' },
]

export function How() {
  const step = useSteps('how', CALL.length)
  return (
    <Field>
      <Head kicker="Solution" color="macaw" title="How a call works" width={520} />
      {CALL.map((item, i) => (
        <Appear key={item.screen} on={step >= i} className={`call-step call-step-${i}`}>
          <Phone screen={item.screen} width={300} />
          <p className="call-caption" style={hue('macaw')}>
            <span className="how-n">{i + 1}</span>
            {item.caption}
          </p>
        </Appear>
      ))}
    </Field>
  )
}

const GUARDIAN: { title: string; body: string; glyph: Parameters<typeof Glyph>[0]['name'] }[] = [
  { title: 'Age-verified matching', body: 'Adults, teens and kids in separate pools.', glyph: 'shield' },
  { title: 'Face hidden by default', body: 'Your Duolingo avatar talks for you.', glyph: 'mask' },
  { title: 'Your voice, your choice', body: 'Real or synthetic, even mid-call.', glyph: 'mic' },
  { title: 'Personal info filter', body: 'Numbers, addresses and handles muted live.', glyph: 'lock' },
  { title: 'One-tap report & block', body: 'Reviewed by the safety team.', glyph: 'flag' },
]

export function Safety() {
  return (
    <Field>
      <Head kicker="Solution · Duo Guardian" color="macaw" title="Safe by design" width={900}>
        <p>Talking to strangers is the biggest barrier. Here’s how we remove it.</p>
      </Head>
      <ul className="guardian">
        {GUARDIAN.map((item, i) => (
          <Appear as="li" key={item.title} delay={60 * i}>
            <Glyph name={item.glyph} size={48} />
            <span>
              <b>{item.title}</b>
              {item.body}
            </span>
          </Appear>
        ))}
      </ul>
      <Phone screen="guardian" width={390} className="guardian-phone" />
    </Field>
  )
}

// ---------------------------------------------------------------- Demo

/** The prototype's own shortcuts, for whoever is driving. */
const KEYS: [string, string][] = [
  ['L', 'Call Lily'],
  ['P', 'Real person'],
  ['G', 'Safety filter'],
  ['N', 'Next partner'],
  ['Esc', 'End call'],
  ['1–3', 'Language'],
]

export function Demo() {
  return (
    <Field>
      <Head kicker="Demo" color="cardinal" title="Let’s make a call" width={700}>
        <p>Click the phone to drive it. Arrow keys still move the deck.</p>
      </Head>
      <ul className="demo-keys">
        {KEYS.map(([key, what]) => (
          <li key={key}>
            <kbd>{key}</kbd>
            {what}
          </li>
        ))}
      </ul>
      <LiveConnect height={960} className="demo-phone" />
    </Field>
  )
}

// ---------------------------------------------------------------- Stubs

/**
 * A slide still to be designed: its title, the ideas already on the table,
 * and a sticker that says so.
 */
function stub(kicker: string, color: Hue, title: string, seeds: string[]) {
  return function Stub() {
    return (
      <Field className="stub">
        <Head kicker={kicker} color={color} title={title} />
        <ul className="stub-seeds">
          {seeds.map((seed) => (
            <li key={seed}>{seed}</li>
          ))}
        </ul>
        <Appear draw className="stub-sticker">
          <Chip color="bee">To build</Chip>
        </Appear>
      </Field>
    )
  }
}

export const stubs = {
  Unolingo: stub('Problem', 'beetle', '(Uno)lingo', [
    'Duolingo cut its branching paths for one linear path',
    'Example of the game winning over the learning',
    '“Pretty-looking trash”: the costume comes off on the next slide',
  ]),
  Growth: stub('Growth', 'fox', 'Getting it in front of learners', [
    'A popup after a lesson invites you to a call',
    'Win back lapsed streaks with a call instead of a lesson',
    '“42,810 learners online” on the Connect tab: show the crowd',
    'Competitor to beat: HelloTalk',
  ]),
  Measure: stub('Growth', 'fox', 'How we’d know it works', [
    'Time speaking, phrases learned, live calls (the profile stats in the MVP)',
    'Speaking scores before and after',
    'Calls completed, and calls repeated',
    'Streak recovery among lapsed learners',
  ]),
}

// ---------------------------------------------------------------- Close

export function Ending() {
  return (
    <Field className="ending">
      <Owl className="ending-owl" size={420} look="up" />
      <Appear draw className="ending-bubble" delay={150}>
        <Bubble toward="down">¡Gracias!</Bubble>
      </Appear>
      <Head title="Thank you!" y={720} x={0} width={1920} size="large">
        <p>Questions?</p>
      </Head>
    </Field>
  )
}
