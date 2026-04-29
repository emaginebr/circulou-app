interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center" role="alert">
      <p className="text-[var(--color-danger)] font-medium mb-3">
        {message ?? 'Algo deu errado. Tente novamente.'}
      </p>
      {onRetry ? (
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] rounded-[var(--radius)] hover:bg-[var(--color-primary)] hover:text-white transition"
          onClick={onRetry}
        >
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
