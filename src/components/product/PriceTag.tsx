import { calculateDiscountPercent, formatBRL } from '@/lib/currency';

interface PriceTagProps {
  price: number;
  discount: number;
}

export const PriceTag = ({ price, discount }: PriceTagProps) => {
  const final = Math.max(0, price - discount);
  const hasDiscount = discount > 0 && price > 0;
  const percent = hasDiscount ? calculateDiscountPercent(price, discount) : 0;
  return (
    <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1 mt-1">
      <strong
        className="price-now whitespace-nowrap"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          color: 'var(--color-cobre)',
        }}
      >
        {formatBRL(final)}
      </strong>
      {hasDiscount ? (
        <>
          <span
            className="price-old line-through whitespace-nowrap"
            style={{ fontSize: '0.85rem', color: 'var(--color-mute)' }}
          >
            {formatBRL(price)}
          </span>
          <span
            className="inline-block px-2 py-0.5 text-xs font-semibold rounded whitespace-nowrap"
            style={{
              background: 'var(--color-ambar)',
              color: 'var(--color-cedro)',
            }}
          >
            -{percent}%
          </span>
        </>
      ) : null}
    </div>
  );
};
