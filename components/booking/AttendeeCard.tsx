"use client";

import { memo, useCallback, useState } from "react";
import type { SavedStudent } from "@/lib/types";
import {
  applySavedStudent,
  CHENNAI_SCHOOLS,
  GRADE_OPTIONS,
  OTHER_SCHOOL_VALUE,
  type Attendee,
  type Relationship,
} from "@/lib/booking";
import { TextField } from "@/components/ui/Field";
import { Select, SelectField } from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";

/**
 * flow.pdf "The second event": "sees Ananya and Karthik saved, and registers
 * them in a few clicks." Picking a name here pre-fills this attendee card's
 * fields — it's an action trigger, not a persistent selection, so it always
 * resets back to the placeholder after firing.
 */
function SavedStudentPicker({
  savedStudents,
  onPick,
}: {
  savedStudents: SavedStudent[];
  onPick: (student: SavedStudent) => void;
}) {
  return (
    <div className="mb-4">
      <Select
        value=""
        placeholder="Fill from a saved student…"
        aria-label="Fill this attendee from a saved student"
        onChange={(event) => {
          const student = savedStudents.find((s) => s.student_display_id === event.target.value);
          if (student) onPick(student);
        }}
      >
        <option value="">Fill from a saved student…</option>
        {savedStudents.map((student) => (
          <option key={student.student_display_id} value={student.student_display_id}>
            {student.name}
            {student.school ? ` — ${student.school}` : ""}
          </option>
        ))}
      </Select>
    </div>
  );
}

/** Fixed grade dropdown — Pre-School through 12. Falls back to including
 * whatever value is already set (e.g. loaded from a saved student in some
 * other shape) as an extra option, so switching to this dropdown never
 * silently blanks out existing data. */
function GradeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const options = GRADE_OPTIONS.includes(value) || !value ? GRADE_OPTIONS : [value, ...GRADE_OPTIONS];
  return (
    <SelectField label="Grade" required value={value} onChange={(event) => onChange(event.target.value)} placeholder="Select grade">
      <option value="">Select grade</option>
      {options.map((grade) => (
        <option key={grade} value={grade}>
          {grade}
        </option>
      ))}
    </SelectField>
  );
}

/**
 * School dropdown of common Chennai schools, with a manual fallback: picking
 * "Other" (or already having a value that isn't on the list — a saved
 * student's school, say) swaps in a free-text field, so a school that isn't
 * listed — or its full address, per the field's own hint — can still be
 * entered instead of forcing a pick from the list.
 */
function SchoolField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const isPreset = CHENNAI_SCHOOLS.includes(value);
  const [manual, setManual] = useState(value !== "" && !isPreset);

  if (manual) {
    return (
      <div className="flex flex-col gap-1.5">
        <TextField
          label="School"
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="School name"
        />
        <button
          type="button"
          onClick={() => {
            setManual(false);
            onChange("");
          }}
          className="focus-ring self-start rounded-md text-xs font-semibold text-secondary transition-colors hover:text-primary"
        >
          Choose from the list instead
        </button>
      </div>
    );
  }

  return (
    <SelectField
      label="School"
      required
      value={isPreset ? value : ""}
      placeholder="Select school"
      searchable
      searchPlaceholder="Type to filter schools…"
      onChange={(event) => {
        if (event.target.value === OTHER_SCHOOL_VALUE) {
          setManual(true);
          onChange("");
        } else {
          onChange(event.target.value);
        }
      }}
    >
      <option value="">Select school</option>
      {CHENNAI_SCHOOLS.map((school) => (
        <option key={school} value={school}>
          {school}
        </option>
      ))}
      <option value={OTHER_SCHOOL_VALUE}>Other — enter manually</option>
    </SelectField>
  );
}

function AttendeeCard({
  attendee,
  itemLabel,
  relationship,
  savedStudents,
  lineId,
  index,
  canRemove,
  updateAttendee,
  removeAttendeeFromLine,
}: {
  attendee: Attendee;
  /** e.g. "Team Member 1", "Attendee 2", "Student 1". */
  itemLabel: string;
  relationship: Relationship;
  savedStudents: SavedStudent[];
  lineId: string;
  index: number;
  /** The last remaining slot on a line can't be removed (removing it removes
   * the whole line instead, from the cart UI that owns this list) — hides
   * the Remove action when `false`. */
  canRemove: boolean;
  updateAttendee: (lineId: string, index: number, attendee: Attendee) => void;
  removeAttendeeFromLine: (lineId: string, index: number) => void;
}) {
  const isStudent = relationship === "student";

  const onChange = useCallback(
    (next: Attendee) => updateAttendee(lineId, index, next),
    [updateAttendee, lineId, index],
  );
  const onRemove = canRemove ? () => removeAttendeeFromLine(lineId, index) : undefined;
  const onFillFromSaved = useCallback(
    (student: SavedStudent) => updateAttendee(lineId, index, applySavedStudent(attendee, student)),
    [updateAttendee, lineId, index, attendee],
  );

  return (
    <div className="animate-pop-in rounded-2xl border border-primary/10 bg-white/60 p-5 transition-colors duration-[var(--dur-med)] focus-within:border-primary/25 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-secondary">{itemLabel}</p>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${itemLabel}`}
            className="focus-ring press group inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-muted transition-colors duration-[var(--dur-fast)] hover:bg-red-50 hover:text-red-600"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            Remove
          </button>
        )}
      </div>

      {savedStudents.length > 0 && <SavedStudentPicker savedStudents={savedStudents} onPick={onFillFromSaved} />}

      {isStudent ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField
            label="Full name"
            required
            value={attendee.name}
            onChange={(event) => onChange({ ...attendee, name: event.target.value })}
          />
          <GradeField value={attendee.grade} onChange={(grade) => onChange({ ...attendee, grade })} />
          <DatePicker
            label="Date of birth"
            required
            value={attendee.dob}
            onChange={(event) => onChange({ ...attendee, dob: event.target.value })}
          />
          <TextField
            label="Email"
            required
            type="email"
            value={attendee.email}
            onChange={(event) => onChange({ ...attendee, email: event.target.value })}
          />
          <TextField
            label="Phone"
            required
            type="tel"
            value={attendee.phone}
            onChange={(event) => onChange({ ...attendee, phone: event.target.value })}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField
            label="Full name"
            required
            value={attendee.name}
            onChange={(event) => onChange({ ...attendee, name: event.target.value })}
          />
          <GradeField value={attendee.grade} onChange={(grade) => onChange({ ...attendee, grade })} />
          <DatePicker
            label="Date of birth"
            required
            value={attendee.dob}
            onChange={(event) => onChange({ ...attendee, dob: event.target.value })}
          />
        </div>
      )}

      {/* School gets its own row below whichever set of fields above — a long school name no
          longer competes for grid width against Full name/Grade/DOB the way it did when every
          field sat in one row together. There's no separate district field anymore: the school
          itself (either picked from the list or typed manually) is the one place that
          information lives now, instead of asking for it twice. */}
      <div className="mt-4">
        <SchoolField value={attendee.school} onChange={(school) => onChange({ ...attendee, school })} />
      </div>
    </div>
  );
}

export default memo(AttendeeCard);
