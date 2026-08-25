import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

export const dynamic = "force-dynamic";

/*
  Signing in, on the same Clerk instance the iOS app uses.

  A catch-all route because Clerk's component owns the steps under it - the
  emailed code, the OAuth hand-back, a second factor - and each is a path
  beneath this one rather than a state inside a single page.

  Clerk's prebuilt component rather than a hand-built form. What it buys is the
  part that is genuinely hard to get right and identical on both sides: the
  OAuth round trip, the verification codes, and the fact that a person who
  signed up on their phone with Apple can sign in here with the same button and
  land on the same profile row. It is themed with the app's own tokens so it
  does not read as somebody else's screen.
*/
export default function SignInPage() {
  return (
    <main className="flex w-full flex-1 items-center justify-center px-6 py-16">
      <SignIn appearance={clerkAppearance} />
    </main>
  );
}
