import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import {
  LEAVE_WAITLIST_MUTATION,
  type LeaveWaitlistData,
  type LeaveWaitlistVars,
} from '../../graphql/mutations/waitlist';
import { MY_WAITLIST_QUERY } from '../../graphql/queries/waitlist';
import type { WaitlistEntry } from '../../types';
import { formatDateTime, formatTime } from '../../utils/date';
import { getGraphQLErrorMessage } from '../../utils/errors';

type LeaveWaitlistModalProps = {
  open: boolean;
  entry: WaitlistEntry | null;
  onClose: () => void;
  onLeft?: (entry: WaitlistEntry) => void;
};

/**
 * Leaving is the one wait-list action that destroys something the user cannot
 * get back on their own initiative — the released slot goes to whoever is next
 * — so it is confirmed here. Joining needs no confirmation: it is reversible
 * from this same page and from Room Details.
 */
export const LeaveWaitlistModal = ({
  open,
  entry,
  onClose,
  onLeft,
}: LeaveWaitlistModalProps) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const [leaveWaitlist, { loading }] = useMutation<
    LeaveWaitlistData,
    LeaveWaitlistVars
  >(LEAVE_WAITLIST_MUTATION);

  if (!open || !entry) return null;

  const handleLeave = async () => {
    setError(null);
    try {
      const result = await leaveWaitlist({
        variables: { entryId: entry.id },
        // `leaveWaitlist` returns a Boolean, so the cache holds nothing to
        // update and every mounted list has to be re-read.
        refetchQueries: [{ query: MY_WAITLIST_QUERY }],
      });
      if (!result.data?.leaveWaitlist) {
        throw new Error('The server did not confirm the removal.');
      }
      onLeft?.(entry);
      onClose();
    } catch (err) {
      setError(getGraphQLErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Leave this wait-list entry">
      <p className="text-[15px] text-body">
        Leave the wait-list for{' '}
        <span className="font-semibold">{entry.room?.name ?? `Room #${entry.roomId}`}</span>?
      </p>
      <p className="mt-2 text-sm text-muted">
        {formatDateTime(entry.startTime)} – {formatTime(entry.endTime)}
      </p>

      <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
        <li>
          If this slot is released after you leave, it is offered to the next
          person waiting instead.
        </li>
        <li>
          You can join again for the same slot while it is still in the future.
        </li>
        <li>Only your own wait-list entries can be removed this way.</li>
      </ul>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Keep waiting
        </Button>
        <Button variant="danger" loading={loading} onClick={() => void handleLeave()}>
          Leave wait-list
        </Button>
      </div>
    </Modal>
  );
};
