import type { SavedStudent } from "@/lib/types";
import type { Attendee, Relationship } from "@/lib/booking";
import { TextField } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
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

/**
 * One attendee's editable fields — a student's, or a parent/institute's
 * charge's, depending on `relationship`. Shared by every attendee slot on
 * the checkout page, across every cart line: a "Rover Bot Workshop" team
 * member and a "UX Design Trend Party" individual attendee use the exact
 * same card, just with a different `itemLabel` and `onRemove` wiring from
 * the cart line that owns them.
 */
export default function AttendeeCard({
  attendee,
  itemLabel,
  relationship,
  savedStudents,
  onChange,
  onRemove,
  onFillFromSaved,
}: {
  attendee: Attendee;
  /** e.g. "Team Member 1", "Attendee 2", "Student 1". */
  itemLabel: string;
  relationship: Relationship;
  savedStudents: SavedStudent[];
  onChange: (next: Attendee) => void;
  /** Omit to hide the Remove action — the last remaining slot on a line
   * can't be removed (removing it removes the whole line instead, from
   * the cart UI that owns this list). */
  onRemove?: () => void;
  onFillFromSaved: (student: SavedStudent) => void;
}) {
  const isStudent = relationship === "student";

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
          <TextField
            label="Grade"
            required
            value={attendee.grade}
            onChange={(event) => onChange({ ...attendee, grade: event.target.value })}
            placeholder="e.g. 8th"
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
          <TextField
            label="School"
            required
            value={attendee.school}
            onChange={(event) => onChange({ ...attendee, school: event.target.value })}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TextField
            label="Full name"
            required
            value={attendee.name}
            onChange={(event) => onChange({ ...attendee, name: event.target.value })}
          />
          <TextField
            label="Grade"
            required
            value={attendee.grade}
            onChange={(event) => onChange({ ...attendee, grade: event.target.value })}
            placeholder="e.g. 8th"
          />
          <DatePicker
            label="Date of birth"
            required
            value={attendee.dob}
            onChange={(event) => onChange({ ...attendee, dob: event.target.value })}
          />
          <TextField
            label="School"
            required
            value={attendee.school}
            onChange={(event) => onChange({ ...attendee, school: event.target.value })}
          />
        </div>
      )}
    </div>
  );
}
