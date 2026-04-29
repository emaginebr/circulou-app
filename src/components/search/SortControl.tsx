import type { SortBy } from '@/types/search';

interface SortControlProps {
  value: SortBy;
  onChange: (next: SortBy) => void;
}

const OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'priceAsc', label: 'Menor preço' },
  { value: 'priceDesc', label: 'Maior preço' },
  { value: 'discount', label: 'Maior desconto' },
  { value: 'newest', label: 'Mais recentes' },
];

export const SortControl = ({ value, onChange }: SortControlProps) => (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-[var(--color-mute)]">Ordenar por:</span>
      <select
        className="rounded-[var(--radius-sm)] border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        value={value}
        onChange={e => onChange(e.target.value as SortBy)}
      >
        {OPTIONS.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
