# Lofn API Gaps — Circulou MVP

**Created**: 2026-04-27
**Spec**: [spec.md](./spec.md)
**Constraint**: a spec do Circulou estabelece que o frontend deve consumir apenas
endpoints **já existentes** da API Lofn (REST + `POST /graphql` público) e do NAuth.
Para cada capacidade exigida pela spec sem cobertura backend, o MVP do Circulou
implementa um **mock local controlado no frontend** e o item correspondente é
registrado abaixo como trabalho futuro para a equipe Lofn.

> Volume-alvo do MVP: < 1.000 produtos agregados, < 10 lojas, baixíssimo tráfego — o que torna mocks client-side viáveis.

## Convenções deste documento

- **Status backend**: ✅ existente · ⚠ parcial · 🚫 ausente.
- **Estratégia MVP (frontend)**: o que o Circulou faz hoje, dentro do escopo desta spec, sem modificar o backend.
- **Trabalho futuro Lofn**: o que a equipe Lofn precisa entregar para que o mock possa ser removido. Cada item tem um identificador `LOFN-G##` que será referenciado no código do Circulou (em comentário ao lado do mock) para localização imediata na hora da substituição.

## Resumo visual

| ID | Capacidade exigida pela spec | FR | Status backend | Mock no MVP? |
|---|---|---|---|---|
| LOFN-G01 | Filtro de busca por **faixa de preço** (min/max) | FR-005 | 🚫 ausente em REST; verificar args do GraphQL `products` | Sim — filtro client-side sobre página fetched |
| LOFN-G02 | Filtro **"apenas em promoção"** (`discount > 0`) | FR-005 | 🚫 ausente em REST; verificar GraphQL | Sim — filtro client-side |
| LOFN-G03 | **Ordenação** (relevância, menor/maior preço, maior desconto, mais recentes) | FR-006 | 🚫 ausente em REST; possivelmente GraphQL | Sim — ordenação client-side; relevância calculada no front |
| LOFN-G04 | Listagem cross-store de **`featured = true`** na home | FR-004 | ⚠ GraphQL expõe `featuredProducts` (verificar args para multi-store) | Possivelmente não, se `featuredProducts` cobrir |
| LOFN-G05 | **Recuperar produto único** por (`storeSlug`, `productSlug`) | FR-010 | ⚠ ausente em REST; provável via GraphQL `products(...)` ou similar | Não, se GraphQL cobrir; senão mock por `productId` da listagem |
| LOFN-G06 | **Recuperar loja única** (nome, logo, slug) | FR-011, FR-012 | ⚠ GraphQL `storeBySlug` existe | Não, se `storeBySlug` cobrir |
| LOFN-G07 | **Listar todas as lojas ativas** (alimenta o filtro "loja" da busca unificada) | FR-005 | ⚠ GraphQL `stores` existe | Não, se `stores` cobrir |
| LOFN-G08 | **Listar categorias internas** de uma loja (filtro de categoria escopo de loja) | FR-011 | ⚠ ausente em REST; provável via GraphQL `storeBySlug.categories` | Não, se GraphQL cobrir |
| LOFN-G09 | **Persistir carrinho server-side** com leitura por usuário (cross-device) | FR-019, SC-008 | 🚫 `/shopcart/insert` é write-only e publica em fila | Sim — persistir em `localStorage` por usuário; sincronização cross-device fica desabilitada com aviso |
| LOFN-G10 | Carrinho **multi-loja** em uma única estrutura | FR-017, FR-018 | ✅ `ShopCartInfo.items` aceita itens com `storeId` arbitrário | Não — o tipo `ShopCartInfo` já tolera multi-loja |
| LOFN-G11 | **Submissão de checkout multi-loja** com retorno de identificadores de pedido | FR-024, FR-025 | ⚠ `/shopcart/insert` aceita itens multi-loja em uma chamada, mas é fire-and-forget (publica em RabbitMQ, não retorna IDs de pedido) | Sim — frontend envia uma chamada para `/shopcart/insert` por loja envolvida e gera **identificadores temporários** locais (UUID) para exibição efêmera na página de confirmação |
| LOFN-G12 | **Histórico de pedidos** por usuário | (fora de escopo nesta spec — confirmação efêmera, FR-025) | 🚫 ausente | Não — feature está fora de escopo. Item registrado apenas para visibilidade futura |
| LOFN-G13 | **CRUD de endereços** vinculados ao usuário (criar, atualizar, remover, listar) | FR-015 | 🚫 não há endpoints dedicados; `ShopCartAddressInfo` é embutido no insert de carrinho | Sim — endereços persistidos em `localStorage` por usuário; sincronização cross-device desabilitada com aviso |
| LOFN-G14 | **Default address** entre os endereços do usuário | FR-015 | 🚫 ausente | Sim — flag local no `localStorage` |
| LOFN-G15 | **Batch get de produtos por id** (re-hidratação eficiente do carrinho) | FR-021 (re-hidratação) | 🚫 ausente em REST; verificar se GraphQL `products(ids: [Int!])` existe | Sim — N chamadas paralelas com max 4 in-flight (fallback) |

## Detalhamento por item

### LOFN-G01 — Filtro de faixa de preço

- **Spec**: FR-005 (filtros: loja, faixa de preço, "apenas em promoção") + FR-007 (pré-fetch progressivo).
- **Backend hoje**: `POST /product/search` aceita `{ storeId?, userId?, keyword, onlyActive, pageNum, userSlug?, networkSlug? }`. Não há `minPrice` / `maxPrice`.
- **Estratégia MVP** (alinhada com FR-007 — pré-fetch progressivo):
  - Frontend aplica `price (após desconto) ∈ [min, max]` client-side, mas executa **pré-fetch progressivo** das páginas do servidor até preencher 12 itens visíveis pós-filtro, com teto de **5 páginas (60 itens) por interação**.
  - Atingido o teto, exibir contagem corrente e botão "Buscar mais" (estende em +5 páginas a cada clique).
  - Resultado: o filtro deixa de "limitar à página atual" e passa a varrer progressivamente o catálogo, dentro de um teto que protege o backend e o tempo de resposta.
- **Trabalho futuro Lofn (LOFN-G01)**: estender `ProductSearchParam` com `minPrice?: double`, `maxPrice?: double`. Quando entregue, o pré-fetch progressivo do FR-007 deixa de ser necessário para este filtro.

### LOFN-G02 — Filtro "apenas em promoção"

- **Spec**: FR-005 + FR-007.
- **Backend hoje**: nenhum filtro por `discount > 0`.
- **Estratégia MVP**: idêntica a G01 — filtro `discount > 0` client-side com pré-fetch progressivo (5 páginas / 60 itens por interação, botão "Buscar mais" para estender).
- **Trabalho futuro Lofn (LOFN-G02)**: estender `ProductSearchParam` com `onlyOnSale?: bool`.

### LOFN-G03 — Ordenação

- **Spec**: FR-006 + FR-007.
- **Backend hoje**: `/product/search` retorna em ordem implícita do servidor; sem parâmetro de ordenação. A definição de "relevância" da spec (match exato > prefixo > substring, desempate por `featured` + recente) é puramente client-side.
- **Estratégia MVP**:
  - O frontend ordena em memória sobre **todo o conjunto pré-fetched** (até o teto progressivo do FR-007 — 5 páginas / 60 itens, ou mais se o usuário clicar "Buscar mais").
  - Importante: a ordenação é estável apenas dentro do conjunto pré-fetched; ao clicar "Buscar mais", a ordem é recomputada com o novo conjunto agregado, sem reordenar itens já visualizados acima da dobra (para evitar "saltos" do que o usuário já viu).
- **Trabalho futuro Lofn (LOFN-G03)**: estender `ProductSearchParam` com `sortBy?: enum { relevance, priceAsc, priceDesc, discountDesc, recent }`. Implementar ranking de relevância no servidor. Quando entregue, o ordenar client-side fica restrito ao "estritamente necessário" (ex.: relevância híbrida).

### LOFN-G04 — Featured cross-store

- **Spec**: FR-004, home exibe destaque agregado de várias lojas.
- **Backend hoje**: GraphQL público expõe `featuredProducts` (conforme inventário). Validar se o resolver aceita ausência de filtro de loja para retornar destaque agregado e se respeita `onlyActive`.
- **Estratégia MVP**:
  - **Caminho preferido**: usar `featuredProducts` via GraphQL público se aceitar consulta cross-store.
  - **Fallback (mock)**: se `featuredProducts` exigir `storeSlug`, frontend faz N consultas (uma por loja conhecida) e concatena. Limite máximo de N controlado (ex.: até 10 lojas, dentro do volume-alvo POC).
- **Trabalho futuro Lofn (LOFN-G04)**: garantir resolver `featuredProducts` cross-store paginado e ordenado por mais recentes.

### LOFN-G05 — Produto único (detalhe)

- **Spec**: FR-010, página de detalhe do produto.
- **Backend hoje**: REST não expõe `GET /product/{id}` ou `GET /product/{storeSlug}/{productSlug}`. Lookup deve passar pelo GraphQL ou por uma busca por keyword igual ao slug.
- **Estratégia MVP**:
  - **Caminho preferido**: query GraphQL `products(...)` ou equivalente que aceite `productId`/`slug`.
  - **Fallback (mock)**: ao navegar da listagem para o detalhe, o frontend já carrega o `ProductInfo` completo da listagem em estado e o reusa na tela de detalhe; deep-link via URL avulsa não é garantido fora da sessão de listagem.
- **Trabalho futuro Lofn (LOFN-G05)**: expor `GET /product/{storeSlug}/{productSlug}` (ou query GraphQL dedicada `product(storeSlug, productSlug)`).

### LOFN-G06 — Loja única

- **Spec**: FR-011, FR-012.
- **Backend hoje**: GraphQL `storeBySlug` existe.
- **Estratégia MVP**: usar `storeBySlug` via GraphQL. Sem mock necessário se o resolver retornar logo, nome, slug e categorias.
- **Trabalho futuro Lofn**: nenhum, salvo se `storeBySlug` não retornar `categories[]` — neste caso, abrir item para incluir.

### LOFN-G07 — Listar todas as lojas

- **Spec**: FR-005 (filtro "loja específica" alimentado por uma lista de lojas conhecidas).
- **Backend hoje**: GraphQL `stores` existe (segundo inventário).
- **Estratégia MVP**: usar `stores` via GraphQL para popular o filtro lateral. Cache em memória durante a sessão (volume POC justifica).
- **Trabalho futuro Lofn**: garantir que `stores` retorne apenas lojas com `Status = Active` por padrão.

### LOFN-G08 — Categorias internas de uma loja

- **Spec**: FR-011 (filtro de categoria dentro da página da loja).
- **Backend hoje**: REST não tem `GET /category/{storeSlug}/list`. Provável via GraphQL `storeBySlug.categories`.
- **Estratégia MVP**: GraphQL `storeBySlug` se já trouxer `categories[]` aninhado; senão mock que infere categorias a partir dos produtos da loja (campo `category` do produto).
- **Trabalho futuro Lofn (LOFN-G08)**: expor `GET /category/{storeSlug}/list` ou garantir `categories[]` no resolver `storeBySlug`.

### LOFN-G09 — Persistência server-side do carrinho

- **Spec**: FR-019 (carrinho persiste entre sessões e dispositivos com last-write-wins); SC-008 (90% dos usuários recuperam carrinho ao logar em outro dispositivo).
- **Backend hoje**: `/shopcart/insert` apenas publica em RabbitMQ; não há `GET /shopcart/{userId}` nem leitura por usuário. O carrinho efetivamente não é storage server-side.
- **Estratégia MVP**:
  - Persistir o carrinho em `localStorage` chaveado pelo `userId` autenticado.
  - **SC-008 fica não-atendido neste MVP** — o usuário NÃO recupera o carrinho ao logar em outro dispositivo enquanto LOFN-G09 não for entregue. A spec ainda lista SC-008 como objetivo de longo prazo; o checklist de aceite do MVP MUST registrar esta limitação como conhecida e documentada (ver "Limitações conhecidas do MVP" abaixo).
  - O comportamento last-write-wins do FR-019 é trivialmente satisfeito por `localStorage` num único dispositivo (o último `set` sobrescreve).
- **Trabalho futuro Lofn (LOFN-G09)**: introduzir endpoints `GET /shopcart/{userId}` e `PUT /shopcart/{userId}` (ou `POST /shopcart/upsert`) com semântica last-write-wins (timestamp + carrinho inteiro). Isto destrava SC-008.

### LOFN-G10 — Carrinho multi-loja (estrutura)

- **Status**: ✅ já suportado pelo modelo `ShopCartInfo.items` (cada item carrega seu `storeId`). Sem ação para o backend.

### LOFN-G11 — Checkout multi-loja com retorno de IDs

- **Spec**: FR-024 (gera um pedido por loja), FR-025 (página de confirmação lista identificadores).
- **Backend hoje**: `/shopcart/insert` aceita itens com `storeId` heterogêneo, mas é fire-and-forget (publica em fila) e retorna o input. Não há geração nem retorno de identificador de pedido.
- **Estratégia MVP**:
  - O frontend particiona o carrinho por `storeId` antes do checkout e faz **uma chamada `/shopcart/insert` por loja**, sequencial (com limite de retentativas por loja).
  - Para cada chamada bem-sucedida, gera um **identificador temporário local** no formato `MOCK-{storeSlug}-{timestamp}-{random}` exibido na página de confirmação efêmera (FR-025).
  - A página de confirmação MUST sinalizar visualmente que os IDs são temporários ("Identificador provisório — confirme com a loja em caso de dúvida"), respeitando que a confirmação é efêmera.
  - Se uma das chamadas falhar, o frontend marca aquela loja como "não enviada" na confirmação e mantém os itens correspondentes no carrinho para nova tentativa — sem rollback das outras (consistente com a Assumption "pedido por loja é independente").
- **Trabalho futuro Lofn (LOFN-G11)**: retornar `OrderInfo` (com `orderId` per-store) síncronamente do `/shopcart/insert`, ou expor `POST /order/submit` com semântica explícita.

### LOFN-G12 — Histórico de pedidos

- **Status**: a spec coloca histórico **fora de escopo** (Clarifications Q4 — confirmação efêmera, sem tela de "Meus pedidos" e sem e-mail). Item registrado apenas para visibilidade no roadmap, sem ação no MVP.
- **Trabalho futuro Lofn (LOFN-G12)**: `GET /order/list?userId={id}` quando histórico for endereçado em spec posterior.

### LOFN-G13 — CRUD de endereços

- **Spec**: FR-015 (usuário gerencia lista de endereços: criar, atualizar, remover).
- **Backend hoje**: não há endpoints dedicados a endereço; `ShopCartAddressInfo` é embutido no insert do carrinho.
- **Estratégia MVP**:
  - Endereços persistidos em `localStorage` chaveados pelo `userId`.
  - No checkout, o endereço escolhido é injetado em `ShopCartAddressInfo` da chamada `/shopcart/insert` por loja.
  - Mesma limitação cross-device do LOFN-G09: endereços não migram entre dispositivos enquanto este gap não for fechado. Deve estar listado nas "Limitações conhecidas do MVP".
- **Trabalho futuro Lofn (LOFN-G13)**: expor `GET /user/{userId}/address`, `POST`, `PUT /{addressId}`, `DELETE /{addressId}`. Alternativamente, integrar com NAuth se o serviço de identidade já provê endereços (validar com a equipe NAuth).

### LOFN-G14 — Default address

- **Spec**: FR-015 ("escolher um como padrão").
- **Backend hoje**: ausente como propriedade.
- **Estratégia MVP**: flag `isDefault` armazenada junto com cada endereço em `localStorage`.
- **Trabalho futuro Lofn (LOFN-G14)**: incluir flag `isDefault` no schema de endereço quando LOFN-G13 for endereçado.

### LOFN-G15 — Batch get de produtos por id

- **Spec**: o carrinho persiste apenas `productId`/`storeId`/`quantity` (data-model.md §2.4); ao carregar, re-hidratar `ProductInfo` para validar disponibilidade (FR-021) e exibir preço/desconto/imagem atuais.
- **Backend hoje**: `POST /product/search` aceita `keyword` e `storeId`, mas não `ids[]`. Existência do resolver GraphQL `products(ids: [Int!])` é incerta — precisa confirmação durante `/speckit.tasks` ou no spike de auth (T048a) por proximidade.
- **Estratégia MVP**:
  - **Caminho preferido**: GraphQL `products(ids: [...])` se disponível.
  - **Fallback (mock)**: N chamadas paralelas a `POST /product/search { storeId, keyword: slug, onlyActive: false }` com max 4 in-flight; aceitável em volume-alvo POC (carrinho típico ≤ 20 itens). Marcar com `// MOCK :: LOFN-G15`.
  - Cada chamada pode falhar individualmente — itens cuja recuperação falhar são marcados como `unavailable` mas mantidos no carrinho (FR-021).
- **Trabalho futuro Lofn (LOFN-G15)**: expor `POST /product/getMany { productIds: number[] }` retornando `ProductInfo[]`, ou garantir resolver `products(ids: [Int!])` no GraphQL público. Quando entregue, o fallback paralelo é trocado por uma única chamada batched.

## Limitações conhecidas do MVP (resultantes dos gaps)

- **Carrinho não sincroniza entre dispositivos** (LOFN-G09). SC-008 fica em modo "objetivo declarado, não exigido para o MVP". O critério MUST ser reativado quando G09 for entregue.
- **Endereços não migram entre dispositivos** (LOFN-G13). A página de checkout exige re-cadastro do endereço ao usar dispositivo novo.
- **Filtros price-range / "em promoção" e ordenação operam via pré-fetch progressivo** (G01–G03 + FR-007), com teto de 5 páginas (60 itens) por interação e botão "Buscar mais" para estender. A contagem total exata de resultados pós-filtro só é conhecida ao esgotar o catálogo via "Buscar mais"; até lá, exibe-se a contagem corrente do conjunto já pré-fetched. Em volume-alvo POC isso raramente é perceptível.
- **Identificadores de pedido são provisórios** (LOFN-G11). Comunicar ao usuário na tela de confirmação.

## Como referenciar este documento no código do Circulou

Cada mock implementado no frontend MUST ter um comentário acima da definição com o
identificador correspondente, no formato:

```ts
// MOCK :: LOFN-G01 — filtro client-side de faixa de preço.
// Substituir por minPrice/maxPrice em ProductSearchParam quando o gap for fechado no Lofn.
// Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g01.
```

Esse comentário é a única dependência textual entre código e spec — faz com que a
substituição do mock pelo endpoint real seja localizável por busca em `MOCK :: LOFN-G`.

## Histórico de mudanças

- **2026-04-27**: criação. 14 itens identificados (G01–G14). Origem: amendment da spec via `/speckit.specify` "apenas alterar uma especificação".
