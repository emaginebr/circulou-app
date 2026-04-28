import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { OrderConfirmation } from '@/types/order';
import { formatBRL } from '@/lib/currency';

interface LocationStateWithConfirmation {
  confirmation?: OrderConfirmation;
}

export const OrderConfirmationPage = () => {
  const { t } = useTranslation('checkout');
  const location = useLocation();
  const state = location.state as LocationStateWithConfirmation | null;
  const confirmation = state?.confirmation;

  useEffect(() => {
    if (!confirmation) {
      toast.warning('Confirmação não disponível.');
    }
  }, [confirmation]);

  if (!confirmation) return <Navigate to="/" replace />;

  const succeeded = confirmation.groups.filter(g => g.orderId !== null);
  const failed = confirmation.groups.filter(g => g.orderId === null);

  return (
    <section className="max-w-7xl mx-auto px-4 py-4">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold mb-1">Pedido(s) realizados</h1>
        <p
          className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-[var(--radius)] p-3 text-sm mb-0"
          role="status"
        >
          {t('ephemeralWarning')}
        </p>
      </header>

      {succeeded.length > 0 ? (
        <>
          <h2 className="text-lg font-semibold mb-3">Confirmações</h2>
          <div className="grid grid-cols-12 gap-3 mb-4">
            {succeeded.map(g => (
              <div key={g.orderId} className="col-span-12 md:col-span-6">
                <article className="bg-white border border-gray-200 rounded-[var(--radius)] h-full flex flex-col">
                  <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <strong>{g.store.name}</strong>
                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-[var(--color-warning)] text-white">
                      {t('provisionalIdBadge')}
                    </span>
                  </header>
                  <div className="p-4">
                    <p className="text-sm text-[var(--color-mute)] mb-1">ID:</p>
                    <code className="block text-sm mb-2">{g.orderId}</code>
                    <p className="text-sm mb-1">Itens:</p>
                    <ul className="list-none ps-0 text-sm mb-2">
                      {g.items.map(it => (
                        <li key={it.productId}>
                          #{it.productId} × {it.quantity}
                        </li>
                      ))}
                    </ul>
                    <p className="mb-1">
                      Subtotal: <strong>{formatBRL(g.subtotal)}</strong>
                    </p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {failed.length > 0 ? (
        <>
          <h2 className="text-lg font-semibold text-[var(--color-danger)] mb-3">
            Pedidos não enviados
          </h2>
          <div className="grid grid-cols-12 gap-3 mb-4">
            {failed.map((g, idx) => (
              <div key={`${g.store.storeId}-${idx}`} className="col-span-12 md:col-span-6">
                <article className="bg-white border border-[var(--color-danger)] rounded-[var(--radius)] h-full flex flex-col">
                  <header className="px-4 py-3 bg-[var(--color-danger)] text-white rounded-t-[var(--radius)]">
                    {g.store.name}
                  </header>
                  <div className="p-4">
                    <p className="text-sm">
                      Falha: <em>{g.errorMessage ?? 'Erro desconhecido'}</em>
                    </p>
                    <p className="text-sm text-[var(--color-mute)]">
                      Os itens desta loja foram mantidos no seu carrinho. Tente novamente.
                    </p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-[var(--radius)]">
        <div className="p-4 flex justify-between items-center">
          <span>Total geral confirmado</span>
          <strong className="text-xl">{formatBRL(confirmation.total)}</strong>
        </div>
      </div>
    </section>
  );
};
