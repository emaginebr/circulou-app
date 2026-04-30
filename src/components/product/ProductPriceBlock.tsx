import { calculateDiscountPercent, calculateFinalPrice, formatBRL } from '@/lib/currency';

interface ProductPriceBlockProps {
  price: number;
  discount: number;
}

export const ProductPriceBlock = ({ price, discount }: ProductPriceBlockProps) => {
  const final = calculateFinalPrice(price, discount);
  const hasDiscount = discount > 0 && price > 0;
  const percent = hasDiscount ? calculateDiscountPercent(price, discount) : 0;

  return (
    <div
      className="flex items-baseline flex-wrap gap-3.5 py-2"
      style={{
        borderTop: '1px dashed var(--color-line)',
        borderBottom: '1px dashed var(--color-line)',
      }}
    >
      <strong
        aria-label={`Preço atual: ${formatBRL(final)}`}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
          color: 'var(--color-cobre)',
          lineHeight: 1,
          fontWeight: 400,
        }}
      >
        {formatBRL(final)}
      </strong>
      {hasDiscount ? (
        <>
          <span
            aria-label={`Preço original: ${formatBRL(price)}`}
            className="line-through"
            style={{
              fontSize: '1rem',
              color: 'var(--color-mute)',
            }}
          >
            {formatBRL(price)}
          </span>
          <span
            aria-label={`Desconto de ${percent}%`}
            className="inline-flex items-center"
            style={{
              padding: '0.3rem 0.7rem',
              borderRadius: 999,
              background: 'var(--color-cobre)',
              color: 'var(--color-cru)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              letterSpacing: '0.05em',
            }}
          >
            −{percent}%
          </span>
        </>
      ) : null}
    </div>
  );
};
