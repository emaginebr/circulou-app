# Circulou — Home (proposta de design)

Proposta de design **somente** para a Home do `circulou-app`. Pasta:
`docs/design/home/`. Stack alvo: React 18 + TypeScript 5 + Vite 6 +
Tailwind CSS 4 (`@tailwindcss/vite`). Esta entrega **não inclui `.tsx`** —
o time `frontend-react-developer` materializa a partir daqui.

## Artefatos nesta pasta

| Arquivo        | Propósito                                                                |
|----------------|--------------------------------------------------------------------------|
| `index.html`   | Mockup desktop completo, navegável standalone no browser.                |
| `mobile.html`  | Recorte mobile 360 px do mesmo fluxo (mobile-first decisivo).            |
| `tokens.css`   | Tokens Tailwind v4 `@theme` ancorados em `docs/images/cores.jpg`.        |
| `README.md`    | Este arquivo — spec textual para o frontend implementar.                 |

## Direção criativa

**Estilo nomeado:** *Editorial retrô-folk com fotografia forte*. Mistura:

- Tipografia display **chubby/condensed** (Alfa Slab One — fallback do
  lettering "Circulou"); evoca o caráter artesanal do logo sem reproduzir
  o lettering custom da marca;
- Fotografia editorial em primeiro plano (fashion editorial, não catálogo);
- Formas orgânicas decorativas (sol-rosáceo, blob âmbar) que aparecem no
  hero e na seção "Quero Vender", inspiradas no logo principal e no mockup
  de embalagem `circulou5.jpg` ("chegou!");
- Paleta terrosa autoral — não cai no clichê verde-folha + bege-pálido de
  outros brechós; usa **Oliva Urbano + Cobre Queimado + Âmbar Solar** como
  trio de impacto.

Tom de voz: acolhedor, próximo, "do brechó com amor", sem moralismo
sustentável. Copy puxa narrativa ("Cada peça carrega uma história") em vez
de pressão de venda ("compre agora").

## Paleta (oficial — extraída de `docs/images/cores.jpg`)

| Nome marca           | Hex        | Papel no design                                         |
|----------------------|------------|---------------------------------------------------------|
| Oliva Urbano         | `#4A4B2C`  | Primária. Header marca, hero bg, links navegação.       |
| Âmbar Solar          | `#D69543`  | Secundária. CTA destaque, sol decorativo, números KPI.  |
| Marrom Cedro         | `#4D2801`  | Texto principal headings, botões primários.             |
| Cobre Queimado       | `#AE531A`  | Acento. Preço, hover de CTA, seção "Quero Vender".      |
| Areia do Deserto     | `#E6D2AD`  | Superfície morna, banner editorial, divisórias.         |
| Algodão Cru          | `#F5ECE5`  | `--color-page` — fundo do site inteiro.                 |
| Preto Absoluto       | `#141414`  | Texto puro corpo (`--color-ink`), footer.               |

Mudança chave em relação a `src/styles/theme.css` atual:

- `--color-primary` muda de `#2f7d5b` (verde Bootstrap) para `#4a4b2c` (Oliva
  Urbano). Os tokens *legacy* (`--color-success`, `--color-info`, etc.)
  foram remapeados para essa paleta, mantendo as chaves para que o resto
  do app não quebre.

## Tipografia

| Token            | Família                          | Uso                                                    |
|------------------|----------------------------------|--------------------------------------------------------|
| `--font-display` | `Alfa Slab One`, fallback Cooper | h1, h2, KPIs (números grandes), badge logo na header.  |
| `--font-sans`    | `DM Sans`                        | Corpo, parágrafos, copy de produto, navegação.         |
| `--font-mono`    | `DM Mono`                        | `.circulou-tag`, brand label dos cards, headings rod.  |

Por que não Inter? A marca tem caráter **retrô** (vide `circulou1.jpg`,
`circulou3.jpg`, `circulou4.jpg` — todos lettering chubby). Inter neutraliza
demais a personalidade e faria a Home parecer SaaS B2B. Alfa Slab One é a
fonte gratuita do Google Fonts mais próxima do peso/coxa do logo, sem
precisar embutir uma custom font.

### Escala (clamp fluid)

```text
display-xl → clamp(2.5rem, 6vw, 4.5rem)   // hero h1 (mobile 40 px → desktop 72 px)
display-lg → clamp(2rem, 4.5vw, 3.25rem)  // h1 secundário (banner editorial, sell CTA)
display-md → clamp(1.5rem, 3vw, 2.25rem)  // h2 de seção (Hot News, Alfaiataria)
display-sm → 1.25rem                      // h3 dentro de cards de tile
body-lg    → 1.125rem                     // parágrafo introdutório
body       → 1rem                         // padrão
body-sm    → 0.875rem                     // metadata de produto
caption    → 0.75rem                      // tags, brand-label monospace
```

Hierarquia: **um único h1** por página (no hero). Demais seções usam h2.
Cards de produto (já implementados) usam h3 internos.

## Estrutura da Home — seção a seção

### 1. Header (sticky, redesenhado)

- **Layout desktop**: linha única — logo (Alfa Slab One + sol-icon) /
  search (max-width 480 px, pill, ícone à esquerda) / nav-links + sacola.
- **Mobile**: hambúrguer à esquerda, logo centralizado, sacola à direita.
  Search ocupa linha 2 abaixo do header.
- Tem **segunda linha** (desktop) com categorias horizontais em
  `bg-areia-soft`. Em mobile vira chip-rail scrollable separado.
- Sacola é botão sólido (`circulou-btn-primary`) com badge contador âmbar.
- Hover/foco: `:focus-visible` mostra outline cobre 2 px deslocado.
- **Tailwind**: `sticky top-0 z-50 bg-page border-b border-line`,
  `flex items-center justify-between`. Logo `font-display text-2xl`.

### 2. Hero principal

- Background `bg-oliva` com textura em `radial-gradient` quase
  imperceptível (papel reciclado).
- Decoração: **sol-rosáceo âmbar** (clip-path) no canto superior direito
  + **blob cobre** inferior esquerdo. Apenas decoração, `aria-hidden`.
- Conteúdo: tag mono ("✦ Coleção de Outono · 2026"), h1 display em cru,
  parágrafo em areia, CTA primário **âmbar** ("Garimpar agora") + ghost
  cru ("Quero vender"), trio de KPIs (peças/ONGs/tecido).
- À direita: foto editorial girada `-1.5deg` com sticker branco rotacionado
  ("do brechó com amor ♡") sobreposto — efeito artesanal/recorte.
- **Responsivo**: mobile colapsa para coluna única, foto vai abaixo do
  texto, KPIs viram linha horizontal compacta, CTA full-width.
- **Hierarquia**: h1 único do site. Tag funciona como sobrelinha.
- **Tailwind sugerido**: `bg-oliva text-cru min-h-[78vh] flex items-center
  relative overflow-hidden`. Hero h1: `font-display text-display-xl
  leading-tight max-w-[36ch]`.

### 3. Banners secundários (trio bento)

- Grid desktop **2fr 1fr 1fr** — primeiro tile largo (Curadoria do Bem),
  depois Last Chance e Novas com Etiquetas em coluna estreita.
- Cada tile é foto editorial com gradient overlay inferior (linear-gradient
  preto 0 → 55%) e conteúdo absolute-bottom: tag colorida + h3 cru.
- Mobile: 2 colunas iguais, mostra os 2 mais relevantes (Curadoria + Last
  Chance). Usuário acessa o terceiro pelo menu de categorias.
- Hover desktop: scale `1.015` suave, transição 200 ms (ignorada em
  `prefers-reduced-motion`).
- **Tailwind**: `grid grid-cols-1 md:grid-cols-3 gap-5`, primeiro tile
  `md:col-span-2 md:row-span-1`. Aspect-ratio `aspect-[4/5]`.

### 4. Seção "Hot News" — rail horizontal

- Header de seção em duas partes: (esquerda) tag mono + h2 + sub-copy;
  (direita) link "Ver todos →" como ghost button.
- Conteúdo: scroll horizontal CSS-only (sem JS) com **scroll-snap**
  obrigatório. Cards no formato existente do `ProductCard` — em desktop
  larguras fixas 240 px, em mobile 160 px.
- Cada card: imagem 3:4, `brand-label` mono + nome + size/condição (sm
  mute) + preço atual display cobre + preço antigo line-through.
- Padding inferior 0.5rem deixa espaço para scroll-thumb.
- **Acessibilidade**: `role="list"` no rail, cada card `role="listitem"`,
  `aria-label` no rail descrevendo a seção.
- **Tailwind para o time**: `flex gap-4 overflow-x-auto snap-x snap-mandatory
  pb-2`. Cards: `flex-shrink-0 w-[240px] snap-start`. Browser-mod scrollbar
  já tratado em `tokens.css`.

### 5. Banner editorial full-bleed (História)

- **Decisão de design não óbvia**: em vez de mais cards, uma seção de
  meio-de-página em `bg-areia` com 50/50 — coluna esquerda traz copy
  narrativa, direita traz foto editorial em radius-lg.
- Copy: "Cada peça carrega uma história. Qual será a próxima?" — puxa
  emoção/ propósito antes de jogar mais SKU na cara do usuário.
- Mobile: empilha. Foto fica acima do texto.
- CTA primário cedro/cru direciona para Curadoria do Bem.

### 6. Seleção Alfaiataria — grid responsivo

- Mesma anatomia da Hot News mas em **grid 4 colunas** desktop /
  **2 colunas** mobile. Mostra que o sistema de cards comporta os dois
  layouts (rail e grid) sem refatorar componente.
- Header de seção idêntico ao Hot News, garante consistência visual.
- **Tailwind**: `grid grid-cols-2 lg:grid-cols-4 gap-5`.

### 7. CTA "Quero Vender" (Sacola do Bem)

- Full-bleed em `bg-cobre`, conteúdo em duas colunas: copy/CTA à esquerda,
  ordered-list dos 3 passos com **step-pill âmbar** à direita.
- Step-pill: 56 px círculo, fonte display, número 01/02/03 cedro sobre
  âmbar — escala visual da marca.
- Decoração: blob âmbar parcial saindo da borda inferior direita.
- CTAs: primário cru (alto contraste) + ghost contornado.
- Mobile: empilha tudo, steps viram lista vertical com pill-44 px,
  CTA full-width no fim.
- Esta seção é também o ponto de chegada do link `#sell` do header e do
  sticky FAB-bar do mobile.

### 8. Seção propósito / impacto

- Full-bleed em `bg-cedro` (texto em cru/areia, máximo contraste).
- Header puxa "Brechó do Juntos" como tag âmbar (referência ao tagline
  oficial do logo `circulou1.jpg`).
- 3 cards de impacto em grid 3 col desktop / 1 col mobile: cores
  alternadas (cobre / oliva / cobre) para não cair em monotonia.
- Cada card: número grande display âmbar + título cru + descrição areia.
- CTA central no final: "Conheça nossas ONGs parceiras →" em âmbar.

### 9. Footer (redesenhado)

- Bg `bg-tinta` (preto absoluto). Texto principal em areia, hover âmbar.
- Desktop: 4 colunas (marca + redes / Úteis / Meu Perfil / Ajuda).
- Mobile: marca no topo, demais colunas viram **`<details>` acordeão**
  (cada `summary` 44 px, expansível por toque). Solução zero-JS.
- Linha legal final em mute pequeno: CNPJ, contato, copyright.

### 10. Sticky FAB-bar (apenas mobile)

- Barra inferior fixa com 2 botões 50/50 ("Quero vender" / "Comprar").
- Bg cru com `backdrop-filter: blur(10px)` e borda superior em line.
- Garante que a CTA estratégica de vendas esteja sempre acessível em
  scroll longo no mobile (Home tem ~7 seções verticais).
- Não aparece em desktop (`md:hidden`).

## Comportamento responsivo (breakpoints)

| Breakpoint  | Comportamento principal                                           |
|-------------|-------------------------------------------------------------------|
| 360 px      | Layout-base mobile-first. 1 coluna. Search abaixo do header.      |
| 480 px      | Banners secundários permanecem 2 col. Cards rail = 180 px.         |
| 768 px      | Hero vira 2 col. Grid Alfaiataria = 3 col. Footer abre 2 col.     |
| 1024 px     | Header abre nav completa. Banners 3 col. Grid Alfaiataria = 4 col.|
| 1280 px+    | Container `max-w-[1280px]` centralizado, padding lateral 2.5 rem. |

Tailwind aliases recomendados: usar os defaults do v4 (`sm` 640, `md` 768,
`lg` 1024, `xl` 1280). Nenhum custom breakpoint necessário.

## Estados de hover/foco/disabled (resumo)

| Componente              | Hover                          | Focus visible                 | Disabled               |
|-------------------------|--------------------------------|-------------------------------|------------------------|
| `circulou-btn-primary`  | bg cedro → cobre               | outline 3 px âmbar            | opacity 50, cursor not |
| `circulou-btn-ghost`    | bg transparente → cedro/cru    | outline 3 px cobre            | opacity 50             |
| Nav-link                | cor cedro → cobre              | outline 2 px cobre offset 2   | n/a                    |
| ProductCard             | translateY(-3px) + shadow-lg   | outline 2 px cobre offset 3   | bg areia-soft, mute    |
| Banner-tile             | scale(1.015)                   | outline herdado do `<a>`      | n/a                    |
| Search input            | n/a (input)                    | border oliva + ring 3 px      | bg areia-soft          |

`prefers-reduced-motion: reduce` cancela todas as transições e animações
(regra global em `tokens.css`). Nenhuma informação é transmitida apenas
por cor — toda tag tem ícone/texto adicional, todo preço com desconto
mostra também o valor original tachado.

## Parallax

Os mockups (`index.html` e `mobile.html`) trazem efeitos de parallax
inline para elevar a sensação editorial sem quebrar a portabilidade
standalone (`file://`) e sem dependências externas.

### Inventário (desktop · `index.html`)

| Elemento                      | Efeito                                           | Anchor   |
|-------------------------------|--------------------------------------------------|----------|
| `.hero-sun`                   | Desce 180 px + rotaciona −8°, drift +40 px em X  | root     |
| `.hero-blob`                  | Sobe 120 px e sai pela esquerda (−60 px X)       | root     |
| `.hero-text`                  | Translate-up 40 px + fade 1 → 0.55                | root     |
| `.hero-photo`                 | Sobe 60 px (mais lento que o texto)              | root     |
| `.editorial-photo`            | Translate Y de +60 px → −60 px ao cruzar viewport| self     |
| `.sell-cta::before` / `.sell-cta-blob` | Drift inverso: +40,+80 px → −40,−80 px  | self     |

### Inventário (mobile · `mobile.html`)

Apenas `.m-hero-sun` (desce 100 px, +20 px X, −6° de rotação enquanto
o usuário rola os primeiros 400 px). **Nenhum** outro elemento ganha
parallax em mobile — decisão deliberada (ver trade-offs abaixo).

### Técnica

Dois caminhos coexistem com **detecção automática**:

1. **CSS scroll-driven animations** (caminho A — Chrome/Edge 115+):
   `animation-timeline: scroll(root)` para alvos ancorados no
   documento (hero) e `animation-timeline: view()` para alvos
   ancorados no próprio elemento (banner editorial, blob da seção
   "Quero Vender"). Zero JS, zero custo de listener.
2. **Fallback JS** (caminho B — Safari, Firefox <130):
   detectado via `CSS.supports('animation-timeline: scroll()')`. Um
   IIFE no fim do `<body>` adiciona a classe `.js-parallax` ao
   `<html>` e atualiza CSS variables (`--p-y`, `--p-x`, `--p-rot`,
   `--p-opacity`) via `requestAnimationFrame` num único listener de
   scroll passive. `IntersectionObserver` ignora alvos fora do
   viewport (com 50% de margem). Apenas `transform: translate3d` é
   tocado — promove camada GPU e evita reflow.

Em ambos os caminhos o cálculo inicial roda **sincronamente** no
load (DOMContentLoaded é desnecessário — script está antes de
`</body>` com elementos já parseados) para evitar "salto" do `<main>`
no primeiro paint quando a página é recarregada já rolada (CLS).

### Reduced motion

O hook `prefers-reduced-motion: reduce` cancela parallax em três
níveis:

- regra `@media (prefers-reduced-motion: reduce)` no `<style>`
  inline força `animation: none` + `transform: none !important` em
  todos os alvos (mais específica que a regra global do `tokens.css`,
  que só zera `transition`/`animation` mas não `transform`);
- o IIFE retorna cedo se a media query já estiver ativa no load;
- um listener de mudança no `prefersReduce` derruba o efeito em
  runtime se o usuário ativar a preferência durante a sessão (limpa
  CSS variables inline e remove `.js-parallax` do `<html>`).

### Como portar para React (frontend-react-developer)

Recomenda-se um hook único — sugestão de assinatura:

```ts
// src/hooks/useParallax.ts (NÃO criado por este agente — apenas spec)
type ParallaxConfig = {
  anchor: 'root' | 'self';
  // root: speed (multiplicador do scrollY) + max (clamp em px)
  speed?: number;
  max?: number;
  // self: range (px de translate ao longo da passagem) + offset inicial
  range?: number;
  offset?: number;
  extras?: (progress: number, el: HTMLElement) => void;
};

export function useParallax<T extends HTMLElement>(
  config: ParallaxConfig
): React.RefObject<T>;
```

Diretrizes de implementação no React:

1. **Mesma feature-detection**: o hook deve checar
   `CSS.supports('animation-timeline: scroll()')` e, se verdadeiro,
   apenas anexar a classe CSS-only (não anima via JS). Os keyframes
   ficam em `src/styles/parallax.css` (ou inline em `theme.css`).
2. **Mesma ordem de saída**: respeitar `prefers-reduced-motion` antes
   de qualquer trabalho. Use `useSyncExternalStore` ou
   `matchMedia(...).addEventListener('change', ...)`.
3. **Compartilhar o `requestAnimationFrame`**: se a Home tiver mais
   de 5 alvos, agregue todos num único loop (não um rAF por hook). O
   hook pode registrar-se num `ParallaxRegistry` Context que mantém o
   loop singleton.
4. **`IntersectionObserver`**: o hook deve usar UM observer
   compartilhado (registry) para evitar N observers separados.
5. **Cleanup obrigatório**: remover listener, `unobserve`, e limpar
   `style.removeProperty(...)` no `useEffect` de cleanup.
6. **Não tocar transforms já existentes**: a `.hero-photo` tem
   `rotate(-1.5deg)` estática. O hook deve usar uma CSS var (`--p-y`)
   composta com o transform original via classe CSS, não escrever
   `el.style.transform` direto (sobrescreveria a rotação base).

### Trade-offs registrados

- **Não apliquei parallax no banner editorial em mobile**: o blob
  âmbar da seção "Quero Vender" mobile passa atrás do texto cru. Um
  parallax inverso desloca o blob para perto do bloco de copy
  durante a saída do viewport e reduz o contraste de cru
  (`#F5ECE5`) sobre âmbar (`#D69543`) de ~4.5:1 (cobre puro) para
  ~3.2:1 (cobre + âmbar misturados pela transparência), violando
  WCAG AA. Em desktop o blob vive bem longe da copy → sem risco.
- **Não usei `background-attachment: fixed`** em nenhuma camada:
  além de quebrar em iOS Safari, força repaint em `scroll` e
  contraria a meta de Lighthouse Performance ≥ 90. Tudo é
  `transform`.
- **Hero text fade só vai até 0.55, não 0**: a copy do hero precisa
  permanecer legível mesmo com o usuário rolando lentamente até o
  fim da viewport do hero (cenário comum em scroll com trackpad
  preciso). Fade total ofuscaria o h1 numa zona ainda legível.

## Notas para o desenvolvedor frontend

1. **Não reuse classes Bootstrap** — o `index.html` usa CSS standalone
   apenas para a demo. Ao portar para React, mapeie 1:1 para utility
   classes do Tailwind v4 (sugeridas em comentário `/* … */` no topo do
   `<style>` do `index.html`).
2. **Tokens**: NÃO modifique `src/styles/theme.css` direto sem aprovação.
   Para testar a paleta nova, importe `tokens.css` em paralelo (ele
   sobrescreve `--color-primary` etc.). Quando aprovado, fundir.
3. **Componentes existentes a reusar**:
   - `ProductCard` / `ProductGrid` — já alinha com o markup `.product-card`
     do mockup. Só precisa receber as props certas (brand, name, size,
     condition, priceNow, priceOld) e ganhar a variant **rail** que
     deixa width fixo + scroll-snap-align (passar via prop ou variante).
   - `Header` e `Footer` — recomenda-se redesign conforme markup novo
     (são componentes puramente apresentacionais).
4. **Imagens placeholder**: o mockup usa Unsplash via URL para entregar
   uma sensação real. Em produção, trocar por imagens reais da Circulou
   ou usar `picsum.photos` no ambiente de dev.
5. **Fontes**: precisamos adicionar `Alfa Slab One` e `DM Sans` ao
   `index.html` raiz do app (`public/index.html` ou via `<link>` em
   `App.tsx`). DM Mono é opcional (só usada em tags) — pode ser
   substituída pela mono do sistema sem perda significativa.
6. **i18n**: site é monolíngue pt-BR (constituição v2.1.0). Strings da
   home devem ir para `src/locales/pt-BR/home.json` (ou similar) ainda
   que não exista chave de troca de idioma — facilita auditoria de copy.
7. **Acessibilidade**: skip-link no topo, `<main id="main">`, headings
   em ordem (h1 único hero, depois h2 por seção, h3 dentro de cards).
   Imagens decorativas (sol/blob) são `aria-hidden`. Search tem `<label
   class="sr-only">`. Sacola tem `aria-label="Sacola — N itens"`.
8. **Performance**: sem JS na home além do que já existe. Rail horizontal
   é CSS puro com scroll-snap. Foto Unsplash deve ser substituída por
   `<img loading="lazy" decoding="async">` em produção.
9. **Bundle**: a home não introduz novas dependências. Lembrando que o
   bundle JS principal já passa de 500 KB conforme `CLAUDE.md` —
   considerar `manualChunks` quando rolar code-splitting da Phase 9.
