import { useState, type InputHTMLAttributes } from 'react';
import { field } from '../../theme';

const iconClass = 'h-5 w-5';

const EyeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={iconClass}
    aria-hidden="true"
  >
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={iconClass}
    aria-hidden="true"
  >
    <path d="M9.9 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.3 4.1M6.4 7.8A16.7 16.7 0 0 0 2.5 12S6 18.5 12 18.5c1.3 0 2.4-.3 3.5-.7" />
    <path d="M10 10.1a2.9 2.9 0 0 0 4 4" />
    <path d="m3.5 3.5 17 17" />
  </svg>
);

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  /** Keeps the label for screen readers only, so the field can rely on its placeholder. */
  hideLabel?: boolean;
  error?: string;
};

export const AuthField = ({
  label,
  hideLabel = false,
  error,
  id,
  type = 'text',
  className = '',
  ...rest
}: AuthFieldProps) => {
  const inputId = id ?? rest.name;
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const canReveal = isPassword && !rest.disabled;

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className={hideLabel ? 'sr-only' : field.label}
        >
          {label}
        </label>
      )}
      <div className={hideLabel ? 'relative' : 'relative mt-2'}>
        <input
          {...rest}
          id={inputId}
          type={canReveal && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          className={`${field.control} ${error ? field.controlError : field.controlOk} ${
            canReveal ? 'pr-11' : ''
          } ${className}`}
        />
        {canReveal && (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            aria-pressed={revealed}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && <p className={field.error}>{error}</p>}
    </div>
  );
};
