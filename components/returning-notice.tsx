/*
  For the handful of people who had Durus on their home screen before any of
  this.

  Their shortcut points at the site, so opening it now lands them on the sign-in
  screen with no explanation - the name-and-PIN box they used is simply gone.
  This says what happened, in the one place they will actually see it.

  It also says plainly that their old progress did not come with them. The PIN
  profiles carried no email address to match a new account against, so there was
  nothing to migrate them by. Letting someone discover that after signing up
  and finding an empty deck would be worse than saying it here.

  Remove this once those people have all signed up again - it is a notice about
  a change, not a permanent part of the page, and it stops being true the moment
  nobody is arriving from the old version.
*/
export function ReturningNotice() {
  return (
    <aside className="border-rule bg-surface mx-auto flex w-full max-w-[400px] flex-col gap-2 rounded-[12px] border px-5 py-4">
      <p className="text-ink text-[15px] font-medium">Used Durus before?</p>
      <p className="text-ink-soft text-[14px] leading-relaxed">
        Signing in has moved from a name and a PIN to an account, so that your
        progress can follow you rather than living on one device. Create one with
        your email and it will work in the iPhone app the moment it arrives.
      </p>
      <p className="text-ink-faint text-[13px] leading-relaxed">
        The old PIN profiles could not be carried across — there was no email on
        them to match an account to — so you will be starting from your current
        lesson again.
      </p>
    </aside>
  );
}
