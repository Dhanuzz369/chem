import { strings } from "@/lib/leads/strings";
import { TextField, type StepProps } from "./shared";

/** Step 7: optional notes, then Send. */
export function NotesStep({ answers, fieldId, update }: StepProps) {
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
      maxLength={2000}
    />
  );
}
