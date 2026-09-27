import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { LuCheck, LuUserPlus } from 'react-icons/lu';
import { AppCard } from '../../components/common/AppCard';
import { Button } from '../../components/common/Button';
import { DetailRow } from '../../components/common/DetailRow';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { ListRow } from '../../components/common/ListRow';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  CHECK_IN_MUTATION,
  type CheckInData,
  type CheckInVars,
} from '../../graphql/mutations/bookings';
import {
  BOOKING_DETAILS_QUERY,
  RECURRING_BOOKING_GROUP_QUERY,
  type BookingDetailsData,
  type BookingDetailsVars,
  type RecurringBookingGroupData,
  type RecurringBookingGroupVars,
} from '../../graphql/queries/bookings';
import { useAuth } from '../../hooks/useAuth';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
import {
  bookingStatusMeta,
  roomStatusMeta,
  typeScale,
} from '../../theme';
import {
  BookingStatus,
  UserRole,
  type Employee,
} from '../../types';
import { formatDateTime, formatTime } from '../../utils/date';
import { getGraphQLErrorCode, getGraphQLErrorMessage } from '../../utils/errors';
import { AddParticipantsModal } from './AddParticipantsModal';
import { CancelBookingModal } from './CancelBookingModal';
import { RecurringSeriesPanel } from './RecurringSeriesPanel';
import { RemoveParticipantModal } from './RemoveParticipantModal';

/** What the engine already did to a booking that is no longer CONFIRMED. */
const statusNote: Partial<Record<BookingStatus, string>> = {
  [BookingStatus.CANCELLED]:
    'This booking is cancelled, so the room is free for that slot.',
  [BookingStatus.COMPLETED]: 'This meeting is already finished.',
  [BookingStatus.NO_SHOW]:
    'Nobody checked in, so the room was released 10 minutes after the start.',
};

/** Employees are never hard-failed: a missing relation falls back to the id. */
const personName = (
  employeeId: number,
  employee?: Pick<Employee, 'firstName' | 'lastName'>,
) =>
  employee
    ? `${employee.firstName} ${employee.lastName}`.trim()
    : `Employee #${employeeId}`;

type RemovingParticipant = { employeeId: number; employee?: Employee } | null;

export const BookingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const bookingId = Number(id);
  const validId = Number.isInteger(bookingId) && bookingId > 0;

  const [cancelOpen, setCancelOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<RemovingParticipant>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkInJustHappened, setCheckInJustHappened] = useState(false);

  const { data, loading, error, refetch } = useQuery<
    BookingDetailsData,
    BookingDetailsVars
  >(BOOKING_DETAILS_QUERY, {
    variables: { id: bookingId },
    skip: !validId,
  });

  // The no-show release and the completion sweep run on a cron and emit no
  // socket event, so a booking can change status while the tab is in the
  // background. Refetching on focus is how this page notices.
  useRefetchOnFocus(() => {
    if (validId) void refetch();
  });

  const booking = data?.bookingDetails;
  const recurrenceId = booking?.recurrenceId;

  // One lean query for the whole series, skipped for a one-off booking. It is
  // selected field-resolver-free on purpose — see RECURRING_BOOKING_GROUP_QUERY.
  const series = useQuery<RecurringBookingGroupData, RecurringBookingGroupVars>(
    RECURRING_BOOKING_GROUP_QUERY,
    {
      variables: { recurrenceId: recurrenceId ?? '' },
      skip: !recurrenceId,
    },
  );

  const participants = booking?.participants ?? [];
  const forbidden = getGraphQLErrorCode(error) === 'FORBIDDEN';
  const isConfirmed = booking?.status === BookingStatus.CONFIRMED;

  // Only the organiser or an admin may add people (FR-28); a participant may
  // only remove themself (FR-29). The server is still the authority — this only
  // decides whose screen the control appears on.
  const isOrganiser =
    booking !== undefined &&
    (booking.organizerId === user?.id || user?.role === UserRole.ADMIN);
  const isSelfParticipant = (participant: { employeeId: number }) =>
    participant.employeeId === user?.id;

  // FR-38 is stricter than FR-28 and gets NO admin exemption: the server rejects
  // an admin who is neither the organiser nor a listed participant, so
  // `isOrganiser` must not be reused here — it would offer the button to an
  // admin who is guaranteed to be refused.
  const isBookingOrganiser = booking !== undefined && booking.organizerId === user?.id;
  const alreadyCheckedIn = Boolean(booking?.checkIn) || Boolean(booking?.hasCheckedIn);
  const canCheckIn =
    booking !== undefined &&
    isConfirmed &&
    !alreadyCheckedIn &&
    (isBookingOrganiser || participants.some(isSelfParticipant));

  const [checkIn, { loading: checkingIn }] = useMutation<CheckInData, CheckInVars>(
    CHECK_IN_MUTATION,
  );

  const handleCheckIn = async () => {
    if (!booking) return;
    setCheckInError(null);
    try {
      await checkIn({
        variables: { id: booking.id },
        // `hasCheckedIn` and `checkIn` are field resolvers, so Apollo's cache
        // write from the mutation response cannot populate them. The details
        // query has to come back from the server for the Check-in row to
        // change and the button to go away.
        refetchQueries: [
          { query: BOOKING_DETAILS_QUERY, variables: { id: booking.id } },
        ],
        awaitRefetchQueries: true,
      });
      setCheckInJustHappened(true);
    } catch (err) {
      // Shown verbatim, where the user acted. The window bounds are printed
      // next to the button but never used to hide it (§9.8), so both messages
      // FR-39 can produce have to be visible rather than pre-empted client-side.
      setCheckInError(getGraphQLErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title={booking?.title ?? 'Booking Details'}
        sub={
          booking
            ? `${formatDateTime(booking.startTime)} – ${formatTime(
                booking.endTime,
              )}${booking.room ? ` · ${booking.room.name}` : ''}`
            : 'Booking details, participants and cancellation'
        }
        topPad="pt-10"
        action={
          <div className="flex flex-wrap justify-end gap-3">
            {canCheckIn && (
              <Button
                variant="primary"
                icon={<LuCheck aria-hidden />}
                loading={checkingIn}
                onClick={() => void handleCheckIn()}
              >
                Check In
              </Button>
            )}
            {isConfirmed && isOrganiser && (
              <Button
                variant="primary"
                icon={<LuUserPlus aria-hidden />}
                onClick={() => setAddOpen(true)}
              >
                Add People
              </Button>
            )}
            {isConfirmed && (
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                Cancel Booking
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        }
      />

      {/* Where the user acted: the Check In button is in the header above, so
          its outcome is reported here rather than inside a card. */}
      {checkInError && (
        <p role="alert" className="mb-4 text-sm font-medium text-red-600">
          {checkInError}
        </p>
      )}
      {checkInJustHappened && !checkInError && booking?.checkIn && (
        <p role="status" className="mb-4 text-sm font-medium text-navy">
          Checked in — the room will not be released for a no-show.
        </p>
      )}

      {error ? (
        <ErrorState
          message={
            forbidden
              ? 'You are not part of this booking, so you cannot open it.'
              : validId
                ? 'Could not load this booking.'
                : 'That booking link is not valid.'
          }
          onRetry={validId ? () => void refetch() : undefined}
        />
      ) : loading || !booking ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <AppCard>
              <div className="flex items-start justify-between gap-4">
                <h2 className={typeScale.panelTitle}>Booking</h2>
                <StatusBadge meta={bookingStatusMeta[booking.status]} />
              </div>
              {statusNote[booking.status] && (
                <p className="mt-2 text-sm text-muted">{statusNote[booking.status]}</p>
              )}
              <dl className="mt-4 flex flex-col">
                <DetailRow
                  label="When"
                  value={`${formatDateTime(booking.startTime)} – ${formatTime(
                    booking.endTime,
                  )}`}
                />
                <DetailRow
                  label="Room"
                  value={
                    booking.room ? (
                      <Link
                        to={`/rooms/${booking.room.id}`}
                        className="text-navy underline"
                      >
                        {booking.room.name}
                      </Link>
                    ) : (
                      `Room #${booking.roomId}`
                    )
                  }
                />
                <DetailRow
                  label="Organiser"
                  value={
                    booking.organizer
                      ? `${booking.organizer.firstName} ${booking.organizer.lastName}`
                      : `Employee #${booking.organizerId}`
                  }
                />
                <DetailRow
                  label="Check-in"
                  value={
                    booking.checkIn
                      ? `${personName(
                          booking.checkIn.checkedInBy,
                          booking.checkIn.employee,
                        )} at ${formatDateTime(booking.checkIn.checkedInAt)}`
                      : 'Not checked in'
                  }
                />
                {canCheckIn &&
                  booking.checkInWindowOpensAt &&
                  booking.checkInWindowClosesAt && (
                    <p className="mt-2 text-sm text-muted">
                      Check-in opens at{' '}
                      {formatTime(booking.checkInWindowOpensAt)} and closes at{' '}
                      {formatTime(booking.checkInWindowClosesAt)}. If nobody
                      checks in, the room is released when that window closes.
                    </p>
                  )}
                <DetailRow
                  label="Series"
                  value={
                    recurrenceId
                      ? series.data
                        ? `Part of a ${series.data.recurringBookingGroup.length}-booking series`
                        : 'Part of a recurring series'
                      : 'One-off booking'
                  }
                />
                <DetailRow
                  label="Booked on"
                  value={
                    booking.createdAt ? formatDateTime(booking.createdAt) : '—'
                  }
                />
              </dl>
              {booking.description && (
                <p className="mt-4 text-sm text-muted">{booking.description}</p>
              )}
            </AppCard>

            <AppCard>
              <div className="flex items-start justify-between gap-4">
                <h2 className={typeScale.panelTitle}>Room</h2>
                {booking.room && (
                  <StatusBadge meta={roomStatusMeta[booking.room.status]} />
                )}
              </div>
              {booking.room ? (
                <>
                  <dl className="mt-4 flex flex-col">
                    <DetailRow label="Name" value={booking.room.name} />
                    <DetailRow
                      label="Capacity"
                      value={`${booking.room.capacity} seats`}
                    />
                    <DetailRow label="Floor" value={String(booking.room.floor)} />
                    <DetailRow label="Location" value={booking.room.location} />
                  </dl>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/rooms/${booking.room?.id}`)}
                    >
                      View Room Details
                    </Button>
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-muted">
                  This room is no longer in the catalog.
                </p>
              )}
            </AppCard>
          </div>

          {recurrenceId && (
            <RecurringSeriesPanel
              occurrences={series.data?.recurringBookingGroup ?? []}
              loading={series.loading}
              error={Boolean(series.error)}
              onRetry={() => void series.refetch()}
            />
          )}

          <div className="mt-5">
            <AppCard>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className={typeScale.panelTitle}>Participants</h2>
                  <p className={`${typeScale.subCaption} mt-2`}>
                    Everyone invited, besides the organiser
                  </p>
                </div>
              </div>
              {participants.length === 0 ? (
                <EmptyState message="Nobody else has been invited to this booking." />
              ) : (
                <div className="mt-2 flex flex-col">
                  {participants.map((participant) => {
                    const canRemove =
                      isConfirmed && (isOrganiser || isSelfParticipant(participant));
                    return (
                      <ListRow
                        key={participant.id}
                        action={
                          canRemove ? (
                            <Button
                              variant="secondary"
                              onClick={() => setRemoving(participant)}
                            >
                              {isSelfParticipant(participant)
                                ? 'Leave'
                                : 'Remove'}
                            </Button>
                          ) : undefined
                        }
                      >
                        <p className="text-[15px] text-body">
                          {personName(participant.employeeId, participant.employee)}
                        </p>
                        {participant.employee?.email && (
                          <p className="mt-1 text-sm text-muted">
                            {participant.employee.email}
                          </p>
                        )}
                      </ListRow>
                    );
                  })}
                </div>
              )}
            </AppCard>
          </div>
        </>
      )}

      <CancelBookingModal
        open={cancelOpen}
        booking={booking ?? null}
        onClose={() => setCancelOpen(false)}
      />
      <AddParticipantsModal
        open={addOpen}
        booking={booking ?? null}
        existingEmployeeIds={participants.map((participant) => participant.employeeId)}
        onClose={() => setAddOpen(false)}
      />
      <RemoveParticipantModal
        open={removing !== null}
        booking={booking ?? null}
        participant={removing}
        isSelf={removing !== null && isSelfParticipant(removing)}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
};
