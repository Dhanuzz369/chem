/** A check mark that draws itself once (stroke-dashoffset). With reduced motion it is simply there. */
export function SuccessCheck() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" fill="none" className="text-brand-700">
      <circle cx="24" cy="24" r="24" className="fill-brand-100" />
      <path
        d="m15 24.5 6.25 6.25L33.5 18"
        pathLength={1}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lead-check-path"
      />
    </svg>
  );
}
