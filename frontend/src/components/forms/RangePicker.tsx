import { DatePicker } from './DatePicker';
import { Button } from '../common/Button';
import {
  buildDateRange,
  dateRangePresets,
  isPresetRange,
  type DateRangePresetId,
  type LocalDateRange,
} from '../../utils/date';

type RangePickerProps = {
  range: LocalDateRange;
  onChange: (range: LocalDateRange) => void;
  className?: string;
};

const rangeError = (range: LocalDateRange): string | undefined =>
  range.from > range.to
    ? 'The start date must be on or before the end date.'
    : undefined;

/**
 * The date-range control shared by the admin Calendar and Analytics pages:
 * four preset buttons plus a custom From/To pair, both of which change the
 * range immediately (there is no Apply step — an admin exploring a range wants
 * the data to move under them).
 *
 * The From/To pair is the authority, not the buttons: choosing a preset writes
 * into it, so the fields always show the range in effect. An inverted pair is
 * reported inline, and the caller is expected to keep it off the wire
 * altogether — skipping the query is not sufficient on its own, because
 * `refetch()` un-skips it. See `refetchRange` in `AdminCalendarPage`.
 */
export const RangePicker = ({
  range,
  onChange,
  className = '',
}: RangePickerProps) => {
  // One clock read per render, so every preset is built from the same "today".
  const now = new Date();
  const error = rangeError(range);
  const active: DateRangePresetId | undefined = dateRangePresets.find(
    (preset) => isPresetRange(range, preset, now),
  )?.id;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-3">
        {dateRangePresets.map((preset) => (
          <Button
            key={preset.id}
            // The filled variant is the only visual cue for the active preset,
            // and colour alone is not announced, so the selection state is
            // carried explicitly the way `AuthField` carries its reveal toggle.
            aria-pressed={active === preset.id}
            variant={active === preset.id ? 'primary' : 'outline'}
            onClick={() => onChange(buildDateRange(preset, now))}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DatePicker
          id="range-from"
          label="From"
          value={range.from}
          max={range.to}
          onChange={(event) =>
            onChange({ ...range, from: event.target.value })
          }
        />
        <DatePicker
          id="range-to"
          label="To"
          value={range.to}
          min={range.from}
          error={error}
          onChange={(event) => onChange({ ...range, to: event.target.value })}
        />
      </div>
    </div>
  );
};
