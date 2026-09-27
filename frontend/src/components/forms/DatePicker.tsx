import type { InputHTMLAttributes } from 'react';
import { field } from '../../theme';

type DatePickerProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

/**
 * A calendar-date control, the `DateTimePicker` sibling used for date-only
 * fields (Phase 18's "repeat until"). Same 44px control contract, 4px radius and
 * 1px black border as every other §7.1 field.
 */
export const DatePicker = ({
  label,
  error,
  className = '',
  id,
  ...rest
}: DatePickerProps) => {
  const inputId = id ?? rest.name;

  return (
    <div>
      {label && <label htmlFor={inputId} className={field.label}>{label}</label>}
      <input
        id={inputId}
        type="date"
        aria-invalid={error ? true : undefined}
        className={`${field.control} mt-2 ${
          error ? field.controlError : field.controlOk
        } ${className}`}
        {...rest}
      />
      {error && <p className={field.error}>{error}</p>}
    </div>
  );
};
