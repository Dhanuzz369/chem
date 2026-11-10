"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { asksFirst } from "@/lib/consent-regions";
import {
  COOKIE_SETTINGS_EVENT,
  LIVE_HOST,
  choiceInEffect,
  denyAnalytics,
  grantAnalytics,
  loadGtag,
  readChoice,
  saveChoice,
  type Choice,
  type Mode,
} from "@/lib/consent";
import { buttonClasses } from "./Button";

/** gtag.js waits until the page has loaded and the browser is idle, so it never competes with LCP or INP. */
function whenIdle(run: () => void): () => void {
  // Safari has no requestIdleCallback; a short timeout after load stands in for it.
  const hasIdle = typeof window.requestIdleCallback === "function";
  let idle: number | undefined;
  const schedule = () => {
    idle = hasIdle ? window.requestIdleCallback(run, { timeout: 4000 }) : window.setTimeout(run, 1500);
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
  return () => {
    window.removeEventListener("load", schedule);
    if (idle === undefined) return;
    if (hasIdle) window.cancelIdleCallback(idle);
    else window.clearTimeout(idle);
  };
}

let initialMode: Mode | undefined;
/** Read once per page load, in the browser only: the stored choice, or what the time zone implies. */
function getInitialMode(): Mode {
  initialMode ??= choiceInEffect(readChoice(), asksFirst(Intl.DateTimeFormat().resolvedOptions().timeZone));
  return initialMode;
}
const noSubscribe = () => () => {};

/**
 * Google Analytics consent. In ask-first time zones (Europe and the countries in consent-regions.ts)
 * the banner shows and nothing loads from Google until Accept; elsewhere analytics runs by default.
 * Footer "Cookie settings" reopens the banner anywhere.
 */
export function CookieConsent() {
  // null on the server and during hydration, so the server HTML never contains the banner.
  const initial = useSyncExternalStore(noSubscribe, getInitialMode, () => null);
  const [chosen, setChosen] = useState<Choice | null>(null);
  const [openState, setOpen] = useState<boolean | null>(null);
  const mode = chosen ?? initial;
  const open = openState ?? initial === "ask";
  const region = useRef<HTMLDivElement>(null);
  const reopened = useRef(false);

  useEffect(() => {
    const initial = getInitialMode();
    const reopen = () => {
      reopened.current = true;
      setOpen(true);
    };
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    const cancel =
      window.location.hostname === LIVE_HOST && (initial === "granted" || initial === "default")
        ? whenIdle(() => loadGtag(initial))
        : undefined;
    return () => {
      window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
      cancel?.();
    };
  }, []);

  // Reserve the banner's height at the bottom of the page so it never covers a submit button or the quote bar.
  useEffect(() => {
    const el = region.current;
    if (!open || !el) return;
    if (reopened.current) el.focus();
    const root = document.documentElement;
    const observer = new ResizeObserver(() => root.style.setProperty("--consent-h", `${el.offsetHeight}px`));
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--consent-h");
    };
  }, [open]);

  function choose(choice: Choice) {
    saveChoice(choice);
    if (choice === "granted") grantAnalytics();
    else denyAnalytics();
    setChosen(choice);
    setOpen(false);
  }

  if (!open || mode === null) return null;
  // The choice in effect, marked once there is one; a first-time ask pre-selects nothing.
  const pressed = mode === "ask" ? undefined : mode === "denied" ? "denied" : "granted";

  return (
    <div
      ref={region}
      role="region"
      aria-label="Cookie settings"
      tabIndex={-1}
      data-consent-banner
      className="consent-banner fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(0_0_0/0.06)] outline-none"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:gap-6 md:px-6">
        <div className="min-w-0 flex-1 text-sm text-ink">
          <p>
            We&apos;d like to use Google Analytics cookies to see which pages and products buyers look at, so we can
            improve the site. No advertising, and nothing about you is sold.{" "}
            <Link href="/privacy" className="font-medium text-brand-700 underline underline-offset-4">
              Privacy and cookie policy
            </Link>
          </p>
          {mode === "default" && (
            <p className="mt-1 text-ink-muted">Analytics is on by default where you are. Reject turns it off and deletes its cookies.</p>
          )}
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-3 md:flex">
          <button
            type="button"
            aria-pressed={pressed === undefined ? undefined : pressed === "granted"}
            onClick={() => choose("granted")}
            className={buttonClasses("secondary", "md", "min-w-28 aria-pressed:border-brand-700")}
          >
            Accept
          </button>
          <button
            type="button"
            aria-pressed={pressed === undefined ? undefined : pressed === "denied"}
            onClick={() => choose("denied")}
            className={buttonClasses("secondary", "md", "min-w-28 aria-pressed:border-brand-700")}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

/** The footer's "Cookie settings" control: reopens the banner on any page. */
export function CookieSettingsButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}>
      Cookie settings
    </button>
  );
}
