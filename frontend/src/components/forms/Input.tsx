import type { InputHTMLAttributes, ReactNode } from 'react';
import { field } from '../../theme';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  rightElement?: ReactNode;
};

export const Input = ({
  label,
  error,
  rightElement,
  className = '',
  id,
  ...rest
}: InputProps) => {
  const inputId = id ?? rest.name;

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className={field.label}>
          {label}
        </label>
      )}
      <div className="relative mt-2">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={`${field.control} ${error ? field.controlError : field.controlOk} ${
            rightElement ? 'pr-11' : ''
          } ${className}`}
          {...rest}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className={field.error}>{error}</p>}
    </div>
  );
};
