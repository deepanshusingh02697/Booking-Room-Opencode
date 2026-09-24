type Status = 'available' | 'maintenance' | 'disabled' | 'confirmed' | 'cancelled' | 'completed' | 'checked-in' | 'no-show';

type StatusBadgeProps = {
  status: Status;
};

const statusConfig: Record<Status, { label: string; icon: string; className: string }> = {
  available: {
    label: 'Available',
    icon: '●',
    className: 'bg-green-100 text-green-800',
  },
  maintenance: {
    label: 'Maintenance',
    icon: '⚙',
    className: 'bg-amber-100 text-amber-800',
  },
  disabled: {
    label: 'Disabled',
    icon: '⊘',
    className: 'bg-red-100 text-red-800',
  },
  confirmed: {
    label: 'Confirmed',
    icon: '✓',
    className: 'bg-blue-100 text-blue-800',
  },
  cancelled: {
    label: 'Cancelled',
    icon: '✕',
    className: 'bg-slate-100 text-slate-700',
  },
  completed: {
    label: 'Completed',
    icon: '✓',
    className: 'bg-green-100 text-green-800',
  },
  'checked-in': {
    label: 'Checked in',
    icon: '✓',
    className: 'bg-green-100 text-green-800',
  },
  'no-show': {
    label: 'No-show',
    icon: '!',
    className: 'bg-amber-100 text-amber-800',
  },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { label, icon, className } = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
      aria-label={label}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
};