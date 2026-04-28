# Contract — `Services/AddressService.ts`

**FRs cobertos**: FR-015 (CRUD de endereços + escolher default).
**Gaps backend referenciados**: LOFN-G13, G14.

## 1. Strategy

CRUD inteiramente client-side em `localStorage`:

| Chave | Valor |
|---|---|
| `circulou:addresses:{userId}` | `Address[]` |

```ts
interface Address {
  addressId: string;       // UUID v4 client-side
  zipCode: string;
  address: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
  createdAt: string;       // ISO 8601
}
```

> Nenhum endpoint Lofn é chamado. Quando LOFN-G13 abrir os endpoints REST, o
> Service muda completo de implementação mas mantém esta interface.

## 2. Funções públicas

```ts
interface AddressService {
  list(userId: string): Promise<Address[]>;
  get(userId: string, addressId: string): Promise<Address | null>;
  create(userId: string, draft: Omit<Address, 'addressId' | 'createdAt'>): Promise<Address>;
  update(userId: string, addressId: string, patch: Partial<Address>): Promise<Address>;
  remove(userId: string, addressId: string): Promise<void>;
  setDefault(userId: string, addressId: string): Promise<void>;  // mock LOFN-G14
}
```

## 3. Mock comments anchorados

```ts
// MOCK :: LOFN-G13 — endereços CRUD em localStorage por userId.
// Substituir por /user/{userId}/address (GET/POST/PUT/DELETE) quando o gap fechar.
// Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g13.
```

```ts
// MOCK :: LOFN-G14 — flag isDefault armazenada no Address.
// Substituir por endpoint dedicado (ou propriedade no schema) quando o gap fechar.
// Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g14.
```

## 4. Invariantes (validados em `update` e `setDefault`)

- No máximo um endereço com `isDefault === true` por `userId`.
- `setDefault(addressId)` força os demais a `false` no mesmo storage write
  (operação atômica do ponto de vista do Context).
- `remove(addressId)` onde `address.isDefault === true`:
  - Se houver outro endereço, eleger automaticamente o de maior `createdAt` como
    novo default;
  - Se a lista ficar vazia, salvar array vazio. A próxima visita ao checkout
    pedirá cadastro (FR-023).

## 5. Validações de campos (UI level — espelhadas no Service)

| Campo | Regra |
|---|---|
| `zipCode` | regex `^\d{5}-?\d{3}$` (CEP brasileiro) |
| `address` | min 3 caracteres, max 200 |
| `neighborhood` | min 2, max 100 |
| `city` | min 2, max 100 |
| `state` | exatamente 2 caracteres (UF) |
| `complement` | max 100, opcional |

Validação primária está nos componentes de form (`AddressForm.tsx`); o Service
re-valida e lança erro se receber dado inválido — defesa em profundidade.

## 6. Conversão para `ShopCartAddressInfo` no checkout

`CheckoutService.submit` recebe um `Address` mas envia ao backend o
`ShopCartAddressInfo` (sem `addressId`, `isDefault`, `createdAt`):

```ts
function toShopCartAddress(a: Address): ShopCartAddressInfo {
  const { addressId, isDefault, createdAt, ...rest } = a;
  return rest;
}
```
