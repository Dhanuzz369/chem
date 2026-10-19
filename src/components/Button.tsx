import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

// Press feedback (scale 0.97, 160ms ease-out) on every variant. Hover colour
// changes only on devices that really hover, so taps never stick.
const base =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium " +
  "transition-[transform,background-color,border-color] duration-(--duration-press) ease-(--ease-out) " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand-700 text-white [@media(hover:hover)]:hover:bg-brand-800",
  secondary:
    "border border-brand-200 bg-brand-100 text-brand-800 [@media(hover:hover)]:hover:border-brand-300 [@media(hover:hover)]:hover:bg-brand-200",
  ghost: "text-brand-700 [@media(hover:hover)]:hover:bg-brand-50",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-4 text-[0.9375rem]",
  lg: "h-13 px-6 text-base",
};

type ButtonProps = {
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}

/** A Next.js link when `href` is given, otherwise a native button. */
export function Button({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = buttonClasses(variant, size, className);
  if (href !== undefined) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
