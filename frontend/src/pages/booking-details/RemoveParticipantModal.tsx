import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  REMOVE_PARTICIPANT_MUTATION,
  type RemoveParticipantData,
  type RemoveParticipantVars,
} from '../../graphql/mutations/bookings';
import { BOOKING_DETAILS_QUERY } from '../../graphql/queries/bookings';
import type { Booking, Employee } from '../../types';
import { formatDateTime } from '../../utils/date';
import { getGraphQLErrorMessage } from '../../utils/errors';

const CHANGE_WINDOW_MINUTES = 30;

type RemoveParticipantModalProps = {
  open: boolean;
  booking: Booking | null;
  participant: { employeeId: number; employee?: Employee } | null;
  /** True when the signed-in user is removing themselves from the meeting. */
  isSelf: boolean;
  onClose: () => void;
};

const personName = (
  employeeId: number,
  employee?: Pick<Employee, 'firstName' | 'lastName'>,
) =>
  employee
    ? `${employee.firstName} ${employee.lastName}`.trim()
    : `Employee #${employeeId}`;

/**
 * Removing someone is destructive and takes them out of a meeting they may be
 * travelling to, so it is confirmed. Like the cancel modal (§9.6) the control is
 * never disabled on client-side time maths — the 30-minute rule is explained
 * here and the server's own rejection is shown verbatim where the user acted.
 */
export const RemoveParticipantModal = ({
  open,
  booking,
  participant,
  isSelf,
  onClose,
}: RemoveParticipantModalProps) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const [removeParticipant, { loading }] = useMutation<
    RemoveParticipantData,
    RemoveParticipantVars
  >(REMOVE_PARTICIPANT_MUTATION);

  if (!open || !booking || !participant) return null;

  const name = personName(participant.employeeId, participant.employee);

  const handleRemove = async () => {
    setError(null);
    try {
      await removeParticipant({
        variables: {
          input: { bookingId: booking.id, employeeId: participant.employeeId },
        },
        // `participants` is a field resolver, so the list has to come back from
        // the server — a cache write cannot remove a row from it.
        refetchQueries: [
          { query: BOOKING_DETAILS_QUERY, variables: { id: booking.id } },
        ],
        awaitRefetchQueries: true,
      });
      onClose();
    } catch (err) {
      setError(getGraphQLErrorMessage(err));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isSelf ? 'Leave this meeting' : 'Remove participant'}
    >
      <p className="text-[15px] text-body">
        {isSelf ? (
          <>
            Leave <span className="font-semibold">{booking.title}</span>?
          </>
        ) : (
          <>
            Remove <span className="font-semibold">{name}</span> from{' '}
            <span className="font-semibold">{booking.title}</span>?
          </>
        )}
      </p>
      <p className="mt-2 text-sm text-muted">
        {formatDateTime(booking.startTime)}
        {booking.room ? ` · ${booking.room.name}` : ''}
      </p>

      <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
        <li>
          The organiser of this booking — or an admin — can remove anyone. You
          can always remove yourself.
        </li>
        <li>
          People can only be added or removed until {CHANGE_WINDOW_MINUTES}{' '}
          minutes before the booking starts.
        </li>
        {booking.recurrenceId && (
          <li>
            This is one occurrence of a recurring series. Removing them here
            affects this booking only — they stay on the other occurrences.
          </li>
        )}
      </ul>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Keep {isSelf ? 'me' : 'them'}
        </Button>
        <Button
          variant="danger"
          loading={loading}
          onClick={() => void handleRemove()}
        >
          {isSelf ? 'Leave meeting' : 'Remove participant'}
        </Button>
      </div>
    </Modal>
  );
};
