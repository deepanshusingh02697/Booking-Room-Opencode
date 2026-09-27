import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { Button } from '../../components/common/Button';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import {
  EMPLOYEES_QUERY,
  type EmployeesData,
} from '../../graphql/queries/employees';
import type { Employee } from '../../types';

type ParticipantPickerProps = {
  value: number[];
  onChange: (ids: number[]) => void;
  /** The signed-in employee — the backend rejects the organiser as their own participant. */
  currentUserId: number | undefined;
  /** Attendee budget left in the selected room, or null when no room is chosen yet. */
  remainingSeats: number | null;
  /**
   * Employees to hide — the ones already on the booking when the picker is used
   * to add someone (Phase 18). The server rejects a duplicate with a CONFLICT,
   * so offering them would only ever produce an error.
   */
  excludeIds?: number[];
};

const fullName = (employee: Employee) =>
  `${employee.firstName} ${employee.lastName}`;

export const ParticipantPicker = ({
  value,
  onChange,
  currentUserId,
  remainingSeats,
  excludeIds = [],
}: ParticipantPickerProps) => {
  const [search, setSearch] = useState('');
  const { data, loading, error, refetch } = useQuery<EmployeesData>(
    EMPLOYEES_QUERY,
  );

  const everyoneElse = useMemo(
    () => (data?.employees ?? []).filter((employee) => employee.id !== currentUserId),
    [data, currentUserId],
  );

  const colleagues = useMemo(() => {
    const term = search.trim().toLowerCase();
    return everyoneElse
      .filter((employee) => !excludeIds.includes(employee.id))
      .filter(
        (employee) =>
          term === '' ||
          fullName(employee).toLowerCase().includes(term) ||
          employee.email.toLowerCase().includes(term),
      );
  }, [everyoneElse, search, excludeIds]);

  const overCapacity =
    remainingSeats !== null && value.length > remainingSeats;

  const toggle = (id: number) => {
    onChange(
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id],
    );
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-label">Participants</p>
          <p className="mt-1 text-xs text-muted">
            You are counted as the organiser, so you are not listed here.
          </p>
        </div>
        {value.length > 0 && (
          <Button variant="secondary" onClick={() => onChange([])}>
            Clear
          </Button>
        )}
      </div>

      <div className="mt-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          aria-label="Search colleagues"
          className="h-11 w-full rounded border border-black bg-white px-3 text-base text-ink placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-navy"
        />
      </div>

      {error ? (
        <ErrorState
          message="Could not load the employee list."
          onRetry={() => void refetch()}
        />
      ) : loading ? (
        <LoadingState />
      ) : colleagues.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          {search.trim() !== ''
            ? 'No colleague matches that search.'
            : everyoneElse.length === 0
              ? 'There are no other employees to invite yet.'
              : 'Everyone else is already on this booking.'}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {colleagues.map((employee) => {
            const selected = value.includes(employee.id);
            return (
              <label
                key={employee.id}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm ${
                  selected
                    ? 'border-navy bg-tint text-navy'
                    : 'border-hairline bg-white text-body hover:border-idle'
                }`}
              >
                <input
                  type="checkbox"
                  name="participantIds"
                  value={employee.id}
                  checked={selected}
                  onChange={() => toggle(employee.id)}
                  className="h-4 w-4 accent-navy"
                />
                <span className="min-w-0">
                  {fullName(employee)}
                  <span className="ml-2 text-xs text-muted">
                    {employee.email}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}

      <p
        className={`mt-3 text-xs ${
          overCapacity ? 'text-red-600' : 'text-muted'
        }`}
      >
        {value.length === 0
          ? 'No participants added yet.'
          : overCapacity
            ? `${value.length} selected but only ${remainingSeats} seat${
                remainingSeats === 1 ? '' : 's'
              } left in this room.`
            : `${value.length} participant${
                value.length === 1 ? '' : 's'
              } selected.`}
      </p>
    </div>
  );
};
