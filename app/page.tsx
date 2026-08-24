import Link from "next/link";
import { Arabic } from "@/components/arabic";
import { StandaloneRedirect } from "@/components/standalone-redirect";
import { ButtonLink, Eyebrow } from "@/components/ui";
import { TOTAL_LESSONS } from "@/lib/constants";

/*
  The front door, and the only public page in the app. Everything else
  sits behind the PIN gate, so this is the one screen a stranger can
  see: what Durus is, what the three drills do, and one way in.

  It is written for a desktop browser, since that is where a link gets
  opened. The installed app never sees it, because the manifest starts
  at /today and anything launched in standalone mode is sent there.

  The palette is the icon: lapis on paper, and paper on lapis for the
  one band in the middle. Same two colours, turned over.
*/

export const metadata = {
  title: "Durus, Arabic revision for Madinah Book 1",
  description:
    "Spaced repetition, recognition speed, and case endings for the vocabulary of Madinah Book 1.",
};

const DRILLS = [
  {
    title: "Review",
    body: "Every word you have been taught, scheduled so it comes back the day before you would have forgotten it. Grade a card in one keystroke.",
  },
  {
    title: "Speed",
    body: "A word for a second and a half, then it blurs. Recognition is not the same skill as reading, and this is the one that measures it.",
  },
  {
    title: "Cases",
    body: "Raf', nasb, jarr, on the letter rather than after the punctuation. The endings are the grammar, so they get their own drill.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex w-full flex-1 flex-col">
      <StandaloneRedirect />

      <header className="mx-auto flex w-full max-w-[880px] items-center justify-between px-6 py-5">
        <Arabic showHarakat={false} className="text-lapis text-[24px] leading-none">
          دُرُوس
        </Arabic>
        <Link
          href="/unlock"
          className="text-ink-soft hover:text-ink text-[15px] transition-colors"
        >
          Sign in
        </Link>
      </header>

      {/* The hero. One mark, one line, one way in. */}
      <section className="mx-auto flex w-full max-w-[680px] flex-col items-center gap-8 px-6 py-20 lg:py-28">
        {/*
          Unvowelled, like the rail. The marks are drawn into the app
          icon, but the browser will not attach them to the letters.
        */}
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
            {TOTAL_LESSONS} lessons of vocabulary, drilled the way the book
            teaches it. Nothing appears before you have been taught it.
          </p>
        </div>

        <ButtonLink href="/unlock" className="min-w-[220px]">
          Sign in to your review
        </ButtonLink>
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

      {/* Back to paper. The quiet half of the page. */}
      <section className="mx-auto flex w-full max-w-[680px] flex-col items-center gap-10 px-6 py-20 lg:py-24">
        <Eyebrow>How it works</Eyebrow>

        <ul className="flex w-full flex-col gap-8">
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
            Install it to the home screen. Grades made without a signal go to
            an outbox and settle the next time you have one.
          </Point>
          <Point title="A keyboard, if you have one">
            Space reveals, one to four grade, u undoes. A session at a desk is
            a session you never touch the mouse for.
          </Point>
        </ul>
      </section>

      <footer className="border-rule mx-auto flex w-full max-w-[880px] flex-col items-center gap-4 border-t px-6 py-12">
        <Arabic showHarakat={false} className="text-lapis text-[22px] leading-none">
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
