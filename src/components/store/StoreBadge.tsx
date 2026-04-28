import { Link } from 'react-router-dom';
import type { StoreInfo } from '@/types/store';

interface StoreBadgeProps {
  store: StoreInfo;
  size?: 'sm' | 'md';
}

export const StoreBadge = ({ store, size = 'sm' }: StoreBadgeProps) => {
  const dim = size === 'md' ? 32 : 24;
  return (
    <Link
      to={`/loja/${store.slug}`}
      className="inline-flex items-center gap-2 text-[var(--color-primary)] hover:underline"
    >
      {store.logoUrl ? (
        <img
          src={store.logoUrl}
          alt=""
          style={{ width: dim, height: dim }}
          className="object-cover rounded-[var(--radius-sm)]"
        />
      ) : null}
      <span className="text-sm">{store.name}</span>
    </Link>
  );
};
