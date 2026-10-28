import { useState } from "react";
import { packagingOptions, quantityOptions, type QuantityId } from "@/lib/leads/options";
import { strings } from "@/lib/leads/strings";
import { Pill } from "./Pill";
import { ErrorText, Reveal, TextField, type StepProps } from "./shared";

/**
 * Step 4: quantity pills, then optional packaging. A quantity tap moves on only while packaging
 * is untouched, so packaging stays reachable; "Another amount" opens a text box and stays.
 */
export function QuantityStep({ answers, errors, fieldId, headingId, update, choose, hold }: StepProps) {
  const [packagingTouched, setPackagingTouched] = useState(false);
  const errorId = `${fieldId("quantity")}-error`;
  const packagingLabelId = `${fieldId("packaging")}-label`;

  const tapQuantity = (quantity: QuantityId) => {
    if (quantity === "other") choose({ quantity }, { focus: "quantityOther" });
    else if (packagingTouched) update({ quantity });
    else choose({ quantity }, { advance: true });
  };

  return (
    <>
      <div
        id={fieldId("quantity")}
        role="radiogroup"
        aria-labelledby={headingId}
        aria-describedby={errors.quantity ? errorId : undefined}
        aria-invalid={errors.quantity ? true : undefined}
      >
        <div className="flex flex-wrap gap-2">
          {quantityOptions.map((o) => (
            <Pill
              key={o.id}
              name="quantity"
              value={o.label}
              label={o.label}
              checked={answers.quantity === o.id}
              required
              onSelect={() => update({ quantity: o.id })}
              onTap={() => tapQuantity(o.id)}
            />
          ))}
        </div>
      </div>
      <ErrorText id={errorId} error={errors.quantity} />
      <Reveal open={answers.quantity === "other"}>
        <TextField
          id={fieldId("quantityOther")}
          name="quantityOther"
          label={strings.ui.fields.quantityOther}
          placeholder={strings.ui.fields.quantityOtherPlaceholder}
          value={answers.quantityOther}
          onChange={(quantityOther) => update({ quantityOther })}
          error={errors.quantityOther}
          autoComplete="off"
          maxLength={100}
          className="max-w-[24rem]"
        />
      </Reveal>

      <div role="group" aria-labelledby={packagingLabelId} className="mt-8 border-t border-line pt-6">
        <div className="flex items-baseline justify-between gap-3">
          <p id={packagingLabelId} className="text-[0.9375rem] font-medium text-ink">
            {strings.ui.fields.packaging}
          </p>
          <span className="text-sm text-ink-muted">{strings.ui.optional}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {packagingOptions.map((o) => (
            <Pill
              key={o.id}
              type="checkbox"
              name="packaging"
              value={o.label}
              label={o.label}
              checked={answers.packaging.includes(o.id)}
              onSelect={(on) => {
                setPackagingTouched(true);
                hold();
                update({ packaging: on ? [...answers.packaging, o.id] : answers.packaging.filter((p) => p !== o.id) });
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
