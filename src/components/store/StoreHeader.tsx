import type { StoreInfo } from '@/types/store';

interface StoreHeaderProps {
  store: StoreInfo;
}

export const StoreHeader = ({ store }: StoreHeaderProps) => (
  <header className="flex items-center gap-3 mb-4">
    {store.logoUrl ? (
      <img
        src={store.logoUrl}
        alt={store.name}
        className="w-20 h-20 object-cover rounded-[var(--radius)] border border-gray-200"
      />
    ) : null}
    <div>
      <h1 className="text-2xl font-semibold mb-0">{store.name}</h1>
      <small className="text-[var(--color-mute)]">/{store.slug}</small>
    </div>
  </header>
);
