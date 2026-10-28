import { strings } from "@/lib/leads/strings";
import { TextField, type StepProps } from "./shared";

const f = strings.ui.fields;

/** Step 1: the lead. Name, plus an email or a WhatsApp/phone number. */
export function ContactStep({ answers, errors, fieldId, update }: StepProps) {
  return (
    <div className="grid gap-5 @xl:grid-cols-2 @xl:gap-x-6">
      <TextField
        id={fieldId("name")}
        name="name"
        label={f.name}
        value={answers.name}
        onChange={(name) => update({ name })}
        error={errors.name}
        required
        autoComplete="name"
        maxLength={100}
      />
      <TextField
        id={fieldId("company")}
        name="company"
        label={f.company}
        value={answers.company}
        onChange={(company) => update({ company })}
        optional
        autoComplete="organization"
        maxLength={150}
      />
      <TextField
        id={fieldId("email")}
        name="email"
        label={f.email}
        value={answers.email}
        onChange={(email) => update({ email })}
        error={errors.email}
        hint={f.emailHint}
        type="email"
        inputMode="email"
        autoComplete="email"
        maxLength={200}
      />
      <TextField
        id={fieldId("phone")}
        name="phone"
        label={f.phone}
        value={answers.phone}
        onChange={(phone) => update({ phone })}
        error={errors.phone}
        hint={f.phoneHint}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={40}
      />
    </div>
  );
}
