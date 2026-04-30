import { Link } from 'react-router-dom';
import type { StoreInfo } from '@/types/store';
import type { StoreReputation } from '@/types/storeReputation';

interface ProductSellerCompactProps {
  store: StoreInfo;
  reputation: StoreReputation;
}

const formatSalesCount = (count: number): string => {
  if (count >= 1000) {
    const thousands = (count / 1000).toFixed(count % 1000 === 0 ? 0 : 1);
    return `${thousands.replace('.', ',')} mil`;
  }
  return String(count);
};

export const ProductSellerCompact = ({ store, reputation }: ProductSellerCompactProps) => {
  const formattedRating = reputation.rating.toFixed(1).replace('.', ',');
  const stars = '★★★★★';

  return (
    <aside
      aria-labelledby="pdp-seller-title"
      className="grid items-center gap-3.5 pdp-seller"
      style={{
        gridTemplateColumns: '56px minmax(0, 1fr) auto',
        padding: '0.95rem 1rem',
        background: 'var(--color-areia)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-line)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundImage: store.logoUrl ? `url(${store.logoUrl})` : undefined,
          backgroundColor: 'var(--color-areia-soft)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '2px solid var(--color-cru)',
        }}
      />

      <div style={{ minWidth: 0 }}>
        <p
          className="m-0"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-mute)',
            marginBottom: '0.15rem',
          }}
        >
          Vendido por
        </p>
        <h3
          id="pdp-seller-title"
          className="m-0"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.15rem',
            color: 'var(--color-cedro)',
            lineHeight: 1.1,
            marginBottom: '0.25rem',
          }}
        >
          {store.name}
        </h3>
        <div
          className="flex flex-wrap items-center gap-1.5"
          style={{ fontSize: '0.78rem', color: 'var(--color-ink-soft)' }}
        >
          <span
            aria-label={`Avaliação ${formattedRating} de 5`}
            style={{ color: 'var(--color-ambar)', letterSpacing: '0.05em' }}
          >
            {stars}
          </span>
          <strong style={{ color: 'var(--color-cedro)' }}>{formattedRating}</strong>
          <span aria-hidden="true" style={{ color: 'var(--color-mute)' }}>
            ·
          </span>
          <span>{formatSalesCount(reputation.salesCount)} produtos vendidos</span>
          <span aria-hidden="true" style={{ color: 'var(--color-mute)' }}>
            ·
          </span>
          <span>
            {reputation.city}/{reputation.state}
          </span>
        </div>
      </div>

      <Link
        to={`/loja/${store.slug}`}
        className="circulou-btn-ghost no-underline pdp-seller-cta"
        style={{
          fontSize: '0.85rem',
          padding: '0.55rem 0.9rem',
          minHeight: 40,
        }}
      >
        Ver loja →
      </Link>

      <style>{`
        @media (max-width: 520px) {
          .pdp-seller {
            grid-template-columns: 48px minmax(0, 1fr) !important;
          }
          .pdp-seller > .pdp-seller-cta {
            grid-column: 1 / -1;
            margin-top: 0.5rem;
          }
        }
      `}</style>
    </aside>
  );
};
