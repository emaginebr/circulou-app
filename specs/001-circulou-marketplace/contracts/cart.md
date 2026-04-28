# Contract — `Services/CartService.ts`

**FRs cobertos**: FR-017, FR-018, FR-019, FR-020, FR-021.
**Gaps backend referenciados**: LOFN-G09 (persistência server-side), G10 (estrutura).

## 1. Strategy

Toda persistência do carrinho é **client-side** no MVP:

| Caso | Storage | Chave |
|---|---|---|
| Visitante anônimo (buffer pré-login) | `sessionStorage` | `circulou:cart:anon` |
| Usuário autenticado | `localStorage` | `circulou:cart:{userId}` |

Estrutura do valor armazenado (idêntica em ambos):

```json
{
  "updatedAt": "2026-04-27T17:30:00.000Z",
  "items": [
    { "productId": 1, "storeId": 5, "quantity": 2 },
    { "productId": 7, "storeId": 11, "quantity": 1 }
  ]
}
```

> **Nota**: o storage **persiste apenas `productId`, `storeId` e `quantity`** — não a
> snapshot completa do `ProductInfo`. Isso obriga o `CartContext` a re-buscar os
> dados frescos dos produtos no carregamento (preço pode ter mudado, item pode ter
> ficado inativo — FR-021). O re-fetch é um POST `/product/search` por produto
> hidratando `ProductInfo`, ou idealmente uma única chamada GraphQL `products(ids:[])`
> se o resolver suportar (a confirmar em `/speckit.tasks`).

## 2. Funções públicas

```ts
interface CartService {
  // Carrega o carrinho do storage e re-hidrata os ProductInfo via API.
  // Retorna { items, updatedAt, unavailableProductIds } — itens cujo produto/loja
  // estão inativos vêm marcados (FR-021) sem serem removidos do storage.
  load(scope: { type: 'anon' } | { type: 'user', userId: string }): Promise<CartState & { unavailableProductIds: number[] }>;

  // Sobrescreve completamente o carrinho (last-write-wins, FR-019).
  save(scope: { type: 'anon' } | { type: 'user', userId: string }, items: CartItem[]): Promise<void>;

  // Mescla o buffer anônimo no carrinho do usuário recém-logado.
  // Soma quantidades para o mesmo product, respeitando product.limit.
  // Apaga o buffer ao final.
  mergeAnonBufferIntoUser(userId: string): Promise<CartState>;

  // Adiciona um item respeitando product.limit.
  // MUST re-buscar o produto fresco antes de aceitar (FR-020 + edge case "limit reduzido"),
  // chamando ProductService.getByStoreAndSlug — sempre chamada fresca, sem cache TTL.
  // Retorna a quantidade efetiva no carrinho.
  // refusedReason:
  //   'unavailable'    → produto/loja inativos no momento do add
  //   'limit_exceeded' → qty > limit corrente; quantidade foi recortada no limite
  //   undefined        → adicionado integralmente
  add(scope, productId: number, qty: number): Promise<{ effectiveQty: number, refusedReason?: 'unavailable' | 'limit_exceeded' }>;

  // Atualiza a quantidade. qty <= 0 remove o item.
  update(scope, productId: number, qty: number): Promise<void>;

  // Remove um item específico.
  remove(scope, productId: number): Promise<void>;

  // Limpa o carrinho.
  clear(scope): Promise<void>;
}
```

## 3. Mock comments anchorados

```ts
// MOCK :: LOFN-G09 — persistir carrinho em localStorage por userId.
// Substituir por GET /shopcart/{userId} + PUT /shopcart/{userId} quando o gap fechar.
// Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g09.
```

```ts
// MOCK :: LOFN-G09 (buffer pré-login) — sessionStorage até o login.
// Após login, mergeAnonBufferIntoUser() é disparado pelo AuthContext.
```

## 4. Estrutura agrupada por loja (derivada em runtime)

`CartContext` expõe um seletor `groupedByStore(items)` para a `CartPage` (FR-018):

```ts
type CartGroup = {
  store: StoreInfo;
  items: CartItem[];
  subtotal: number;          // Σ (price - discount) * quantity
};

function groupedByStore(items: CartItem[], stores: StoreInfo[]): CartGroup[];
```

A ordem dos grupos é determinística: alfabética por `store.name` (case-insensitive,
sem diacríticos) — para que a UI seja estável entre re-renders.

## 5. Last-write-wins (FR-019)

Em um único dispositivo, `save` simplesmente sobrescreve o blob. `updatedAt` é
gravado a cada `save` em ISO 8601. Quando LOFN-G09 fechar (storage no servidor):

- `save` passará a ser `PUT /shopcart/{userId}` enviando `{ updatedAt, items }`.
- `load` será `GET /shopcart/{userId}` retornando o blob.
- Conflitos serão resolvidos pelo backend comparando `updatedAt` (a request com
  `updatedAt` mais recente sobrescreve; a outra recebe 409 e o cliente faz reload
  silencioso). Esse comportamento implementa LWW por carrinho inteiro (Q1 da clarify).

## 6. Tratamento de itens indisponíveis (FR-021)

`load()` devolve `unavailableProductIds`. A `CartPage`:

- Mantém os itens visíveis com badge "Indisponível";
- Desabilita o "Finalizar compra" enquanto houver pelo menos um item indisponível
  ou enquanto a loja estiver inativa (FR-026);
- Permite remoção manual; clicar em "Remover indisponíveis" remove em lote.

## 7. Erros mapeados

| Falha | Tratamento |
|---|---|
| `localStorage` cheio (`QuotaExceededError`) | Toast "Não foi possível salvar o carrinho. Libere espaço de armazenamento.". Estado mantido em memória; tentativa de re-save no próximo evento. |
| Storage corrompido (JSON inválido) | Limpar a chave + começar carrinho vazio. Log via `console.warn` (sem analytics no MVP). |
| Network error em re-hidratação de `ProductInfo` | Marcar todos os itens como `unavailable` temporariamente; oferecer "tentar novamente". |
