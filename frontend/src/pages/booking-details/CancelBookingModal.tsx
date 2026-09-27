import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import {
  CANCEL_BOOKING_MUTATION,
  type CancelBookingData,
  type CancelBookingVars,
} from '../../graphql/mutations/bookings';
import { MY_MEETINGS_QUERY } from '../../graphql/queries/bookings';
import type { Booking } from '../../types';
import { formatDateTime, formatTime } from '../../utils/date';
import { getGraphQLErrorMessage } from '../../utils/errors';

/**
 * Mirrors `BOOKING_CHANGE_WINDOW_MINUTES` in
 * `backend/src/modules/bookings/utils/booking-time-policy.ts`, which is the
 * single source of truth. The copy is advisory: the button is never disabled
 * on this, so the server's own message is what the user ultimately sees.
 */
const CANCEL_WINDOW_MINUTES = 30;

type CancelBookingModalProps = {
  open: boolean;
  booking: Booking | null;
  onClose: () => void;
};

export const CancelBookingModal = ({ open, booking, onClose }: CancelBookingModalProps) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const [cancelBooking, { loading }] = useMutation<
    CancelBookingData,
    CancelBookingVars
  >(CANCEL_BOOKING_MUTATION);

  if (!open || !booking) return null;

  const handleCancel = async () => {
    setError(null);
    try {
      const result = await cancelBooking({
        variables: { id: booking.id },
        // The cache update alone is enough for `myBookings` and for this
        // details page, but `myMeetings` is CONFIRMED-only, so the cancelled
        // booking has to actually leave that list.
        refetchQueries: [{ query: MY_MEETINGS_QUERY }],
      });
      if (!result.data?.cancelBooking) {
        throw new Error('The booking was not returned by the server.');
      }
      onClose();
    } catch (err) {
      setError(getGraphQLErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Cancel Booking">
      <p className="text-[15px] text-body">
        Cancel <span className="font-semibold">{booking.title}</span>?
      </p>
      <p className="mt-2 text-sm text-muted">
        {formatDateTime(booking.startTime)} – {formatTime(booking.endTime)}
        {booking.room ? ` · ${booking.room.name}` : ''}
      </p>

      <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
        <li>
          Only the organiser of this booking — or an admin — can cancel it.
        </li>
        <li>
          Cancellations close {CANCEL_WINDOW_MINUTES} minutes before the booking
          starts.
        </li>
        {booking.recurrenceId && (
          <li>
            This is one occurrence of a recurring series. The other bookings in
            the series are not affected.
          </li>
        )}
        <li>
          If someone is waiting for this slot on the waitlist, it is offered to
          them automatically.
        </li>
      </ul>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Keep booking
        </Button>
        <Button variant="danger" loading={loading} onClick={() => void handleCancel()}>
          Cancel Booking
        </Button>
      </div>
    </Modal>
  );
};
