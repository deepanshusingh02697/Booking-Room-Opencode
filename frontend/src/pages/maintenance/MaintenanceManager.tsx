import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Button } from '../../components/common/Button';
import { ErrorState } from '../../components/common/ErrorState';
import { ListRow } from '../../components/common/ListRow';
import { LoadingState } from '../../components/common/LoadingState';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/forms/Input';
import { DateTimePicker } from '../../components/forms/DateTimePicker';
import {
  CREATE_MAINTENANCE_MUTATION,
  type CreateMaintenanceData,
  type CreateMaintenanceVars,
} from '../../graphql/mutations/maintenance';
import {
  ROOM_MAINTENANCE_QUERY,
  type RoomMaintenanceData,
  type RoomMaintenanceVars,
} from '../../graphql/queries/maintenance';
import { field } from '../../theme';
import type { MaintenanceWindow, Room } from '../../types';
import { defaultSlotInput, localInputToGraphQLDate } from '../../utils/date';
import { getGraphQLErrorMessage } from '../../utils/errors';
import { splitMaintenanceWindows } from '../../utils/maintenance';
import { DeleteMaintenanceModal } from './DeleteMaintenanceModal';
import { MaintenanceRow } from './MaintenanceRow';

const PAST_LIMIT = 10;

type MaintenanceManagerProps = {
  open: boolean;
  room: Room | null;
  onClose: () => void;
};

type FormErrors = Partial<Record<'startTime' | 'endTime' | 'reason', string>>;

/**
 * The maintenance windows of one room, opened from a Maintenance button on the
 * Admin Rooms card — the Phase 11 admin surface the plan calls for. It does
 * everything Phase 11's API offers: list every window (scheduled + past, split
 * client-side), create a new window, and delete an existing one. `roomMaintenance`
 * is available to every authenticated role, but the two mutations are admin-only
 * and the server's FORBIDDEN is what a non-admin gets.
 *
 * Create is a real form, mirroring `RoomForm`'s validation approach, and delete
 * goes through a confirm because it hands the time back to the booking engine
 * with no undo — mirroring `CancelBookingModal`.
 */
export const MaintenanceManager = ({
  open,
  room,
  onClose,
}: MaintenanceManagerProps) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<MaintenanceWindow | null>(null);
  const [showAllPast, setShowAllPast] = useState(false);

  useEffect(() => {
    if (!open) return;
    const slot = defaultSlotInput();
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setReason('');
    setErrors({});
    setActionError(null);
    setRemoving(null);
    setShowAllPast(false);
  }, [open, room]);

  const { data, loading, error, refetch } = useQuery<
    RoomMaintenanceData,
    RoomMaintenanceVars
  >(ROOM_MAINTENANCE_QUERY, {
    variables: { roomId: room?.id ?? 0 },
    skip: !open,
  });
  const [createMaintenance, createState] = useMutation<
    CreateMaintenanceData,
    CreateMaintenanceVars
  >(CREATE_MAINTENANCE_MUTATION);

  const windows = data?.roomMaintenance ?? [];
  const now = new Date();
  const { scheduled, past } = splitMaintenanceWindows(windows, now);
  const visiblePast = showAllPast ? past : past.slice(0, PAST_LIMIT);

  if (!open || !room) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const found: FormErrors = {};
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (!Number.isFinite(start.getTime())) {
      found.startTime = 'A start time is required.';
    }
    if (!Number.isFinite(end.getTime())) {
      found.endTime = 'An end time is required.';
    }
    if (
      Number.isFinite(start.getTime()) &&
      Number.isFinite(end.getTime()) &&
      start.getTime() >= end.getTime()
    ) {
      found.endTime = 'Maintenance start time must be before end time.';
    }
    const trimmedReason = reason.trim();
    if (reason.length > 0 && trimmedReason.length === 0) {
      found.reason = 'Maintenance reason cannot be empty.';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      await createMaintenance({
        variables: {
          input: {
            roomId: room.id,
            startTime: localInputToGraphQLDate(startTime),
            endTime: localInputToGraphQLDate(endTime),
            ...(trimmedReason ? { reason: trimmedReason } : {}),
          },
        },
      });
      await refetch();
      // A fresh default slot from one clock read, so the two ends cannot drift
      // apart across a half-hour boundary (§8.28).
      const slot = defaultSlotInput();
      setStartTime(slot.startTime);
      setEndTime(slot.endTime);
      setReason('');
      setErrors({});
    } catch (err) {
      setActionError(getGraphQLErrorMessage(err));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={`Maintenance · ${room.name}`}
    >
      {error ? (
        <ErrorState
          message="Could not load this room's maintenance windows."
          onRetry={() => void refetch()}
        />
      ) : loading ? (
        <LoadingState />
      ) : (
        <>
          {actionError && (
            <p role="alert" className="mb-4 text-sm font-medium text-red-600">
              {actionError}
            </p>
          )}

          <form onSubmit={handleCreate} noValidate>
            <p className={field.label}>Add a window</p>
            <p className="mt-1 text-sm text-muted">
              The room cannot be booked while the window runs. The engine refuses
              a window that clashes with a confirmed booking.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateTimePicker
                id="maintenance-start"
                label="Starts"
                value={startTime}
                error={errors.startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <DateTimePicker
                id="maintenance-end"
                label="Ends"
                value={endTime}
                error={errors.endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div className="mt-4">
              <Input
                label="Reason (optional)"
                name="reason"
                value={reason}
                error={errors.reason}
                maxLength={1000}
                placeholder="What is being repaired?"
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="form"
                loading={createState.loading}
              >
                Add Maintenance
              </Button>
            </div>
          </form>

          <p className={`${field.label} mt-6`}>
            Scheduled ({scheduled.length})
          </p>
          <div className="mt-2 flex flex-col">
            {scheduled.length === 0 ? (
              <p className="text-sm text-muted">
                No maintenance is scheduled for this room.
              </p>
            ) : (
              scheduled.map((window) => (
                <MaintenanceRow
                  key={window.id}
                  window={window}
                  action={
                    <Button
                      variant="outline"
                      disabled={createState.loading}
                      onClick={() => {
                        setActionError(null);
                        setRemoving(window);
                      }}
                    >
                      Remove
                    </Button>
                  }
                />
              ))
            )}
          </div>

          <p className={`${field.label} mt-6`}>Past ({past.length})</p>
          <div className="mt-2 flex flex-col">
            {past.length === 0 ? (
              <p className="text-sm text-muted">
                No maintenance windows have passed.
              </p>
            ) : (
              <>
                {visiblePast.map((window) => (
                  <MaintenanceRow key={window.id} window={window} />
                ))}
                {!showAllPast && past.length > PAST_LIMIT && (
                  <ListRow>
                    <p className="text-sm text-muted">
                      Showing the {PAST_LIMIT} most recent of {past.length}{' '}
                      passed windows.
                    </p>
                  </ListRow>
                )}
              </>
            )}
          </div>

          {past.length > PAST_LIMIT ? (
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAllPast((value) => !value)}
              >
                {showAllPast ? 'Show less' : `Show all ${past.length}`}
              </Button>
            </div>
          ) : null}
        </>
      )}

      <DeleteMaintenanceModal
        open={removing !== null}
        roomId={room.id}
        window={removing}
        onClose={() => setRemoving(null)}
      />
    </Modal>
  );
};