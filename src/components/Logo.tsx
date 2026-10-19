import { site } from "@/config/site";

/*
 * The mark: a deep-green tile holding an open ring that reads as a "G",
 * with a mint atom sitting in the ring's gap. Geometry is shared with
 * src/app/icon.svg, so keep the two in sync.
 */
function Mark({ x = 0 }: { x?: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect width="32" height="32" rx="8" style={{ fill: "var(--color-brand-700, #176140)" }} />
      <path
        d="M18.07 8.27 A8 8 0 1 0 24 16 H17.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22.35" cy="11.13" r="2.1" style={{ fill: "var(--color-brand-200, #bce2cb)" }} />
    </g>
  );
}

type LogoProps = {
  className?: string;
  /** "mark" drops the wordmark for very narrow spaces. */
  variant?: "full" | "mark";
};

export function Logo({ className = "", variant = "full" }: LogoProps) {
  if (variant === "mark") {
    return (
      <svg viewBox="0 0 32 32" role="img" aria-label={site.name} className={className}>
        <Mark />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 178 32" role="img" aria-label={site.name} className={className}>
      <Mark />
      <text
        x="41"
        y="22.5"
        fontSize="20"
        letterSpacing="-0.4"
        textLength="135"
        lengthAdjust="spacing"
        style={{ fontFamily: "var(--font-display)", fill: "var(--color-ink, #0e2a1e)" }}
      >
        <tspan fontWeight="700">Goodbiz</tspan>
        <tspan fontWeight="500" dx="5" style={{ fill: "var(--color-brand-700, #176140)" }}>
          Chem
        </tspan>
      </text>
    </svg>
  );
}
