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
    <div className="flex items-baseline gap-2">
      <strong className="text-xl text-[var(--color-primary)]">{formatBRL(final)}</strong>
      {hasDiscount ? (
        <>
          <span className="text-sm text-[var(--color-mute)] line-through">
            {formatBRL(price)}
          </span>
          <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-[var(--color-warning)] text-gray-900">
            -{percent}%
          </span>
        </>
      ) : null}
    </div>
  );
};
