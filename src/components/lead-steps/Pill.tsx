import { useTap } from "./shared";

type PillProps = {
  type?: "radio" | "checkbox";
  name: string;
  /** What the no-JavaScript form posts: the English label the JSON payload also sends. */
  value: string;
  checked: boolean;
  label: string;
  id?: string;
  required?: boolean;
  onSelect: (checked: boolean) => void;
  onTap?: () => void;
};

/** A compact tappable choice. Radios are single-select and may auto-advance; checkboxes never do. */
export function Pill({ type = "radio", name, value, checked, label, id, required, onSelect, onTap }: PillProps) {
  const tap = useTap(onTap ?? (() => {}));
  const box = type === "checkbox";
  return (
    <label
      {...tap.label}
      className="group inline-flex min-h-11 cursor-pointer select-none items-center gap-2 rounded-pill border border-line-strong bg-bg px-4 py-2 text-[0.9375rem] leading-snug text-ink transition-[transform,background-color,border-color,color] duration-(--duration-press) ease-(--ease-out) active:scale-[0.97] hover-fine:not-has-checked:border-brand-600 has-checked:border-brand-700 has-checked:bg-brand-700 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-600"
    >
      <input
        {...(onTap ? tap.input : {})}
        id={id}
        type={type}
        name={name}
        value={value}
        checked={checked}
        required={required}
        onChange={(e) => onSelect(e.target.checked)}
        className="sr-only"
      />
      {box && (
        <span
          aria-hidden="true"
          className="grid size-4 shrink-0 place-items-center rounded-[4px] border-[1.5px] border-line-strong group-has-checked:border-white"
        >
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-0 group-has-checked:opacity-100">
            <path d="m2.5 6.25 2.25 2.25 4.75-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      {label}
    </label>
  );
}
