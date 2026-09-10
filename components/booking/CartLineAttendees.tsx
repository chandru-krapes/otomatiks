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

function LinkIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 12h6M10 6H7a4 4 0 0 0 0 8h3m4-8h3a4 4 0 0 1 0 8h-3" />
    </svg>
  );
}

/**
 * The locked stand-in for a line's first attendee once it's linked to another line (see
 * `CartLine.linkedFromLineId` and `useCart().linkAttendee`) — grayed out and uneditable, since
 * editing it here would silently drift from the source it's supposed to mirror. Editing the
 * *source* ticket's attendee 1 still updates this one automatically (CartProvider.updateAttendee).
 */
function LinkedAttendeeSummary({
  itemLabel,
  attendee,
  sourceTicketName,
  sourceDisplayIndex,
  onUnlink,
}: {
  itemLabel: string;
  attendee: { name: string; school?: string };
  sourceTicketName: string;
  sourceDisplayIndex: number;
  onUnlink: () => void;
}) {
  return (
    <div className="animate-pop-in rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-5 opacity-80 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-secondary">{itemLabel}</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-1 text-[11px] font-semibold text-primary">
          <LinkIcon className="h-3 w-3" />
          Linked
        </span>
      </div>
      <p className="text-sm text-foreground">
        Same as <strong className="text-primary">{attendee.name || "this attendee"}</strong> from{" "}
        <strong className="text-primary">
          Ticket {sourceDisplayIndex + 1} &middot; {sourceTicketName}
        </strong>
        . Edit it there to update both.
      </p>
      {attendee.school && <p className="mt-1 text-xs text-muted">{attendee.school}</p>}
      <button
        type="button"
        onClick={onUnlink}
        className="focus-ring press mt-3 rounded-md text-xs font-semibold text-secondary transition-colors hover:text-primary"
      >
        Unlink and edit separately
      </button>
    </div>
  );
}

export default function CartLineAttendees({
  line,
  lines,
  index: lineIndex,
  total,
  relationship,
  savedStudents,
}: {
  line: CartLine;
  /** Every line in the cart, in checkout order — needed to offer *any* earlier ticket's attendee
   * as a "same as" suggestion (not just the immediately preceding one) and to resolve a linked
   * line's source ticket name/position for display. */
  lines: CartLine[];
  index: number;
  total: number;
  relationship: Relationship;
  savedStudents: SavedStudent[];
}) {
  const { updateAttendee, addAttendeeToLine, removeAttendeeFromLine, removeLine, linkAttendee, unlinkAttendee } = useCart();
  const isTeam = line.ticket.kind === "team";
  const isStudent = relationship === "student";
  const maxTeamSize = line.ticket.max_team_size ?? 3;
  const canAdd = isTeam ? line.attendees.length < maxTeamSize : true;

  const isLinked = Boolean(line.linkedFromLineId);
  const sourceIndex = isLinked ? lines.findIndex((candidate) => candidate.id === line.linkedFromLineId) : -1;
  const sourceLine = sourceIndex !== -1 ? lines[sourceIndex] : null;

  // Every earlier ticket whose own first attendee is already filled in and isn't itself a link —
  // linking always resolves to an independently-typed original, never chains through another
  // link, so unwinding one line never has to walk more than one hop.
  const candidates =
    !isLinked && !line.attendees[0]?.name
      ? lines
          .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
          .filter(
            ({ candidate, candidateIndex }) =>
              candidateIndex < lineIndex && Boolean(candidate.attendees[0]?.name) && !candidate.linkedFromLineId,
          )
      : [];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-secondary">
            Ticket {lineIndex + 1} of {total}
          </p>
          <h3 className="mt-1 font-display text-lg font-bold text-primary">
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

      {candidates.length > 0 && (
        <div className="animate-pop-in flex flex-col gap-2 rounded-xl border border-secondary/20 bg-secondary/5 p-3">
          <p className="px-1 text-xs font-semibold text-muted">Fill from an earlier ticket?</p>
          {candidates.map(({ candidate, candidateIndex }) => (
            <div
              key={candidate.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2"
            >
              <p className="text-sm text-foreground/80">
                Same as <strong className="text-primary">{candidate.attendees[0].name}</strong> from Ticket{" "}
                {candidateIndex + 1} &middot; {candidate.ticket.name}?
              </p>
              <Button type="button" variant="secondary" size="sm" onClick={() => linkAttendee(line.id, candidate.id)}>
                Use these details
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {line.attendees.map((attendee, index) => {
          if (index === 0 && isLinked && sourceLine) {
            return (
              <LinkedAttendeeSummary
                key="linked-0"
                itemLabel={isTeam ? "Team Member 1" : isStudent ? "Student" : "Attendee 1"}
                attendee={attendee}
                sourceTicketName={sourceLine.ticket.name}
                sourceDisplayIndex={sourceIndex}
                onUnlink={() => unlinkAttendee(line.id)}
              />
            );
          }
          return (
            <AttendeeCard
              key={index}
              attendee={attendee}
              itemLabel={isTeam ? `Team Member ${index + 1}` : `${isStudent ? "Student" : "Attendee"} ${index + 1}`}
              relationship={relationship}
              savedStudents={savedStudents}
              lineId={line.id}
              index={index}
              canRemove={line.attendees.length > 1}
              updateAttendee={updateAttendee}
              removeAttendeeFromLine={removeAttendeeFromLine}
            />
          );
        })}
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
