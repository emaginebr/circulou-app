# circulou-app Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-27

## Active Technologies

- TypeScript 5.x (strict mode) sobre React 18.x + React 18 · React Router 6 · Vite 6 · Tailwind CSS 4 (`@tailwindcss/vite`) · `lofn-react` (último) · `nauth-react` 0.7.x · `sonner` (toaster, herdado da referência) · `react-markdown` + `remark-gfm` (descrição de produto). Strings hard-coded em pt-BR — sem i18next (constituição v3.0.0). (001-circulou-marketplace)

## Project Structure

```text
src/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x (strict mode) sobre React 18.x: Follow standard conventions

## Recent Changes

- 001-circulou-marketplace: Added TypeScript 5.x (strict mode) sobre React 18.x + React 18 · React Router 6 · Vite 6 · Tailwind CSS 4 (`@tailwindcss/vite`) · `lofn-react` (último) · `nauth-react` 0.7.x · `sonner` (toaster, herdado da referência) · `react-markdown` + `remark-gfm` (descrição de produto)
- 2026-04-27 (constitution v2.0.0): UI base migrada de Bootstrap 5 para Tailwind CSS 4 com `@tailwindcss/vite`. Tokens de design vivem em `src/styles/theme.css` via `@theme`. Não usar classes Bootstrap em código novo.
- 2026-04-28 (constitution v3.0.0): i18next removido. Strings ficam hard-coded em pt-BR diretamente no JSX. Sem `useTranslation`, sem `public/locales/`. Tema da marca (oliva/âmbar/cedro/cobre/areia/cru) + tipografia Alfa Slab One + DM Sans aplicados em `src/styles/theme.css`.

<!-- MANUAL ADDITIONS START -->

## Status da feature 001-circulou-marketplace (2026-04-27)

Implementado: Phase 1–8 (T001–T097) — Setup, Foundational, US1–US6 todas entregues.
Validações: `npm run typecheck`, `npm run lint`, `npm run build` passam todos.

Pendências de Phase 9 (Polish):
- T098 i18n review — várias strings hard-coded em pt-BR ainda em `*.tsx`. Dívida.
- T099 a11y audit, T100 QA responsivo 360 px — exigem inspeção em browser real.
- T103 + T103a — exigem ambiente Lofn/NAuth dev (não acessível na sessão).

Pontos de atenção para o futuro engenheiro:
- Spike T048a foi resolvido via leitura do source de `nauth-react`. Validar
  empiricamente NAUTH-S1 (Lofn aceita `Basic {token-NAuth}`?) na primeira request
  autenticada de US5 (`POST /shopcart/insert`).
- Bundle JS principal hoje passa de 500 KB. Plan.md prevê code-splitting em Phase
  9 — não foi feito; considerar `manualChunks` quando o bundle ficar incômodo.
- `Vitest` foi atualizado de 1.x (research D1) para 3.x para compatibilidade com
  Vite 6. Sem tests escritos ainda — RTL+MSW prontos para uso.

<!-- MANUAL ADDITIONS END -->
