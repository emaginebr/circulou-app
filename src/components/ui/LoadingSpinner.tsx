interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner = ({ label, size = 'md' }: LoadingSpinnerProps) => {
  const dim = size === 'lg' ? 48 : size === 'sm' ? 20 : 32;
  return (
    <div className="flex items-center justify-center gap-2 py-6" role="status">
      <span
        className="circulou-spinner"
        style={{ width: dim, height: dim }}
        aria-hidden="true"
      />
      <span className="sr-only">{label ?? 'Carregando...'}</span>
      {label ? <span className="text-[var(--color-mute)]">{label}</span> : null}
    </div>
  );
};
