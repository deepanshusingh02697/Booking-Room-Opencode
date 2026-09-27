import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { LuCheck, LuPlus } from 'react-icons/lu';
import { AppCard } from '../../components/common/AppCard';
import { Button } from '../../components/common/Button';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { DateTimePicker } from '../../components/forms/DateTimePicker';
import { Input } from '../../components/forms/Input';
import {
  CREATE_BOOKING_MUTATION,
  type CreateBookingData,
  type CreateBookingVars,
} from '../../graphql/mutations/bookings';
import {
  ROOMS_QUERY,
  type RoomsData,
  type RoomsVars,
} from '../../graphql/queries/rooms';
import { useAuth } from '../../hooks/useAuth';
import { field, roomStatusMeta, typeScale } from '../../theme';
import {
  RecurrenceFrequency,
  RoomStatus,
  type Booking,
  type Room,
} from '../../types';
import {
  addDaysInput,
  defaultSlotInput,
  endOfLocalDay,
  localInputToGraphQLDate,
  nextHalfHourInput,
  toLocalDateValue,
} from '../../utils/date';
import { getGraphQLErrorMessage } from '../../utils/errors';
import { previewOccurrences, repeatUntilToGraphQLDate } from '../../utils/recurrence';
import { BookingConfirmedPanel } from './BookingConfirmedPanel';
import { ParticipantPicker } from './ParticipantPicker';
import { RecurrenceSection } from './RecurrenceSection';

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 1000;

const parseLocal = (value: string): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const CreateBookingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedRoomId = Number(searchParams.get('room'));

  // One clock reading feeds both ends of the default slot, so the default can
  // never drift to a non-60-minute window across a half-hour boundary.
  const [defaultSlot] = useState(() => defaultSlotInput());
  const [startTime, setStartTime] = useState(defaultSlot.startTime);
  const [endTime, setEndTime] = useState(defaultSlot.endTime);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roomId, setRoomId] = useState<number | null>(() =>
    Number.isInteger(preselectedRoomId) && preselectedRoomId > 0
      ? preselectedRoomId
      : null,
  );
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [repeats, setRepeats] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    RecurrenceFrequency.WEEKLY,
  );
  // A week past the first booking: a sensible starting point for either cadence
  // that is well inside the 90-occurrence cap. The user owns it from here — the
  // frequency switch deliberately does not move it, and the preview below says
  // exactly what the current pair of values produces.
  const [repeatUntil, setRepeatUntil] = useState(() =>
    toLocalDateValue(addDaysInput(defaultSlot.startTime, 7)),
  );
  const [created, setCreated] = useState<Booking | null>(null);

  const start = parseLocal(startTime);
  const end = parseLocal(endTime);
  const rangeIsUsable = start !== null && end !== null && end > start;

  const rooms = useQuery<RoomsData>(ROOMS_QUERY);
  const availability = useQuery<RoomsData, RoomsVars>(ROOMS_QUERY, {
    variables: rangeIsUsable
      ? {
          filter: {
            startTime: localInputToGraphQLDate(startTime),
            endTime: localInputToGraphQLDate(endTime),
          },
        }
      : {},
    skip: !rangeIsUsable,
  });

  const [createBooking, { loading: creating, error: createError }] =
    useMutation<CreateBookingData, CreateBookingVars>(CREATE_BOOKING_MUTATION);

  const allRooms = useMemo(
    () => rooms.data?.rooms ?? [],
    [rooms.data],
  );
  const selectedRoom: Room | undefined = allRooms.find(
    (room) => room.id === roomId,
  );
  const freeRoomIds = useMemo(
    () => new Set((availability.data?.rooms ?? []).map((room) => room.id)),
    [availability.data],
  );

  const attendees = participantIds.length + 1;
  const remainingSeats = selectedRoom ? selectedRoom.capacity - 1 : null;

  // The exact occurrences the server would create, recomputed as the user types.
  // Advisory only — the server regenerates and re-validates them all.
  const recurrencePreview = useMemo(() => {
    if (!repeats || !start || !end || !rangeIsUsable) {
      return { starts: [], error: null };
    }
    if (!repeatUntil) {
      return { starts: [], error: 'Choose the date the series ends on.' };
    }
    return previewOccurrences({
      startTime: start,
      endTime: end,
      frequency,
      endDate: endOfLocalDay(repeatUntil),
    });
  }, [repeats, start, end, rangeIsUsable, frequency, repeatUntil]);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};
    const now = Date.now();

    if (!startTime) next.startTime = 'Start time is required.';
    else if (!start) next.startTime = 'Enter a valid start time.';
    else if (start.getTime() <= now)
      next.startTime = 'The start time must be in the future.';

    if (!endTime) next.endTime = 'End time is required.';
    else if (!end) next.endTime = 'Enter a valid end time.';
    else if (start && end <= start)
      next.endTime = 'End time must be after the start time.';

    if (title.trim().length === 0) next.title = 'Title is required.';
    else if (title.length > TITLE_MAX)
      next.title = `Title must be at most ${TITLE_MAX} characters.`;

    if (roomId === null) next.roomId = 'Choose a room to book.';

    if (repeats && rangeIsUsable && recurrencePreview.error) {
      next.recurrence = recurrencePreview.error;
    }

    if (
      selectedRoom &&
      remainingSeats !== null &&
      participantIds.length > remainingSeats
    ) {
      next.roomId = `${selectedRoom.name} seats ${selectedRoom.capacity}, but you have ${attendees} attendees.`;
    }

    return next;
  }, [startTime, endTime, title, roomId, selectedRoom, participantIds, remainingSeats, attendees, repeats, rangeIsUsable, recurrencePreview.error]);

  const blockingErrors = Object.keys(errors);
  const availabilityKnown = !availability.loading && !availability.error;
  const selectedRoomUnavailable =
    selectedRoom !== undefined &&
    rangeIsUsable &&
    availabilityKnown &&
    selectedRoom.status === RoomStatus.AVAILABLE &&
    !freeRoomIds.has(selectedRoom.id);

  const roomHint = (room: Room) => {
    if (room.status !== RoomStatus.AVAILABLE) {
      return roomStatusMeta[room.status].label;
    }
    if (!rangeIsUsable) return 'Pick a time to check availability';
    if (availability.loading) return 'Checking availability…';
    if (availability.error) return 'Availability unknown';
    return freeRoomIds.has(room.id) ? 'Free for this slot' : 'Unavailable';
  };

  const submit = async () => {
    if (blockingErrors.length > 0 || roomId === null) return;

    const descriptionValue = description.trim();

    try {
      const result = await createBooking({
        variables: {
          input: {
            roomId,
            title: title.trim(),
            ...(descriptionValue ? { description: descriptionValue } : {}),
            startTime: localInputToGraphQLDate(startTime),
            endTime: localInputToGraphQLDate(endTime),
            ...(participantIds.length > 0 ? { participantIds } : {}),
            // Omitted, never `null`, when the booking does not repeat
            // (doc/project-state.md §8.25).
            ...(repeats && repeatUntil
              ? {
                  recurrence: {
                    frequency,
                    endDate: repeatUntilToGraphQLDate(repeatUntil),
                  },
                }
              : {}),
          },
        },
      });
      setCreated(result.data?.createBooking ?? null);
      void availability.refetch();
    } catch {
      // the message is rendered from createError below
    }
  };

  const reset = () => {
    const slot = defaultSlotInput();
    setCreated(null);
    setTitle('');
    setDescription('');
    setParticipantIds([]);
    setRoomId(null);
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setRepeats(false);
    setRepeatUntil(toLocalDateValue(addDaysInput(slot.startTime, 7)));
  };

  if (created) {
    return <BookingConfirmedPanel booking={created} onReset={reset} />;
  }

  return (
    <div>
      <PageHeader
        title="Create Booking"
        sub="Choose a room and a time, then invite the people you need"
        topPad="pt-10"
      />

      {rooms.error ? (
        <ErrorState
          message="Could not load the room list."
          onRetry={() => void rooms.refetch()}
        />
      ) : rooms.loading && allRooms.length === 0 ? (
        <LoadingState />
      ) : (
        <AppCard>
          <h2 className={typeScale.panelTitle}>New Booking</h2>
          <p className={`${typeScale.subCaption} mt-2`}>
            Every rule is checked again on the server when you submit
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <DateTimePicker
              label="Starts at"
              name="startTime"
              value={startTime}
              min={nextHalfHourInput()}
              error={errors.startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <DateTimePicker
              label="Ends at"
              name="endTime"
              value={endTime}
              error={errors.endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="mt-6">
            <p className={field.label}>Room</p>
            <p className="mt-1 text-xs text-muted">
              Rooms that are booked or under maintenance for this slot are marked
              unavailable.
            </p>
            <div
              className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
              role="radiogroup"
              aria-label="Room"
            >
              {allRooms.map((room) => {
                const isSelected = room.id === roomId;
                const unavailable =
                  room.status === RoomStatus.AVAILABLE &&
                  rangeIsUsable &&
                  availabilityKnown &&
                  !freeRoomIds.has(room.id);

                return (
                  <button
                    key={room.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setRoomId(room.id)}
                    className={`rounded border px-4 pb-3 pt-3.5 text-left transition-colors ${
                      isSelected
                        ? 'border-navy bg-tint'
                        : 'border-hairline bg-white hover:border-idle'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {room.name}
                      </span>
                      {isSelected && <LuCheck className="h-4 w-4 shrink-0 text-navy" strokeWidth={3} aria-hidden />}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      Floor {room.floor} · Seats {room.capacity}
                    </span>
                    <span
                      className={`mt-2 block text-xs ${
                        unavailable ? 'text-red-600' : 'text-muted'
                      }`}
                    >
                      {roomHint(room)}
                    </span>
                  </button>
                );
              })}
            </div>
            {availability.error && (
              <div role="status" className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm text-red-600">
                  Could not check which rooms are free for this time. You can still
                  submit — the server will reject a room that is not available.
                </p>
                <Button
                  variant="outline"
                  onClick={() => void availability.refetch()}
                >
                  Retry
                </Button>
              </div>
            )}
            {errors.roomId ? (
              <p className={field.error}>{errors.roomId}</p>
            ) : (
              selectedRoom && (
                <p className="mt-3 text-xs text-muted">
                  {attendees} attendee{attendees === 1 ? '' : 's'} (
                  {selectedRoom.capacity - attendees} seat
                  {selectedRoom.capacity - attendees === 1 ? '' : 's'} left)
                </p>
              )
            )}
          </div>

          <div className="mt-6">
            <Input
              label="Title"
              name="title"
              value={title}
              maxLength={TITLE_MAX}
              placeholder="Weekly team sync"
              error={errors.title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="mt-6">
            <label htmlFor="description" className={field.label}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={description}
              maxLength={DESCRIPTION_MAX}
              placeholder="Optional agenda or notes"
              className={`mt-2 w-full rounded border border-black bg-white px-3 py-2 text-base text-ink placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-navy`}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted">
              Optional · {description.length}/{DESCRIPTION_MAX}
            </p>
          </div>

          <div className="mt-6 border-t border-rule pt-6">
            <ParticipantPicker
              value={participantIds}
              onChange={setParticipantIds}
              currentUserId={user?.id}
              remainingSeats={remainingSeats}
            />
          </div>

          <RecurrenceSection
            repeats={repeats}
            onToggleRepeats={setRepeats}
            frequency={frequency}
            onFrequencyChange={setFrequency}
            until={repeatUntil}
            onUntilChange={setRepeatUntil}
            minDate={start ? toLocalDateValue(start) : ''}
            preview={recurrencePreview}
          />

          {selectedRoomUnavailable && (
            <p role="status" className="mt-6 text-sm text-red-600">
              {selectedRoom.name} is not free for the selected time — submitting
              will be rejected by the booking engine.
            </p>
          )}

          {createError && (
            <p role="alert" className="mt-6 text-sm text-red-600">
              {getGraphQLErrorMessage(createError)}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-rule pt-6">
            <Button variant="outline" onClick={() => navigate('/rooms')}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={creating}
              disabled={blockingErrors.length > 0}
              icon={<LuPlus aria-hidden />}
              onClick={() => void submit()}
            >
              {repeats && recurrencePreview.starts.length > 1
                ? `Create ${recurrencePreview.starts.length} Bookings`
                : 'Create Booking'}
            </Button>
          </div>
        </AppCard>
      )}
    </div>
  );
};
