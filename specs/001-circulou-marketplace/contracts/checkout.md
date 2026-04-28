# Contract — `Services/CheckoutService.ts`

**FRs cobertos**: FR-022, FR-023, FR-024, FR-025, FR-026.
**Gaps backend referenciados**: LOFN-G11.

## 1. Endpoint real consumido

### `POST {VITE_API_URL}/shopcart/insert`

Auth: autenticado (Bearer/Basic via NAuth) · Implementado pelo Lofn ✅ (write-only).

**Request body**:

```json
{
  "user": { "userId": 123, "name": "Rodrigo", "email": "rodrigo@example.com" },
  "address": {
    "zipCode": "01310-100",
    "address": "Av. Paulista, 1000",
    "complement": "Apto 12",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP"
  },
  "items": [
    { "product": { /* ProductInfo completo */ }, "quantity": 2 },
    ...
  ],
  "createdAt": "2026-04-27T17:35:00.000Z"
}
```

**Response body** (atual): retorna o input inalterado. Sem `orderId` gerado pelo
servidor — daí o mock LOFN-G11.

## 2. Algoritmo do checkout multi-loja

```ts
async function submit(cart: CartState, address: Address): Promise<OrderConfirmation> {
  const groups = groupedByStore(cart.items, knownStores);  // CartGroup[]
  const results: MockOrderId[] = [];

  for (const group of groups) {
    const body = {
      user: currentUser,                       // de useAuth()
      address: stripIdAndIsDefault(address),    // converte Address → ShopCartAddressInfo
      items: group.items,
      createdAt: new Date().toISOString()
    };

    try {
      await httpClient.post('/shopcart/insert', body);
      const orderId = generateMockOrderId(group.store.slug);  // MOCK :: LOFN-G11
      results.push({
        storeSlug: group.store.slug,
        storeName: group.store.name,
        orderId,
        items: group.items,
        subtotal: group.subtotal,
        status: 'submitted'
      });
    } catch (err) {
      results.push({
        storeSlug: group.store.slug,
        storeName: group.store.name,
        orderId: '',
        items: group.items,
        subtotal: group.subtotal,
        status: 'failed',
        errorMessage: extractMessage(err)
      });
    }
  }

  // Itens das lojas que falharam VOLTAM ao carrinho (não foram processados).
  const successfulProductIds = new Set(
    results.filter(r => r.status === 'submitted')
           .flatMap(r => r.items.map(i => i.product.productId))
  );
  const remainingItems = cart.items.filter(i => !successfulProductIds.has(i.product.productId));
  await CartService.save({ type: 'user', userId: currentUser.userId }, remainingItems);

  return {
    createdAt: new Date().toISOString(),
    shippingAddress: address,
    results,
    totalAll: results
      .filter(r => r.status === 'submitted')
      .reduce((sum, r) => sum + r.subtotal, 0)
  };
}
```

## 3. Geração de ID provisório (LOFN-G11)

```ts
// MOCK :: LOFN-G11 — orderId é gerado client-side; o backend não devolve um.
// Substituir pelo orderId retornado por /shopcart/insert quando o gap fechar.
// Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g11.
function generateMockOrderId(storeSlug: string): string {
  const ts = format(new Date(), 'yyyyMMdd-HHmmss');
  const rand = randomAlphanumeric(5);
  return `MOCK-${storeSlug}-${ts}-${rand}`;
}
```

## 4. Funções públicas

```ts
interface CheckoutService {
  // FR-024: dispara N inserts (um por loja). Retorna confirmation com IDs provisórios.
  submit(cart: CartState, address: Address): Promise<OrderConfirmation>;

  // Pré-validação para FR-026: confirma que todos os itens e lojas seguem ativos antes de iniciar.
  // Devolve [] quando OK; senão, devolve a lista de itens que precisam ser removidos/ajustados.
  validateAvailability(cart: CartState): Promise<{ unavailable: { productId: number; reason: string }[] }>;
}
```

## 5. Pré-condições (FR-022, FR-023, FR-026)

- `useCheckout` chama `validateAvailability` antes de habilitar "Confirmar pedido".
- A `CheckoutPage` exige `currentUser` (FR-022) — caso contrário redireciona para
  login mantendo o estado em `state.from = '/checkout'`.
- A `CheckoutPage` exige `address !== undefined` antes do submit (FR-023) — força a
  seleção/criação de pelo menos um endereço.

## 6. Página de confirmação efêmera (FR-025)

Após `submit()` retornar, o `useCheckout` faz:

```ts
navigate('/order-confirmation', { state: { confirmation }, replace: true });
```

Importante: `replace: true` impede o "voltar" do navegador de retornar ao checkout
(que já não é válido — o carrinho já foi mutado). A `OrderConfirmationPage` lê
`location.state.confirmation`. Se o estado estiver ausente (usuário recarregou ou
chegou via URL), redireciona para a home com toast "Confirmação não disponível".

## 7. Erros mapeados

| Cenário | Tratamento |
|---|---|
| Todas as lojas com sucesso | `OrderConfirmationPage` exibe N cards, todos com aviso "ID provisório". |
| Algumas lojas falham | Cards com `status: 'failed'` em destaque visual; itens dessas lojas voltam ao carrinho automaticamente; toast "Alguns pedidos não foram enviados — tente novamente do carrinho." |
| Todas as lojas falham | Não navega para `OrderConfirmationPage`; mantém na `CheckoutPage` com erro destacado. |
| 401 durante submit | `HttpClient` dispara `auth:expired` → fluxo padrão de re-login (FR-016) com retorno ao checkout. |
| Loja desativada entre review e submit | `validateAvailability` deve ter detectado (FR-026); se passou, o `submit` ainda assim falha graciosamente conforme acima. |
