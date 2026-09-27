import type { InputHTMLAttributes } from 'react';
import { field } from '../../theme';

type DateTimePickerProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const DateTimePicker = ({
  label,
  error,
  className = '',
  id,
  ...rest
}: DateTimePickerProps) => {
  return (
    <div>
      {label && (
        <label htmlFor={id} className={field.label}>
          {label}
        </label>
      )}
      <input
        id={id}
        type="datetime-local"
        aria-invalid={error ? true : undefined}
        className={`${field.control} mt-2 ${error ? field.controlError : field.controlOk} ${className}`}
        {...rest}
      />
      {error && <p className={field.error}>{error}</p>}
    </div>
  );
};
