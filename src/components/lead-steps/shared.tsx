import { useRef, type HTMLAttributes, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import type { Answers } from "@/lib/leads/steps";
import { strings } from "@/lib/leads/strings";

export type FieldKey = keyof Answers;
export type Errors = Partial<Record<FieldKey, string>>;

/** What every step component gets from StepQuoteForm. */
export type StepProps = {
  answers: Answers;
  errors: Errors;
  /** Stable DOM id per field, so the form can focus the first invalid one. */
  fieldId: (field: FieldKey) => string;
  /** The heading that names this step; radio groups are labelled by it. */
  headingId: string;
  hydrated: boolean;
  /** The final send is under way: fields that could still change the request are disabled. */
  busy: boolean;
  /** Typing, or a choice made with the keyboard: update and stay. */
  update: (patch: Partial<Answers>) => void;
  /** A card or pill was tapped: update, then move on after a beat, or focus a field that opened. */
  choose: (patch: Partial<Answers>, then: { advance: true } | { focus: FieldKey }) => void;
  /** Cancels a pending auto-advance (the buyer is still deciding on this step). */
  hold: () => void;
};

/**
 * Tells a tap from a keyboard choice. Arrow keys also "click" a radio, but only a pointer
 * press shortly before the click counts as a tap, and only a tap may auto-advance.
 */
export function useTap(onTap: () => void) {
  const pressedAt = useRef(Number.NEGATIVE_INFINITY);
  return {
    label: {
      onPointerDown: (e: PointerEvent) => {
        pressedAt.current = e.timeStamp;
      },
    },
    input: {
      onClick: (e: MouseEvent) => {
        if (e.timeStamp - pressedAt.current > 1000) return;
        pressedAt.current = Number.NEGATIVE_INFINITY;
        onTap();
      },
    },
  };
}

export function ErrorText({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-2 text-sm font-medium text-danger-700">
      {error}
    </p>
  );
}

type TextFieldProps = {
  id: string;
  name: FieldKey;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
  required?: boolean;
  multiline?: boolean;
  disabled?: boolean;
  className?: string;
} & Pick<HTMLAttributes<HTMLInputElement>, "inputMode"> & {
    type?: "text" | "email" | "tel";
    autoComplete?: string;
    placeholder?: string;
    maxLength?: number;
    list?: string;
  };

/** A labelled text input (or textarea). The error replaces the hint; an empty error slot renders nothing. */
export function TextField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  hint,
  optional,
  required,
  multiline,
  disabled,
  className = "",
  type = "text",
  ...rest
}: TextFieldProps) {
  const noteId = `${id}-note`;
  const note = error ?? hint;
  const shared = {
    id,
    name,
    value,
    required,
    disabled,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": note ? noteId : undefined,
    maxLength: rest.maxLength,
    placeholder: rest.placeholder,
    autoComplete: rest.autoComplete,
  } as const;
  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.9375rem] font-medium text-ink">
          {label}
        </label>
        {optional && <span className="text-sm text-ink-muted">{strings.ui.optional}</span>}
      </div>
      {multiline ? (
        <textarea {...shared} rows={4} onChange={(e) => onChange(e.target.value)} className="field-input mt-2 py-3" />
      ) : (
        <input
          {...shared}
          type={type}
          inputMode={rest.inputMode}
          list={rest.list}
          onChange={(e) => onChange(e.target.value)}
          className="field-input mt-2"
        />
      )}
      {note && (
        <p id={noteId} className={`mt-2 text-sm ${error ? "font-medium text-danger-700" : "text-ink-muted"}`}>
          {note}
        </p>
      )}
    </div>
  );
}

/** Wraps a field that opens under a choice ("Something else", "Another amount"). Always shown without JavaScript. */
export function Reveal({ open, children }: { open: boolean; children: ReactNode }) {
  return <div className={`lead-reveal mt-5 ${open ? "enter-soft" : "hidden"}`}>{children}</div>;
}
