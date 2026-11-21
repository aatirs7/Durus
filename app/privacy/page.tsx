import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/contact";

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

/* Bump when the substance changes, not when the wording is tidied. */
const UPDATED = "21 November 2026";

export const metadata: Metadata = {
  title: "Privacy, Durus",
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

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-ink-soft text-[16px] leading-relaxed">{children}</p>
);

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="text-ink-faint text-[12px] tracking-[0.08em] uppercase">Privacy</p>
        <h1 className="text-ink text-[32px] leading-tight font-medium">
          What Durus stores, and why
        </h1>
        <P>
          Durus is an app for reading, memorizing and understanding the Quran. It
          works without an account, and it collects what its features need and
          nothing else. Last updated {UPDATED}.
        </P>
      </header>

      <Section title="Without an account">
        <P>
          Everything stays on your phone: what you have marked as memorized, your
          reading place and bookmarks, your Barakah practices and prayers, your
          lessons and reviews, your recent searches, the name you give for the
          greeting, and your settings. Durus does not receive any of it.
        </P>
      </Section>

      <Section title="With an account">
        <P>
          An account is optional. If you create one, Durus keeps your{" "}
          <strong>email address</strong> and <strong>name</strong>, your{" "}
          <strong>lesson and review history</strong> (which word you answered,
          when, whether it was right and how long you took), your{" "}
          <strong>course settings</strong>, and an identifier for each device, so
          your progress follows you to a new phone. Memorization marks, Barakah
          and searches still stay on the phone.
        </P>
      </Section>

      <Section title="Search">
        <P>
          When you type a question or a topic into Search, the text you type is
          sent to the Durus server, which asks an AI service to suggest places in
          the Quran: <strong>Google Gemini</strong>, or <strong>Groq</strong> if
          Gemini is unavailable. Only the search text is sent, never your name,
          email or account. Answers are kept on the server for up to a day so the
          same question is not asked twice. Google may use text sent to its free
          service to improve its products, so do not type personal details into
          Search. Searches for a surah, a juz or an ayah number are answered on
          your phone and are not sent.
        </P>
      </Section>

      <Section title="Quran content">
        <P>
          Translations, word meanings and recitation are provided by{" "}
          <strong>Quran Foundation</strong> (Quran.com). Your phone fetches them
          through the Durus server, sending only which surahs and ayahs are
          needed. Recitation audio is downloaded from Quran Foundation&apos;s
          servers directly, which, like any website, see your IP address. Nothing
          about you is sent with these requests.
        </P>
      </Section>

      <Section title="What is not collected">
        <P>
          There is no analytics, no advertising, no tracking of any kind, and no
          third-party SDK watching what you do. Nothing is sold or shared for
          marketing. Reminders are scheduled by your own phone; Durus is not told
          whether a reminder was delivered, opened or ignored.
        </P>
      </Section>

      <Section title="Who processes it">
        <P>
          <strong>Clerk</strong> handles sign-in and holds your email address and
          name. <strong>Neon</strong> hosts the database your lesson history is
          stored in. <strong>Vercel</strong> runs the Durus server.{" "}
          <strong>Google</strong> and <strong>Groq</strong> answer searches, and{" "}
          <strong>Quran Foundation</strong> provides Quran content, as described
          above. Each keeps ordinary server logs, which include IP addresses, for
          a short period.
        </P>
      </Section>

      <Section title="How long it is kept, and deleting it">
        <P>
          Account data is kept for as long as you have an account. In the app,{" "}
          <strong>Settings, Delete account</strong> removes your account
          and every answer you have given, from the server and from the phone. It
          cannot be undone, so export your data first if you want a copy
          (Settings, Your data). Data kept only on the phone goes when you delete
          the app.
        </P>
        <P>
          If you cannot reach the app, email{" "}
          <a className="text-lapis underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          from the address on the account and it will be done for you.
        </P>
      </Section>

      <Section title="Children">
        <P>
          Durus has no social features and no user-to-user contact. It is not
          directed at children under 13 and no age is asked for or inferred.
        </P>
      </Section>

      <Section title="Changes">
        <P>
          If what is collected changes, this page changes with it and the date at
          the top moves. Questions go to{" "}
          <a className="text-lapis underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </P>
      </Section>

      <footer className="border-rule flex flex-col gap-3 border-t pt-6">
        <Link className="text-ink-soft text-[15px] underline underline-offset-4" href="/">
          Back to Durus
        </Link>
        <Link
          className="text-ink-soft text-[15px] underline underline-offset-4"
          href="/support"
        >
          Support
        </Link>
      </footer>
    </main>
  );
}
