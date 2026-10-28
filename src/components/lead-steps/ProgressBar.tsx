/** A thin bar under "Step N of M". It grows with transform: scaleX, never width. Decorative: the label says the same. */
export function ProgressBar({ value, max }: { value: number; max: number }) {
  return (
    <div aria-hidden="true" className="h-1 overflow-hidden rounded-pill bg-brand-100">
      <div
        className="h-full origin-left rounded-pill bg-brand-600 transition-transform duration-[320ms] ease-(--ease-in-out) rtl:origin-right"
        style={{ transform: `scaleX(${max > 0 ? value / max : 0})` }}
      />
    </div>
  );
}
