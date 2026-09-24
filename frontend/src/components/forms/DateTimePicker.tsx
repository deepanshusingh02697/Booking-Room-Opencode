import type { InputHTMLAttributes } from 'react';

type DateTimePickerProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const DateTimePicker = ({ label, error, className = '', ...rest }: DateTimePickerProps) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={rest.id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        type="datetime-local"
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-400 focus:ring-red-500' : 'border-slate-300'
        } ${className}`}
        {...rest}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};