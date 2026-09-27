import { LuCheck } from 'react-icons/lu';
import { DatePicker } from '../../components/forms/DatePicker';
import { field } from '../../theme';
import { RecurrenceFrequency } from '../../types';
import { formatDateTime } from '../../utils/date';
import {
  frequencyLabel,
  MAX_RECURRENCE_OCCURRENCES,
  type OccurrencePreview,
} from '../../utils/recurrence';

const PREVIEW_LIMIT = 5;

type RecurrenceSectionProps = {
  repeats: boolean;
  onToggleRepeats: (value: boolean) => void;
  frequency: RecurrenceFrequency;
  onFrequencyChange: (value: RecurrenceFrequency) => void;
  until: string;
  onUntilChange: (value: string) => void;
  /** Earliest selectable repeat-until date — the first booking's own date. */
  minDate: string;
  /** The occurrence times the server would generate, or why it would refuse. */
  preview: OccurrencePreview;
};

/**
 * The recurrence controls on Create Booking: repeat or not, how often, and
 * until when — with a live preview of the exact occurrences that will be
 * created. Improvised on the §7.1/§7.2 primitives (the design references in
 * doc/project-state.md §7.2.11 do not cover a form like this) and authorised as
 * not pixel-referenced in §9.7.
 *
 * The preview is the client mirror of `generateOccurrences`, so the rules are
 * visible before submitting, but the server still re-checks every occurrence and
 * its message is what the user ultimately sees.
 */
export const RecurrenceSection = ({
  repeats,
  onToggleRepeats,
  frequency,
  onFrequencyChange,
  until,
  onUntilChange,
  minDate,
  preview,
}: RecurrenceSectionProps) => {
  const untilError = repeats ? preview.error : null;
  const count = preview.starts.length;

  return (
    <div className="mt-6 border-t border-rule pt-6">
      <label
        className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded border px-3 py-2 text-sm ${
          repeats
            ? 'border-navy bg-tint text-navy'
            : 'border-hairline bg-white text-body hover:border-idle'
        }`}
      >
        <input
          type="checkbox"
          name="recurring"
          checked={repeats}
          onChange={(e) => onToggleRepeats(e.target.checked)}
          className="h-4 w-4 accent-navy"
        />
        <span className="font-medium">Repeat this booking</span>
      </label>

      {repeats && (
        <div className="mt-4">
          <p className={field.label}>How often</p>
          <div
            className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2"
            role="radiogroup"
            aria-label="How often"
          >
            {Object.values(RecurrenceFrequency).map((value) => {
              const selected = value === frequency;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onFrequencyChange(value)}
                  className={`rounded border px-4 pb-3 pt-3.5 text-left transition-colors ${
                    selected
                      ? 'border-navy bg-tint'
                      : 'border-hairline bg-white hover:border-idle'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {frequencyLabel[value]}
                    </span>
                    {selected && (
                      <LuCheck
                        className="h-4 w-4 shrink-0 text-navy"
                        strokeWidth={3}
                        aria-hidden
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 max-w-xs">
            <DatePicker
              label="Repeat until"
              name="repeatUntil"
              value={until}
              min={minDate}
              error={untilError ?? undefined}
              onChange={(e) => onUntilChange(e.target.value)}
            />
          </div>

          <p className="mt-1.5 text-xs text-muted">
            The last day you choose is included, and a series can hold at most{' '}
            {MAX_RECURRENCE_OCCURRENCES} occurrences.
          </p>

          {untilError || count === 0 ? null : (
            <div role="status" className="mt-3">
              <p className="text-sm text-body">
                <span className="font-semibold">
                  {count} booking{count === 1 ? '' : 's'}
                </span>{' '}
                will be created, starting {formatDateTime(preview.starts[0])}.
              </p>
              {count > 1 && (
                <ul className="mt-2 flex flex-col gap-1 text-xs text-muted">
                  {preview.starts.slice(0, PREVIEW_LIMIT).map((start) => (
                    <li key={start.toISOString()}>{formatDateTime(start)}</li>
                  ))}
                  {count > PREVIEW_LIMIT && (
                    <li>and {count - PREVIEW_LIMIT} more, up to the date above</li>
                  )}
                </ul>
              )}
            </div>
          )}

          <p className="mt-3 text-xs text-muted">
            Every occurrence is checked against existing bookings and
            maintenance windows. If any single one clashes, the whole series is
            rejected and nothing is booked.
          </p>
        </div>
      )}
    </div>
  );
};
