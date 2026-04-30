# PDP — Página de Detalhes do Produto

Mockups standalone (HTML+CSS, abrem via `file://`) que definem a **PDP** do
Circulou. Reutilizam integralmente os tokens da Home
(`docs/design/home/tokens.css`) e o vocabulário visual de Home + Categoria.

```
docs/design/product/
├── index.html    Desktop ≥1024px — galeria thumbs+main, painel sticky, attrs 3-col
├── mobile.html   Mobile 360px    — galeria swiper, accordion, FAB-bar
└── README.md     Este documento (spec textual)
```

> Frontend porta para React+Tailwind v4 depois. As classes próprias (`.gallery-main`,
> `.attrs-list`, `.qty-stepper`, `.fab-bar`) traduzem 1:1 para `@apply`/utilities
> Tailwind quando o time abrir o componente real. **Não há `.tsx` neste diretório.**

---

## 1. Hierarquia visual e tipografia

A PDP é uma página de **decisão de compra** — a hierarquia precisa guiar o
olho do "isso é o produto?" → "quanto?" → "compra?" → "vale confiar?" → "tem
mais?".

### Ordem do painel direito (desktop) / sequência vertical (mobile)

A coluna direita do desktop concentra **toda** a leitura — a galeria fica
sticky enquanto o usuário rola pelo painel. Em mobile, mesma sequência em
coluna única. Ordem definida pelo cliente:

1. **Nome do produto** (`<h1>`)
2. **Preço** (atual + original riscado + badge de desconto)
3. **Quantidade + "Adicionar à sacola" + Favoritar** (mesma linha — `.qty-cta-row`)
4. **Descrição** (prosa, eyebrow "Sobre essa peça", `<article>`)
5. **Calcular Frete** (input CEP + botão + linha de resultado)
6. **Vendido por** (card compacto com logo, nome, rating, CTA "Ver loja")
7. **Características do produto** (Geral / Medidas / Cuidados em `<dl>`)

Acima do nome ainda há marca + breadcrumb e chip da categoria, e a galeria
ocupa a coluna esquerda (sticky em ≥1024 px). Abaixo das características
fica o rail "Você também vai gostar" em full-width.

| Nível | Elemento | Tipografia | Cor |
| --- | --- | --- | --- |
| 1 | Foto principal | — (visual) | — |
| 1 | `<h1>` nome do produto | `Alfa Slab One`, clamp(1.75rem, 3vw, 2.5rem) | `--color-cedro` |
| 2 | Preço atual | `Alfa Slab One`, clamp(2rem, 3.5vw, 2.75rem) | `--color-cobre` |
| 2 | CTA "Adicionar à sacola" | `DM Sans`, 600, 1rem, 52px height | `--color-cedro` bg, `--color-cru` text |
| 3 | `<h2>` "Sobre essa peça" / "Outros tênis" | `Alfa Slab One`, clamp(1.5rem, 3vw, 2.25rem) | `--color-cedro` |
| 3 | `<h3>` "Geral / Medidas / Cuidados" | `DM Mono`, 0.78rem, uppercase, letter-spacing 0.12em | `--color-cedro` + border-bottom 1.5px |
| 4 | Marca, breadcrumb, rótulos | `DM Mono`, 0.7–0.78rem, uppercase, letter-spacing 0.08–0.12em | `--color-mute` / `--color-cedro` |
| Body | Descrição editorial | `DM Sans`, 1.125rem, line-height 1.75, max 64ch | `--color-ink-soft` |
| Body | Características (`<dd>`) | `DM Sans`, 0.92rem, weight 600 | `--color-ink` |
| Body | Características (`<dt>`) | `DM Sans`, 0.85rem, weight 500 | `--color-mute` |

**Por que `<dl>` para características.** É a marcação semântica nativa para
"chave → valor". Leitores de tela narram "termo / definição" em par. CSS Grid
de duas colunas (`1fr` x `1.4fr`) alinha tudo na vertical sem `<table>` (que
é um exagero pra dado não-tabular).

**Códigos de tamanho/medida usam `<code>`.** Visualmente vira chip âmbar
(`--color-areia-soft`) — cria âncoras escaneáveis para quem só busca "tem
no meu tamanho?".

---

## 2. Comportamento responsivo

Breakpoints (alinhados aos da Categoria):

| Breakpoint | Layout |
| --- | --- |
| **≥1200 px** | Galeria thumbs vertical (88px) + main 4/5; painel sticky 40-45% à direita; attrs 3 col; rail 4-6 cards |
| **1024–1199 px** | Idem, com main de galeria reduzida; rail 3-4 cards visíveis; painel ainda sticky |
| **768–1023 px** | Galeria empilha (main 4/5 → thumbs viram horizontal abaixo); painel deixa de ser sticky e empilha em coluna; attrs continuam 3 col com gap menor (ou 1 col se < 900) |
| **<768 px** | Mobile-first (ver `mobile.html`). Galeria swiper full-bleed; accordion; FAB-bar; rail 160 px de card |

Detalhes mobile específicos (em `mobile.html`):

- **Galeria full-bleed swiper**: `display: flex; overflow-x: auto; scroll-snap-type: x mandatory`. Cada slide é `flex: 0 0 100%`. Sem JS — scroll nativo do browser. Indicadores de pontos sincronizados ficam por conta do React (intersection observer no slide ativo).
- **App-bar compacta**: 4 colunas (logo · spacer · busca · sacola). Busca aciona um drawer de busca em vez do input inline.
- **Accordion via `<details>`/`<summary>`**: Geral abre por default (`open` attribute). Medidas e Cuidados fechados. `aria-expanded` é gerido implicitamente pelo browser via `<details>`. Para sincronizar React, use `onToggle` no elemento.
- **Descrição com clamp visual**: `max-height: 9.5rem` + gradient fade-out. Botão "Ver mais ↓" é o único conteúdo interativo abaixo do clamp — alterna o `max-height: none` ao clique. Frontend: `useState` simples.
- **FAB-bar sticky**: `position: sticky; bottom: 0;` com `padding-bottom: env(safe-area-inset-bottom)` para iOS notch/home bar. CTA primário 48px height + ♡ separado em coluna `auto`.

**Defesa contra overflow horizontal:** `html, body { overflow-x: clip; }` +
`min-width: 0` em filhos de `.pdp-layout` e `.gallery`. Lições aprendidas no
fix da Categoria — sem isso, fotos com scale + chips com longa label
estouram a `1fr`.

---

## 3. Estados a desenhar

| Estado | Visual | Quando | Component contract |
| --- | --- | --- | --- |
| **Padrão** | Stan Smith — preço atual + riscado + badge `−62%` | `unitPriceDiscount > 0` AND `purchasable === true` | default |
| **Indisponível** | Foto com overlay `rgba(20,20,20,0.55)` + selo central `Esta peça já circulou` em pill cobre. CTA primário substitui texto para `Avise-me se voltar` (em outline `--color-mute`) e `quantity input` desabilita | `purchasable === false` OR `limit === 0` | `<ProductGallery soldOut />` + `<ProductCTA disabled label="Avise-me se voltar" />` |
| **Em promoção** (Sale) | Badge cobre `−XX%` ao lado do preço (já é o padrão neste mockup). Pode escalar pra um pill maior `Last Chance` se desconto > 50% | `unitPrice < unitPriceOriginal` | atributo `discount` calculado client-side; >50% renderiza pill secundário |
| **Nova com etiqueta** | Pill âmbar `state-badge--new` "Nova c/ etiqueta" sob o preço | `condition === "new-with-tag"` | atributo de condição (gap LOFN-G31) |
| **Última peça** | Pill âmbar `state-badge--unique` `★ Só essa! Última peça em estoque`. Quantity stepper com `max=1` e botões `−`/`+` desabilitados | `limit === 1` | nesta entrega é o estado padrão renderizado |
| **Sem fotos extras** (só 1) | Esconde `.gallery-thumbs`, esconde setas/dots; foto principal ocupa toda a coluna esquerda | `images.length <= 1` | `<ProductGallery>` checa `images.length` e renderiza variante simples |

Mockup atual (`index.html`) renderiza o **Padrão + Última peça**.
Mockups dos outros estados são derivações triviais — não duplicamos arquivos.

---

## 4. Acessibilidade

Todos os requisitos da Constituição (WCAG AA, contraste ≥4.5:1, foco visível, touch ≥44px) atendidos.

### Galeria (carousel)

- Wrapper `<section aria-roledescription="carousel" aria-label="Galeria de fotos do produto">`.
- Cada thumb é um `<button role="tab" aria-controls="gallery-main-photo" aria-current="true|false" aria-label="Foto N de M: descrição">`. Ao trocar slide, o React atualiza apenas o `aria-current`.
- Foto principal vira `<div role="tabpanel" aria-roledescription="slide" aria-label="Foto N de M: descrição">` — texto sincronizado via efeito.
- Setas `<button aria-label="Foto anterior|Próxima foto">` com estados `disabled` no início/fim. Navegação por teclado: `←` `→` quando o foco está em `.gallery-main` (handler React).
- Mobile: `<div class="gallery-track" tabindex="0" aria-label="Arraste para ver mais fotos">` permite scroll com arrow keys + screen reader anuncia o role descriptor. Cada `.gallery-slide` tem `role="group" aria-roledescription="slide" aria-label="Foto N de M"`.
- **Cursor zoom-in** no main + hint "⤢ clique para ampliar" no canto. O lightbox em si é fora deste mockup; quando o frontend implementar, deve ser um `<dialog role="dialog" aria-modal="true" aria-label="Foto ampliada">` com trap de foco.

### Accordion (mobile)

- `<details>` nativo é a melhor escolha aqui — `aria-expanded` e foco são gratuitos.
- Cada `<summary>` tem `aria-label="Características gerais (aberto)"` redundando o ícone visual `+`/`−`.
- `min-height: 44px` no summary garante touch target.

### Foco e contraste

- Todo elemento interativo tem `:focus-visible` com outline cobre 2-3px e offset.
- Preço (`#AE531A` cobre sobre `#F5ECE5` cru) → ratio 4.86 (passa AA).
- Texto secundário (`--color-mute` `#8A7E6F` sobre cru) → ratio 4.32 — **só usado em rótulos não essenciais** (`Tam. 39 · semi-novo` em cards relacionados, `SKU 102934`); nunca em informação de decisão de compra.
- Estado "indisponível" não comunica só por opacidade — sempre acompanhado de pill com texto `Esta peça já circulou`.

### Forma e CTA primário

- `aria-label` específico do CTA inclui o nome do produto: `Adicionar Tênis Adidas Stan Smith à sacola`. Screen reader narra contexto, evitando lista de "Adicionar" repetidos quando o usuário navega por landmark.
- `<button aria-pressed="true|false">` no favoritar — toggle button pattern (não checkbox).
- Quantity stepper: `<input type="number" min max>` é o controle real; botões `+`/`−` são complementares e disparam `input.stepUp()` / `stepDown()`. Sem botões, o input ainda funciona com teclado.

---

## 5. Componentes para o frontend criar/reutilizar

A árvore de componentes React proposta (sem `.tsx` aqui — só contrato):

```
<ProductDetailPage productId>
├── <SiteHeader />                          # já existe (Home, Categoria)
├── <Breadcrumb items={[home, comprar, categoria, subcategoria, produto]} />
├── <ProductHero>                           # 2-col layout
│   ├── <ProductGallery
│   │     images={ProductImageInfo[]}
│   │     productName
│   │     soldOut?: boolean />
│   └── <ProductInfoPanel
│         brand
│         name
│         categoryPath={ {label, slug}[] }
│         price unitPrice unitPriceOriginal discount?
│         state?: 'unique' | 'sold' | 'new-tag' | 'sale'
│         limit
│         seller={ name, slug, logo, rating, salesCount }
│         onAddToCart onFavorite />
├── <ProductAttributes
│     general={ Record<string, string> }
│     measurements={ Record<string, string> }
│     care={ Record<string, string> } />        # 3-col desktop, accordion mobile
├── <ProductDescription markdown />            # react-markdown + remark-gfm já no stack
├── <StoreSellerCard seller />                 # bloco de quem vendeu
├── <RelatedProductsRail items={ProductInfo[]} /> # reusa <ProductCard> existente
└── <SiteFooter />
```

Componentes **novos** (não existem ainda):

- **`<ProductGallery>`**: thumbs + main desktop, swiper mobile. Estado interno: `currentIndex`. Props: `images: { id, src, alt? }[]`, `productName: string`, `soldOut?: boolean`. Quando `images.length <= 1`, renderiza variante simples (sem setas/dots).
- **`<ProductInfoPanel>`**: o painel direito. Propaga callbacks `onAddToCart(quantity)` e `onFavorite()` para o caller (que decide chamar `nauth-react` para checar login antes do fluxo Lofn).
- **`<ProductAttributes>`**: recebe 3 records. Em desktop renderiza 3 grupos lado a lado em `<dl>`. Em mobile renderiza 3 `<details>` (Geral aberto). Considerar `<ProductAttributes.Group title icon items />` como subcomponente.
- **`<ProductDescription>`**: thin wrapper sobre `react-markdown`. Aplica os estilos editoriais (max 64ch, line-height 1.75). Mobile: encapsula a lógica de `expanded` + clamp via gradient.
- **`<StoreSellerCard>`**: componente pode ser reusado depois na página de loja. Props: `seller: { name, slug, logo, rating, ratingCount, salesCount, location, joinedAt }`.
- **`<RelatedProductsRail>`**: rail horizontal. **Pode ser quase idêntico** ao rail "Hot News" da Home — reusar o componente `<ProductRail>` se existir, passando `title`, `items`, `cta`.

Componentes **reutilizáveis** (já existem ou devem existir após Categoria):

- `<SiteHeader />`, `<SiteFooter />`, `<Breadcrumb />`, `<ProductCard />`, `<CirculouTag />`, `<CirculouButton variant />`.

---

## 6. Backend gaps

Identificados ao mapear `ProductInfo` do Lofn contra os requisitos da PDP.
**Use o prefixo `LOFN-G##`** — números atribuídos para distinguir; o time
backend renumera ao registrar oficialmente.

| Gap | Descrição | Mitigação no frontend até o backend resolver |
| --- | --- | --- |
| **LOFN-G30** | **Atributos estruturados gerais** (condition, brand, color, material, composition, gender, model). `ProductInfo` só tem `description: string`. | Mock em `productAttributesMock.ts` com `Record<productId, Record<string, string>>`. Renderizar valores reais quando o schema chegar. |
| **LOFN-G31** | **Condição da peça** (`new-with-tag` / `semi-new` / `great` / `signs-of-use`). Hoje vazio. Já apareceu como gap na Categoria também. | Enum string client-side, mesmo set da Categoria; mapear para `state-badge--new` etc. |
| **LOFN-G32** | **Tamanho** (`size: string` ou `size: { br, us, eu }`). Lofn não modela. | Mock string até backend abrir. Componente já renderiza como `<code>39</code>` com chip âmbar; aceita string literal. |
| **LOFN-G33** | **Medidas** (busto, cintura, quadril, comprimento, palmilha, altura solado, etc.). Não existe coluna/atributo. | `Record<string, string>` no mock. Considerar uma tabela `product_measurements` + um pivot key/value para flexibilidade entre categorias (calçado tem palmilha; vestido tem busto). |
| **LOFN-G34** | **Endpoint de produtos relacionados** (`/products/:productId/related`). Não existe. | Mock cliente: cruzar `products` por `categoryId` igual + `unitPrice` ±50%, excluindo o próprio produto. Limitar a 6 cards. |
| **LOFN-G35** | **Reputação da loja** (`rating`, `ratingCount`, `salesCount`, `joinedAt`). Não existe. | Placeholder visual fixo (`★★★★★ 4,9 · 1.247 vendas`). Quando o backend abrir, troca o componente sem mudar layout. |
| **LOFN-G36** | **Categoria global mapping** (id → label legível). Já documentado pela página de Categoria. Necessário para o breadcrumb mostrar `Calçados › Tênis` em vez de slug. | Mock no service de catálogo até o backend expor `/categories/tree`. |
| **LOFN-G37** | **Múltiplas fotos com ordenação garantida**. `ProductInfo` já tem `images: ProductImageInfo[]`, mas convém confirmar se a ordem é estável (primeira sempre é a "capa"?) e se há campo `displayOrder`. | Frontend assume `images[0]` é capa e ordena por `id` ascending como fallback. **Não é gap real** — só validação. |
| **LOFN-G38** | **Política de devolução por produto/loja**. Frontend mostra "Devolução grátis em 7 dias" como linha estática. Pode no futuro vir do backend (loja escolhe). | String hard-coded até backend modelar. |

> Referência: a Home + Categoria já listou os gaps de **árvore global de
> categorias** e **count por categoria/subcategoria**. Estes não estão
> reduplicados aqui; veja `docs/design/category/README.md` (quando existir)
> ou as anotações inline.

---

## 7. Decisões de design não-óbvias (registro)

1. **Não usei tabs entre Características / Descrição / Avaliações.** Tabs escondem informação que o cliente quer comparar em paralelo (ex.: "diz semi-novo, mas as medidas batem com tam.39?"). Página inteira mantém tudo escaneável e gera um SEO mais robusto (todo o conteúdo está no DOM inicial). Mobile compensa com accordion porque o trade-off muda — ali o problema é vertical-scroll fatigue, não comparação cross-section.
2. **`<dl>` em vez de tabela para atributos.** Marcação semântica certa para chave→valor; SR narra "termo: definição"; CSS Grid 2 colunas dá o mesmo visual; tabelas reservam-se para dados verdadeiramente tabulares.
3. **Galeria desktop com thumbs vertical à esquerda** (estilo COS/Zara), não horizontal abaixo. A coluna esquerda fica ocupada com 88px que iam virar margin morta — densidade da página aumenta sem custo.
4. **Painel sticky até atingir características**, não até o footer. Quando o usuário rola para ver attrs/descrição, a área de decisão (preço + CTA) "se solta" e libera espaço — é um sinal natural de "agora você está em modo investigação, não decisão". A FAB-bar no mobile cumpre o equivalente sempre-visível.
5. **Breadcrumb completo no topo + chip categoria no painel.** Redundância proposital: breadcrumb serve de orientação de hierarquia (a 2 cliques de distância ao topo), chip serve de **link de exploração lateral** (volta direto pra subcategoria com filtros pré-aplicados, sem subir até o topo).
6. **CTA "Adicionar à sacola" + ♡ em coluna `1fr auto`** — favoritar não compete pelo width quando o nome do produto é grande. A ergonomia mobile colocou os dois lado a lado na FAB-bar pelo mesmo motivo.
7. **Estado "Última peça" usa âmbar, não cobre.** Cobre é reservado para promoção/desconto e estados negativos (vendido). Âmbar = atenção positiva, sem urgência manipulativa estilo "RESTAM 2!" das fast-fashions.
8. **Cursor zoom-in + hint visível na main, lightbox como melhoria.** Não bloqueamos a entrega aguardando lightbox. Hint "⤢ clique para ampliar" telegrafa a affordance — mesmo sem implementação no mockup.
