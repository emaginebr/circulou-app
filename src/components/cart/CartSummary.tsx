import { useTranslation } from 'react-i18next';
import { formatBRL } from '@/lib/currency';

interface CartSummaryProps {
  total: number;
  canCheckout: boolean;
  onCheckout: () => void;
}

export const CartSummary = ({ total, canCheckout, onCheckout }: CartSummaryProps) => {
  const { t } = useTranslation('cart');
  return (
    <aside className="bg-white border border-gray-200 rounded-[var(--radius)] p-4 sticky top-4">
      <div className="flex justify-between items-baseline mb-3">
        <span>{t('total')}</span>
        <strong className="text-xl">{formatBRL(total)}</strong>
      </div>
      <button
        type="button"
        className="w-full inline-flex justify-center items-center px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius)] hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onCheckout}
        disabled={!canCheckout}
      >
        {t('checkout')}
      </button>
    </aside>
  );
};
