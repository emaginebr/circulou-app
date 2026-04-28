# Implementation Plan: Circulou — Marketplace Unificado de Produtos

**Branch**: `001-circulou-marketplace` | **Date**: 2026-04-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-circulou-marketplace/spec.md`

## Summary

Frontend SPA "Circulou" que apresenta busca, filtros e ordenação **unificados** sobre
produtos de várias lojas Lofn, mais checkout multi-loja e autenticação via NAuth.
A spec define 6 user stories, 30 FRs e 8 SCs; clarificações já fixaram (a) match
textual no nome do produto, (b) filtro de categoria escopo de loja apenas, (c) carrinho
unificado com pedido por loja, (d) confirmação de pedido efêmera, (e) carrinho
last-write-wins por dispositivo, (f) buffer pré-login em `sessionStorage`, (g) busca
disparada apenas ao confirmar, (h) LGPD diferida para produção, (i) home com fallback
"featured → mais recentes", (j) filtros client-side com pré-fetch progressivo.

A abordagem técnica usa **APIs Lofn existentes apenas** (REST + `POST /graphql`
público + NAuth). 14 gaps de backend mapeados em [`lofn-api-gaps.md`](./lofn-api-gaps.md)
serão preenchidos por **mocks frontend controlados** (`localStorage`/`sessionStorage`,
filtragem e ordenação client-side com pré-fetch progressivo, identificadores
provisórios de pedido) — cada mock referencia o gap correspondente em comentário no
código (`// MOCK :: LOFN-G##`) para substituição localizada quando o backend for
estendido.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) sobre React 18.x
**Primary Dependencies**: React 18 · React Router 6 · Vite 6 · Tailwind CSS 4 (`@tailwindcss/vite`) · i18next 25 (+ react-i18next) · `lofn-react` (último) · `nauth-react` 0.7.x · `sonner` (toaster, herdado da referência) · `react-markdown` + `remark-gfm` (descrição de produto). _UI base migrada de Bootstrap 5 → Tailwind 4 em 2026-04-27 (constitution v2.0.0)._
**HTTP Client**: Fetch API nativa (constituição V) — todas as chamadas novas. Axios não é introduzido (não há legado no greenfield)
**Storage**:
 - `localStorage` — token NAuth (`"login-with-metamask:auth"`, constituição V); carrinho por `userId` (mock LOFN-G09); endereços por `userId` (mock LOFN-G13); ack de IDs provisórios de pedido (mock LOFN-G11)
 - `sessionStorage` — buffer pré-login do visitante anônimo (FR-017)
**Testing**: Vitest 1.x + @testing-library/react + @testing-library/user-event (unit/component); MSW (Mock Service Worker) para isolar `fetch` em testes; Playwright (e2e) é opcional/diferido — não bloqueia o MVP
**Target Platform**: Browsers evergreen (Chrome/Edge/Firefox/Safari últimas 2 versões); responsivo a partir de 360 px (FR-028)
**Project Type**: Single-project SPA frontend (não há backend neste repo — Lofn e NAuth são externos)
**Performance Goals**: SC-001 (95% das buscas exibindo primeira página em < 1,5 s no volume-alvo POC); pré-fetch progressivo até 5 páginas / 60 itens por interação de filtro (FR-007)
**Constraints**:
 - Constituição v1.0.0 inviolável (stack pinada, casing de diretórios, conventions, header `Authorization: Basic {token}`, prefixo `VITE_`)
 - **API existing-only**: nenhum endpoint novo no backend Lofn neste escopo
 - Volume-alvo POC: < 1.000 produtos agregados, < 10 lojas, baixíssimo tráfego
 - LGPD diferida — banner/consentimento NÃO no MVP
**Scale/Scope**: 14 rotas (`/`, `/search`, `/loja/:storeSlug`, `/product/:storeSlug/:productSlug`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/change-password`, `/profile`, `/cart`, `/checkout`, `/order-confirmation`, `*` → `NotFoundPage`); ~28 componentes reutilizáveis estimados; ~8 entidades TypeScript

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Avaliação contra `.specify/memory/constitution.md` v1.0.0:

| Princípio | Como o plano cumpre |
|---|---|
| **I. Mandatory Skill Usage (NON-NEGOTIABLE)** | Toda nova entidade frontend (Types, Service, Context, Hook, Provider) será scaffolded via `/react-architecture` em `/speckit.tasks` (não scaffolded à mão). |
| **II. Approved Frontend Stack** | React 18 ✅, TS 5 ✅, RR 6 ✅, Vite 6 ✅, Tailwind 4 ✅ (após amendment v2.0.0), i18next 25 ✅, Fetch API ✅. Axios NÃO é introduzido (não há legado neste repo). |
| **III. Directory Case Sensitivity (Inviolable)** | Layout em `src/Contexts/`, `src/Services/`, `src/hooks/`, `src/types/` exatamente como exigido. |
| **IV. TypeScript & React Code Conventions** | Componentes/Interfaces PascalCase, funções/variáveis camelCase, constantes UPPER_CASE, `interface` para shape, arrow functions, `const` por padrão — aplicado em todo o `src/`. |
| **V. Authentication & Security** | Header `Authorization: Basic {token}`; token em localStorage sob `"login-with-metamask:auth"`. Sem cookies. Sem secrets no frontend. |
| **VI. Environment Variables (VITE_ Prefix)** | `VITE_API_URL` (REST), `VITE_LOFN_GRAPHQL_URL` (GraphQL público — derivável da REST mas explicitado para flexibilidade), `VITE_SITE_BASENAME` (opcional). Nada de `REACT_APP_`. |

Stack Rules & Restrictions:
- ✅ Vite como único bundler.
- ✅ Sem state-management externo (Context API + hooks dedicados, conforme `react-architecture`).
- ✅ Sem comandos Docker locais — não há docker-compose neste plano.
- ✅ Sem `REACT_APP_*`.

**Resultado do gate**: ✅ **PASS** — nenhuma violação. Sem entradas em `Complexity Tracking`.

## Project Structure

### Documentation (this feature)

```text
specs/001-circulou-marketplace/
├── plan.md                    # Este arquivo
├── spec.md                    # Especificação clarificada
├── research.md                # Phase 0 output
├── data-model.md              # Phase 1 output
├── quickstart.md              # Phase 1 output
├── lofn-api-gaps.md           # Catálogo dos 14 gaps backend (LOFN-G01..G14)
├── contracts/                 # Phase 1 output — contratos por serviço
│   ├── search.md              # /product/search e mocks G01..G04
│   ├── store.md               # GraphQL stores / storeBySlug
│   ├── category.md            # GraphQL categories (escopo de loja)
│   ├── product.md             # detalhe (G05) + listagem
│   ├── cart.md                # carrinho mock (G09, G10) + buffer pré-login
│   ├── checkout.md            # /shopcart/insert × loja + IDs provisórios (G11)
│   ├── address.md             # CRUD em localStorage (G13, G14)
│   └── auth.md                # NAuth (login/register/profile/forgot-password)
├── checklists/
│   └── requirements.md        # Spec quality checklist
└── tasks.md                   # Phase 2 output (gerado por /speckit.tasks)
```

### Source Code (repository root)

```text
circulou-app/
├── public/
│   └── locales/
│       └── pt-BR/
│           └── translation.json
├── src/
│   ├── Contexts/                       # Uppercase C (Princípio III)
│   │   ├── AuthContext.tsx
│   │   ├── ProductsContext.tsx
│   │   ├── StoresContext.tsx
│   │   ├── CategoriesContext.tsx
│   │   ├── CartContext.tsx             # carrinho + buffer pré-login (sessionStorage)
│   │   └── AddressesContext.tsx
│   ├── Services/                       # Uppercase S (Princípio III)
│   │   ├── ProductsService.ts          # POST /product/search + mocks G01..G04
│   │   ├── StoresService.ts            # GraphQL stores / storeBySlug
│   │   ├── CategoriesService.ts        # GraphQL storeBySlug.categories
│   │   ├── ProductService.ts           # detalhe (estado da listagem; mock G05 fallback)
│   │   ├── CartService.ts              # localStorage por userId (mock G09, G10) + sessionStorage buffer
│   │   ├── CheckoutService.ts          # /shopcart/insert × loja + IDs provisórios (mock G11)
│   │   ├── AddressService.ts           # CRUD localStorage (mock G13, G14)
│   │   ├── AuthService.ts              # cliente NAuth + helper getHeaders()
│   │   └── HttpClient.ts               # wrapper sobre Fetch (header Basic, refresh de token, error handling)
│   ├── hooks/                          # Lowercase h (Princípio III)
│   │   ├── useAuth.ts
│   │   ├── useProducts.ts              # busca unificada + pré-fetch progressivo (FR-007)
│   │   ├── useStores.ts
│   │   ├── useCategories.ts
│   │   ├── useProduct.ts
│   │   ├── useCart.ts                  # add/remove/update + merge buffer no login
│   │   ├── useAddresses.ts
│   │   ├── useCheckout.ts              # particiona por loja, dispara N inserts
│   │   ├── useUrlSearchState.ts        # FR-009: filtros e termo na URL
│   │   └── useDebounce.ts              # utilitário (apesar da busca ser on-confirm)
│   ├── types/                          # Lowercase t (Princípio III)
│   │   ├── product.ts
│   │   ├── store.ts
│   │   ├── category.ts
│   │   ├── image.ts
│   │   ├── cart.ts
│   │   ├── order.ts
│   │   ├── address.ts
│   │   └── search.ts                   # SearchParams, SortBy, FilterState
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   ├── search/
│   │   │   ├── SearchBar.tsx           # on-confirm only (FR-001)
│   │   │   ├── FiltersPanel.tsx        # loja, faixa de preço, em promoção
│   │   │   ├── SortControl.tsx
│   │   │   └── LoadMoreButton.tsx      # FR-007 "Buscar mais"
│   │   ├── product/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductGallery.tsx
│   │   │   └── PriceTag.tsx
│   │   ├── store/
│   │   │   ├── StoreBadge.tsx
│   │   │   └── StoreHeader.tsx
│   │   ├── cart/
│   │   │   ├── CartLine.tsx
│   │   │   ├── CartStoreGroup.tsx
│   │   │   └── CartSummary.tsx
│   │   ├── checkout/
│   │   │   ├── AddressPicker.tsx
│   │   │   └── OrderReview.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── PasswordResetForm.tsx
│   │   └── ui/
│   │       ├── EmptyState.tsx
│   │       ├── ErrorState.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── Pagination.tsx
│   ├── pages/
│   │   ├── HomePage.tsx                # FR-004 fallback featured/recente
│   │   ├── SearchResultsPage.tsx       # busca unificada
│   │   ├── StorePage.tsx               # FR-011 com filtro por categoria
│   │   ├── ProductPage.tsx             # FR-010
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   ├── ChangePasswordPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── CartPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── OrderConfirmationPage.tsx   # efêmera (FR-025)
│   │   └── NotFoundPage.tsx
│   ├── i18n/
│   │   ├── index.ts
│   │   └── resources.ts
│   ├── styles/
│   │   ├── theme.css                   # tokens via @theme do Tailwind 4 (+ classes utilitárias custom)
│   │   └── (globals.scss removido — fundido em theme.css)
│   ├── lib/
│   │   ├── normalize.ts                # case-insensitive + remoção de diacríticos (FR-001)
│   │   ├── currency.ts                 # formatação BRL
│   │   ├── slug.ts
│   │   ├── pagination.ts               # cálculo de teto progressivo (FR-007)
│   │   └── relevance.ts                # ranking match exato > prefixo > substring > featured > recente
│   ├── App.tsx                         # rotas
│   └── main.tsx                        # provider chain (Princípio I via react-architecture)
├── .env.example                        # VITE_API_URL=, VITE_LOFN_GRAPHQL_URL=, VITE_SITE_BASENAME=
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

**Structure Decision**: **Single-project SPA** (não há backend ou mobile neste repo). Os
diretórios `Contexts/`, `Services/`, `hooks/`, `types/` respeitam exatamente o casing
da constituição (Princípio III). Os mocks que respondem aos gaps `LOFN-G##` vivem
dentro dos respectivos `Services/*` (cada chamada Lofn que precisa de mock é
encapsulada lá com comentário `// MOCK :: LOFN-G##`); nenhum diretório paralelo de
"mocks" é criado, para evitar divergência entre código de produção e fallback. O
provider chain é único (`main.tsx`) e segue a ordem decidida pelo skill
`react-architecture` em `/speckit.tasks`.

## Complexity Tracking

> Não há violações da constituição. Esta seção fica vazia.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(nenhuma)_ | _(nenhuma)_ | _(nenhuma)_ |
