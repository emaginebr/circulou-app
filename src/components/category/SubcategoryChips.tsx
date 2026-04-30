import type { CategoryNode } from '@/types/category';

interface SubcategoryChipsProps {
  subcategories: CategoryNode[];
  totalCount: number;
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
}

export const SubcategoryChips = ({
  subcategories,
  totalCount,
  activeSlug,
  onSelect,
}: SubcategoryChipsProps) => (
  <section
    aria-labelledby="subcat-title"
    className="sticky z-40"
    style={{
      top: 113,
      background: 'var(--color-page)',
      borderBottom: '1px solid var(--color-line)',
    }}
  >
    <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-10 py-5">
      <h2 id="subcat-title" className="sr-only">
        Subcategorias
      </h2>
      <ul
        className="flex flex-wrap gap-2.5 list-none p-0 m-0"
        role="list"
        style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
      >
        <li>
          <Chip
            label="Tudo"
            count={totalCount}
            active={activeSlug === null}
            onClick={() => onSelect(null)}
          />
        </li>
        {subcategories.map(sub => (
          <li key={sub.slug}>
            <Chip
              label={sub.name}
              count={sub.productCount}
              active={activeSlug === sub.slug}
              onClick={() => onSelect(sub.slug)}
            />
          </li>
        ))}
      </ul>
    </div>
  </section>
);

interface ChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

const Chip = ({ label, count, active, onClick }: ChipProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className="inline-flex items-center gap-2 whitespace-nowrap"
    style={{
      padding: '0.55rem 1rem',
      borderRadius: 999,
      border: '1.5px solid var(--color-line)',
      background: active ? 'var(--color-cedro)' : 'var(--color-surface)',
      borderColor: active ? 'var(--color-cedro)' : 'var(--color-line)',
      color: active ? 'var(--color-cru)' : 'var(--color-cedro)',
      fontSize: '0.9rem',
      fontWeight: 500,
      minHeight: 40,
      cursor: 'pointer',
      transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease',
    }}
  >
    {label}
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.1rem 0.55rem',
        borderRadius: 999,
        background: active ? 'var(--color-cobre)' : 'var(--color-areia-soft)',
        color: active ? 'var(--color-cru)' : 'var(--color-cedro)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        fontWeight: 500,
      }}
    >
      {count}
    </span>
  </button>
);
