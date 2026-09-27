import type { SelectHTMLAttributes } from 'react';
import { field } from '../../theme';

type Option = {
  value: string;
  label: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: Option[];
  error?: string;
};

export const Select = ({
  label,
  options,
  error,
  className = '',
  id,
  ...rest
}: SelectProps) => {
  const selectId = id ?? rest.name;

  return (
    <div>
      {label && (
        <label htmlFor={selectId} className={field.label}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        className={`${field.control} mt-2 ${error ? field.controlError : field.controlOk} ${className}`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className={field.error}>{error}</p>}
    </div>
  );
};
