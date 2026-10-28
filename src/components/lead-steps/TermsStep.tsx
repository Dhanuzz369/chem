import { termsOptions } from "@/lib/leads/options";
import { ChoiceCard } from "./ChoiceCard";
import { ErrorText, type StepProps } from "./shared";

/** Step 6: shipping terms, each with one plain line. A tap moves on. */
export function TermsStep({ answers, errors, fieldId, headingId, update, choose }: StepProps) {
  const errorId = `${fieldId("terms")}-error`;
  return (
    <>
      <div
        id={fieldId("terms")}
        role="radiogroup"
        aria-labelledby={headingId}
        aria-describedby={errors.terms ? errorId : undefined}
        aria-invalid={errors.terms ? true : undefined}
        className="grid gap-3 @2xl:grid-cols-2"
      >
        {termsOptions.map((o) => (
          <ChoiceCard
            key={o.id}
            name="terms"
            value={o.label}
            label={o.label}
            hint={o.hint}
            layout="row"
            checked={answers.terms === o.id}
            required
            onSelect={() => update({ terms: o.id })}
            onTap={() => choose({ terms: o.id }, { advance: true })}
          />
        ))}
      </div>
      <ErrorText id={errorId} error={errors.terms} />
    </>
  );
}
