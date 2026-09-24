type EmptyStateProps = {
  title?: string;
  message?: string;
  action?: React.ReactNode;
};

export const EmptyState = ({
  title = 'Nothing here yet',
  message,
  action,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <p className="text-base font-medium text-slate-700">{title}</p>
      {message && <p className="text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};