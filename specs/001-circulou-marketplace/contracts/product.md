# Contract — `Services/ProductService.ts`

**FRs cobertos**: FR-010, US4 cenário 5 (produto inativo).
**Gaps backend referenciados**: LOFN-G05.

## 1. Origem preferida — `state` do React Router

Quando o usuário clica em um produto da listagem (`SearchResultsPage`, `HomePage`,
`StorePage`), o `ProductCard` navega via:

```ts
navigate(`/product/${storeSlug}/${productSlug}`, { state: { product } });
```

A `ProductPage` lê `location.state.product` primeiro:

```ts
const product = location.state?.product as ProductInfo | undefined;
```

Sem chamada ao backend nesse caminho ✅ — é o caso comum.

## 2. Origem secundária — deep-link sem state

Quando o usuário acessa `/product/:storeSlug/:productSlug` diretamente (link
compartilhado, recarga da página), `state` está ausente. O Service tenta:

### 2.1 GraphQL — preferencial

```graphql
query ProductByStoreAndSlug($storeSlug: String!, $productSlug: String!) {
  products(storeSlug: $storeSlug, slug: $productSlug, onlyActive: false) {
    productId
    storeId
    slug
    name
    description
    price
    discount
    frequency
    limit
    status
    productType
    featured
    imageUrl
    images { imageId imageUrl sortOrder }
    categoryId
    createdAt
    updatedAt
  }
}
```

> **Nota**: o nome exato do resolver e dos parâmetros do GraphQL Lofn deve ser
> confirmado em `/speckit.tasks` antes da implementação. Caso o resolver não aceite
> filtro por slug, a opção é `products(storeSlug: $slug)` + filtro client-side por
> `slug`. Em ambos os casos a chamada é única e idempotente.

### 2.2 Fallback REST

Se GraphQL não cobrir, fallback para `POST /product/search { storeId, keyword: productSlug, onlyActive: false, pageNum: 1 }` e match exato por `slug` no resultado.

```ts
// MOCK :: LOFN-G05 — não há GET /product/{storeSlug}/{productSlug}; recuperar via search/keyword.
// Substituir por GET /product/{storeSlug}/{productSlug} quando o gap fechar.
// Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g05.
```

## 3. Funções públicas

```ts
interface ProductService {
  // FR-010: tenta state → GraphQL → REST fallback.
  // Retorna null quando o produto não existe ou está inativo.
  getByStoreAndSlug(
    storeSlug: string,
    productSlug: string,
    options?: { allowInactive?: boolean }
  ): Promise<ProductInfo | null>;

  // listImages é raramente usado isoladamente — o galeria já vem em `product.images`.
  // Mantido para futura tela de gerência de imagens.
  listImages?(productId: number): Promise<ProductImageInfo[]>;
}
```

## 4. Validação de "indisponível" (US4 cenário 5, FR-026)

Quando o resultado é não-nulo mas `product.status !== Active` ou `store.status !== Active`,
a `ProductPage` ainda renderiza nome/imagem mas:

- O botão "Adicionar ao carrinho" é substituído por um aviso "Produto indisponível".
- A API de adição (`CartContext.add`) recusa o item caso seja chamada por bypass.

## 5. Erros mapeados

| Falha | Tratamento |
|---|---|
| 404 / produto inexistente | Retornar `null`. `ProductPage` mostra estado "Produto não encontrado" + link para home. |
| Loja inativa | Tratado igual a "indisponível"; deixa a página acessível para histórico do link compartilhado. |
| Network error | Toast + estado de erro; recarregar restaura. |
