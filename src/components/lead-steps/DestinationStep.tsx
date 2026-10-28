import { useMemo } from "react";
import { countryNames } from "@/lib/leads/countries";
import { strings } from "@/lib/leads/strings";
import { TextField, type StepProps } from "./shared";

/**
 * Step 5: country with type-ahead, plus an optional port or city. Any text is accepted.
 * The suggestions are built in the browser after hydration: Intl region names differ between
 * the server's ICU data and the browser's, and the server HTML must match the first client render.
 */
export function DestinationStep({ answers, errors, fieldId, update, hydrated }: StepProps) {
  const listId = `${fieldId("country")}-list`;
  const countries = useMemo(() => (hydrated ? countryNames("en") : []), [hydrated]);
  return (
    <div className="grid gap-5 @xl:grid-cols-2 @xl:gap-x-6">
      <TextField
        id={fieldId("country")}
        name="country"
        label={strings.ui.fields.country}
        value={answers.country}
        onChange={(country) => update({ country })}
        error={errors.country}
        required
        autoComplete="country-name"
        list={listId}
        maxLength={80}
      />
      <datalist id={listId}>
        {countries.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <TextField
        id={fieldId("port")}
        name="port"
        label={strings.ui.fields.port}
        value={answers.port}
        onChange={(port) => update({ port })}
        optional
        autoComplete="off"
        maxLength={100}
      />
    </div>
  );
}
