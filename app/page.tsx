import Link from "next/link";
import { Arabic } from "@/components/arabic";
import { StandaloneRedirect } from "@/components/standalone-redirect";
import { ButtonLink, Eyebrow } from "@/components/ui";
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
  { value: 4, label: "grades, no more" },
];

const GRADES = [
  { label: "Again", interval: "10m", color: "var(--clay)" },
  { label: "Hard", interval: "1d", color: "var(--saffron)" },
  { label: "Good", interval: "3d", color: "var(--verdigris)" },
  { label: "Easy", interval: "6d", color: "var(--lapis)" },
];

export default function LandingPage() {
  return (
    <main className="flex w-full flex-1 flex-col">
      <StandaloneRedirect />

      <header className="mx-auto flex w-full max-w-[1040px] items-center justify-between px-6 py-5">
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
        <Link
          href="/unlock"
          className="text-ink-soft hover:text-ink text-[15px] transition-colors"
        >
          Sign in
        </Link>
      </header>

      {/* The hero, over the ring and the word field. */}
      <section className="relative w-full overflow-hidden">
        <Ring />
        <WordField />

        <div className="relative mx-auto flex w-full max-w-[680px] flex-col items-center gap-8 px-6 py-24 lg:py-32">
          <Arabic
            as="p"
            showHarakat={false}
            className="text-lapis text-[72px] leading-[1.6] lg:text-[112px]"
          >
            دُرُوس
          </Arabic>

          <div className="flex flex-col items-center gap-4">
            <h1 className="text-ink text-[32px] leading-tight font-medium tracking-tight lg:text-[40px]">
              Arabic revision for Madinah Book 1
            </h1>
            <p className="text-ink-soft max-w-[520px] text-[18px] leading-relaxed">
              {TOTAL_LESSONS} lessons of vocabulary, drilled in the order the
              book teaches them. Nothing appears before you have been taught it.
            </p>
          </div>

          <ButtonLink href="/unlock" className="min-w-[220px]">
            Sign in to your review
          </ButtonLink>

          <Ticks />
        </div>
      </section>

      {/*
        A card, as the review screen actually draws one. Showing the
        thing beats describing it, and this is the whole product in a
        single tile.
      */}
      <section className="mx-auto flex w-full max-w-[1040px] flex-col items-center gap-12 px-6 pb-24 lg:flex-row lg:justify-center lg:gap-16">
        <Specimen />

        <div className="flex max-w-[380px] flex-col gap-4 lg:text-left">
          <Eyebrow>One card at a time</Eyebrow>
          <p className="text-ink text-[20px] leading-relaxed">
            The word, then the meaning, then how long until you see it again. No
            decks to build and nothing to configure before you start.
          </p>
          <p className="text-ink-soft text-[16px] leading-relaxed">
            Grade it and the next one is already there. At a keyboard the whole
            session runs on the space bar and the number row.
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
      <section className="mx-auto flex w-full max-w-[880px] justify-center gap-12 px-6 py-16 lg:gap-24">
        {FIGURES.map((figure) => (
          <div key={figure.label} className="flex flex-col items-center gap-2">
            <span className="tabular text-ink text-[40px] leading-none">
              {figure.value}
            </span>
            <span className="text-ink-soft text-[13px]">{figure.label}</span>
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
            Install it to the home screen. Grades made without a signal go to an
            outbox and settle the next time you have one.
          </Point>
          <Point title="A keyboard, if you have one">
            Space reveals, one to four grade, u undoes. A session at a desk is a
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
        <Link
          href="/unlock"
          className="text-lapis text-[16px] underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
        <p className="text-ink-faint text-[13px]">
          A private app for one reader. There is no sign up.
        </p>
      </footer>
    </main>
  );
}

/*
  The vocabulary field. Desktop only, because on a phone the hero is
  already the width of the screen and the words would sit under the
  text rather than around it.
*/
function WordField() {
  return (
    <div
      className="pointer-events-none absolute inset-0 hidden lg:block"
      aria-hidden
    >
      {FIELD.map((entry) => (
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
*/
function Ring() {
  const r = 256;
  const circumference = 2 * Math.PI * r;

  return (
    <div
      className="pointer-events-none absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block"
      aria-hidden
    >
      <svg width="520" height="520" viewBox="0 0 520 520">
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
        {GRADES.map((grade) => (
          <div
            key={grade.label}
            className="border-rule flex flex-col items-center gap-1 rounded-[12px] border py-2"
          >
            <span className="tabular text-ink-soft text-[11px]">
              {grade.interval}
            </span>
            <span
              className="text-[13px] font-medium"
              style={{ color: grade.color }}
            >
              {grade.label}
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
