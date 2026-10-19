"use client";

import { useEffect, useState } from "react";
import { buttonClasses } from "@/components/Button";

type StickyQuoteBarProps = {
  name: string;
  hsn: string;
  /** id of the on-page quote section. The bar steps aside once that section is on screen or above it. */
  targetId: string;
};

/** Below lg (phones and tablets): keeps "Request a quote" within thumb reach while reading a long product page. */
export function StickyQuoteBar({ name, hsn, targetId }: StickyQuoteBarProps) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      setHidden(entry.isIntersecting || entry.boundingClientRect.top < 0);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  return (
    <div
      data-sticky-quote-bar
      inert={hidden}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] transition-[transform,opacity] duration-200 ease-(--ease-out) lg:hidden ${
        hidden ? "translate-y-full opacity-0" : ""
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{name}</p>
          <p className="font-mono text-xs text-ink-muted tabular-nums">HSN {hsn}</p>
        </div>
        <a href={`#${targetId}`} aria-label={`Request a quote for ${name}`} className={buttonClasses("primary", "md", "shrink-0")}>
          Request a quote
        </a>
      </div>
    </div>
  );
}
