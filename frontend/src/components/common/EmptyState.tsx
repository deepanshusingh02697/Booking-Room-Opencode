type EmptyStateProps = {
  message: string;
};

export const EmptyState = ({ message }: EmptyStateProps) => {
  return (
    <p className="mt-[46px] text-center text-sm text-muted">{message}</p>
  );
};
