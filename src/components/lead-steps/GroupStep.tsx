import { products } from "@/content/products";
import { groupOptions } from "@/lib/leads/options";
import type { Answers } from "@/lib/leads/steps";
import { strings } from "@/lib/leads/strings";
import { ChoiceCard } from "./ChoiceCard";
import { GroupIllustration } from "./GroupIllustration";
import { ErrorText, Reveal, TextField, type StepProps } from "./shared";

/** A few product names under each type, from the catalogue itself. */
const samples = Object.fromEntries(
  groupOptions.map((g) => [g.id, strings.ui.groupSample(products.filter((p) => p.group === g.id).slice(0, 2).map((p) => p.name))]),
);

/** Step 2: four product types and "Something else", which opens a text box and skips step 3. */
export function GroupStep({ answers, errors, fieldId, headingId, update, choose }: StepProps) {
  const errorId = `${fieldId("group")}-error`;
  // Changing the type drops a product picked under the old one.
  const pick = (group: Answers["group"]): Partial<Answers> =>
    group === answers.group ? { group } : { group, product: "" };
  return (
    <>
      <div
        id={fieldId("group")}
        role="radiogroup"
        aria-labelledby={headingId}
        aria-describedby={errors.group ? errorId : undefined}
        aria-invalid={errors.group ? true : undefined}
        className="grid grid-cols-2 gap-3 @2xl:grid-cols-4"
      >
        {groupOptions.map((g) => (
          <ChoiceCard
            key={g.id}
            name="group"
            value={g.label}
            label={g.label}
            hint={samples[g.id]}
            art={<GroupIllustration group={g.id} />}
            checked={answers.group === g.id}
            required
            onSelect={() => update(pick(g.id))}
            onTap={() => choose(pick(g.id), { advance: true })}
          />
        ))}
        <ChoiceCard
          name="group"
          // The sheet keeps group empty for "Something else"; the chemical goes in otherProduct.
          value=""
          label={strings.groupOther}
          hint={strings.ui.otherHint}
          art={<GroupIllustration group="other" />}
          layout="row"
          className="col-span-2 @2xl:col-span-4"
          checked={answers.group === "other"}
          onSelect={() => update(pick("other"))}
          onTap={() => choose(pick("other"), { focus: "otherProduct" })}
        />
      </div>
      <ErrorText id={errorId} error={errors.group} />
      <Reveal open={answers.group === "other"}>
        <TextField
          id={fieldId("otherProduct")}
          name="otherProduct"
          label={strings.ui.fields.otherProduct}
          placeholder={strings.ui.fields.otherProductPlaceholder}
          value={answers.otherProduct}
          onChange={(otherProduct) => update({ otherProduct })}
          error={errors.otherProduct}
          autoComplete="off"
          maxLength={200}
        />
      </Reveal>
    </>
  );
}
