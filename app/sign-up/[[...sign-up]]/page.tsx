import { SignUp } from "@clerk/nextjs";
import { ReturningNotice } from "@/components/returning-notice";
import { clerkAppearance } from "@/lib/clerk-appearance";

export const dynamic = "force-dynamic";

/* The other half of /sign-in. Same component family, same instance, same
   profile row at the end of it. */
export default function SignUpPage() {
  return (
    <main className="flex w-full flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <SignUp appearance={clerkAppearance} />
      <ReturningNotice />
    </main>
  );
}
