type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export const ErrorState = ({
  message = 'Something went wrong.',
  onRetry,
}: ErrorStateProps) => {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 py-8 text-center"
    >
      <p className="text-sm font-medium text-red-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm text-blue-600 underline hover:text-blue-700"
        >
          Try again
        </button>
      )}
    </div>
  );
};