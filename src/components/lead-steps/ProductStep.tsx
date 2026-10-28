import { productOptions, groupOptions } from "@/lib/leads/options";
import { Pill } from "./Pill";
import { ErrorText, type StepProps } from "./shared";

/**
 * Step 3: the products in the chosen type, plus "Any / not sure". Single select; a tap moves on.
 * Before a type is chosen (and so in the no-JavaScript form) every type's products are listed.
 */
export function ProductStep({ answers, errors, fieldId, headingId, update, choose }: StepProps) {
  const chosen = groupOptions.find((g) => g.id === answers.group);
  const shown = chosen ? [chosen] : groupOptions;
  const errorId = `${fieldId("product")}-error`;
  return (
    <>
      <div className="grid gap-6">
        {shown.map((g, i) => {
          const groupLabelId = `${fieldId("product")}-${g.id}`;
          return (
            <div
              key={g.id}
              id={i === 0 ? fieldId("product") : undefined}
              role="radiogroup"
              aria-labelledby={shown.length > 1 ? `${headingId} ${groupLabelId}` : headingId}
              aria-describedby={errors.product ? errorId : undefined}
              aria-invalid={errors.product ? true : undefined}
            >
              {shown.length > 1 && (
                <p id={groupLabelId} className="mb-3 text-sm font-medium text-ink-muted">
                  {g.label}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {productOptions(g.id).map((o) => {
                  const patch = { group: g.id, product: o.id };
                  return (
                    <Pill
                      key={o.id}
                      name="product"
                      value={o.label}
                      label={o.label}
                      checked={answers.group === g.id && answers.product === o.id}
                      onSelect={() => update(patch)}
                      onTap={() => choose(patch, { advance: true })}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <ErrorText id={errorId} error={errors.product} />
    </>
  );
}
