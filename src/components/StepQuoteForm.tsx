"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { fallbackLinks, LEADS_EMAIL, LEADS_WHATSAPP } from "@/lib/leads/fallback";
import { productLabel } from "@/lib/leads/options";
import { buildPayload, nextEverSent } from "@/lib/leads/payload";
import { createSender } from "@/lib/leads/send";
import { emptyAnswers, stageFor, validateStep, visibleSteps, type Answers, type Stage, type StepId } from "@/lib/leads/steps";
import { strings } from "@/lib/leads/strings";
import { buttonClasses } from "./Button";
import { ContactStep } from "./lead-steps/ContactStep";
import { DestinationStep } from "./lead-steps/DestinationStep";
import { GroupStep } from "./lead-steps/GroupStep";
import { NotesStep } from "./lead-steps/NotesStep";
import { ProductStep } from "./lead-steps/ProductStep";
import { ProgressBar } from "./lead-steps/ProgressBar";
import { QuantityStep } from "./lead-steps/QuantityStep";
import { SuccessCheck } from "./lead-steps/SuccessCheck";
import { TermsStep } from "./lead-steps/TermsStep";
import type { Errors, FieldKey, StepProps } from "./lead-steps/shared";

/** The Apps Script web app (/exec URL). Inlined at build time; empty means every send falls back. */
const ENDPOINT = process.env.NEXT_PUBLIC_LEADS_ENDPOINT?.trim() ?? "";
const AUTO_ADVANCE_MS = 260;
/** A valid submit faster than this after mount is delayed, never dropped. */
const MIN_SUBMIT_MS = 3000;

const ALL_STEPS: StepId[] = ["contact", "group", "product", "quantity", "destination", "terms", "notes"];
/** DOM order, so focus lands on the first invalid field. */
const FIELD_ORDER: FieldKey[] = ["name", "email", "phone", "group", "otherProduct", "product", "quantity", "quantityOther", "country", "terms"];

const stepViews: Record<StepId, (props: StepProps) => ReactNode> = {
  contact: ContactStep,
  group: GroupStep,
  product: ProductStep,
  quantity: QuantityStep,
  destination: DestinationStep,
  terms: TermsStep,
  notes: NotesStep,
};

/**
 * Without JavaScript every step shows as one plain form that posts to the endpoint. With it, only
 * the current step shows (from the first paint, so nothing jumps), and the step controls appear.
 */
const NO_JS_STYLE =
  ".lead-step,.lead-reveal,.lead-nojs{display:block!important}.lead-js{display:none!important}" +
  ".lead-step+.lead-step{margin-top:2.5rem;padding-top:2.5rem;border-top:1px solid var(--color-line)}";

type Phase = "editing" | "sending" | "success" | "failed";
type FocusTarget = "heading" | "success" | "failed" | FieldKey;

const subscribeNothing = () => () => {};
/** False in the server HTML and during hydration, true once React runs in the browser. */
function useHydrated() {
  return useSyncExternalStore(subscribeNothing, () => true, () => false);
}

/** Validation errors keyed by the field they sit under. A bad phone number shows under the phone field. */
function stepErrors(step: StepId, a: Answers): Errors {
  const e: Errors = validateStep(step, a);
  if (e.email === strings.errors.phoneInvalid) {
    e.phone = e.email;
    delete e.email;
  }
  return e;
}

/** Resolves once performance.now() reaches the given time (straight away if it has passed). */
async function waitUntil(time: number): Promise<void> {
  for (let wait = time - performance.now(); wait > 0; wait = time - performance.now()) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
}

/** Scrolls the form's top into view when a step change happens with it off screen or under the sticky header. */
function keepInView(form: HTMLElement) {
  const header = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
  const top = form.getBoundingClientRect().top;
  if (top < header || top > window.innerHeight) form.scrollIntoView({ block: "start" });
}

type StepQuoteFormProps = {
  /** From parsePrefill: answers to start with and steps to skip (a product page skips type and product). */
  initial?: { answers: Partial<Answers>; skip: StepId[] };
  /** Narrow spots such as product pages: step headings become h3 under the section's h2. */
  compact?: boolean;
};

export function StepQuoteForm({ initial, compact = false }: StepQuoteFormProps) {
  const uid = useId();
  const hydrated = useHydrated();
  const [skip] = useState(() => new Set(initial?.skip ?? []));
  const [answers, setAnswers] = useState<Answers>(() => ({ ...emptyAnswers, ...initial?.answers }));
  const [current, setCurrent] = useState<StepId>("contact");
  const [enter, setEnter] = useState<"forward" | "back" | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<Phase>("editing");
  // Client-only: the server never needs it, and the no-JavaScript form posts an empty leadId.
  const [leadId] = useState(() => (typeof window === "undefined" ? "" : crypto.randomUUID()));
  const [sender] = useState(() => createSender({ endpoint: ENDPOINT }));
  const everSent = useRef<ReadonlySet<string>>(new Set());
  const mountedAt = useRef(0);
  const submitting = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const focusTarget = useRef<FocusTarget | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  const fieldId = (field: FieldKey) => (field === "otherProduct" ? "other" : `${uid}-${field}`);
  const headingId = (step: StepId | "success" | "failed") => `${uid}-heading-${step}`;
  const steps = visibleSteps(answers, skip);
  const index = Math.max(0, steps.indexOf(current));
  const Heading = compact ? "h3" : "h2";
  const SubHeading = compact ? "h4" : "h3";

  useEffect(() => {
    mountedAt.current = performance.mark("quote-form-mounted").startTime;
    return () => clearTimeout(advanceTimer.current);
  }, []);

  // Focus follows the buyer: the new step's heading, the first invalid field, or the result.
  useEffect(() => {
    const target = focusTarget.current;
    const form = formRef.current;
    if (!target || !form) return;
    focusTarget.current = null;
    if (target === "heading" || target === "success" || target === "failed") {
      document.getElementById(headingId(target === "heading" ? current : target))?.focus({ preventScroll: true });
      keepInView(form);
      return;
    }
    const el = document.getElementById(fieldId(target));
    const input = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
      ? el
      : (el?.querySelector<HTMLInputElement>("input:checked") ?? el?.querySelector<HTMLInputElement>("input"));
    input?.focus();
  });

  function send(stage: Stage, a: Answers, keepalive: boolean) {
    const payload = buildPayload(leadId, stage, a, everSent.current, {
      sourcePage: window.location.pathname + window.location.search,
      userAgent: navigator.userAgent,
    });
    const result = sender.send(payload, { keepalive });
    // Whatever the result: a failed or timed-out request may still have reached the sheet.
    everSent.current = nextEverSent(everSent.current, payload);
    return result;
  }

  function goTo(step: StepId, direction: "forward" | "back", a: Answers) {
    clearTimeout(advanceTimer.current);
    setCurrent(step);
    setEnter(direction);
    setErrors({});
    setPhase("editing");
    // "/quote#other": step 2 opens with "Something else" chosen and its box ready to type in.
    focusTarget.current = step === "group" && a.group === "other" && !a.otherProduct.trim() ? "otherProduct" : "heading";
  }

  async function submit(a: Answers) {
    if (submitting.current) return;
    if (honeypot.current?.checked) {
      focusTarget.current = "success";
      setPhase("success");
      return;
    }
    submitting.current = true;
    setPhase("sending");
    await waitUntil(mountedAt.current + MIN_SUBMIT_MS);
    const result = await send("submitted", a, false);
    submitting.current = false;
    focusTarget.current = result.ok ? "success" : "failed";
    setPhase(result.ok ? "success" : "failed");
  }

  /** Next (and Send on the last step): validate this step, send it, move on. */
  function next(a: Answers, step: StepId) {
    clearTimeout(advanceTimer.current);
    const errs = stepErrors(step, a);
    const firstInvalid = FIELD_ORDER.find((f) => errs[f]);
    if (firstInvalid) {
      setErrors(errs);
      focusTarget.current = firstInvalid;
      return;
    }
    if (step === "notes") {
      setErrors({});
      void submit(a);
      return;
    }
    // Fire and forget: a failed intermediate send never blocks the buyer; the next one carries everything.
    void send(stageFor(step), a, true);
    const list = visibleSteps(a, skip);
    goTo(list[list.indexOf(step) + 1], "forward", a);
  }

  function back() {
    if (index > 0) goTo(steps[index - 1], "back", answers);
  }

  const update = (patch: Partial<Answers>) => {
    setAnswers((prev) => ({ ...prev, ...patch }));
    // Clear an error as soon as its field changes.
    const keys = Object.keys(patch) as FieldKey[];
    if (keys.some((k) => errors[k]) || (errors.email && (patch.phone !== undefined || patch.email !== undefined))) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        for (const k of keys) delete nextErrors[k];
        if (patch.phone !== undefined || patch.email !== undefined) {
          delete nextErrors.email;
          delete nextErrors.phone;
        }
        if (patch.group !== undefined) delete nextErrors.otherProduct;
        if (patch.quantity !== undefined) delete nextErrors.quantityOther;
        return nextErrors;
      });
    }
  };

  const choose: StepProps["choose"] = (patch, then) => {
    const a = { ...answers, ...patch };
    update(patch);
    clearTimeout(advanceTimer.current);
    if ("advance" in then) {
      const step = current;
      advanceTimer.current = setTimeout(() => next(a, step), AUTO_ADVANCE_MS);
    } else {
      focusTarget.current = then.focus;
    }
  };

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (phase === "sending" || phase === "success") return;
    next(answers, current);
  }

  /** The second click of a double click is not another Next or Send. */
  const ignoreRepeat = (e: MouseEvent) => {
    if (e.detail > 1) e.preventDefault();
  };

  const done = phase === "success";
  const replyTo = answers.email.trim() || answers.phone.trim();
  const links = phase === "failed" ? fallbackLinks(answers) : null;
  const prefilledGroup = skip.has("group") && answers.group !== "other" ? answers.group : "";

  return (
    <form
      ref={formRef}
      data-lead-form=""
      data-hydrated={hydrated ? "" : undefined}
      method="post"
      action={ENDPOINT || undefined}
      noValidate={hydrated}
      onSubmit={onSubmit}
      aria-busy={phase === "sending"}
      className="@container relative scroll-mt-4 rounded-lg border border-line bg-bg p-5 sm:p-8"
    >
      <noscript dangerouslySetInnerHTML={{ __html: `<style>${NO_JS_STYLE}</style>` }} />

      {!done && (
        <div className="lead-js mb-7">
          <p className="mb-2.5 text-sm font-medium text-ink-muted tabular-nums">{strings.ui.stepOf(index + 1, steps.length)}</p>
          <ProgressBar value={index + 1} max={steps.length} />
        </div>
      )}

      {ALL_STEPS.filter((step) => !skip.has(step)).map((step) => {
        const View = stepViews[step];
        const active = !done && step === current;
        return (
          <section
            key={step}
            aria-labelledby={headingId(step)}
            data-enter={active && enter ? enter : undefined}
            className={`lead-step ${active ? "" : "hidden"}`}
          >
            <Heading
              id={headingId(step)}
              tabIndex={-1}
              className="text-[1.5rem] font-semibold text-ink outline-none md:text-[1.75rem]"
            >
              {strings.ui.headings[step]}
            </Heading>
            <p className="mt-2 text-ink-muted">{strings.ui.leads[step]}</p>
            <div className="mt-6">
              <View
                answers={answers}
                errors={active ? errors : {}}
                fieldId={fieldId}
                headingId={headingId(step)}
                hydrated={hydrated}
                update={update}
                choose={choose}
                hold={() => clearTimeout(advanceTimer.current)}
              />
            </div>
          </section>
        );
      })}

      {/* Pre-filled answers whose steps are skipped, so the no-JavaScript post still carries them. */}
      {prefilledGroup && <input type="hidden" name="group" defaultValue={prefilledGroup} />}
      {skip.has("product") && <input type="hidden" name="product" defaultValue={productLabel(answers.group, answers.product)} />}
      <input type="hidden" name="leadId" defaultValue="" />
      <input type="hidden" name="stage" defaultValue="submitted" />

      {/* Honeypot: hidden from people and assistive tech. Ticked means a bot: show success, send nothing. */}
      <div aria-hidden="true" className="absolute -start-[10000px] top-0 size-px overflow-hidden">
        <label>
          <input ref={honeypot} type="checkbox" name="website" value="1" tabIndex={-1} autoComplete="off" />
          Website
        </label>
      </div>

      {links && (
        <div className="enter-soft mt-8 rounded-lg border border-danger-700/30 bg-danger-50 p-5 sm:p-6">
          <SubHeading id={headingId("failed")} tabIndex={-1} className="text-lg font-semibold text-danger-700 outline-none">
            {strings.ui.failed.heading}
          </SubHeading>
          <p className="mt-1.5 text-ink">{strings.ui.failed.body}</p>
          <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
            <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary", "md")}>
              {strings.ui.failed.whatsapp}
            </a>
            <a href={links.email} className={buttonClasses("secondary", "md")}>
              {strings.ui.failed.email}
            </a>
          </div>
        </div>
      )}

      {done ? (
        <div className="enter-soft">
          <SuccessCheck />
          <Heading id={headingId("success")} tabIndex={-1} className="mt-5 text-[1.5rem] font-semibold text-ink outline-none md:text-[1.75rem]">
            {strings.ui.success.heading}
          </Heading>
          <p className="mt-2 max-w-[56ch] text-ink-muted">{strings.ui.success.body(replyTo)}</p>
        </div>
      ) : (
        <div className="lead-js mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
          {index > 0 ? (
            <button type="button" onClick={back} className={buttonClasses("ghost", "md", "-ms-2 ps-2 pe-3")}>
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" className="rtl:-scale-x-100">
                <path d="M10 3.5 5.5 8l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {strings.ui.back}
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            onClick={ignoreRepeat}
            aria-disabled={phase === "sending" || undefined}
            className={buttonClasses("primary", "lg", "min-w-32 flex-1 sm:flex-none")}
          >
            {phase === "sending"
              ? strings.ui.sending
              : phase === "failed"
                ? strings.ui.retry
                : current === "notes"
                  ? strings.ui.send
                  : strings.ui.next}
            {phase !== "sending" && current !== "notes" && (
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" className="rtl:-scale-x-100">
                <path d="M6 3.5 10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Without JavaScript: one Send for the whole form. */}
      <div className="lead-nojs mt-10 hidden border-t border-line pt-6">
        <button type="submit" className={buttonClasses("primary", "lg")}>
          {strings.ui.send}
        </button>
        {!ENDPOINT && LEADS_WHATSAPP && LEADS_EMAIL && (
          <p className="mt-4 text-ink-muted">
            {strings.ui.noScriptContact}{" "}
            <a href={`https://wa.me/${LEADS_WHATSAPP}`} className="font-medium text-brand-700 underline underline-offset-4">
              WhatsApp
            </a>
            {" · "}
            <a href={`mailto:${LEADS_EMAIL}`} className="font-medium text-brand-700 underline underline-offset-4">
              {LEADS_EMAIL}
            </a>
          </p>
        )}
      </div>
    </form>
  );
}
