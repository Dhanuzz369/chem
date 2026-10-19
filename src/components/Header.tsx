"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./Button";
import { Container } from "./Container";
import { Logo } from "./Logo";

export const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h10" />
      )}
    </svg>
  );
}

export function Header() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const panelId = useId();

  // Close on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // While open: lock page scroll and close if the viewport grows to desktop.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 768px)");
    const onChange = () => desktop.matches && setOpen(false);
    desktop.addEventListener("change", onChange);
    return () => {
      root.style.overflow = previous;
      desktop.removeEventListener("change", onChange);
    };
  }, [open]);

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  // While open, listen on the document so Escape and the focus trap work wherever focus is
  // (for example after a click on the backdrop moved it to <body>). Escape closes; Tab cycles
  // between the menu button and the menu links.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const links = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("a[href]") ?? []);
      const cycle = [buttonRef.current, ...links].filter((el): el is HTMLElement => el !== null);
      if (cycle.length === 0) return;
      event.preventDefault();
      const index = cycle.indexOf(document.activeElement as HTMLElement);
      const next =
        index === -1
          ? event.shiftKey ? cycle.length - 1 : 0
          : (index + (event.shiftKey ? -1 : 1) + cycle.length) % cycle.length;
      cycle[next].focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <Container className="flex h-16 items-center gap-2 md:h-[4.5rem] md:gap-8">
        <Link
          href="/"
          className="-mx-1 mr-auto flex shrink-0 items-center rounded-sm px-1 py-2 md:mr-0"
        >
          <Logo className="hidden h-6 w-auto min-[360px]:block sm:h-8" />
          <Logo variant="mark" className="h-7 w-7 min-[360px]:hidden" />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative inline-flex h-11 items-center rounded-sm px-3 text-[0.9375rem] transition-colors duration-(--duration-press) ease-(--ease-out) ${
                      active
                        ? "font-medium text-brand-800"
                        : "text-ink-muted [@media(hover:hover)]:hover:text-ink"
                    }`}
                  >
                    {link.label}
                    {active && (
                      <span aria-hidden="true" className="absolute inset-x-3 bottom-2 h-0.5 rounded-pill bg-brand-500" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2 md:ml-auto">
          <Button href="/quote" className="max-sm:px-3 max-sm:text-sm">
            Request a quote
          </Button>
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-ink transition-transform duration-(--duration-press) ease-(--ease-out) active:scale-[0.97] md:hidden"
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </Container>

      {open && (
        <>
          <div
            aria-hidden="true"
            onClick={() => close(false)}
            className="fixed inset-x-0 top-16 bottom-0 bg-ink/20 md:hidden"
          />
          <nav
            ref={panelRef}
            id={panelId}
            aria-label="Site"
            className="menu-panel absolute inset-x-0 top-full border-b border-line bg-bg pb-4 shadow-float md:hidden"
          >
            <Container as="ul" className="flex flex-col">
              {navLinks.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href} className="border-b border-line last:border-b-0">
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`flex h-14 items-center justify-between text-lg ${
                        active ? "font-medium text-brand-800" : "text-ink"
                      }`}
                    >
                      {link.label}
                      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-brand-600">
                        <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </li>
                );
              })}
            </Container>
          </nav>
        </>
      )}
    </header>
  );
}
