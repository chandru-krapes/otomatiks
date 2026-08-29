"use client";

import type { SavedStudent } from "@/lib/types";
import type { Relationship } from "@/lib/booking";
import type { CartLine } from "@/lib/cart";
import { useCart } from "./CartProvider";
import AttendeeCard from "./AttendeeCard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

function PlusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" />
    </svg>
  );
}

/**
 * One cart line's worth of attendee cards — the checkout screen renders one
 * of these per selected ticket type (see CheckoutForm), each independently
 * capped at its own ticket's `max_team_size` for a team-kind ticket, or
 * uncapped for an individual one. Removing a line's last attendee removes
 * the whole line (an empty cart line isn't meaningful) — that's enforced in
 * CartProvider.removeAttendeeFromLine, not here.
 */
export default function CartLineAttendees({
  line,
  step,
  relationship,
  savedStudents,
  onFillFromSaved,
}: {
  line: CartLine;
  /** Displayed step number — checkout numbers "Purchaser details" as step 1,
   * then one step per cart line after that. */
  step: number;
  relationship: Relationship;
  savedStudents: SavedStudent[];
  onFillFromSaved: (lineId: string, attendeeIndex: number, student: SavedStudent) => void;
}) {
  const { updateAttendee, addAttendeeToLine, removeAttendeeFromLine, removeLine } = useCart();
  const isTeam = line.ticket.kind === "team";
  const isStudent = relationship === "student";
  const maxTeamSize = line.ticket.max_team_size ?? 3;
  const canAdd = isTeam ? line.attendees.length < maxTeamSize : true;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">
            {step}
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-primary">
              {line.ticket.name}
              {isTeam && <span className="ml-2 font-sans text-sm font-semibold text-muted">(Team)</span>}
            </h3>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">
              {isTeam
                ? `Add up to ${maxTeamSize} members to this team.`
                : isStudent
                  ? "One entry per ticket — each ticket is booked for a student."
                  : "One entry per ticket — who's actually attending."}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {isTeam && (
            <Badge tone={canAdd ? "neutral" : "warning"} className="shrink-0">
              {line.attendees.length} / {maxTeamSize} members
            </Badge>
          )}
          <button
            type="button"
            onClick={() => removeLine(line.id)}
            aria-label={`Remove ${line.ticket.name} from your booking`}
            className="focus-ring press group inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-muted transition-colors duration-[var(--dur-fast)] hover:bg-red-50 hover:text-red-600"
          >
            <TrashIcon />
            Remove
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {line.attendees.map((attendee, index) => (
          <AttendeeCard
            key={index}
            attendee={attendee}
            itemLabel={isTeam ? `Team Member ${index + 1}` : `${isStudent ? "Student" : "Attendee"} ${index + 1}`}
            relationship={relationship}
            savedStudents={savedStudents}
            onChange={(next) => updateAttendee(line.id, index, next)}
            onRemove={line.attendees.length > 1 ? () => removeAttendeeFromLine(line.id, index) : undefined}
            onFillFromSaved={(student) => onFillFromSaved(line.id, index, student)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {isTeam && !canAdd && (
          <p className="text-xs font-semibold text-muted" role="status">
            Maximum {maxTeamSize} members
          </p>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={() => addAttendeeToLine(line.id)}
          disabled={!canAdd}
          className="whitespace-nowrap"
          icon={<PlusIcon className="h-4 w-4 shrink-0 transition-transform duration-[var(--dur-fast)] group-hover:rotate-90" />}
        >
          {isTeam ? "Add Teammate" : "Add Attendee"}
        </Button>
      </div>
    </section>
  );
}
