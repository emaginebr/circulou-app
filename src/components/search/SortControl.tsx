import { useTranslation } from 'react-i18next';
import type { SortBy } from '@/types/search';

interface SortControlProps {
  value: SortBy;
  onChange: (next: SortBy) => void;
}

const OPTIONS: { value: SortBy; key: string }[] = [
  { value: 'relevance', key: 'sort.relevance' },
  { value: 'priceAsc', key: 'sort.priceAsc' },
  { value: 'priceDesc', key: 'sort.priceDesc' },
  { value: 'discount', key: 'sort.discount' },
  { value: 'newest', key: 'sort.newest' },
];

export const SortControl = ({ value, onChange }: SortControlProps) => {
  const { t } = useTranslation('search');
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-[var(--color-mute)]">{t('sort.label')}:</span>
      <select
        className="rounded-[var(--radius-sm)] border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        value={value}
        onChange={e => onChange(e.target.value as SortBy)}
      >
        {OPTIONS.map(o => (
          <option key={o.value} value={o.value}>
            {t(o.key)}
          </option>
        ))}
      </select>
    </label>
  );
};
