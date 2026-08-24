"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hasReviewed, isPlainKey, isTyping, overlayOpen } from "@/lib/keys";

/*
  R starts a review from Today. The binding is live at every width,
  since a phone has no key to press, but the hint that teaches it only
  appears on desktop and only until the first session has been
  finished.
*/
export function ReviewHint({ href = "/review" }: { href?: string }) {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hasReviewed()) setShow(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target) || !isPlainKey(e) || overlayOpen()) return;
      if (e.key !== "r" && e.key !== "R") return;
      e.preventDefault();
      router.push(href);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, href]);

  if (!show) return null;

  return (
    <p className="text-ink-faint hidden text-[12px] lg:block">
      Press R to review
    </p>
  );
}
