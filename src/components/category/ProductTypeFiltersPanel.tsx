import { useEffect, useState, type ReactNode } from 'react';
import type {
  AvailableFilterInfo,
  ProductTypeFilterSelection,
} from '@/types/productType';

interface ProductTypeFiltersPanelProps {
  filters: AvailableFilterInfo[];
  value: ProductTypeFilterSelection[];
  onChange: (next: ProductTypeFilterSelection[]) => void;
  onClear: () => void;
}

/**
 * Painel lateral de filtros DINÂMICOS por Tipo de Produto (feature 003).
 *
 * Recebe os filtros disponíveis direto do response de
 * `/product/search-filtered` (`availableFilters`). O backend já entrega só
 * os filtros que têm valores no conjunto resultante e já ordenados por
 * `displayOrder` — re-ordenamos defensivamente.
 *
 * Widgets por `dataType`:
 *  - `enum` → radios usando `availableValues` (valores reais do banco).
 *  - `boolean` → Sim/Não/Indiferente (não depende de `availableValues`).
 *  - `text/integer/decimal` → input livre (ignoramos `availableValues`
 *    deliberadamente, pra preservar a UX atual de busca por substring/número).
 *
 * Backend hoje aceita 1 valor por filter (interseção AND), então usamos
 * radios/inputs únicos — não checkboxes múltiplos.
 *
 * Strings em pt-BR (constituição v3.0.0 — sem i18n).
 */
export const ProductTypeFiltersPanel = ({
  filters,
  value,
  onChange,
  onClear,
}: ProductTypeFiltersPanelProps) => {
  const ordered = [...filters].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  const valueById = new Map(value.map(v => [v.filterId, v.value] as const));

  const upsert = (filterId: number, next: string | null) => {
    const without = value.filter(v => v.filterId !== filterId);
    if (next === null || next === '') {
      onChange(without);
    } else {
      onChange([...without, { filterId, value: next }]);
    }
  };

  return (
    <aside
      className="mt-4"
      aria-label="Filtros do tipo de produto"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-line)',
        borderRadius: 'var(--radius)',
        padding: '1rem',
      }}
    >
      <header className="mb-3">
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--color-mute)',
          }}
        >
          Refinar resultados
        </p>
      </header>

      {ordered.map(filter => (
        <FilterGroup key={filter.filterId} filter={filter}>
          <FilterWidget
            filter={filter}
            value={valueById.get(filter.filterId) ?? null}
            onChange={next => upsert(filter.filterId, next)}
          />
        </FilterGroup>
      ))}

      <button
        type="button"
        className="w-full mt-2"
        style={{
          minHeight: 40,
          borderRadius: 'var(--radius-sm)',
          border: '1.5px solid var(--color-line)',
          background: 'var(--color-surface)',
          color: 'var(--color-cedro)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          cursor: 'pointer',
        }}
        onClick={onClear}
      >
        Limpar filtros
      </button>
    </aside>
  );
};

interface FilterGroupProps {
  filter: AvailableFilterInfo;
  children: ReactNode;
}

const FilterGroup = ({ filter, children }: FilterGroupProps) => (
  <div className="mb-4">
    <h3
      className="mb-2 flex items-center gap-2"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'var(--color-cedro)',
      }}
    >
      <span>{filter.label}</span>
      {filter.isRequired ? (
        <span
          aria-label="obrigatório no cadastro"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--color-cobre)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          obrigatório
        </span>
      ) : null}
    </h3>
    {children}
  </div>
);

interface FilterWidgetProps {
  filter: AvailableFilterInfo;
  value: string | null;
  onChange: (next: string | null) => void;
}

const FilterWidget = ({ filter, value, onChange }: FilterWidgetProps) => {
  switch (filter.dataType) {
    case 'text':
      return <TextWidget filter={filter} value={value} onChange={onChange} />;
    case 'integer':
      return (
        <NumberWidget
          filter={filter}
          value={value}
          onChange={onChange}
          step="1"
        />
      );
    case 'decimal':
      return (
        <NumberWidget
          filter={filter}
          value={value}
          onChange={onChange}
          step="0.01"
        />
      );
    case 'boolean':
      return <BooleanWidget filter={filter} value={value} onChange={onChange} />;
    case 'enum':
      return <EnumWidget filter={filter} value={value} onChange={onChange} />;
    default:
      return null;
  }
};

const inputBaseStyle = {
  width: '100%',
  minHeight: 40,
  padding: '0 0.75rem',
  borderRadius: 'var(--radius-sm)',
  border: '1.5px solid var(--color-line)',
  background: 'var(--color-surface)',
  color: 'var(--color-ink)',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.9rem',
} as const;

interface PrimitiveWidgetProps {
  filter: AvailableFilterInfo;
  value: string | null;
  onChange: (next: string | null) => void;
}

/**
 * `text` é renderizado como `<select>` listando apenas os valores que
 * existem nos produtos do conjunto resultante (`availableValues`). Commit
 * é imediato ao escolher uma opção.
 */
const TextWidget = ({ filter, value, onChange }: PrimitiveWidgetProps) => (
  <select
    value={value ?? ''}
    onChange={e => onChange(e.target.value === '' ? null : e.target.value)}
    aria-label={filter.label}
    style={inputBaseStyle}
  >
    <option value="">Todos</option>
    {filter.availableValues.map(opt => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
);

interface NumberWidgetProps extends PrimitiveWidgetProps {
  step: string;
}

const NumberWidget = ({ filter, value, onChange, step }: NumberWidgetProps) => {
  const [local, setLocal] = useState<string>(value ?? '');

  useEffect(() => {
    setLocal(value ?? '');
  }, [value]);

  const commit = () => {
    const trimmed = local.trim();
    if (trimmed === '') {
      if (value !== null) onChange(null);
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return;
    const normalized = step === '1' ? String(Math.trunc(n)) : String(n);
    if (normalized !== value) onChange(normalized);
  };

  return (
    <input
      type="number"
      step={step}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        }
      }}
      aria-label={filter.label}
      style={inputBaseStyle}
    />
  );
};

const BooleanWidget = ({ filter, value, onChange }: PrimitiveWidgetProps) => {
  const name = `pt-bool-${filter.filterId}`;
  return (
    <div role="radiogroup" aria-label={filter.label} className="flex flex-col gap-1.5">
      <RadioRow
        name={name}
        label="Indiferente"
        checked={value === null}
        onChange={() => onChange(null)}
      />
      <RadioRow
        name={name}
        label="Sim"
        checked={value === 'true'}
        onChange={() => onChange('true')}
      />
      <RadioRow
        name={name}
        label="Não"
        checked={value === 'false'}
        onChange={() => onChange('false')}
      />
    </div>
  );
};

/**
 * Backend aceita 1 valor por filter por busca (interseção AND), então
 * usamos radios — não checkboxes. Botão extra "Limpar este filtro"
 * remove a seleção sem mexer nos demais. `availableValues` traz só os
 * valores que de fato existem no conjunto resultante.
 */
const EnumWidget = ({ filter, value, onChange }: PrimitiveWidgetProps) => {
  const name = `pt-enum-${filter.filterId}`;
  return (
    <div role="radiogroup" aria-label={filter.label} className="flex flex-col gap-1.5">
      {filter.availableValues.map(allowed => (
        <RadioRow
          key={allowed}
          name={name}
          label={allowed}
          checked={value === allowed}
          onChange={() => onChange(allowed)}
        />
      ))}
      {value !== null ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="self-start mt-1"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-cobre)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Limpar este filtro
        </button>
      ) : null}
    </div>
  );
};

interface RadioRowProps {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}

const RadioRow = ({ name, label, checked, onChange }: RadioRowProps) => (
  <label
    className="flex items-center gap-2 py-1"
    style={{ fontSize: '0.9rem', color: 'var(--color-ink)', cursor: 'pointer' }}
  >
    <input
      type="radio"
      name={name}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4"
      style={{ accentColor: 'var(--color-oliva)' }}
    />
    <span>{label}</span>
  </label>
);
