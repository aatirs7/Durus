import type { ElementType } from "react";
import { stripHarakat } from "@/lib/harakat";

/*
  Every Arabic string in the app renders through this component.
  It is the only place that sets dir="rtl", so the Settings harakat
  toggle stays a one line change when it arrives.

  Never mix Arabic and English inside a single text node. Bidi
  reordering will mangle the punctuation. Always separate elements.
*/

export { stripHarakat, hasHarakat } from "@/lib/harakat";

type ArabicProps = {
  children: string;
  showHarakat?: boolean;
  className?: string;
  as?: ElementType;
};

export function Arabic({
  children,
  showHarakat = true,
  className = "",
  as: Tag = "span",
}: ArabicProps) {
  const text = showHarakat ? children : stripHarakat(children);
  return (
    <Tag dir="rtl" lang="ar" className={`arabic ${className}`}>
      {text}
    </Tag>
  );
}
