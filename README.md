# Circulou — marketplace unificado de produtos

SPA frontend que agrega produtos de múltiplas lojas do Lofn em uma busca única,
com autenticação NAuth, carrinho cliente e checkout multi-loja.

## Quickstart

```bash
npm install
cp .env.example .env.local
# editar .env.local apontando para Lofn e NAuth
npm run dev
```

Após o `npm run dev`, abra `http://localhost:5173`.

Variáveis obrigatórias em `.env.local`:

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL base do Lofn (REST + GraphQL). A REST é consumida em `POST /product/search`, `POST /shopcart/insert`, etc.; o GraphQL público fica em `{VITE_API_URL}/graphql` (`stores`, `storeBySlug`, `featuredProducts`). |
| `VITE_NAUTH_URL` | URL da REST do NAuth (login, register, etc.) |
| `VITE_TENANT_ID` | (opcional) Identificador do tenant. Default `"emagine"`. Enviado no header `X-Tenant-Id` em toda requisição (Lofn + NAuth). |
| `VITE_SITE_BASENAME` | (opcional) base path do React Router 6 |

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Servir o build local |
| `npm run test` | Vitest run-mode |
| `npm run test:watch` | Vitest watch |
| `npm run lint` | ESLint sobre `src/` |
| `npm run typecheck` | `tsc -b` (project references) |

## Arquitetura

- **Stack**: React 18 + TypeScript 5 (strict) + Vite 6 + React Router 6 + Tailwind CSS 4 (`@tailwindcss/vite`)
- **Auth**: `nauth-react` 0.7.x — token em `localStorage["login-with-metamask:auth"]`
- **Domínio Lofn**: `lofn-react` (tipos re-exportados em `src/types/`)
- **Estado**: Context API por entidade (`Products`, `Stores`, `Cart`, `Addresses`, `Categories`)
- **Idioma**: pt-BR único, strings hard-coded no JSX. Sem i18next (constituição v3.0.0, Princípio VII).
- **Design tokens**: `src/styles/theme.css` define paleta da marca (oliva/âmbar/cedro/cobre/areia/cru), tipografia (Alfa Slab One + DM Sans + DM Mono), raios e fontes via `@theme` (Tailwind v4) — consumir em componentes via `var(--color-primary)`, `rounded-[var(--radius)]`, etc.

A constituição em `.specify/memory/constitution.md` (v3.0.0) define os invariantes
do projeto. Casing dos diretórios:

| Diretório | Casing | Motivo |
|---|---|---|
| `src/Contexts/` | Uppercase C | Princípio III |
| `src/Services/` | Uppercase S | Princípio III |
| `src/hooks/` | Lowercase | Convenção React |
| `src/types/` | Lowercase | Convenção TypeScript |

## Onde os mocks vivem

Cada gap do backend Lofn que ainda não fechou é encapsulado em um mock client-side
marcado com um comentário ancorado:

```ts
// MOCK :: LOFN-G## — descrição. Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g##.
```

Para listar todos os mocks ativos:

```bash
# bash / git-bash
grep -rn "MOCK :: LOFN-G" src/

# PowerShell
Select-String -Path src/* -Pattern "MOCK :: LOFN-G" -Recurse
```

Cada match aponta para uma linha do `specs/001-circulou-marketplace/lofn-api-gaps.md`.
Quando um gap for fechado no backend, leia a estratégia de substituição naquele
documento e remova o mock.

## Limitações conhecidas (MVP)

- **Carrinho não migra entre dispositivos** — depende de `LOFN-G09` (cart server-side).
- **Endereços ficam locais** — depende de `LOFN-G13` (address server-side).
- **IDs de pedido são provisórios** (`MOCK-{slug}-{ts}-{rand}`) — depende de `LOFN-G11`.
- **Filtros price-range, only-on-sale e ordenação** são aplicados client-side sobre o
  resultado de `/product/search` paginado em até 5 páginas (60 itens) — botão "Buscar
  mais" estende em +5 páginas. Depende de `LOFN-G01..G03`.
- **NAuth × Constituição V**: `nauth-react` envia `Bearer {token}` para o backend
  NAuth, e nosso `HttpClient` envia `Basic {token}` para o Lofn (Princípio V). A
  validação empírica de aceitação do Lofn está aberta como dívida `NAUTH-S1` — ver
  `specs/001-circulou-marketplace/research-nauth-spike.md`.

## Especificação

Toda a especificação, plano e tasks deste MVP estão em
`specs/001-circulou-marketplace/`:

- `spec.md` — user stories, FRs, success criteria
- `plan.md` — Technical Context, structure, gates
- `data-model.md` — entidades e tipos
- `contracts/` — contratos de Service por domínio
- `lofn-api-gaps.md` — gaps do backend e suas estratégias de mock
- `tasks.md` — execução T001..T105
- `research-nauth-spike.md` — análise do `nauth-react` que resolveu o spike T048a
