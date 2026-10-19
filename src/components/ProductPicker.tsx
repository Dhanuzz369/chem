"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

export type ProductOption = {
  slug: string;
  name: string;
  hsn: string;
  group: string;
  /** Lowercased name, synonyms, HSN and CAS numbers, for searching. */
  terms: string;
};

type ProductPickerProps = {
  id: string;
  options: ProductOption[];
  value: string[];
  onChange: (slugs: string[]) => void;
  onBlur?: () => void;
  invalid?: boolean;
  describedBy?: string;
};

const normalise = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function filterOptions(options: ProductOption[], query: string) {
  const q = normalise(query);
  return q ? options.filter((o) => o.terms.includes(q)) : options;
}

/**
 * A searchable multi-select following the ARIA combobox pattern: type to filter,
 * arrow keys to move, Enter to add or remove, Escape to close, Backspace on an
 * empty search to remove the last product. Chosen products show as removable chips.
 */
export function ProductPicker({ id, options, value, onChange, onBlur, invalid, describedBy }: ProductPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [announcement, setAnnouncement] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** After a chip is removed: the chip whose button takes focus next, or null for the input. */
  const focusAfterRemove = useRef<string | null | undefined>(undefined);
  const listId = `${id}-list`;
  const optionId = (slug: string) => `${id}-opt-${slug}`;
  const chipId = (slug: string) => `${id}-chip-${slug}`;

  const results = useMemo(() => filterOptions(options, query), [options, query]);
  const chosenId = `${id}-chosen`;

  const groups = useMemo(() => {
    const byGroup = new Map<string, ProductOption[]>();
    for (const o of results) byGroup.set(o.group, [...(byGroup.get(o.group) ?? []), o]);
    return [...byGroup];
  }, [results]);

  const showList = open && results.length > 0;
  const activeOption = showList && active >= 0 ? results[active] : undefined;
  const byslug = useMemo(() => new Map(options.map((o) => [o.slug, o])), [options]);

  useEffect(() => {
    if (!activeOption) return;
    listRef.current?.querySelector(`#${CSS.escape(optionId(activeOption.slug))}`)?.scrollIntoView({ block: "nearest" });
    // optionId is derived from id, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOption]);

  // The removed chip's button unmounts while focused; without this, focus falls to <body>.
  useEffect(() => {
    if (focusAfterRemove.current === undefined) return;
    const next = focusAfterRemove.current;
    focusAfterRemove.current = undefined;
    if (next) document.getElementById(`${id}-chip-${next}`)?.focus();
    else inputRef.current?.focus();
  }, [id, value]);

  function removeChip(slug: string) {
    const i = value.indexOf(slug);
    focusAfterRemove.current = value[i + 1] ?? value[i - 1] ?? null;
    toggle(slug);
  }

  function toggle(slug: string) {
    const name = byslug.get(slug)?.name ?? slug;
    const next = value.includes(slug) ? value.filter((s) => s !== slug) : [...value, slug];
    onChange(next);
    const count = `${next.length} ${next.length === 1 ? "product" : "products"} chosen.`;
    setAnnouncement(`${name} ${next.includes(slug) ? "added" : "removed"}. ${count}`);
  }

  /** Closing also forgets the highlighted option, so reopening starts fresh. */
  function closeList() {
    setOpen(false);
    setActive(-1);
  }

  function search(next: string) {
    setQuery(next);
    setOpen(true);
    setActive(next ? 0 : -1);
    const found = filterOptions(options, next).length;
    setAnnouncement(
      found === 0
        ? `No products match ${next.trim()}.`
        : `${found} ${found === 1 ? "product" : "products"} available.`,
    );
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActive(results.length ? 0 : -1);
        } else setActive((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActive(results.length - 1);
        } else setActive((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        // Inside the open list, Enter picks; it must never submit the form from here.
        if (open) {
          e.preventDefault();
          if (activeOption) toggle(activeOption.slug);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          closeList();
        } else if (query) {
          e.preventDefault();
          setQuery("");
        }
        break;
      case "Backspace":
        if (query === "" && value.length > 0) toggle(value[value.length - 1]);
        break;
      case "Tab":
        closeList();
        break;
    }
  }

  return (
    <div>
      <div className="relative">
        <svg
          viewBox="0 0 20 20"
          width="18"
          height="18"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted"
        >
          <circle cx="8.75" cy="8.75" r="5.5" />
          <path d="m13 13 4 4" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOption ? optionId(activeOption.slug) : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={[describedBy, value.length > 0 && chosenId].filter(Boolean).join(" ") || undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="Search by name, HSN or CAS number"
          value={query}
          onChange={(e) => search(e.target.value)}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            closeList();
            onBlur?.();
          }}
          className="field-input pl-10"
        />

        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          aria-label="Product list"
          hidden={!showList}
          // Clicks anywhere in the list (options, group labels, padding) must not blur the input.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-72 overflow-y-auto overscroll-contain rounded-lg border border-line bg-bg p-1.5 shadow-popover"
        >
          {groups.map(([group, items]) => (
            <div key={group} role="group" aria-labelledby={`${id}-g-${group}`}>
              <div
                id={`${id}-g-${group}`}
                role="presentation"
                className="px-2.5 pt-2 pb-1 text-xs font-medium tracking-wide text-ink-muted uppercase"
              >
                {group}
              </div>
              {items.map((o) => {
                const selected = value.includes(o.slug);
                const isActive = activeOption?.slug === o.slug;
                return (
                  <div
                    key={o.slug}
                    id={optionId(o.slug)}
                    role="option"
                    aria-selected={selected}
                    data-active={isActive || undefined}
                    onClick={() => toggle(o.slug)}
                    onMouseMove={() => setActive(results.indexOf(o))}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-2.5 py-2 text-ink data-active:bg-brand-50"
                  >
                    <span
                      aria-hidden="true"
                      className={`grid size-4.5 shrink-0 place-items-center rounded-[4px] border ${
                        selected ? "border-brand-700 bg-brand-700 text-white" : "border-line-strong bg-bg"
                      }`}
                    >
                      {selected && (
                        <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m2.5 6.25 2.25 2.25 4.75-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">{o.name}</span>
                    <span className="font-mono text-xs text-ink-muted tabular-nums">
                      <span className="sr-only">HSN </span>
                      {o.hsn}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {open && results.length === 0 && (
          <p className="absolute inset-x-0 top-full z-20 mt-1.5 rounded-lg border border-line bg-bg px-4 py-3 text-sm text-ink-muted">
            No products match “{query.trim()}”. Try a shorter name or an HSN code.
          </p>
        )}
      </div>

      {value.length > 0 && (
        <p id={chosenId} className="sr-only">
          Chosen: {value.map((slug) => byslug.get(slug)?.name ?? slug).join(", ")}.
        </p>
      )}
      {value.length > 0 && (
        <ul aria-label="Chosen products" className="mt-3 flex flex-wrap gap-2">
          {value.map((slug) => {
            const name = byslug.get(slug)?.name ?? slug;
            return (
              <li key={slug}>
                <button
                  id={chipId(slug)}
                  type="button"
                  aria-label={`Remove ${name}`}
                  onClick={() => removeChip(slug)}
                  className="inline-flex h-11 items-center gap-2 rounded-sm border border-brand-200 bg-brand-100 pr-2.5 pl-3 text-[0.9375rem] text-brand-900 transition-[transform,background-color] duration-(--duration-press) ease-(--ease-out) active:scale-[0.97] sm:h-9 [@media(hover:hover)]:hover:bg-brand-200"
                >
                  {name}
                  <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="m3 3 6 6M9 3 3 9" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
