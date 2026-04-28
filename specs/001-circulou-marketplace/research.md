# Phase 0 Research — Circulou Marketplace

**Date**: 2026-04-27
**Plan**: [plan.md](./plan.md)
**Spec**: [spec.md](./spec.md)
**Backend gaps**: [lofn-api-gaps.md](./lofn-api-gaps.md)

## Status of NEEDS CLARIFICATION

Nenhum marcador `NEEDS CLARIFICATION` permanece — todos os pontos críticos foram
resolvidos em duas sessões de `/speckit.clarify` (11 perguntas registradas em
`spec.md#clarifications`). Esta fase apenas consolida decisões técnicas a partir
das clarificações e da constituição v1.0.0.

## Decisões técnicas

### D1. Test framework

- **Decision**: Vitest 1.x + `@testing-library/react` + `@testing-library/user-event` para unit/component; **MSW** (Mock Service Worker) para isolar `fetch` em testes que tocam `Services/*`.
- **Rationale**: a constituição não pina test framework, mas Vite 6 + Vitest é o pareamento de fato (compartilham config, transformer e watch mode). MSW evita que mocks de `Services/*` divirjam dos contratos REST/GraphQL reais. Playwright fica como sucessor opcional para e2e quando o MVP estabilizar.
- **Alternatives considered**:
  - Jest + ts-jest + babel-jest — pareamento histórico, mas duplica config Vite e tem overhead de transformer.
  - Cypress — bom para e2e, mas pesa para component tests; descartado neste estágio.
  - Stub direto de `fetch` com `vi.fn()` — funciona mas afasta os testes do contrato real (cabeçalhos, query strings); MSW captura no nível do request handler, mais fiel à integração.

### D2. Estado global e provider chain

- **Decision**: Context API + hooks dedicados (um Service + um Context + um hook por entidade), montados em `main.tsx` na ordem que o skill `/react-architecture` define em `/speckit.tasks`. Sem Redux/Zustand/Recoil/MobX.
- **Rationale**: constituição Princípio II + Stack Restrictions proibem state-management externo; volume-alvo POC absorve confortavelmente o custo de re-render do Context API; o skill `react-architecture` já encoda o padrão `handleError`/`clearError`/`loading`.
- **Alternatives considered**:
  - Zustand/Jotai — descartados pelas restrições da constituição.
  - URL como única fonte de verdade — atrativo para filtros (FR-009) mas insuficiente para carrinho/auth/endereços.

### D3. HTTP client e wrapper

- **Decision**: criar `Services/HttpClient.ts` como wrapper sobre `fetch` nativo com responsabilidades:
  1. Injetar `Authorization: Basic {token}` lendo `localStorage["login-with-metamask:auth"]` (Princípio V).
  2. Serializar/desserializar JSON.
  3. Mapear erros HTTP em uma forma `LofnApiError` consumida por `handleError` dos contexts.
  4. Detectar 401 → disparar evento global de "session expired" para o `AuthContext` redirecionar (FR-016).
  5. Cancelar requisições anteriores via `AbortController` quando uma busca é refeita.
- **Rationale**: Princípio II proíbe Axios em código novo (Fetch API é o cliente padrão para serviços novos). Centralizar a leitura de token, o tratamento de erro e o cancelamento evita duplicação em cada Service.
- **Alternatives considered**:
  - `lofn-react` provê hooks que provavelmente já fazem este wrapping — vamos preferir os hooks oficiais quando o uso for direto (`useStore`, `useProduct`, `useCategory`, `useShopCart`); o `HttpClient` próprio é usado apenas onde os hooks oficiais não cobrem (busca unificada cross-store, queries GraphQL específicas, mocks).

### D4. Cliente GraphQL

- **Decision**: chamar `POST /graphql` via `HttpClient` com query string em template literal — **sem** Apollo Client/urql. Schema é pequeno (`stores`, `storeBySlug`, `featuredProducts`, `categories`, `products`) e o volume-alvo POC dispensa cache normalizado.
- **Rationale**: introduzir um cliente GraphQL completo violaria a Stack Restriction "no external state-management" (Apollo cache normalizado é state-management). Manter contratos pequenos em `Services/*` é mais fiel à constituição e ao padrão `react-architecture`.
- **Alternatives considered**:
  - `graphql-request` — minimalista, mas adiciona dependência sem ganho prático para 4-5 queries.
  - Apollo Client — caro (cache, devtools, subscriptions); excessivo para o escopo.

### D5. Estilização — Bootstrap 5 + tema

- **Decision**: usar Bootstrap 5 SCSS importado em `src/styles/theme.scss` com override de variáveis (cores primária/secundária do Circulou, fontes, raios). Componentes de UI custom (Card, Modal, Toast) reutilizam classes Bootstrap. `sonner` para toasts (herdado do `lofn-react/example-app`).
- **Rationale**: Princípio II pina Bootstrap 5. SCSS permite overrides limpos sem CSS-in-JS. `sonner` é prática comum em React e mais leve que react-toastify.
- **Alternatives considered**:
  - Tailwind ou shadcn/ui — fora da stack pinada.
  - CSS Modules puro — possível, mas perde os mixins/variáveis do Bootstrap.

### D6. Internacionalização (i18next 25)

- **Decision**: configurar `i18next` + `react-i18next` com backend de arquivos estáticos em `public/locales/pt-BR/translation.json`. Detector de idioma só usa `pt-BR` no MVP. A interface está pronta para adicionar `en-US` depois sem refactor.
- **Rationale**: FR-027 exige pt-BR padrão e capacidade de receber traduções; constituição pina i18next 25.
- **Alternatives considered**: `react-intl` — descartado pela stack pinada.

### D7. Roteamento — React Router 6

- **Decision**: rotas declarativas em `App.tsx` usando `createBrowserRouter` + `<RouterProvider>`. URL como fonte de verdade para filtros e termo de busca (FR-009).
- **Rationale**: Princípio II pina RR6; `createBrowserRouter` é o caminho recomendado em RR6+.
- **Alternatives considered**: rotas via `<BrowserRouter>` com `<Routes>` — funciona, mas perde benefícios de loader/action que podem ajudar em fetches iniciais (HomePage).

### D8. Persistência local

- **Decision**: três namespaces em `Storage`:
  1. `localStorage["login-with-metamask:auth"]` — token NAuth (Princípio V).
  2. `localStorage["circulou:cart:{userId}"]` — carrinho do usuário (mock LOFN-G09); valor: `{ updatedAt: ISO8601, items: CartItem[] }`. Last-write-wins é trivial em `localStorage` num único dispositivo (FR-019).
  3. `localStorage["circulou:addresses:{userId}"]` — endereços (mock LOFN-G13/G14); valor: `Address[]` com `isDefault: boolean`.
  4. `sessionStorage["circulou:cart:anon"]` — buffer pré-login (FR-017); descartado após merge.
- **Rationale**: namespacing com prefixo `circulou:` evita colisão com outras apps no mesmo domínio (volume-alvo POC pode reutilizar localhost com outras ferramentas).
- **Alternatives considered**: IndexedDB — overkill para volume POC. Service Worker cache — não cobre escrita transacional.

### D9. Pré-fetch progressivo (FR-007)

- **Decision**: implementar em `useProducts` um loop assíncrono que dispara `pageNum=1..5` em paralelo limitado (max 2 in-flight para não saturar conexão), agrega resultados, aplica filtros/ordenação client-side (G01–G03), e retorna os 12 primeiros pós-filtro. Se < 12, mantém os fetched, expõe contagem corrente, e o botão "Buscar mais" estende o teto em +5 páginas.
- **Rationale**: trade-off entre latência (paralelo) e cortesia ao backend (max 2). Esse algoritmo cabe inteiro no hook sem expor para componentes.
- **Alternatives considered**:
  - Sequencial 1→5 — mais lento; rejeitado.
  - Paralelo total 1..5 — pode estourar `concurrent-requests` configurados em proxies; max 2 é conservador.

### D10. Identidade do produto na navegação para detalhe (mock LOFN-G05)

- **Decision**: ao clicar em um produto da listagem, o frontend navega usando a rota `/product/:storeSlug/:productSlug` e passa o `ProductInfo` completo via `state` do React Router (`navigate(path, { state: { product } })`). A `ProductPage` lê `location.state.product` primeiro; se ausente (deep-link sem state), tenta recuperar via GraphQL `products` filtrado por slug; se também falhar, exibe estado "Produto indisponível" (cobre US4 cenário 5).
- **Rationale**: state passing reusa o `ProductInfo` já fetched, evitando chamada extra. Fallback GraphQL respeita LOFN-G05 sem precisar de novo endpoint REST.
- **Alternatives considered**:
  - Cache global por id em `ProductsContext` — adiciona complexidade pouco usada (paginas raramente são deep-linked sem listagem prévia neste MVP).

### D11. Geração de identificadores provisórios de pedido (mock LOFN-G11)

- **Decision**: para cada chamada bem-sucedida ao `POST /shopcart/insert` durante o checkout, o frontend gera um identificador no formato `MOCK-{storeSlug}-{YYYYMMDD-HHmmss}-{rand5}` (ex.: `MOCK-cafedalua-20260427-141502-X7K4Q`). É exibido na `OrderConfirmationPage` com aviso visual ("Identificador provisório — confirme com a loja em caso de dúvida"). O ID **não** é persistido em `localStorage` — coerente com a confirmação efêmera (FR-025) e Q4 da clarify.
- **Rationale**: mantém a página de confirmação efêmera e ainda assim oferece algo concreto que o usuário pode anotar. Quando LOFN-G11 for fechado, a substituição é trivial: trocar a string MOCK pelo `orderId` retornado.
- **Alternatives considered**:
  - UUID v4 puro — funciona, mas não é legível; perde valor para o usuário anotar.

### D12. Acessibilidade (FR-029)

- **Decision**: Bootstrap 5 garante contraste e foco padrão; complemento de skip-link, `<main>` semântico, ARIA labels nos botões de filtro e paginação, e teste manual de navegação por teclado dos fluxos críticos (busca, filtros, paginação, adicionar ao carrinho, checkout). Sem dependência de biblioteca externa.
- **Rationale**: WCAG 2.1 AA básico é alcançável com Bootstrap + boas práticas; introdução de `react-aria` ou `radix-ui` violaria Stack Restriction.
- **Alternatives considered**: nenhuma viável dentro da stack pinada.

### D13. Estratégia de mocks no `Services/*`

- **Decision**: cada Service exporta uma função pública que primeiro tenta a chamada real (REST ou GraphQL) e, **apenas onde o gap LOFN-G## confirma ausência**, cai no mock client-side. O comentário acima do bloco mock é o anchor textual para futura remoção:

  ```ts
  // MOCK :: LOFN-G09 — carrinho persiste em localStorage por userId.
  // Substituir por GET /shopcart/{userId} + PUT /shopcart/{userId} quando o gap fechar.
  // Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g09.
  ```

- **Rationale**: convenção fixada na spec (Assumption "Restrição de backend") e em `lofn-api-gaps.md`. Busca por `MOCK :: LOFN-G` localiza todas as substituições futuras.
- **Alternatives considered**: pasta `src/mocks/*` separada — espalha responsabilidade, dificulta a substituição localizada. Rejeitado.

### D14. Volume-alvo POC e budget de performance

- **Decision**: SC-001 (1,5 s p95 na primeira página) é viável sem cache externo dado < 1.000 produtos / < 10 lojas. O pré-fetch progressivo do FR-007 com max 2 in-flight + teto 5 páginas/60 itens consome ~6 chamadas REST sequenciais paralelas — aceitável.
- **Rationale**: não introduzir Redis/Algolia/cache de borda; conformidade com Assumption "Volume-alvo do MVP".

### D15. Tipos compartilhados — `lofn-react` re-exports

- **Decision**: importar tipos de domínio (`ProductInfo`, `StoreInfo`, `CategoryInfo`, `ShopCartInfo`, `ShopCartItemInfo`, `ProductImageInfo`) diretamente de `lofn-react`. Tipos próprios do Circulou (`SearchParams`, `FilterState`, `SortBy`, `MockOrderId`) ficam em `src/types/`.
- **Rationale**: evitar duplicação de definição entre pacote e app. O domínio Lofn é o mesmo aqui.
- **Alternatives considered**: re-tipar localmente — gera divergência cada vez que `lofn-react` evolui.

### D16. Build/CI

- **Decision**: scripts npm `dev`, `build`, `preview`, `test`, `test:watch`, `lint`, `typecheck`. ESLint com `eslint-plugin-react`, `eslint-plugin-react-hooks`, `@typescript-eslint`. Pre-commit opcional via husky + lint-staged (não bloqueante).
- **Rationale**: prática padrão Vite + TS. Constituição não pina linter, mas convenções IV exigem regras de naming consistentes — ESLint é o veículo natural.

## Resumo de melhores práticas adotadas

- **lofn-react**: usar hooks oficiais (`useStore`, `useProduct`, `useCategory`, `useShopCart`, `useImage`) para leituras simples; sair para `Services/*` próprios apenas para busca unificada cross-store, GraphQL puro e mocks.
- **nauth-react**: usar fluxo padrão (login, register, forgot-password, change-password) com `useAuth` hook + leitor de token. Após login bem-sucedido, disparar evento que faz o `CartContext` mesclar o buffer de `sessionStorage` (D8) ao carrinho recuperado.
- **Bootstrap 5**: começar de tema customizado em `theme.scss` para evitar "look genérico de bootstrap".
- **i18next 25**: chaves descritivas (`search.placeholder`, `cart.empty.title`); sem strings hard-coded em componentes.
- **React Router 6**: definir rotas em um único arquivo (`App.tsx`); usar `useNavigate` + `state` para passar contexto entre páginas (ver D10).
- **Vite 6**: aliases `@/` para `src/`, `@/Services/` etc., para imports legíveis (respeitando casing exato da constituição).

## Pendências para o `/speckit.tasks`

- Checagem do skill `react-architecture` para confirmar nomes exatos dos arquivos do scaffolding (Service/Context/Hook/Provider) — o presente plano segue o padrão do exemplo, mas o skill é a fonte de verdade.
- Geração das tarefas P1 (busca unificada), P2 (filtros + auth), P3 (detalhe + carrinho + checkout + página de loja) seguindo as user stories da spec.
- Nenhuma decisão arquitetural restou em aberto.
