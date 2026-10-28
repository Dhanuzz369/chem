import { strings } from "@/lib/leads/strings";
import { TextField, type StepProps } from "./shared";

/** Step 7: optional notes, then Send. */
export function NotesStep({ answers, fieldId, update, busy }: StepProps) {
  return (
    <TextField
      id={fieldId("notes")}
      name="notes"
      label={strings.ui.fields.notes}
      hint={strings.ui.fields.notesHint}
      value={answers.notes}
      onChange={(notes) => update({ notes })}
      optional
      multiline
      disabled={busy}
      maxLength={2000}
    />
  );
}
