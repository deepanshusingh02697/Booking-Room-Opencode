import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { LuListOrdered } from 'react-icons/lu';
import { Button } from '../../components/common/Button';
import {
  JOIN_WAITLIST_MUTATION,
  type JoinWaitlistData,
  type JoinWaitlistVars,
} from '../../graphql/mutations/waitlist';
import {
  MY_WAITLIST_QUERY,
  type MyWaitlistData,
} from '../../graphql/queries/waitlist';
import type { Room } from '../../types';
import { localInputToGraphQLDate } from '../../utils/date';
import { getGraphQLErrorMessage } from '../../utils/errors';
import { ownWaitlistEntryForWindow } from '../../utils/waitlist';

type JoinWaitlistControlProps = {
  room: Room;
  /** The form's own window, as datetime-local values. */
  startTime: string;
  endTime: string;
  /**
   * Whether to offer the wait-list at all. The page decides: either the
   * availability query says this room is not free for the window, or the
   * booking engine has already refused the submit with CONFLICT.
   */
  offered: boolean;
};

/**
 * The wait-list's only entry point (FR-33): queue for the room and window the
 * form currently holds. Joining needs no confirmation — it grants nothing, and
 * the entry is reversible from the Wait-List page and from Room Details — so it
 * is a single control next to the refusal it answers.
 *
 * The copy never states *why* the slot cannot be booked. The availability query
 * answers a time question only, so the client cannot tell "already booked" from
 * "under maintenance" (§8.26) — and that distinction is the server's answer to
 * give, so the message it returns is shown verbatim (§9.6).
 */
export const JoinWaitlistControl = ({
  room,
  startTime,
  endTime,
  offered,
}: JoinWaitlistControlProps) => {
  const [error, setError] = useState<string | null>(null);
  const { data } = useQuery<MyWaitlistData>(MY_WAITLIST_QUERY, { skip: !offered });
  const [joinWaitlist, { loading }] = useMutation<
    JoinWaitlistData,
    JoinWaitlistVars
  >(JOIN_WAITLIST_MUTATION);

  // A refusal belongs to the window it was given for; moving the form's times
  // or switching rooms must not carry it over.
  useEffect(() => {
    setError(null);
  }, [room.id, startTime, endTime, offered]);

  if (!offered) return null;

  // The server refuses a second overlapping entry for the same room, so the
  // button is replaced by the entry the user already holds rather than inviting
  // them to queue twice.
  const own = ownWaitlistEntryForWindow(
    data?.myWaitlist ?? [],
    room.id,
    startTime,
    endTime,
  );

  const join = async () => {
    setError(null);
    try {
      await joinWaitlist({
        variables: {
          input: {
            roomId: room.id,
            startTime: localInputToGraphQLDate(startTime),
            endTime: localInputToGraphQLDate(endTime),
          },
        },
        // The mutation returns the new entry, but writing it to the cache does
        // not append it to the `myWaitlist` list, so the list is re-read.
        refetchQueries: [{ query: MY_WAITLIST_QUERY }],
      });
    } catch (err) {
      setError(getGraphQLErrorMessage(err));
    }
  };

  if (own) {
    return (
      <p role="status" className="mt-6 text-sm text-muted">
        You are on the wait-list for this slot in {room.name}.{' '}
        <Link to="/wait-list" className="text-navy underline hover:text-brand">
          View your wait-list
        </Link>
      </p>
    );
  }

  return (
    <div className="mt-6 border-t border-rule pt-6">
      <p className="text-sm text-muted">
        Want {room.name} at this time? Join the wait-list and the booking is made
        for you automatically as soon as the room is released. The booking uses
        the released slot's exact times, so it can be shorter than the window you
        queue for.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <Button
          variant="outline"
          icon={<LuListOrdered aria-hidden />}
          loading={loading}
          onClick={() => void join()}
        >
          Join Wait-List
        </Button>
        <Link to="/wait-list" className="text-sm text-navy underline hover:text-brand">
          View your wait-list
        </Link>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
