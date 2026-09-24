import type { SelectHTMLAttributes } from 'react';

type Option = {
  value: string;
  label: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: Option[];
  error?: string;
};

export const Select = ({ label, options, error, className = '', ...rest }: SelectProps) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={rest.name} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-400' : ''
        } ${className}`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};