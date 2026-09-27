import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  ADD_PARTICIPANTS_MUTATION,
  type AddParticipantsData,
  type AddParticipantsVars,
} from '../../graphql/mutations/bookings';
import { BOOKING_DETAILS_QUERY } from '../../graphql/queries/bookings';
import type { Booking } from '../../types';
import { getGraphQLErrorMessage } from '../../utils/errors';
import { ParticipantPicker } from '../create-booking/ParticipantPicker';

/**
 * Mirrors `BOOKING_CHANGE_WINDOW_MINUTES` in
 * `backend/src/modules/bookings/utils/booking-time-policy.ts`, which is the
 * single source of truth. The copy is advisory: the control is never disabled
 * on this, so the server's own message is what the user ultimately sees — the
 * same decision §9.6 took for the Cancel button.
 */
const CHANGE_WINDOW_MINUTES = 30;

type AddParticipantsModalProps = {
  open: boolean;
  booking: Booking | null;
  /** Employees already on the booking, hidden from the picker. */
  existingEmployeeIds: number[];
  onClose: () => void;
};

/**
 * Adds people to one occurrence, reusing the Create Booking `ParticipantPicker`
 * so the directory search, the chip layout and the seat counter behave
 * identically in both places. The whole selection goes in as one batch, because
 * the server takes a batch and writes it in a single transaction.
 */
export const AddParticipantsModal = ({
  open,
  booking,
  existingEmployeeIds,
  onClose,
}: AddParticipantsModalProps) => {
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelected([]);
      setError(null);
    }
  }, [open]);

  const [addParticipants, { loading }] = useMutation<
    AddParticipantsData,
    AddParticipantsVars
  >(ADD_PARTICIPANTS_MUTATION);

  const capacity = booking?.room?.capacity ?? null;
  const remainingSeats = useMemo(
    () =>
      capacity === null || !booking
        ? null
        : capacity - (booking.participants?.length ?? 0) - 1,
    [capacity, booking],
  );

  if (!open || !booking) return null;

  const handleAdd = async () => {
    if (selected.length === 0) return;
    setError(null);
    try {
      await addParticipants({
        variables: { input: { bookingId: booking.id, employeeIds: selected } },
        // `participants` is a field resolver, so the cache write only covers the
        // scalars. The list itself has to come back from the server.
        refetchQueries: [{ query: BOOKING_DETAILS_QUERY, variables: { id: booking.id } }],
        awaitRefetchQueries: true,
      });
      onClose();
    } catch (err) {
      setError(getGraphQLErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add People" size="wide">
      <p className="text-[15px] text-body">
        Add people to <span className="font-semibold">{booking.title}</span>.
      </p>
      <ul className="mt-3 flex flex-col gap-2 text-sm text-muted">
        <li>
          Only the organiser of this booking — or an admin — can add people.
        </li>
        <li>
          People can only be added or removed until {CHANGE_WINDOW_MINUTES}{' '}
          minutes before the booking starts.
        </li>
        {booking.recurrenceId && (
          <li>
            This is one occurrence of a recurring series. People added here are
            invited to this booking only, not to the rest of the series.
          </li>
        )}
      </ul>

      <div className="mt-5 border-t border-rule pt-5">
        {capacity !== null && remainingSeats !== null && (
          <p className="mb-3 text-xs text-muted">
            {booking.room?.name} seats {capacity} —{' '}
            {remainingSeats <= 0
              ? 'this booking is already full'
              : `${remainingSeats} ${
                  remainingSeats === 1 ? 'seat is' : 'seats are'
                } left for new people`}
            .
          </p>
        )}
        <ParticipantPicker
          value={selected}
          onChange={setSelected}
          currentUserId={booking.organizerId}
          remainingSeats={remainingSeats}
          excludeIds={existingEmployeeIds}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          loading={loading}
          disabled={selected.length === 0}
          onClick={() => void handleAdd()}
        >
          {selected.length > 0
            ? `Add ${selected.length} to booking`
            : 'Add to booking'}
        </Button>
      </div>
    </Modal>
  );
};
