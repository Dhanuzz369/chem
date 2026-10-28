import { useId, type ReactNode } from "react";
import { useTap } from "./shared";

type ChoiceCardProps = {
  name: string;
  /** What the no-JavaScript form posts: the English label the JSON payload also sends. */
  value: string;
  checked: boolean;
  label: string;
  hint?: string;
  art?: ReactNode;
  /** "tile": art above the label (product types). "row": a radio dot beside label and hint (terms, "Something else"). */
  layout?: "tile" | "row";
  className?: string;
  id?: string;
  required?: boolean;
  onSelect: () => void;
  onTap: () => void;
};

/**
 * A large tappable radio. The native input stays in the DOM (visually hidden), so arrow keys,
 * roving focus and the no-JavaScript post all work as the browser intends.
 */
export function ChoiceCard({
  name,
  value,
  checked,
  label,
  hint,
  art,
  layout = "tile",
  className = "",
  id,
  required,
  onSelect,
  onTap,
}: ChoiceCardProps) {
  const tap = useTap(onTap);
  const uid = useId();
  const row = layout === "row";
  // Rows without art carry a radio dot; everything else shows a check badge when chosen.
  const dot = row && !art;
  return (
    <label
      {...tap.label}
      className={`group relative flex min-h-13 cursor-pointer select-none rounded-lg border border-line-strong bg-bg p-4 text-ink transition-[transform,background-color,border-color,box-shadow] duration-(--duration-press) ease-(--ease-out) active:scale-[0.97] hover-fine:not-has-checked:border-brand-600 hover-fine:not-has-checked:bg-brand-50 has-checked:border-brand-700 has-checked:bg-brand-50 has-checked:shadow-[inset_0_0_0_1px_var(--color-brand-700)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-600 ${
        row ? "items-center gap-3.5" : "flex-col items-start gap-3"
      } ${className}`.trim()}
    >
      <input
        {...tap.input}
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        required={required}
        onChange={onSelect}
        // Named by the label alone; the hint is its description.
        aria-labelledby={`${uid}-label`}
        aria-describedby={hint ? `${uid}-hint` : undefined}
        className="sr-only"
      />
      {dot && (
        <span
          aria-hidden="true"
          className="grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] border-line-strong bg-bg transition-[border-color] duration-(--duration-press) ease-(--ease-out) group-has-checked:border-brand-700"
        >
          <span className="size-2.5 scale-50 rounded-full bg-brand-700 opacity-0 transition-[transform,opacity] duration-(--duration-press) ease-(--ease-out) group-has-checked:scale-100 group-has-checked:opacity-100" />
        </span>
      )}
      {art}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span id={`${uid}-label`} className="font-medium leading-snug">
          {label}
        </span>
        {hint && (
          <span id={`${uid}-hint`} className="text-sm leading-snug text-ink-muted">
            {hint}
          </span>
        )}
      </span>
      {!dot && (
        <span
          aria-hidden="true"
          className="absolute end-3 top-3 grid size-5 scale-75 place-items-center rounded-full bg-brand-700 text-white opacity-0 transition-[transform,opacity] duration-(--duration-press) ease-(--ease-out) group-has-checked:scale-100 group-has-checked:opacity-100"
        >
          <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m2.75 6.25 2.25 2.25 4.25-4.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </label>
  );
}
