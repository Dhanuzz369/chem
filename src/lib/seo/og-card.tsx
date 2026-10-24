import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import type { ProductGroup } from "@/content/products";

/*
 * Share cards for Open Graph and X. next/og draws with inline styles and cannot read CSS custom
 * properties, so the tokens it needs are mirrored here from src/app/globals.css (@theme). Keep in sync.
 */
const token = {
  bg: "#ffffff",
  surface: "#f4f9f6",
  line: "#d9e6de",
  ink: "#0e2a1e",
  inkMuted: "#4a6156",
  brand100: "#dcf0e3",
  brand200: "#bce2cb",
  brand700: "#176140",
  brand800: "#134e34",
} as const;

/** The same group pastels as the HSN tags on the site (ProductCard's groupSwatch). */
const groupPastel: Record<ProductGroup, string> = {
  Solvents: "#e4f0f8",
  Amines: "#eeeaf7",
  Inorganics: "#f8f2d8",
  Surfactants: "#e2f4ea",
};

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";
/** The id every card is published under: /…/opengraph-image/card. */
export const OG_ID = "card";

// Read once at module scope: the files never change, and a read per request would make the cards dynamic.
const fontDir = join(process.cwd(), "assets", "fonts");
const [display500, display600, display700, sans500, mono500] = await Promise.all(
  [
    "BricolageGrotesque-Medium.ttf",
    "BricolageGrotesque-SemiBold.ttf",
    "BricolageGrotesque-Bold.ttf",
    "GBCCardSans-Medium.ttf",
    "GBCCardMono-Medium.ttf",
  ].map((file) => readFile(join(fontDir, file))),
);

const fonts = [
  { name: "Bricolage", data: display500, weight: 500 as const, style: "normal" as const },
  { name: "Bricolage", data: display600, weight: 600 as const, style: "normal" as const },
  { name: "Bricolage", data: display700, weight: 700 as const, style: "normal" as const },
  { name: "GBC Card Sans", data: sans500, weight: 500 as const, style: "normal" as const },
  { name: "GBC Card Mono", data: mono500, weight: 500 as const, style: "normal" as const },
];

/** The logo mark from src/app/icon.svg, drawn as JSX so it needs no file read. */
function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill={token.brand700} />
      <path
        d="M18.07 8.27 A8 8 0 1 0 24 16 H17.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22.35" cy="11.13" r="2.1" fill={token.brand200} />
    </svg>
  );
}

function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <Mark size={56} />
      <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: 36, letterSpacing: "-0.02em" }}>
        <span style={{ fontWeight: 700, color: token.ink }}>Goodbiz</span>
        <span style={{ fontWeight: 500, color: token.brand700, marginLeft: 10 }}>Chem</span>
      </div>
    </div>
  );
}

/** Headline size steps down with length so long names stay on two lines at most. */
function headlineSize(text: string): number {
  if (text.length <= 16) return 104;
  if (text.length <= 24) return 88;
  if (text.length <= 34) return 72;
  return 60;
}

function Frame({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: token.surface,
        padding: "64px 72px",
        fontFamily: "GBC Card Sans",
        color: token.ink,
      }}
    >
      <Wordmark />
      <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `2px solid ${token.line}`,
          paddingTop: 28,
          fontSize: 28,
          color: token.inkMuted,
        }}
      >
        {footer}
      </div>
    </div>
  );
}

export async function productCard(p: { name: string; hsn: string; group: ProductGroup }) {
  return new ImageResponse(
    (
      <Frame
        footer={
          <>
            <span style={{ color: token.brand800 }}>Exporter &amp; Supplier</span>
            <span>SDS available on request</span>
          </>
        }
      >
        <div
          style={{
            fontFamily: "Bricolage",
            fontWeight: 600,
            fontSize: headlineSize(p.name),
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            maxWidth: 1000,
          }}
        >
          {p.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 36, fontSize: 30 }}>
          <span
            style={{
              fontFamily: "GBC Card Mono",
              background: groupPastel[p.group],
              border: `2px solid ${token.line}`,
              borderRadius: 10,
              padding: "8px 18px",
            }}
          >
            HSN {p.hsn}
          </span>
          <span style={{ color: token.inkMuted }}>{p.group}</span>
        </div>
      </Frame>
    ),
    { ...ogSize, fonts },
  );
}

export async function postCard(post: { title: string }) {
  return new ImageResponse(
    (
      <Frame
        footer={
          <>
            <span style={{ color: token.brand800 }}>{site.name} blog</span>
            <span>Industrial chemicals exporter from {site.origin.country}</span>
          </>
        }
      >
        <div
          style={{
            fontFamily: "Bricolage",
            fontWeight: 600,
            fontSize: post.title.length <= 48 ? 72 : 60,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            maxWidth: 1040,
          }}
        >
          {post.title}
        </div>
      </Frame>
    ),
    { ...ogSize, fonts },
  );
}
