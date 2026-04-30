import type { ProductInfo } from '@/types/product';
import { ProductStatusEnum } from '@/types/product';
import type { ProductAttributes } from '@/types/productAttributes';

interface ProductStateBadgesProps {
  product: ProductInfo;
  attributes: ProductAttributes | null;
}

interface BadgeSpec {
  key: string;
  label: string;
  variant: 'unique' | 'new' | 'sale' | 'sold';
}

const VARIANT_STYLES: Record<BadgeSpec['variant'], { bg: string; color: string }> = {
  unique: { bg: 'var(--color-ambar)', color: 'var(--color-cedro)' },
  new: { bg: 'var(--color-ambar-soft)', color: 'var(--color-cedro)' },
  sale: { bg: 'var(--color-cobre)', color: 'var(--color-cru)' },
  sold: { bg: 'var(--color-tinta)', color: 'var(--color-cru)' },
};

export const ProductStateBadges = ({ product, attributes }: ProductStateBadgesProps) => {
  const badges: BadgeSpec[] = [];
  const isInactive = product.status !== ProductStatusEnum.Active;
  const limitOne = product.limit === 1;
  const newWithTag = attributes?.condition === 'new-with-tag';
  const onSale = product.discount > 0 && product.price > 0;
  const heavyDiscount = onSale && product.discount / product.price > 0.5;

  if (isInactive) {
    badges.push({ key: 'sold', variant: 'sold', label: 'Esta peça já circulou' });
    return renderList(badges);
  }

  if (limitOne) {
    badges.push({
      key: 'unique',
      variant: 'unique',
      label: '★ Só essa! Última peça em estoque',
    });
  }
  if (newWithTag) {
    badges.push({ key: 'new', variant: 'new', label: 'Nova com etiqueta' });
  }
  if (heavyDiscount) {
    badges.push({ key: 'sale', variant: 'sale', label: 'Last chance' });
  }

  return renderList(badges);
};

const renderList = (badges: BadgeSpec[]) => {
  if (badges.length === 0) return null;
  return (
    <div
      role="group"
      aria-label="Estado da peça"
      className="flex flex-wrap gap-2"
    >
      {badges.map(b => {
        const style = VARIANT_STYLES[b.variant];
        return (
          <span
            key={b.key}
            className="inline-flex items-center gap-1.5"
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 999,
              background: style.bg,
              color: style.color,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {b.label}
          </span>
        );
      })}
    </div>
  );
};
