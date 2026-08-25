# Durus for iOS — build spec

Status: draft for a greenfield repo.
Reference implementation: the `Durus` web repo (Next 16 PWA), which the iOS
repo has read access to. Nothing here is a port instruction unless it says
"port". Where it says "port", it means take the file, keep the comments, and
change only what the platform forces.

Companion references on the same machine, both shipped by the same author and
both worth reading before writing code:

- `../cobalt` — Expo SDK 55, expo-router, zustand, token driven theme, local
  notifications only, no push entitlement. This is the house style. Copy its
  conventions.
- `../drift` — the older Expo app. Useful for `app.json` shape and EAS, but
  Cobalt supersedes it on state, theming, and testing.

---

## 1. What Durus is

A revision app for Madinah Arabic Book 1, 23 lessons. It is not a general
flashcard app and it is not a course. It sits alongside a class that meets on
Wednesdays and it exists to keep the vocabulary from the lessons already
covered in working memory.

Four drills:

| Drill | What it does |
|---|---|
| Review | The scheduler. Auto graded, mixed modes, the main screen. |
| Speed drill | 20 words against a shrinking clock. Recognition only. Logged, never scheduled. |
| Case drill | Blanks a final harakah on a noun in a phrase and asks which ending belongs. |
| Flashcards | Manual flip, no grading, no scheduling. Browsing, not drilling. |

Plus: Today (home), Lessons (list and detail), Stats, Settings, Unlock (name
and PIN).

### 1.1 Things that must not change

These are the product, not implementation details. A rewrite that loses any of
them has failed.

1. **The user never grades themselves.** There is no Again / Hard / Good /
   Easy row. Correctness comes from the answer, difficulty comes from how long
   it took. `lib/modes.ts` is the whole rule.
2. **Recognition and production are separate schedules.** Two rows per card.
   Production is only created once recognition reaches `repetitions >= 2`.
3. **The ladder.** A card gets harder to answer as it gets easier to remember:
   choice → written (recognition) / assemble (production) at 2 reps. Getting it
   wrong resets reps to zero, which demotes it with no separate rule.
4. **The current lesson stays tight.** Cards in `settings.currentLesson` cap at
   a 3 day interval, for 14 days after that lesson became current. Wednesday
   awareness.
5. **Nothing is due is not a different screen.** Review falls back to practice
   over lessons 1..currentLesson. A correct answer in practice does not move
   the schedule; a wrong one still does.
6. **Never praise, never a streak.** Feedback is "Right.", "Right, but slow.",
   "Not that one." No confetti, no scores, no gamification. `feedbackFor`.
7. **Silence is a feature.** A reminder does not fire when nothing is due, or
   when a session was done in the last four hours.
8. **No pure white, no pure black.** One palette file, no literal colour
   anywhere else in the codebase.
9. **Arabic is never selectable and never copyable.** Long press on a card face
   does nothing.
10. **Motion is limited** to the card flip, the deck advance, the speed ring,
    and the PIN shake. Nothing else animates.

---

## 2. The one architectural decision

**Go local first. SQLite on the device is the source of truth. There is no
server in v1.**

The web app is Neon Postgres behind Next server actions, with a cookie
session, a proxy, a hand written service worker, an IndexedDB outbox, web-push
with VAPID keys, and an hourly Vercel cron. Every one of those exists to make
a website behave like an app that is already installed. On iOS none of it is
needed.

What dies outright:

| Web concern | iOS |
|---|---|
| `proxy.ts` | gone — no request to gate |
| `lib/auth.ts`, session cookie, HMAC token | gone — see §2.2 |
| `public/sw.js` | gone |
| `lib/outbox.ts` (IndexedDB replay) | gone — writes are local and synchronous |
| `lib/push.ts` + `web-push` + VAPID | gone — local notifications, §8 |
| `app/api/cron/tick` + `vercel.json` crons | gone — `SchedulableTriggerInputTypes.DAILY` |
| `app/manifest.webmanifest/route.ts` | gone |
| `lib/splash.ts` + 22 generated splash PNGs | gone — one `expo-splash-screen` config |
| `components/install-hint.tsx`, `standalone-redirect.tsx`, `offline-pill.tsx` | gone |
| `components/desktop-shell.tsx`, the 1024px rail | gone — phone only, `supportsTablet: false` |
| Server actions in `app/*/actions.ts` | become plain local functions |

What that buys: the app is fully offline by construction, launches with no
network round trip, has no auth failure mode, and has no infrastructure to pay
for or keep alive.

### 2.1 The database

`expo-sqlite` with `drizzle-orm/expo-sqlite` and `drizzle-kit` migrations.

Use Drizzle rather than raw SQL specifically so `lib/queue.ts` and
`lib/stats.ts` port with their query structure intact — those are the two files
where the logic *is* the SQL. Schema changes go through `drizzle-kit generate`
and the `useMigrations` hook at boot, the same way `db/migrations/` works today.

Postgres → SQLite type mapping for the port:

- `serial` → `integer().primaryKey({ autoIncrement: true })`
- `timestamp with time zone` → `integer({ mode: 'timestamp_ms' })`. Store epoch
  ms. Never store a formatted local time.
- `real` → `real`
- `boolean` → `integer({ mode: 'boolean' })`
- `pgEnum` → `text({ enum: [...] })`. Keep both direction enums separate, for
  the reason the current comment gives: `card_states` has two directions,
  `reviews` has three, because speed runs are logged but never scheduled.
- `date` (`lastNotifiedOn`) → `text` holding `YYYY-MM-DD` in the account's own
  timezone. It is a local calendar day, not an instant.
- `percentile_cont` in `lib/stats.ts` does not exist in SQLite. Compute the
  median in JS from the returned rows, or use
  `ORDER BY ms_to_answer LIMIT 1 OFFSET (count-1)/2`. Keep the "best is the
  best single *day* median, not the best single answer" rule.

Enable WAL (`PRAGMA journal_mode = WAL`) and foreign keys
(`PRAGMA foreign_keys = ON`) at open — SQLite defaults FKs to off, and the
schema leans on `on delete cascade`.

### 2.2 Accounts

The web app has name + 4 digit PIN profiles because several people share one
browser install. A phone is one person's.

**Recommended:** keep the `profiles` table and the multi profile data model
(every scoped table is already keyed by `profileId` — do not throw that away,
it costs nothing to keep and is expensive to add back). But drop the PIN screen
from the default path. On first launch, create a single profile silently from a
name asked for during onboarding. Put "Add a profile" and an optional
"Require a PIN to open" in Settings, off by default.

If a PIN is turned on, use `expo-local-authentication` for Face ID with the PIN
as fallback, and store the PIN hash in `expo-secure-store`, not SQLite. Keep
the honest comment from `lib/auth.ts`: a 4 digit PIN with unlimited attempts is
a "not my phone" speed bump, not security.

`lib/session.ts` collapses to a single `currentProfileId()` reading a zustand
store. Keep the discipline it enforces — one place a request turns into a
profile id, so no query can quietly forget to filter.

### 2.3 Sync — phase 2, not v1

Do not build sync in v1. When it is built:

- `reviews` is append only and already has everything needed to be a CRDT-ish
  log. Ship the log up, never the derived `card_states`.
- `card_states` is a pure fold of `reviews` through `lib/srs.ts`. If both
  devices replay the same log with the same scheduler they land in the same
  place. This is the reason `schedule()` takes `now` and `random` as arguments
  instead of reading the clock — keep that property, it is what makes replay
  possible.
- `settings` is last write wins on `updatedAt`. Add that column now (Cobalt's
  stores all carry one) even though nothing reads it in v1.

---

## 3. Toolchain

Match Cobalt exactly unless there is a reason not to:

```
expo            ~55.x
react-native    0.83.x
react           19.2.x
expo-router     typedRoutes: true, reactCompiler: true
typescript      ~5.9, strict
jest + jest-expo + @testing-library/react-native
eslint-config-expo
```

Dependencies, and why each one is there:

| Package | For |
|---|---|
| `expo-router` | file routing |
| `expo-sqlite` + `drizzle-orm` + `drizzle-kit` | §2.1 |
| `zustand` + `@react-native-async-storage/async-storage` | settings and session, not card data |
| `expo-font` | Amiri, Satoshi, IBM Plex Mono |
| `expo-haptics` | §7.5 |
| `expo-notifications` | local reminders only, §8 |
| `expo-splash-screen`, `expo-status-bar`, `expo-system-ui` | boot and chrome |
| `expo-updates` | OTA for JS only fixes |
| `react-native-reanimated` + `react-native-worklets` | the flip, the ring, the advance |
| `react-native-svg` | the speed ring, the lesson ticks |
| `react-native-safe-area-context`, `react-native-screens`, `react-native-gesture-handler` | standard |
| `expo-local-authentication`, `expo-secure-store` | only if the PIN option in §2.2 ships |

Not wanted: any UI kit, any icon pack, MMKV (Cobalt's note applies — it forces
a dev build on every contributor), `expo-blur` / `expo-glass-effect` (Durus has
no glass anywhere).

`package.json` gets Cobalt's `preflight` script:
`npm run lockcheck && npm run typecheck && npm run lint && npm test`. The
`lockcheck` (`npm ci --dry-run --os=darwin --cpu=arm64`) catches the class of
failure where the lockfile is fine on Windows and fails on an EAS mac builder.
That matters here — the author develops on Windows and builds on EAS.

---

## 4. Domain logic to port

These are pure, already unit tested, and should move across with their tests
and their comments effectively unchanged. This is the highest value part of the
port and it should be done first, before a single screen exists.

| From | To | Notes |
|---|---|---|
| `lib/srs.ts` + `srs.test.ts` | `src/engine/srs.ts` | verbatim. No clock, no db, no imports. |
| `lib/modes.ts` + `modes.test.ts` | `src/engine/modes.ts` | verbatim. |
| `lib/answer.ts` + `answer.test.ts` | `src/engine/answer.ts` | verbatim. Damerau-Levenshtein and the article rules included. |
| `lib/letters.ts` + `letters.test.ts` | `src/engine/letters.ts` | verbatim. Grapheme splitting via `\P{M}\p{M}*`; Hermes supports Unicode property escapes — add a test that asserts it, because a silent regex failure here turns every assemble card into one tile. |
| `lib/case-drill.ts` + `case-drill.test.ts` | `src/engine/caseDrill.ts` | verbatim. |
| `lib/harakat.ts` | `src/engine/harakat.ts` | verbatim. |
| `lib/reminders.ts` + `reminders.test.ts` | `src/engine/reminders.ts` | Keep `decideReminder` pure. It now decides *what to schedule*, not what to send — see §8. |
| `lib/constants.ts`, `lib/speed.ts` | `src/engine/constants.ts` | The reason `constants.ts` exists (keeping the db client out of the client bundle) is gone; the file is still worth having as one place for `TOTAL_LESSONS`, `MATURE_DAYS`, `SPEED_*`, `CASE_RUN_LENGTH`. |
| `lib/parse-cards.ts` + test | `src/engine/parseCards.ts` | See §9. |
| `lib/queue.ts` | `src/data/queue.ts` | Structure ports, `requireProfileId()` becomes a parameter. Keep the bucket order comment and the distractor-matches-card-type rule. |
| `lib/stats.ts` | `src/data/stats.ts` | See the `percentile_cont` note in §2.1. |
| `lib/lessons.ts`, `app/unlock-lesson.ts` | `src/data/lessons.ts` | |
| `lib/keys.ts` | delete | Keyboard shortcut plumbing for desktop. |
| `lib/theme.ts`, `lib/splash.ts` | delete | Replaced by §7 and §11. |

**Rule for the port:** anything in `src/engine/` imports nothing but other
engine modules. No `react-native`, no database, no `Date.now()`. That is what
makes the test suite fast and the scheduler replayable.

---

## 5. Data model

Straight port of `db/schema.ts` with the type mapping in §2.1. Tables:

`lessons`, `cards`, `card_states`, `reviews`, `settings`, `profiles`,
`card_hearts`. Drop `push_subscriptions` — there is no push.

Keep every index and constraint, including:

- `uniqueIndex(cards.lessonId, cards.arabic)` — pasting the same block twice
  must not double the deck.
- `primaryKey(card_states: profileId, cardId, direction)` and
  `index(profileId, dueAt)` — the due query is the hot path.
- `uniqueIndex(lower(profiles.name))` — SQLite writes this as
  `create unique index ... on profile (lower(name))`, which it supports.
- `card_hearts` as its own table rather than a column on `card_states`, for the
  reason its comment gives: a hand made mark should not live in a table an
  algorithm rewrites on every answer.

Add to `settings`: `updatedAt integer` (§2.3), and consider dropping
`lastNotifiedOn` / `lastNotifiedHour` — with local scheduled notifications
there is no server deciding whether a slot was served, so the dedupe those
columns exist for is handled by the notification identifiers instead. Read §8
before deciding.

---

## 6. Screens

Phone only, portrait only. `supportsTablet: false`, `requireFullScreen: true`.
Every screen is a phone screen; there is no desktop layout to carry over.

Routes, as `expo-router` files under `src/app/`:

```
_layout.tsx              boot gate: fonts, migrations, store hydration, splash
index.tsx                redirect to /today (or /onboarding on first launch)
(onboarding)/
  welcome.tsx            name
  lesson.tsx             which lesson the class is on
  reminder.tsx           opt in, two slots
today.tsx                home
review.tsx               the session
speed.tsx
cases.tsx
cards.tsx                flashcards
lessons/index.tsx
lessons/[number].tsx
stats.tsx
settings.tsx
```

### 6.1 Today

Port the layout intent from `app/today/page.tsx`. It answers one question:
what do I do right now.

Three rows, `1fr auto 1fr`, so **Start review** sits on the exact centre line
of the screen regardless of how much sits above or below it. This is deliberate
and the comment in the source explains why — centring the whole stack drifts
the button every time a line appears or disappears. In RN this is
`flex: 1` / `flexShrink: 0` / `flex: 1` on three views inside a safe area.

Contents, top to bottom: the date line (Hijri and Gregorian on one line, via
`Intl.DateTimeFormat` with `en-GB-u-ca-islamic-umalqura` — Hermes ships full
ICU on iOS, but verify this early with a test, it is the one Intl call that is
not guaranteed), the current lesson's Arabic title with `Lesson N` beneath it,
the due count as a large tabular numeral with `due` on the same baseline, then
the button, then the secondary links in a fixed two column grid, then the 23
lesson ticks, then Stats and Settings.

When nothing is due: the same count, the same button, the same links, plus one
faint line — "Nothing scheduled. Review goes over Lessons 1 to N." The screen
does not change shape.

### 6.2 Review — the session

`app/review/session.tsx` is 675 lines and is the heart of the app. Read it
fully before writing the RN version. Do not port it line by line; port its
state machine.

State: `queue`, `index`, `typed`, `result`, `answered[]`, `shownAt` ref.

Flow per card:

1. Card appears. `shownAt = Date.now()`. Time to answer runs from the card
   appearing, not from the first keystroke.
2. User answers according to `mode` (§6.2.1).
3. `gradeFor({correct, close, msToAnswer, mode})` produces the grade.
4. Result band appears with `feedbackFor(...)`. **It stays up until dismissed.**
   No timer. The comment in the source is the rationale: the moment right after
   getting a word wrong is the moment you are actually reading it, and how long
   that takes is not something the app can know.
5. Dismissing clears the result and advances in the same commit, so the answer
   never flashes on the next card.
6. `grade === "again"` pushes the question back onto the end of the queue.
7. The write goes to SQLite immediately. No outbox, no catch, no retry.

The bottom result band has a reserved height (`BAND` in the source) so an
answer can never end up underneath it. Keep that. In RN, reserve it with a
fixed height spacer rather than absolutely positioning it over content.

`undoGrade` exists and is the one documented exception to `reviews` being
append only. Keep it.

#### 6.2.1 The three modes

| Mode | Prompt | Input | Correct when |
|---|---|---|---|
| `choice` | Arabic (recognition) or English (production) | four options, tap | tapped option matches |
| `written` | Arabic | TextInput, English typed | `checkAnswer()` returns exact or close |
| `assemble` | English | shuffled Arabic letter tiles, tap in order | `assembledCorrectly()` |

`written` mode TextInput: `autoCorrect={false}`, `autoCapitalize="none"`,
`spellCheck={false}`, `autoComplete="off"`, `returnKeyType="done"`. Autocorrect
turning "masjid" into "mastic" and marking it wrong is the single most annoying
possible bug in this app.

Keyboard handling is a real problem on this screen and it is where most of the
RN-specific work will go. The card, the input, and the result band all have to
stay visible with the keyboard up on the smallest supported device. Use
`KeyboardAvoidingView` with `behavior="padding"`, plus `useAnimatedKeyboard`
from Reanimated if that is not enough. Test on an SE.

`assemble` mode: tiles carry `{id, letter}` and are compared by text, not by
tile order, because a word with a repeated letter has more than one correct
arrangement. Tapping a placed tile returns it. Isolated Arabic letters on tiles
render in isolated form and re-shape when joined — that is correct and matches
the web, do not fight it.

### 6.3 Speed drill

20 words, recognition only, against a draining ring. Window starts at
`settings.speedWindowMs` (default 2000), floor 700ms, step 100ms, ramps down
when accuracy is above 85%. Logged to `reviews` with `direction: "speed"` and
never scheduled.

The ring: the web version learned the hard way that a CSS transition on a React
state value does not work here — the first card drained instantly and every
card after it barely moved. In RN, drive it with a Reanimated `withTiming` on a
shared value, reset with `cancelAnimation` and set-to-zero before each card,
and key the ring component to the card id.

### 6.4 Case drill

15 questions. `buildCaseQuestion` blanks the final harakah of one declinable
noun in a phrase card and offers four endings. The four marks render on a
dotted circle (U+25CC) so they share a baseline — without a base, a lone
harakah sits at whatever height the font gives it and the row looks scattered.
Keep `BLANK = "ـٜ"` and the `INDECLINABLE` set.

### 6.5 Flashcards

Manual flip, no grading, no scheduling. The flip is 520ms,
`cubic-bezier(0.2, 0.7, 0.2, 1)`, perspective 1200px on the scene not the card.
In RN: `perspective` in the parent's transform, `rotateY` on the inner,
`backfaceVisibility: 'hidden'` on both faces, back face pre-rotated 180°.
Reanimated `withTiming` with a matching `Easing.bezier(0.2, 0.7, 0.2, 1)`.

520ms is slower than a UI transition on purpose. The turn is what tells you the
two faces are the same object; at 280ms it reads as a swap.

Under reduced motion (`AccessibilityInfo.isReduceMotionEnabled` combined with
the in-app `reduceMotion` setting, never replacing it) the flip becomes an
opacity crossfade.

### 6.6 Lessons, Stats, Settings

Straight ports. Stats shows: 7 day median recognition time, 30 day best day
median, reviews per day for 30 days, maturity split (unseen / learning /
mature at >21 days interval), and leeches with a suspend toggle.

Settings, from `db/schema.ts` `settings`: current lesson, new per day, max
reviews, show harakat, speed window, reminders on, two reminder hours with the
second independently switchable, class day reminder, timezone, theme. Plus, iOS
only: haptics, reduce motion, and the optional PIN from §2.2.

Drop the "Test push" button; replace it with "Send a test reminder" firing a
local notification five seconds out, which is more useful anyway.

### 6.7 Help

`components/help.tsx` is a slideshow explaining each drill, held at one size
across slides. Port it. It is how the ladder gets explained, and point 1 of
§1.1 depends on the user understanding that the app grades them.

---

## 7. Design system

### 7.1 Colours

Port `app/globals.css` `:root` and `.dark` verbatim into
`src/theme/tokens.ts`, in Cobalt's shape:

```ts
export type ColorToken =
  | 'paper' | 'surface' | 'surfaceSunk'
  | 'ink' | 'inkSoft' | 'inkFaint'
  | 'rule' | 'lapis' | 'lapisWash'
  | 'verdigris' | 'clay' | 'saffron';
```

Light — lapis on paper, the icon's own colours. Text is a deep blue rather than
near black so the whole screen reads as the ink the mark is drawn in.

```
paper #f6f4ef   surface #fcfbf8   surfaceSunk #eae7df
ink   #1e356f   inkSoft #56679a   inkFaint    #98a3c0
rule  #d7d9e2   lapis   #2a4a8b   lapisWash   #e3e9f5
verdigris #34705f   clay #9c454d   saffron #9c6f1e
```

Dark:

```
paper #131722   surface #1b2130   surfaceSunk #232a3b
ink   #e9e7e1   inkSoft #a2a9b8   inkFaint    #6b7385
rule  #2e3648   lapis   #7fa0dc   lapisWash   #1f2a42
verdigris #6fb6a4   clay #d4868c   saffron #d6ac5e
```

Copy Cobalt's `makeStyles` bounded-cache pattern from `src/theme/useTheme.ts` —
`StyleSheet.create` cannot take dynamic values, so styles are built once per
palette and cached, two entries here instead of three.

Copy Cobalt's `src/theme/__tests__/harshness.test.ts` idea and point it at this
palette's actual rules: no pure white, no pure black, and a contrast floor
between each `ink*` and its ground. A numeric test is the only thing that makes
"the only hex values live in one file" survive contact with future work. Add a
lint rule or a test that greps `src/` for `#[0-9a-fA-F]{6}` outside
`tokens.ts`.

### 7.2 Type

Three families. Register **each weight as its own family name and never set
`fontWeight`** — Cobalt's `typography.ts` comment is the reason: on iOS,
combining a custom `fontFamily` with `fontWeight` produces synthesised bolding
or silently picks the wrong face.

| Role | Family | Notes |
|---|---|---|
| UI | Satoshi | variable on web; ship static cuts per weight instead. `app/fonts/Satoshi-Variable.woff2` is in the web repo — source the statics from the original licence. |
| Numerals | IBM Plex Mono | tabular. Used for every count and timer so nothing jitters as it ticks. |
| Arabic | Amiri 400 and 700 | `scripts/assets/Amiri-Regular.ttf` is already in the web repo. |

Roles ported from `globals.css` and `components/ui.tsx`: `eyebrow` (12px, 500,
0.08em tracking, uppercase, `inkSoft`), `numeral` (40px, tabular, leading 1),
`pageTitle` (24px, 500, tight), body 16px, Arabic card face large with
`lineHeight` around 1.9.

Note Cobalt's conversion detail: RN `letterSpacing` is in points, not em.
Multiply by the font size.

### 7.3 Arabic rendering — read this before writing any Arabic text

Four rules, and getting any of them wrong is visible immediately:

1. **Never set `letterSpacing` on an Arabic `Text`.** RN applies tracking
   between glyphs and it breaks the joins. Arabic gets its own text style with
   no tracking, ever.
2. **Do not call `I18nManager.forceRTL`.** The document stays LTR; Arabic gets
   `writingDirection: 'rtl'` on its own `Text`, through one `<Arabic>`
   component and nowhere else. This mirrors the web layout's rule exactly.
3. **Never put Arabic and English in the same text node.** Bidi reorders them
   around each other. The lessons list and Today both stack them as separate
   elements for this reason.
4. **Arabic is not selectable.** `selectable={false}` on every Arabic `Text`,
   and no `onLongPress`.

`showHarakat` off runs the string through `stripHarakat` at render. Do not
strip at the data layer — the harakat are the content and the setting is a
view preference.

`lineHeight` for Amiri needs to be generous (~1.9) or the harakat clip against
the line above. Verify with a fully vowelled phrase card, not a single word.

### 7.4 Motion

The complete allowed list, ported from `globals.css`:

| Name | Duration | Easing |
|---|---|---|
| card flip | 520ms | `bezier(0.2, 0.7, 0.2, 1)` |
| deck advance | 180ms | `bezier(0.2, 0, 0.1, 1)`, translateX 12 → 0 with fade |
| speed ring drain | the window | linear |
| PIN shake | 300ms | `bezier(0.2, 0, 0.1, 1)` |
| app enter fade | 420ms | `bezier(0.2, 0, 0.1, 1)`, once per cold launch |

Nothing else animates. No screen transition animations beyond the router
default; consider `animation: 'none'` on the drill routes so entering a drill
does not slide.

### 7.5 Haptics

Durus has none today. Add them, but copy Cobalt's discipline: one module is the
only importer of `expo-haptics`, every call swallows rejection (haptics reject
on simulator), and the whole list is enumerated here:

- `Light` impact — tapping an answer option or a letter tile.
- `Success` notification — end of a session, once. Never per card.
- `Warning` / `Error` — **no.** A wrong answer must not buzz. Point 6 of §1.1
  applies to touch as much as to text.

Gated on a `hapticsEnabled` setting, default on.

---

## 8. Notifications

**Local only. No push, no VAPID, no server, no cron.** Ship Cobalt's
`plugins/withoutPushEntitlement.js` verbatim, listed last in `plugins` so it
runs after the auto applied `expo-notifications` plugin and wins. Without it
the build fails on a provisioning profile that lacks the Push capability, for a
capability this app has committed not to use.

Also copy Cobalt's lazy `require('expo-notifications')` guard, so a JS-only OTA
update reaching a binary that predates the dependency degrades to "not
scheduled" instead of crashing Settings.

The behaviour to preserve from `lib/reminders.ts`:

- Two slots a day, a morning one and an evening one, the second independently
  switchable. Slots are deduplicated and sorted, so setting both to the same
  hour gives one reminder rather than two identical ones.
- The Wednesday class nudge replaces the **first** slot of the day only, and it
  fires regardless of due count. Body: `Add today's words from Lesson N`.
- The ordinary reminder does not fire when nothing is due, or when a session
  was completed in the last four hours. **That silence is the reward.**

The platform problem: `SchedulableTriggerInputTypes.DAILY` fires
unconditionally. It cannot consult the due count. Two options —

**Recommended:** schedule a rolling window. On every app foreground and after
every session, cancel all and re-schedule the next 7 days of slots, skipping
any slot whose predicted state says stay quiet. `decideReminder` stays pure in
exactly the way it is now, but it is asked about a *future* slot rather than
the present hour, and `facts.dueCount` becomes "cards whose `dueAt` falls
before that slot". `reviewsInLastFourHours` cannot be predicted, so drop that
condition from scheduling and instead re-run the whole reschedule at the end of
every session — which naturally removes the next slot if one was just
finished. Keep `decideReminder`'s test suite; extend it with "predicted at time
T" cases.

Alternative: `expo-background-task` deciding each morning. Rejected — iOS gives
no guarantee it runs, and a reminder that silently stops for a week is exactly
the failure mode `lib/reminders.ts`'s own comment warns about.

With rolling scheduling, `lastNotifiedOn` / `lastNotifiedHour` are no longer
needed; the notification identifiers are the dedupe. Drop them (§5).

Permission is requested **only** from the explicit toggle in onboarding or
Settings, never on screen entry. iOS gives exactly one chance.

Notification content follows the copy rules: no exclamation marks, no
superlatives, second person, no praise. `sound: false`.

---

## 9. Content

23 lessons of vocabulary and phrases. Today they live in `db/seed-data/` (only
lessons 1–4 are written) and `db/seed.ts` inserts them, with
`lib/parse-cards.ts` handling pasted blocks.

For iOS: ship the content as a JSON asset bundled with the app and seed SQLite
on first launch inside the same transaction as the initial migration. Keep the
`uniqueIndex(lessonId, arabic)` so a re-seed is idempotent.

Content updates ride app updates. The `lessons.unlockedAt` column stays — null
means the lesson has not been covered in class yet, and the user advances
`settings.currentLesson` themselves from Today's "unlock next lesson" control.
The app never unlocks a lesson on its own.

Port `lib/parse-cards.ts` and its tests, and keep a Settings-buried paste
screen for adding cards — that is how lessons 5–23 will actually get entered.

---

## 10. Bringing existing progress across

There is real review history in the Neon database. It should not be thrown
away.

Simplest path that does not require building sync: a one-off export from the
web app — a route or a script that dumps one profile's `profiles`, `settings`,
`cards`, `card_states`, `reviews`, and `card_hearts` as JSON — and an
"Import progress" control in the iOS app's Settings that reads that file via
`expo-document-picker` and replays it into SQLite in one transaction.

Do it once, at cutover, then delete the control. Do not let a half-built import
path become the sync design by accident.

---

## 11. Native configuration

`app.json`, following Cobalt's and Drift's shape:

```jsonc
{
  "expo": {
    "name": "Durus",
    "slug": "durus",
    "owner": "aatirs7",
    "scheme": "durus",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": false,
      "requireFullScreen": true,
      "bundleIdentifier": "com.elysiumventures.durus",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false,
        "UIViewControllerBasedStatusBarAppearance": true
      }
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-sqlite",
      ["expo-splash-screen", {
        "image": "./assets/brand/splash.png",
        "imageWidth": 120,
        "backgroundColor": "#f6f4ef",
        "dark": { "image": "./assets/brand/splash.png", "backgroundColor": "#131722" }
      }],
      "./plugins/withoutPushEntitlement"
    ],
    "experiments": { "typedRoutes": true, "reactCompiler": true }
  }
}
```

`userInterfaceStyle: "automatic"` because Durus has a real light mode that is
the icon's own colours — do not lock it dark the way Drift does.

`eas.json`: copy Cobalt's, with `appVersionSource: "remote"`,
`autoIncrement: true` on production, and channels per profile. Bundle id
`com.elysiumventures.durus`, team `YS28KD4BC4`, new `ascAppId`.

Icon: the existing mark is دُرُوس in Amiri, lapis on paper, with a paper-on-lapis
inversion for dark. iOS 18+ supports light / dark / tinted icon variants —
provide all three. `public/icon-512.png` and `public/icon-512-maskable.png` in
the web repo are the source.

Splash: one image, two background colours, per the config above. The web repo's
22 generated splash PNGs and `scripts/make-pwa-assets.ts` are not needed; the
whole `lib/splash.ts` device-matching apparatus exists only because iOS Safari
uses a startup image only when its pixel dimensions match the device exactly,
which a native app does not care about.

Keep the fade-in from `globals.css` (`durus-enter`, 420ms) as the handoff off
the launch image — it is what covers the seam between the static splash and
first paint, and it reads well.

---

## 12. Repo layout

```
app.json  eas.json  metro.config.js  tsconfig.json  eslint.config.js
plugins/withoutPushEntitlement.js
assets/brand/          icon, splash, adaptive
assets/fonts/          Amiri, Satoshi cuts, IBM Plex Mono
assets/content/        lessons.json
drizzle/               generated migrations
src/
  app/                 expo-router routes (§6)
  components/          Arabic, Button, Screen, Eyebrow, Numeral, Pill, Help, ...
  drills/              ReviewSession, SpeedRun, CaseRun, Deck
  engine/              pure logic + tests (§4)
  data/                schema.ts, client.ts, queue.ts, stats.ts, lessons.ts, seed.ts
  state/               zustand stores, Cobalt's hydration pattern
  theme/               tokens.ts, typography.ts, useTheme.ts, layout.ts
  lib/                 haptics.ts, notifications.ts, time.ts
```

Copy Cobalt's `src/state/storage.ts` wholesale: the `Hydratable` marker, the
`markHydrated` action (assigning to the rehydrated object mutates it but never
notifies, so every component reading `_hydrated` stays false and the app hangs
on the splash), and `onRehydrate` continuing with defaults on a corrupt value
rather than stranding the user.

The boot gate in `src/app/_layout.tsx` holds the splash until: fonts loaded,
migrations applied, seed complete, stores hydrated. Then, and only then,
`SplashScreen.hideAsync()`.

### 12.1 Conventions

The web repo's comment style is the house style and it is worth keeping — the
comments explain *why*, name the failure mode that motivated the code, and are
written in prose. `lib/reminders.ts`, `public/sw.js`, and `next.config.ts` are
good examples. Cobalt does the same, additionally citing numbered sections of
its spec. Do that here: cite sections of this document.

Tests: Jest with `jest-expo`. `src/engine/` is where coverage actually matters
and it should be near total; component tests are for the drills' state
machines, not their pixels.

---

## 13. Milestones

1. **Engine.** §4 ported with tests green. No UI, no database. One afternoon,
   and everything after it is easier.
2. **Data.** Drizzle schema, migrations, seed from bundled JSON, `queue.ts`
   and `stats.ts` ported. Verified against a scripted replay whose results
   match the web app's for the same input.
3. **Shell.** Theme, typography, fonts, `<Arabic>`, Screen / Button / Eyebrow /
   Numeral, boot gate, splash handoff. Today renders real counts.
4. **Review.** The session, all three modes, the result band, undo, keyboard
   handling on an SE. This is the largest single piece of work.
5. **The other three drills.** Speed, cases, flashcards.
6. **Lessons, Stats, Settings, Help, onboarding.**
7. **Notifications** (§8) and **haptics** (§7.5).
8. **Import** (§10), then cutover.
9. TestFlight, then submit.

---

## 14. Decisions still open

Flagged rather than assumed. Each has a recommendation attached; none blocks
starting on milestone 1.

1. **Profiles on a phone.** §2.2 recommends keeping the data model and hiding
   the PIN behind an opt-in setting. Confirm whether anyone other than the
   author actually uses a second profile — if not, the whole unlock screen and
   PIN pad can be dropped from v1 and the `profileId` columns kept as plumbing.
2. **Android.** The web app already works everywhere. Cobalt and Drift both
   configure Android. Cheap to keep the config honest now, expensive to
   retrofit. Recommendation: keep Android buildable, do not ship it in v1.
3. **Sync.** §2.3 says defer. If the answer is "I want my iPad too", say so
   before milestone 2, because it changes whether `reviews` needs a device id
   and a stable uuid rather than a local autoincrement key.
4. **Does the web app stay up?** If it does, it becomes a second client against
   a database the phone no longer writes to, and the two will diverge within a
   week. Recommendation: after cutover, the web app goes read-only or comes
   down.
5. **Content entry for lessons 5–23.** §9 assumes bundled JSON plus a paste
   screen. If the intent is to add lessons without shipping a build, that is a
   content endpoint, and it is the one piece of server this design would need.

---

## 15. Traps

Collected from what the web app already got wrong once, and from Cobalt's and
Drift's comments. Every one of these is a bug someone has already paid for.

- A ring or timer animation driven from React state resets wrong. Key it to the
  card and drive it from a shared value. (`globals.css`, `durus-ring-drain`)
- Rating yourself is the thing this app removed. Do not let a "how well did you
  know it" row back in for any drill.
- Custom `fontFamily` plus `fontWeight` on iOS synthesises or misses. One
  family per weight. (Cobalt `typography.ts`)
- Zustand persist without an explicit `markHydrated` action hangs the app on
  the splash forever. (Cobalt `storage.ts`)
- `expo-notifications` being installed silently adds `aps-environment` and
  fails the build. Strip it. (Cobalt `withoutPushEntitlement.js`)
- Requesting notification permission on screen entry burns the one chance iOS
  gives. Only from an explicit toggle.
- SQLite foreign keys default to **off**. The schema depends on cascade.
- `percentile_cont` does not exist in SQLite. (§2.1)
- Autocorrect on the `written` mode input will mark correct answers wrong.
- `letterSpacing` on Arabic breaks the joins. Arabic and English never share a
  text node.
- A reminder gate that is slightly wrong does not throw, it just goes quiet for
  a week. That is why `decideReminder` is pure and tested, and it must stay
  that way. (`lib/reminders.ts`)
- The lockfile can be valid on Windows and fail on an EAS mac builder. Run
  `lockcheck` in preflight. (Cobalt `package.json`)
