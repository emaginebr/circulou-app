import { useState } from 'react';
import { useStores } from '@/hooks/useStores';
import type { FilterState } from '@/types/search';

interface FiltersPanelProps {
  value: FilterState;
  onChange: (next: Partial<FilterState>) => void;
  onClear: () => void;
  showStoreFilter?: boolean;
}

export const FiltersPanel = ({
  value,
  onChange,
  onClear,
  showStoreFilter = true,
}: FiltersPanelProps) => {
  const { stores } = useStores();
  const [minLocal, setMinLocal] = useState<string>(
    value.priceMin !== null && value.priceMin !== undefined ? String(value.priceMin) : '',
  );
  const [maxLocal, setMaxLocal] = useState<string>(
    value.priceMax !== null && value.priceMax !== undefined ? String(value.priceMax) : '',
  );

  const applyPrice = () => {
    const min = minLocal === '' ? null : Number(minLocal);
    const max = maxLocal === '' ? null : Number(maxLocal);
    onChange({
      priceMin: Number.isFinite(min) ? min : null,
      priceMax: Number.isFinite(max) ? max : null,
    });
  };

  const inputCls =
    'w-full rounded-[var(--radius-sm)] border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]';

  return (
    <aside
      className="bg-white border border-gray-200 rounded-[var(--radius)] p-4 mb-4"
      aria-label="Filtros"
    >
      <h2 className="text-base font-semibold mb-3">Filtros</h2>

      {showStoreFilter ? (
        <div className="mb-3">
          <label htmlFor="filter-store" className="block text-sm font-medium mb-1">
            Loja
          </label>
          <select
            id="filter-store"
            className={inputCls}
            value={value.storeId ?? ''}
            onChange={e =>
              onChange({ storeId: e.target.value ? Number(e.target.value) : null })
            }
          >
            <option value="">—</option>
            {stores.map(s => (
              <option key={s.storeId} value={s.storeId}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <fieldset className="mb-3">
        <legend className="block text-sm font-medium mb-1">
          Preço mínimo / Preço máximo
        </legend>
        <div className="flex gap-2">
          <input
            type="number"
            className={inputCls}
            placeholder="Preço mínimo"
            min={0}
            value={minLocal}
            onChange={e => setMinLocal(e.target.value)}
            onBlur={applyPrice}
            aria-label="Preço mínimo"
          />
          <input
            type="number"
            className={inputCls}
            placeholder="Preço máximo"
            min={0}
            value={maxLocal}
            onChange={e => setMaxLocal(e.target.value)}
            onBlur={applyPrice}
            aria-label="Preço máximo"
          />
        </div>
      </fieldset>

      <label className="flex items-center gap-2 mb-3 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 accent-[var(--color-primary)]"
          checked={value.onlyOnSale ?? false}
          onChange={e => onChange({ onlyOnSale: e.target.checked })}
        />
        Apenas em promoção
      </label>

      <button
        type="button"
        className="w-full inline-flex justify-center items-center px-3 py-1.5 text-sm border border-gray-300 rounded-[var(--radius)] hover:bg-gray-50"
        onClick={() => {
          setMinLocal('');
          setMaxLocal('');
          onClear();
        }}
      >
        Limpar filtros
      </button>
    </aside>
  );
};
