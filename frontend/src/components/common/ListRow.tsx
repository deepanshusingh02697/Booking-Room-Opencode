import type { ReactNode } from 'react';

type ListRowProps = {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

/**
 * One row of a simple in-card list. Improvised for Phase 15 (the design
 * references in doc/project-state.md §7.2.11 do not cover list rows) and used
 * by every list in the app: the equipment manager, the equipment catalog and
 * the four dashboard panels.
 */
export const ListRow = ({ children, action, className = '' }: ListRowProps) => {
  return (
    <div
      className={`flex items-center justify-between gap-4 border-b border-rule py-3 last:border-b-0 ${className}`}
    >
      <div className="min-w-0">{children}</div>
      {action && (
        <div className="flex shrink-0 items-center gap-2">{action}</div>
      )}
    </div>
  );
};
