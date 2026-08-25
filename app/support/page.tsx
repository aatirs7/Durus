import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/contact";

/*
  The support page.

  App Store Connect requires a support URL and this is it. Apple fetches it
  signed out, so proxy.ts has to let it through, and App Review does read it -
  a page that only says "email us" is the sort of thing that comes back.

  So it answers the questions people actually arrive with, and each answer is
  checkable against the code rather than being reassurance. The ones about
  deleting an account and getting data out are here because they are what
  someone looks for when they are leaving, and burying those is a dark pattern.

  A document rather than a Screen: read at whatever width the browser gives it,
  by people who have never signed in.
*/

export const metadata: Metadata = {
  title: "Support — Durus",
  description: "How Durus works, and how to get help with it.",
};

function Question({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-ink text-[18px] font-medium">{q}</h2>
      <div className="text-ink-soft flex flex-col gap-3 text-[16px] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function SupportPage() {
  return (
    <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="text-ink-faint text-[12px] tracking-[0.08em] uppercase">Support</p>
        <h1 className="text-ink text-[32px] leading-tight font-medium">
          How Durus works, and how to get help
        </h1>
        <p className="text-ink-soft text-[16px] leading-relaxed">
          Durus brings back the vocabulary of the Madinah Arabic course just
          before you would have forgotten it. If something below does not answer
          your question, write to{" "}
          <a
            className="text-lapis underline underline-offset-4"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </header>

      <div className="flex flex-col gap-8">
        <Question q="Why am I not seeing a word I have been taught?">
          <p>
            Durus never shows a word from beyond the lesson you told it your
            class is on. Move the lesson forward in{" "}
            <strong>Settings → Study → Current lesson</strong> and the new words
            start arriving. They arrive over several days rather than all at
            once, at the rate set by <strong>New cards per day</strong>.
          </p>
        </Question>

        <Question q="Why is a word I just answered coming back so soon?">
          <p>
            The lesson your class is currently on stays in tight rotation for a
            fortnight after you reach it, whatever the schedule would otherwise
            have said. That is the lesson you are about to be tested on.
          </p>
          <p>
            Getting one wrong also brings it back inside the same session. That
            is not a penalty and nothing is scored — a word you have just missed
            is a word worth seeing again.
          </p>
        </Question>

        <Question q="There is nothing due. Can I still revise?">
          <p>
            Yes. Start a review on a clear day and it goes over the lessons you
            have, rather than a queue the scheduler picked. Answering correctly
            in that mode deliberately does not push a word further out, so a
            quiet evening of revision cannot empty the next fortnight.
          </p>
        </Question>

        <Question q="I am not getting reminders">
          <p>
            Reminders are one or two times a day that you choose, and they are
            scheduled by your own phone rather than sent from a server. If they
            have stopped, check that notifications are still allowed for Durus
            in iOS Settings, then toggle <strong>Daily reminders</strong> off
            and on again in <strong>Settings → Reminders</strong> to lay them
            down afresh.
          </p>
          <p>
            <strong>Send a test reminder</strong>, in the same section, arrives
            about five seconds later and confirms the whole path works.
          </p>
        </Question>

        <Question q="Does it work without a signal?">
          <p>
            Entirely. Every drill runs on the device, and a session started in
            airplane mode is a complete session. Answers given offline are sent
            the next time you have a connection; nothing is lost in between and
            there is nothing to press.
          </p>
        </Question>

        <Question q="Is my progress the same on my phone and in the browser?">
          <p>
            Yes, as long as you sign in to the same account. It is one account,
            one schedule and one history across both — answer a card on the bus
            and it is waiting for you at a desk.
          </p>
        </Question>

        <Question q="How do I get my data out?">
          <p>
            <strong>Settings → Data → Export all data as JSON</strong>. That
            hands back every answer you have ever given as a file, which you can
            save to Files, mail to yourself, or keep anywhere you like.
          </p>
        </Question>

        <Question q="How do I delete my account?">
          <p>
            <strong>Settings → Account → Delete account</strong>. There are two
            confirmations, and then your account and every answer you have given
            are removed from the server and from the phone. It cannot be undone,
            so export first if you want a copy.
          </p>
          <p>
            If you cannot reach the app, write to{" "}
            <a
              className="text-lapis underline underline-offset-4"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </a>{" "}
            from the address on the account and it will be done for you.
          </p>
        </Question>

        <Question q="Something is wrong, or a word is incorrect">
          <p>
            Write to{" "}
            <a
              className="text-lapis underline underline-offset-4"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </a>
            . For a bug, the lesson number and what you were doing is usually
            enough to find it. For a word, say which lesson it is in and what it
            should be.
          </p>
        </Question>
      </div>

      <footer className="border-rule flex flex-col gap-3 border-t pt-6">
        <Link className="text-ink-soft text-[15px] underline underline-offset-4" href="/">
          Back to Durus
        </Link>
        <Link
          className="text-ink-soft text-[15px] underline underline-offset-4"
          href="/privacy"
        >
          Privacy
        </Link>
      </footer>
    </main>
  );
}
