import type { ReactNode } from "react";
import type { ProductGroup } from "@/content/products";

const tile: Record<ProductGroup | "other", string> = {
  Solvents: "bg-accent-sky",
  Amines: "bg-accent-lilac",
  Inorganics: "bg-accent-butter",
  Surfactants: "bg-accent-mint",
  other: "bg-brand-100",
};

/** Line drawings, one per product type: a flask, an amine (N with three bonds), a crystal, foam, and a magnifier for "Something else". */
const art: Record<ProductGroup | "other", ReactNode> = {
  Solvents: (
    <>
      <path d="M16.5 8.5h7M17.5 8.5v8.25L10.4 29.1a2.2 2.2 0 0 0 1.9 3.4h15.4a2.2 2.2 0 0 0 1.9-3.4l-7.1-12.35V8.5" />
      <path d="M13.4 24.5h13.2" />
    </>
  ),
  Amines: (
    <>
      <circle cx="20" cy="20.5" r="4.25" />
      <path d="m16.4 18.2-4.6-3M23.6 18.2l4.6-3M20 24.75v5" />
      <circle cx="9.5" cy="13.75" r="2.25" />
      <circle cx="30.5" cy="13.75" r="2.25" />
      <circle cx="20" cy="32" r="2.25" />
    </>
  ),
  Inorganics: (
    <>
      <path d="m20 7.5 11 6.25v12.5L20 32.5 9 26.25v-12.5z" />
      <path d="m9 13.75 11 6.25 11-6.25M20 20v12.5" />
    </>
  ),
  Surfactants: (
    <>
      <circle cx="15.5" cy="23.5" r="7" />
      <circle cx="26.5" cy="15" r="4.75" />
      <circle cx="27.75" cy="27.25" r="3.25" />
      <path d="M12.5 20.5a3.5 3.5 0 0 1 3-1.75" />
    </>
  ),
  other: (
    <>
      <circle cx="18" cy="18" r="8" />
      <path d="m24 24 7 7M18 14.5v7M14.5 18h7" />
    </>
  ),
};

export function GroupIllustration({ group }: { group: ProductGroup | "other" }) {
  return (
    <span aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-md ${tile[group]}`}>
      <svg
        viewBox="0 0 40 40"
        width="32"
        height="32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand-800"
      >
        {art[group]}
      </svg>
    </span>
  );
}
