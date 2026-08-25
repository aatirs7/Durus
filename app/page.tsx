import Link from "next/link";
import { Arabic } from "@/components/arabic";
import { StandaloneRedirect } from "@/components/standalone-redirect";
import { ButtonLink, Eyebrow } from "@/components/ui";
import { AppPhones } from "@/components/app-preview";
import { AppStoreBadge } from "@/components/app-store-badge";
import { TOTAL_LESSONS } from "@/lib/constants";

/*
  The front door, and the only public page in the app. Everything else
  sits behind the PIN gate, and anyone who already has a session is sent
  to Today by the proxy, so this is only ever seen by a stranger.

  It is written for a desktop browser, since that is where a link gets
  opened. The palette is the icon: lapis on paper, and paper on lapis
  for the one band in the middle. Same two colours, turned over.

  Nothing on it moves. The rest of the app is a timed recognition task,
  and a landing page that animates is promising a different product.
*/

export const metadata = {
  title: "Durus, Arabic revision for Madinah Book 1",
  description:
    "Spaced repetition, recognition speed, and case endings for the vocabulary of Madinah Book 1.",
};

/*
  Book 1 vocabulary, scattered behind the hero at low opacity. Real
  words rather than filler, because the one thing this page has to say
  is what is inside it. The positions are written down rather than
  generated, so the page looks the same every time it is served.

  Two sets, because a phone is not a small desktop. The same eight
  words at the same eight percentages would land on top of the heading
  in a 390px column, so the narrow layout gets fewer of them, smaller,
  and pushed into the top and bottom margins where there is nothing to
  collide with.
*/
const FIELD = [
  { word: "بَيْتٌ", top: "14%", left: "9%", size: 52, fade: 0.1 },
  { word: "مَسْجِدٌ", top: "27%", left: "84%", size: 62, fade: 0.11 },
  { word: "كِتَابٌ", top: "62%", left: "6%", size: 44, fade: 0.09 },
  { word: "مِفْتَاحٌ", top: "74%", left: "80%", size: 54, fade: 0.1 },
  { word: "قَلَمٌ", top: "86%", left: "18%", size: 40, fade: 0.08 },
  { word: "نَجْمٌ", top: "9%", left: "64%", size: 38, fade: 0.08 },
  { word: "طَالِبٌ", top: "47%", left: "92%", size: 42, fade: 0.08 },
  { word: "سَرِيرٌ", top: "44%", left: "3%", size: 38, fade: 0.07 },
];

const FIELD_NARROW = [
  { word: "بَيْتٌ", top: "6%", left: "16%", size: 34, fade: 0.09 },
  { word: "مَسْجِدٌ", top: "10%", left: "78%", size: 38, fade: 0.09 },
  { word: "مِفْتَاحٌ", top: "90%", left: "74%", size: 34, fade: 0.08 },
  { word: "قَلَمٌ", top: "94%", left: "22%", size: 30, fade: 0.07 },
];

const DRILLS = [
  {
    title: "Review",
    body: "Every word you have been taught, scheduled so it comes back the day before you would have forgotten it. One keystroke a card.",
  },
  {
    title: "Speed",
    body: "A word for a second and a half, then it blurs. Recognition is not the same skill as reading, and this is the one that measures it.",
  },
  {
    title: "Cases",
    body: "Raf', nasb, jarr, marked on the letter rather than after the punctuation. The endings are the grammar, so they get a drill of their own.",
  },
];

const FIGURES = [
  { value: TOTAL_LESSONS, label: "lessons in the book" },
  { value: 2, label: "directions per card" },
  { value: 4, label: "steps per word" },
];

/*
  The ladder, which is what the card actually sits on.

  This row used to show four grade buttons with the interval each would
  produce. Nothing in the app has asked anyone to rate themselves for a
  long time - the answer decides whether it was right and the time taken
  decides how well it was known - so a row of grades on the landing page
  was advertising a screen that does not exist.

  Four rungs, the first two done, which is the shape a word is usually
  caught in.
*/
const STEPS = [
  { label: "pick", done: true },
  { label: "type", done: true },
  { label: "choose", done: false },
  { label: "build", done: false },
];

export default function LandingPage() {
  return (
    <main className="flex w-full flex-1 flex-col">
      <StandaloneRedirect />

      {/*
        The extra right padding keeps the actions clear of the theme
        switch, which is fixed to the viewport corner rather than to
        this row, and would otherwise sit on top of them at exactly
        1024px.
      */}
      <header className="mx-auto flex w-full max-w-[1040px] items-center justify-between px-6 py-5 lg:pr-20">
        {/*
          The wordmark is unvowelled here and in the rail. At display
          size the harakat sit high enough above the letters to read as
          floating, and a mark is not something you stop to parse.
        */}
        <Arabic
          showHarakat={false}
          className="text-lapis text-[24px] leading-none"
        >
          دُرُوس
        </Arabic>
        {/*
          Desktop only. On a phone these two would sit under the theme
          switch, and the hero repeats them a screen height below
          anyway.
        */}
        <div className="hidden items-center gap-5 lg:flex">
          <Link
            href="/sign-in"
            className="text-ink-soft hover:text-ink text-[15px] transition-colors"
          >
            Sign in
          </Link>
          <ButtonLink
            href="/sign-up"
            variant="quiet"
            className="px-4 py-2 text-[15px]"
          >
            Create account
          </ButtonLink>
        </div>
      </header>

      {/* The hero, over the ring and the word field. */}
      <section className="relative w-full overflow-hidden">
        <Ring />
        <WordField words={FIELD_NARROW} className="lg:hidden" />
        <WordField words={FIELD} className="hidden lg:block" />

        {/*
          Two halves, and they are two different offers.

          Left is the site as it always was: the mark, what it is, and the way
          in through the browser. Right is the iPhone app. Splitting them means
          neither has to be the subordinate paragraph of the other, and both
          land above the fold instead of the phones sitting under a column of
          centred text.

          It stacks on a narrow screen with the app SECOND, because someone
          reading this on the phone can act on the browser links immediately
          and the badge is not tappable yet.
        */}
        <div className="relative mx-auto grid w-full max-w-[1120px] items-center gap-10 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 lg:py-10">
          <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
            <Arabic
              as="p"
              showHarakat={false}
              className="text-lapis text-[48px] leading-[1.4] lg:text-[64px]"
            >
              دُرُوس
            </Arabic>

            <div className="flex flex-col items-center gap-3 lg:items-start">
              <h1 className="text-ink text-[28px] leading-tight font-medium tracking-tight lg:text-[36px]">
                Arabic revision for Madinah Book 1
              </h1>
              <p className="text-ink-soft max-w-[460px] text-[16px] leading-relaxed">
                {TOTAL_LESSONS} lessons of vocabulary, drilled in the order the
                book teaches them. Nothing appears before you have been taught
                it.
              </p>
            </div>

            <div className="flex w-full max-w-[360px] flex-col items-center gap-3 sm:max-w-none lg:items-start">
              <div className="flex w-full gap-3 sm:w-auto">
                <ButtonLink
                  href="/sign-up"
                  className="flex-1 px-4 sm:min-w-[180px] sm:flex-none"
                >
                  Create account
                </ButtonLink>
                <ButtonLink
                  href="/sign-in"
                  variant="quiet"
                  className="flex-1 px-4 sm:min-w-[140px] sm:flex-none"
                >
                  Sign in
                </ButtonLink>
              </div>
              <p className="text-ink-faint text-[13px]">
                Use it in your browser, or on your phone. Same account either
                way.
              </p>
            </div>

            <Ticks />
          </div>

          <div className="flex flex-col items-center gap-6">
            <AppPhones />
            <AppStoreBadge />
          </div>
        </div>
      </section>

      {/*
        A card, as the review screen actually draws one. Showing the
        thing beats describing it, and this is the whole product in a
        single tile.
      */}
      <section className="mx-auto flex w-full max-w-[1040px] flex-col items-center gap-10 px-6 pb-20 sm:gap-12 sm:pb-24 lg:flex-row lg:justify-center lg:gap-16">
        <Specimen />

        <div className="flex max-w-[380px] flex-col gap-4 lg:text-left">
          <Eyebrow>One card at a time</Eyebrow>
          <p className="text-ink text-[20px] leading-relaxed">
            The word, then the meaning, then how long until you see it again. No
            decks to build and nothing to configure before you start.
          </p>
          <p className="text-ink-soft text-[16px] leading-relaxed">
            Answer it and the next one is already there. Whether you were right
            comes from the answer, and how well you knew it from how long you
            took.
          </p>
        </div>
      </section>

      {/*
        The band. Paper on lapis, the icon turned over. It is the only
        inverted surface in the app, so it carries the three drills and
        nothing else.
      */}
      <section
        className="w-full py-20 lg:py-24"
        style={{ backgroundColor: "var(--lapis)" }}
      >
        <div className="mx-auto flex w-full max-w-[880px] flex-col gap-12 px-6">
          <p
            className="eyebrow"
            style={{ color: "var(--paper)", opacity: 0.7 }}
          >
            Three drills
          </p>

          <div className="grid gap-12 lg:grid-cols-3 lg:gap-10">
            {DRILLS.map((drill) => (
              <div key={drill.title} className="flex flex-col gap-3">
                <h2
                  className="text-[22px] font-medium"
                  style={{ color: "var(--paper)" }}
                >
                  {drill.title}
                </h2>
                <p
                  className="text-[16px] leading-relaxed"
                  style={{ color: "var(--paper)", opacity: 0.82 }}
                >
                  {drill.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three figures, tabular, no chart. */}
      <section className="mx-auto flex w-full max-w-[880px] justify-center gap-8 px-6 py-16 sm:gap-14 lg:gap-24">
        {FIGURES.map((figure) => (
          <div
            key={figure.label}
            className="flex max-w-[96px] flex-col items-center gap-2 sm:max-w-none"
          >
            <span className="tabular text-ink text-[40px] leading-none">
              {figure.value}
            </span>
            <span className="text-ink-soft text-[13px] leading-snug">
              {figure.label}
            </span>
          </div>
        ))}
      </section>

      {/* The quiet half of the page. */}
      <section className="mx-auto flex w-full max-w-[880px] flex-col items-center gap-10 px-6 pb-24">
        <Eyebrow>How it works</Eyebrow>

        <ul className="grid w-full gap-8 text-left lg:grid-cols-2 lg:gap-x-14">
          <Point title="Locked to your lesson">
            The book is taught in order, so the app is too. A lesson unlocks
            when you say you have sat it, and its words are capped for three
            days so a new lesson cannot bury the old ones.
          </Point>
          <Point title="Harakat, until you do not need them">
            Every word is stored fully vowelled. One key strips them mid
            session, which is the whole point of learning to read the script.
          </Point>
          <Point title="Offline, and on your phone">
            Install it to the home screen. Answers given without a signal go to
            an outbox and settle the next time you have one.
          </Point>
          <Point title="A keyboard, if you have one">
            Space reveals, u undoes, escape ends. A session at a desk is a
            session you never touch the mouse for.
          </Point>
        </ul>
      </section>

      <footer className="border-rule mx-auto flex w-full max-w-[880px] flex-col items-center gap-4 border-t px-6 py-12">
        <Arabic
          showHarakat={false}
          className="text-lapis text-[22px] leading-none"
        >
          دُرُوس
        </Arabic>
        {/*
          Desktop only. On a phone these two would sit under the theme
          switch, and the hero repeats them a screen height below
          anyway.
        */}
        <div className="hidden items-center gap-5 lg:flex">
          <Link
            href="/sign-up"
            className="text-lapis text-[16px] underline-offset-4 hover:underline"
          >
            Create account
          </Link>
          <Link
            href="/sign-in"
            className="text-ink-soft text-[16px] underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </div>
        <p className="text-ink-faint text-[13px]">
          Everyone gets their own progress through the book.
        </p>
        {/*
          Reachable from the site's front door, which is what the App Store
          requires of the policy URL it is given - and what anyone deciding
          whether to sign up is entitled to read first.
        */}
        <Link
          href="/privacy"
          className="text-ink-faint text-[13px] underline-offset-4 hover:underline"
        >
          Privacy
        </Link>
      </footer>
    </main>
  );
}

/*
  The vocabulary field. The sizes are numbers rather than classes, so
  the two layouts are two elements and only one of them is ever shown.
*/
function WordField({
  words,
  className,
}: {
  words: typeof FIELD;
  className: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden
    >
      {words.map((entry) => (
        <Arabic
          key={entry.word}
          as="span"
          className="text-lapis absolute -translate-x-1/2 -translate-y-1/2 leading-none"
          style={{
            top: entry.top,
            left: entry.left,
            fontSize: entry.size,
            opacity: entry.fade,
          }}
        >
          {entry.word}
        </Arabic>
      ))}
    </div>
  );
}

/*
  The speed ring at hero scale, drawn once and left to sit there. It is
  the app's one piece of visual expression, so the landing page borrows
  it rather than inventing a second one.

  It is a viewBox and a width class rather than a fixed size, so the
  phone gets the same ring at 300px instead of getting nothing.
*/
function Ring() {
  const r = 256;
  const circumference = 2 * Math.PI * r;

  return (
    <div
      className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      aria-hidden
    >
      <svg
        viewBox="0 0 520 520"
        className="h-auto w-[300px] sm:w-[380px] lg:w-[520px]"
      >
        <circle
          cx="260"
          cy="260"
          r={r}
          fill="none"
          stroke="var(--rule)"
          strokeWidth="1"
        />
        <circle
          cx="260"
          cy="260"
          r={r}
          fill="none"
          stroke="var(--lapis)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.72}
          opacity="0.3"
          transform="rotate(-90 260 260)"
        />
      </svg>
    </div>
  );
}

/* The same twenty three marks the app uses for the book. */
function Ticks() {
  return (
    <div className="flex justify-center gap-1.5" aria-hidden>
      {Array.from({ length: TOTAL_LESSONS }, (_, i) => (
        <span
          key={i}
          className="h-4 w-[2px] rounded-[999px]"
          style={{ backgroundColor: i < 3 ? "var(--lapis)" : "var(--rule)" }}
        />
      ))}
    </div>
  );
}

/* A review card, in the same materials the review screen uses. */
function Specimen() {
  return (
    <div className="border-rule bg-surface flex w-full max-w-[380px] shrink-0 flex-col items-center gap-5 rounded-[16px] border px-8 py-10">
      <Arabic as="p" className="text-ink text-[64px] leading-[1.7]">
        مِفْتَاحٌ
      </Arabic>
      <p className="text-ink-faint text-[16px] italic">miftahun</p>
      <hr className="border-rule w-20 border-t" />
      <p className="text-ink text-[24px] leading-snug">key</p>

      <div className="grid w-full grid-cols-4 gap-2 pt-2">
        {STEPS.map((step) => (
          <div
            key={step.label}
            className="flex flex-col items-center gap-1 rounded-[12px] border py-2"
            style={{
              borderColor: step.done ? "var(--lapis)" : "var(--rule)",
              backgroundColor: step.done ? "var(--lapis-wash)" : "transparent",
            }}
          >
            <span
              className="text-[13px] font-medium"
              style={{ color: step.done ? "var(--lapis)" : "var(--ink-faint)" }}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Point({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex flex-col gap-2">
      <h3 className="text-ink text-[18px] font-medium">{title}</h3>
      <p className="text-ink-soft text-[16px] leading-relaxed">{children}</p>
    </li>
  );
}
