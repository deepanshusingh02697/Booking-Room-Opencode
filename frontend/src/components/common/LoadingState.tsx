type LoadingStateProps = {
  label?: string;
};

export const LoadingState = ({ label = 'Loading…' }: LoadingStateProps) => {
  return (
    <div className="flex items-center justify-center gap-3 py-8" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <span className="text-sm text-slate-600">{label}</span>
    </div>
  );
};