# Specification Quality Checklist: Circulou — Marketplace Unificado de Produtos

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-04-27
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- The user prompt explicitly named the agent (`frontend-react-developer`) and external
  packages (`nauth-react`, `lofn-react`) plus a reference repo. These mentions are
  confined to the **Assumptions** section as external dependencies / context, not as
  implementation decisions inside the requirements. The constitution
  (`.specify/memory/constitution.md` v1.0.0) already pins the stack, so the spec body
  remained free of stack/API specifics.
- All `Functional Requirements`, `User Stories`, and `Success Criteria` are written in
  technology-agnostic language and refer to user-visible behavior only.
- Out-of-scope items (payment/shipping integration, ratings/reviews, wishlist,
  subscription lifecycle) are listed explicitly in Assumptions to bound the scope.
- Items marked incomplete would require spec updates before `/speckit.clarify` or
  `/speckit.plan` — none are incomplete on this iteration.

### Closure 2026-04-27 — Implementação T001–T097 concluída

- Phase 1–8 (T001..T097) executadas e validadas via `npm run typecheck`, `npm run lint`,
  `npm run build` — todos verdes.
- Phase 5-pre Spike T048a resolvido por análise de fontes (sem ambiente live);
  evidência em `research-nauth-spike.md`. Dívida `NAUTH-S1` aberta para validar
  empiricamente `Basic {token-NAuth}` no primeiro `POST /shopcart/insert` real.
- Phase 9 (Polish) parcialmente cumprida: T101 (banners) e T102 (helper grep no README)
  e T104 (CLAUDE.md) feitos; T098/T099/T100/T103/T103a/T105 abaixo como dívida.
- **Constitution Check final** (Princípios I–VI):
  - I (`react-architecture` skill) — adaptado: skill `react-arch` está orientada a outro
    projeto; seguimos o **espírito** (Service classe, Context com loading/error/clearError,
    Hook null-check) com casing/env/auth do Circulou. Documentado neste checklist.
  - II (Stack) — todas as versões pinadas em `package.json` aderem; **Vitest atualizado
    de 1.x → 3.x** (decisão técnica para compatibilidade com Vite 6, sem violar Princípio II).
  - III (Casing de diretórios) — `src/Contexts/`, `src/Services/` (Uppercase) e
    `src/hooks/`, `src/types/` (lowercase) — verificado.
  - IV (Convenções de código) — PascalCase para componentes/interfaces, camelCase para
    funções, UPPER_CASE para constantes — ESLint passa sem warnings.
  - V (Auth header + storage) — `Authorization: Basic {token}` no `HttpClient.ts`,
    storage `localStorage["login-with-metamask:auth"]` configurado em `nauth-react`.
  - VI (`VITE_` prefix) — `.env.example` lista apenas `VITE_*`; nenhum `REACT_APP_*`
    no código.

### Amendment 2026-04-27 — API-existing-only constraint

- Added Clarifications bullet (Q6) and a dedicated Assumption requiring the MVP to use
  only existing Lofn API endpoints (REST + `POST /graphql` public) and NAuth, with
  client-side mocks for missing capabilities and a companion gap document.
- Created `lofn-api-gaps.md` cataloging 14 gaps (LOFN-G01..G14) — each with the FR it
  affects, the MVP mock strategy, and the future backend work item. Six gaps are
  pure-frontend mocks (filters, sort, cart/address `localStorage`, provisional order
  IDs); five are likely covered by GraphQL and need verification, not mocks; three
  describe out-of-scope or already-supported items.
- Downgraded **SC-008** to "deferred to post-MVP, depends on LOFN-G09" because cart
  cross-device sync requires a server-side cart endpoint that does not exist today.
  The cart UI must surface this limitation while the gap is open.
- Re-ran spec quality checklist after the amendment — all items still pass. The
  new Assumption text mentions `localStorage`, REST, and GraphQL; this is a
  deliberate constraint statement (and necessary for the gap document to be
  actionable), not an implementation decision leaking into the requirements body.
