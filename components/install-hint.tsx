"use client";

import { useEffect, useState } from "react";

const DISMISSED = "durus.install-hint.dismissed";

/*
  Shown only when the app is running in a browser tab rather than from
  the home screen, and only on a phone. There is nothing to install on
  a desktop, so the whole thing is hidden at lg.

  Two steps, named after what is actually on the screen in front of you.
  Anything longer than two lines is a manual, and nobody reads a manual
  to save a bookmark.
*/
export function InstallHint() {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS reports standalone on navigator, not through the media query,
      // on some versions.
      (window.navigator as { standalone?: boolean }).standalone === true;

    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(DISMISSED) === "1";
    } catch {
      // Private mode can throw on access. Treat it as not dismissed.
    }

    // Only the two steps differ, so a plain test on the platform is
    // enough. Anything that is not an iPhone or an iPad gets the
    // Chrome wording.
    setIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
    setShow(!standalone && !dismissed);
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISSED, "1");
    } catch {
      // Nothing to do. The hint just comes back next launch.
    }
    setShow(false);
  }

  if (!show) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-rule text-ink-soft mx-auto rounded-[999px] border px-4 py-2 text-[13px] lg:hidden"
      >
        Add to home screen
      </button>
    );
  }

  return (
    <div className="border-rule bg-surface mx-auto flex w-full max-w-[320px] flex-col gap-3 rounded-[16px] border px-5 py-4 lg:hidden">
      <Step number={1}>
        {ios ? "Tap Share at the bottom of Safari" : "Tap the browser menu"}
      </Step>
      <Step number={2}>
        {ios ? "Choose Add to Home Screen" : "Choose Install app"}
      </Step>

      <button
        type="button"
        onClick={dismiss}
        className="text-lapis pt-1 text-[14px]"
      >
        Done
      </button>
    </div>
  );
}

function Step({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <p className="flex items-center gap-3 text-left">
      <span className="tabular text-ink-faint text-[13px]">{number}</span>
      <span className="text-ink text-[15px]">{children}</span>
    </p>
  );
}
