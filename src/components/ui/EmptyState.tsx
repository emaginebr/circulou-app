import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="mx-auto max-w-2xl px-4 py-12 text-center">
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    {description ? (
      <p className="text-[var(--color-mute)]">{description}</p>
    ) : null}
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);
