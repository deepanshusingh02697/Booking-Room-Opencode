import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { typeScale } from '../../theme';

type Variant = 'primary' | 'outline' | 'secondary' | 'danger';
type Size = 'shell' | 'form';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
};

const variantClasses: Record<Variant, string> = {
  primary: 'border border-transparent bg-navy text-white hover:bg-[#16204F] disabled:bg-navy/40',
  outline: 'border border-black bg-white text-body hover:bg-shell disabled:opacity-50',
  secondary: 'border border-rule bg-white text-body hover:bg-shell disabled:opacity-50',
  danger:
    'border border-transparent bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
};

const sizeClasses: Record<Size, string> = {
  shell: `h-10 px-5 ${typeScale.buttonLabel}`,
  form: 'h-11 px-3 text-[13px] font-semibold uppercase',
};

export const Button = ({
  variant = 'primary',
  size = 'shell',
  loading = false,
  disabled,
  icon,
  children,
  className = '',
  ...rest
}: ButtonProps) => {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {!loading && icon}
      {children}
    </button>
  );
};
