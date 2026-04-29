import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useStores } from '@/hooks/useStores';
import { useAddresses } from '@/hooks/useAddresses';
import { checkoutService } from '@/Services/CheckoutService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { OrderReview } from '@/components/checkout/OrderReview';
import { AddressPicker } from '@/components/checkout/AddressPicker';
import type { Address } from '@/types/address';
import type { CartScope } from '@/types/cart';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { items, productsById, refresh: refreshCart } = useCart();
  const { storesById } = useStores();
  const { addresses, defaultAddress } = useAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (!selectedAddressId && defaultAddress) {
      setSelectedAddressId(defaultAddress.addressId);
    }
  }, [defaultAddress, selectedAddressId]);

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: '/checkout' }} />;
  }
  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const selectedAddress: Address | undefined =
    addresses.find(a => a.addressId === selectedAddressId) ?? undefined;

  const handleConfirm = async () => {
    if (!selectedAddress) {
      toast.warning('Selecione um endereço de entrega.');
      return;
    }
    setValidating(true);
    const { unavailable } = await checkoutService.validateAvailability(items, storesById);
    setValidating(false);
    if (unavailable.length > 0) {
      toast.error('Há itens indisponíveis. Volte ao carrinho para revisar.');
      await refreshCart();
      navigate('/cart');
      return;
    }

    setSubmitting(true);
    try {
      const cartScope: CartScope = { type: 'user', userId: String(user.userId) };
      const confirmation = await checkoutService.submit(
        items,
        productsById,
        storesById,
        selectedAddress,
        { userId: user.userId, name: user.name, email: user.email },
        cartScope,
      );
      await refreshCart();
      navigate('/order-confirmation', {
        state: { confirmation },
        replace: true,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao finalizar compra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7">
          <h2 className="text-lg font-semibold mb-3">Endereço de entrega</h2>
          <AddressPicker selectedId={selectedAddressId} onSelect={setSelectedAddressId} />
          {selectedAddress ? (
            <>
              <hr className="border-gray-200 my-4" />
              <h2 className="text-lg font-semibold mb-3">Revisar pedido</h2>
              <OrderReview
                items={items}
                productsById={productsById}
                storesById={storesById}
                address={selectedAddress}
              />
            </>
          ) : null}
        </div>
        <div className="col-span-12 lg:col-span-5">
          <aside className="bg-white border border-gray-200 rounded-[var(--radius)] sticky top-4">
            <div className="p-4">
              <button
                type="button"
                className="w-full inline-flex justify-center items-center px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius)] hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => void handleConfirm()}
                disabled={!selectedAddress || submitting || validating}
              >
                {submitting || validating ? '...' : 'Confirmar pedido'}
              </button>
              <small className="block text-center text-[var(--color-mute)] mt-2">
                Identificadores de pedido são provisórios (LOFN-G11).
              </small>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};
