import type {
  ProductAttributes as ProductAttributesData,
  ProductAttributesGroup,
} from '@/types/productAttributes';

interface ProductAttributesProps {
  attributes: ProductAttributesData;
}

const isCodeValue = (label: string): boolean => {
  const l = label.toLowerCase();
  return (
    l.includes('tamanho') ||
    l === 'composição' ||
    l.startsWith('tam.')
  );
};

export const ProductAttributes = ({ attributes }: ProductAttributesProps) => {
  const groups = attributes.groups.filter(g => g.items.length > 0);
  if (groups.length === 0) return null;

  return (
    <section
      aria-labelledby="pdp-attrs-title"
      className="pt-4"
      style={{ borderTop: '1px dashed var(--color-line)' }}
    >
      <h2
        id="pdp-attrs-title"
        className="inline-flex items-center gap-2"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-cedro)',
          marginBottom: '1rem',
        }}
      >
        <span aria-hidden="true" style={{ color: 'var(--color-cobre)' }}>
          ▣
        </span>
        Características do produto
      </h2>

      <div className="pdp-attrs-grid">
        {groups.map(group => (
          <AttributeGroup key={group.title} group={group} />
        ))}
      </div>

      <style>{`
        .pdp-attrs-grid {
          display: grid;
          /* auto-fit: 1 grupo ocupa toda a largura; 2+ se distribuem
             em colunas de no mínimo 220px. */
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.75rem;
        }
        .pdp-attrs-grid > .pdp-attrs--Cuidados {
          grid-column: 1 / -1;
        }
        @media (max-width: 640px) {
          .pdp-attrs-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
          .pdp-attrs-grid > .pdp-attrs--Cuidados {
            grid-column: auto;
          }
        }
      `}</style>
    </section>
  );
};

interface AttributeGroupProps {
  group: ProductAttributesGroup;
}

const ICON_BY_TITLE: Record<string, string> = {
  Geral: '▲',
  Medidas: '◇',
  Cuidados: '○',
};

const AttributeGroup = ({ group }: AttributeGroupProps) => (
  <div className={`pdp-attrs--${group.title}`}>
    {group.title !== 'Geral' ? (
      <h3
        className="flex items-center gap-2 mb-4 pb-2"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-cedro)',
          borderBottom: '1.5px solid var(--color-cedro)',
          fontWeight: 500,
        }}
      >
        <span aria-hidden="true" style={{ color: 'var(--color-cobre)', fontSize: '0.7rem' }}>
          {ICON_BY_TITLE[group.title] ?? '▲'}
        </span>
        {group.title}
      </h3>
    ) : null}
    <dl
      className="m-0 grid items-baseline"
      style={{
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
        gap: '0.6rem 1rem',
      }}
    >
      {group.items.map(item => (
        <AttributeItem key={item.label} label={item.label} value={item.value} />
      ))}
    </dl>
  </div>
);

interface AttributeItemProps {
  label: string;
  value: string;
}

const AttributeItem = ({ label, value }: AttributeItemProps) => (
  <>
    <dt
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '0.85rem',
        color: 'var(--color-mute)',
        fontWeight: 500,
      }}
    >
      {label}
    </dt>
    <dd
      className="m-0"
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '0.92rem',
        color: 'var(--color-ink)',
        fontWeight: 600,
      }}
    >
      {isCodeValue(label) ? (
        <code
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: 'var(--color-cedro)',
            background: 'var(--color-areia-soft)',
            padding: '0.1rem 0.4rem',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {value}
        </code>
      ) : (
        value
      )}
    </dd>
  </>
);
