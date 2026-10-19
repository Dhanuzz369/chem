import Link from "next/link";

export type Crumb = { name: string; path: string };

/** Trail of links; the last item is the current page and is not a link. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.path} className="flex min-w-0 items-center gap-2">
              {last ? (
                <span aria-current="page" className="text-ink">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link
                    href={item.path}
                    className="whitespace-nowrap text-brand-700 underline-offset-4 [@media(hover:hover)]:hover:underline"
                  >
                    {item.name}
                  </Link>
                  <span aria-hidden="true" className="text-line-strong">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
