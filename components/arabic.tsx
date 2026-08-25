import type { CSSProperties, ElementType, ReactNode } from "react";
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
  /*
    A string in almost every case. Nodes are allowed so an Arabic only
    run can highlight part of itself with a span, which is safe because
    there is no direction change inside it for bidi to resolve. Harakat
    can only be stripped from a plain string, so a node keeps them.
  */
  children: ReactNode;
  showHarakat?: boolean;
  className?: string;
  as?: ElementType;
  /* For the one case where the size is data rather than a class. */
  style?: CSSProperties;
};

export function Arabic({
  children,
  showHarakat = true,
  className = "",
  as: Tag = "span",
  style,
}: ArabicProps) {
  const text =
    showHarakat || typeof children !== "string"
      ? children
      : stripHarakat(children);
  return (
    <Tag dir="rtl" lang="ar" className={`arabic ${className}`} style={style}>
      {text}
    </Tag>
  );
}
