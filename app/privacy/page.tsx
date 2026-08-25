import type { Metadata } from "next";
import Link from "next/link";

/*
  The privacy policy.

  App Store Connect requires a reachable privacy policy URL for every app, and
  this is it. It is also the document the App Privacy questionnaire has to
  agree with, so the two are written from the same list: change what the app
  collects and both have to move.

  Deliberately specific and short. A policy that lists every category of data a
  company might one day collect tells the reader nothing about what THIS app
  does, and every sentence here is checkable against the code.

  Not a Screen: this is a document, read at whatever width the browser gives it,
  and it is linked from outside the app by people who have never signed in.
*/

const CONTACT = "privacy@durus.space";

/* Bump when the substance changes, not when the wording is tidied. */
const UPDATED = "25 August 2026";

export const metadata: Metadata = {
  title: "Privacy — Durus",
  description: "What Durus stores, why, and how to delete it.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-ink text-[20px] font-medium">{title}</h2>
      {children}
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="text-ink-faint text-[12px] tracking-[0.08em] uppercase">Privacy</p>
        <h1 className="text-ink text-[32px] leading-tight font-medium">
          What Durus stores, and why
        </h1>
        <p className="text-ink-soft text-[16px] leading-relaxed">
          Durus is a revision app for the vocabulary of the Madinah Arabic course. It
          exists to bring words back just before you forget them, and it collects
          what that takes and nothing else. Last updated {UPDATED}.
        </p>
      </header>

      <Section title="What is collected">
        <p className="text-ink-soft text-[16px] leading-relaxed">
          If you create an account, your <strong>email address</strong> and the{" "}
          <strong>name you choose</strong>. The name is only ever used to greet
          you.
        </p>
        <p className="text-ink-soft text-[16px] leading-relaxed">
          Your <strong>revision history</strong>: which word you answered, when,
          whether it was right, and how long you took. This is what the schedule
          is computed from, so without it the app cannot do the one thing it is
          for.
        </p>
        <p className="text-ink-soft text-[16px] leading-relaxed">
          Your <strong>settings</strong>: the lesson your class is on, how many
          new words a day, reminder times, theme. Plus an identifier for each
          device you sign in on, so two phones can be told apart when they sync.
        </p>
      </Section>

      <Section title="What is not collected">
        <p className="text-ink-soft text-[16px] leading-relaxed">
          There is no analytics, no advertising, no tracking of any kind, and no
          third-party SDK watching what you do. Nothing is sold or shared with
          anyone for marketing. There are no cookies beyond the one that keeps
          you signed in, and the one that remembers your theme.
        </p>
        <p className="text-ink-soft text-[16px] leading-relaxed">
          Reminders are scheduled by your own phone. Durus has no push server and
          is not told whether a reminder was delivered, opened or ignored.
        </p>
      </Section>

      <Section title="Who processes it">
        <p className="text-ink-soft text-[16px] leading-relaxed">
          Three services, each doing one job:{" "}
          <strong>Clerk</strong> handles sign-in and holds your email address and
          name; <strong>Neon</strong> hosts the database your revision history is
          stored in; <strong>Vercel</strong> serves the site and the API. Each
          keeps ordinary server logs, which include IP addresses, for a short
          period. None of them is given your data for their own purposes.
        </p>
      </Section>

      <Section title="How long it is kept">
        <p className="text-ink-soft text-[16px] leading-relaxed">
          For as long as you have an account. Delete the account and it goes.
        </p>
      </Section>

      <Section title="Deleting everything">
        <p className="text-ink-soft text-[16px] leading-relaxed">
          In the iOS app: <strong>Settings → Account → Delete account</strong>.
          That removes your account and every answer you have given, from the
          server and from the phone. It cannot be undone, so export your data
          first if you want a copy — the option is directly above it, and hands
          back everything as a JSON file.
        </p>
        <p className="text-ink-soft text-[16px] leading-relaxed">
          If you cannot reach the app for any reason, email{" "}
          <a className="text-lapis underline underline-offset-4" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>{" "}
          from the address on the account and it will be done for you.
        </p>
      </Section>

      <Section title="Children">
        <p className="text-ink-soft text-[16px] leading-relaxed">
          Durus is a study aid with no social features, no user-to-user contact
          and no content that is unsuitable at any age. It is not directed at
          children under 13 and no age is asked for or inferred.
        </p>
      </Section>

      <Section title="Changes">
        <p className="text-ink-soft text-[16px] leading-relaxed">
          If what is collected changes, this page changes with it and the date at
          the top moves. Questions go to{" "}
          <a className="text-lapis underline underline-offset-4" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>
          .
        </p>
      </Section>

      <footer className="border-rule border-t pt-6">
        <Link className="text-ink-soft text-[15px] underline underline-offset-4" href="/">
          Back to Durus
        </Link>
      </footer>
    </main>
  );
}
