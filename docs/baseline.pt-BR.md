# Baseline — Documentação de Comportamento

> Este documento registra, item a item, **como o protótipo funciona hoje**. Qualquer evolução futura deve preservar estes comportamentos.
>
> **Como verificar o baseline:** abrir `index.html` no navegador e garantir que a aplicação abre normalmente e sem erros no console.

---

## Índice

1. [Visão geral](#visão-geral)
2. [Checklist: 6 seções](#checklist-6-seções)
3. [Checklist: os 49 itens](#checklist-os-49-itens)
4. [Dados do produto](#dados-do-produto)
5. [Seções recolhíveis (collapsible)](#seções-recolhíveis-collapsible)
6. [Barra de progresso](#barra-de-progresso)
7. [Artwork de demonstração](#artwork-de-demonstração)
8. [Upload de artwork](#upload-de-artwork)
9. [Zoom](#zoom)
10. [Drag-and-drop](#drag-and-drop)
11. [Criação de pins](#criação-de-pins)
12. [Navegação pin ↔ item](#navegação-pin--item)
13. [Clear Pins](#clear-pins)
14. [Exportação JSON (Save Check)](#exportação-json-save-check)
15. [Toast (feedback visual)](#toast-feedback-visual)
16. [Mapa de estado atual](#mapa-de-estado-atual)
17. [Bateria de testes de regressão](#bateria-de-testes-de-regressão)

---

## Visão geral

| Propriedade | Valor |
|---|---|
| App | Artwork & Pack Copy Checklist |
| Padrão | BRCGS Product Labelling 5.2.1 \| Multi-Site Aligned |
| Arquitetura | `index.html` + `css/style.css` + `js/app.js` (JavaScript puro) |
| Dependências externas | Nenhuma |
| Frame atual (baseline) | Funcionalidades marcadas com ✅ abaixo |

---

## Checklist: 6 seções

O checklist é **renderizado por JavaScript** a partir do array `sections` (`js/app.js`). O HTML contém apenas o container `#checklist`. A primeira seção abre expandida; as demais iniciam recolhidas.

| # | Seção | Itens | IDs |
|---|-------|:---:|---|
| 1 | Legal Core (BRCGS 5.2.1) | 10 | 1A–1J |
| 2 | Ingredients & Allergens | 5 | 2A–2E |
| 3 | Nutrition & Serving | 10 | 3A–3J |
| 4 | Storage & Cooking | 4 | 4A–4D |
| 5 | Claims & Certifications | 12 | 5A–5L |
| 6 | Packaging, Marks & Languages | 8 | 6A–6H |
| **Total** | | **49** | |

---

## Checklist: os 49 itens

Cada item possui `id`, `title` e `note` (nota opcional exibida sob o título). A referência exibida é o `id` em maiúsculas (ex.: `1A`).

### 1. Legal Core (BRCGS 5.2.1)

| ID | Item | Nota |
|:--:|---|---|
| 1A | Product Name / Legal Name | Must be clear, not misleading, and reflect true nature of food |
| 1B | Net Quantity (Weight / Volume) | g or ml, with e-mark where applicable |
| 1C | e Mark Present | If pre-packed, verify e-mark is correctly placed |
| 1D | Legal Product Descriptor | Accurate description of product category |
| 1E | Business Name & Address (FBO) | Full address or code referencing pack info |
| 1F | Website | — |
| 1G | Country of Manufacture / Origin | COOL info if required (primary ingredient rule) |
| 1H | Best Before / Use By Date Format & Location | — |
| 1I | Lot / Batch Code Present | — |
| 1J | Barcode & 2D Codes | Readable, correct dimensions, front & back if applicable |

### 2. Ingredients & Allergens

| ID | Item | Nota |
|:--:|---|---|
| 2A | Ingredients Declaration | Descending order by weight; bolded allergens |
| 2B | Allergy Advice Box | "For allergens, see ingredients in bold" (if contains allergens) |
| 2C | Nut Warning Statement | O/H & B/L or B/L only as applicable |
| 2D | Intolerance Info | — |
| 2E | "Some Separation is Natural" | If applicable |

### 3. Nutrition & Serving

| ID | Item | Nota |
|:--:|---|---|
| 3A | Energy (kJ / kcal) | — |
| 3B | Fat & Saturates | — |
| 3C | Carbohydrates & Sugars | — |
| 3D | Protein | — |
| 3E | Salt | Or "Salt due to presence of naturally occurring sodium" |
| 3F | Optional: Fibre, Starch, Polyols, Mono/Polyunsaturates | — |
| 3G | Vitamins & Minerals | If added or claimed |
| 3H | Reference Intakes (RIs) — Front of Pack | — |
| 3I | Serving Size & Number of Servings | — |
| 3J | Guideline Daily Amounts / % RI per portion | — |

### 4. Storage & Cooking

| ID | Item | Nota |
|:--:|---|---|
| 4A | Storage Instructions | — |
| 4B | Storage Instructions — Once Opened | — |
| 4C | Cooking Instructions | If applicable |
| 4D | Serving Suggestion | If image shown |

### 5. Claims & Certifications

| ID | Item | Nota |
|:--:|---|---|
| 5A | Suitable for Vegetarians | — |
| 5B | Suitable for Vegans / Vegan Certified | Certified requires registration number/logo |
| 5C | Gluten Free / Wheat Free / Suitable | — |
| 5D | Free From Claims | — |
| 5E | Halal Claim | — |
| 5F | Kosher Claim | — |
| 5G | Organic Logo & Cert Body | Logo min 9mm(H) × 13.5mm(W), ratio 1:1.5 |
| 5H | No Artificial Colours, Preservatives or Flavours | — |
| 5I | No Added Fat / Low Fat / Low Sugar / Low Calorie | — |
| 5J | Provenance / Variety Claim | — |
| 5K | Chilli Pepper Heat Level | — |
| 5L | Any Other Claim | Specify in notes |

### 6. Packaging, Marks & Languages

| ID | Item | Nota |
|:--:|---|---|
| 6A | Multilingual Wording | ES, FR, IT, DE etc. |
| 6B | Customer Guarantee Statement | — |
| 6C | Package Recycling Statement / Info | — |
| 6D | Dairy Health Mark | UK FR 036 EC / UK FR 048 EC |
| 6E | Label Size — Length / Width | — |
| 6F | Label Commodity Codes | — |
| 6G | Product Name on Back Label Too? | Y/N |
| 6H | Tamper Evidence | Type, Text, Size |

---

## Dados do produto

Quatro campos de texto no painel esquerdo (`product-bar`), em grade 2×2:

| Campo | ID do input | Placeholder |
|---|---|---|
| Brand | `inp-brand` | Brand |
| Product Name / Legal Name | `inp-name` | Product Name / Legal Name |
| Weight | `inp-weight` | Weight (g/ml) |
| SKU | `inp-sku` | SKU / Code |

**Comportamento atual:** valores livres, sem validação. Não são persistidos (perdem-se ao recarregar). São incluídos na exportação JSON quando o usuário clica `Save Check`.

---

## Seções recolhíveis (collapsible)

- Cada seção é um botão (`section-btn`) + um contêiner (`section-content`).
- **Estado inicial:** seção 1 expandida; seções 2–6 recolhidas.
- **Ação:** clique no título alterna a classe `hidden` (conteúdo) e `collapsed` (botão, girando a seta -90°).
- **Abreviação:** o clique em um pin que leva a um item de seção recolhida **expande a seção automaticamente** (via `scrollToItem`).

---

## Barra de progresso

| Aspecto | Comportamento |
|---|---|
| Posição | Rodapé do painel esquerdo (`progress-footer`) |
| Fórmula | `checked / total` — conta checkboxes do DOM em `updateProgress()` |
| Texto | `X / 49 checked` (elemento `#progress-text`) |
| Barra | `#progress-bar`, largura = `%` do total, verde `#10b981`, arredondada |
| Transição | `width 0.3s ease` |
| Atualização | A cada clique em checkbox (`toggleCheck` → `updateProgress`) e no carregamento inicial |

> ⚠️ **Comportamento atual a não confundir:** a barra mede apenas **itens marcados** (checked). Não distingue aprovado vs. rejeitado nem considera % de revisão vs. % de aprovação.

---

## Artwork de demonstração

- **Não é uma imagem:** é um mock estático construído em HTML/CSS (`#artwork-wrapper > .artwork > .pack-front + .pack-back`), 480px de largura, com sombra e cantos arredondados.
- **Frente (Front of Pack):** brand, product title, descriptor, imagem de porção, peso líquido, claims e mini-tabela nutricional (FOP).
- **Verso (Back of Pack):** ingredientes, alergênicos, tabela nutricional (BOP), armazenamento, instruções de cozimento, fabricante, código de barras e metadados.
- **Elementos anotáveis:** cada região relevante tem `data-el` (brand, product-name, descriptor, serving-image, weight, claims, nutrition-fop, ingredients, allergens, nutrition-bop, storage, cooking, address, barcode-area) e ganha contorno tracejado azul no hover.
- A camada de pins (`#pins-layer`) fica **sobreposta** ao wrapper (`position: absolute; inset: 0`), permitindo soltar itens em qualquer ponto da arte.

---

## Upload de artwork

> ⚠️ **Registro fiel ao código:** **não existe upload de imagem neste baseline.** Não há `<input type="file">`, nem função `handleUpload`, nem leitura de dados de imagem no `app.js`.

**Comportamento atual documentado:**

1. O visualizador exibe exclusivamente a artwork de demonstração (HTML/CSS);
2. Não há como substituir a imagem;
3. Não há leitura de dimensões reais de imagem (a largura é fixa, 480px);
4. Consequência esperada: quando o upload chegar, trocar a artwork deverá exigir confirmação caso existam pins (`"Replacing this artwork will invalidate existing pins. Continue?"`), e a identidade da imagem (`name`, `type`, `size`, `width`, `height`) deverá ser registrada.

---

## Zoom

| Aspecto | Comportamento |
|---|---|
| Função | `zoom(delta)` — botões `−` (`-0.1`) e `+` (`+0.1`) na toolbar do viewer |
| Faixa | **50% a 200%** (clamp: `Math.max(0.5, Math.min(2, currentZoom + delta))`) |
| Efeito | `transform: scale()` no `#artwork-wrapper` |
| Origem | `transform-origin: top center` |
| Transição | `transform 0.2s ease` |
| Rótulo | `#zoom-level` mostra percentual arredondado (ex.: `100%`) |
| Importante | O cálculo de posição dos pins **compensa o zoom** (divide a coordenada do mouse pelo zoom atual) |

---

## Drag-and-drop

| Etapa | Comportamento |
|---|---|
| `dragstart` (item) | Grava o `id` do item via `dataTransfer.setData('text/plain', id)`; `effectAllowed = 'copy'`; item ganha classe `.dragging` (opacidade 50%) |
| `dragend` (item) | Remove a classe `.dragging` |
| `dragover` (pins-layer) | `preventDefault()` — necessário para permitir o drop |
| `drop` (pins-layer) | Lê o `id`; se vazio, ignora; calcula `x = (clientX - rect.left) / currentZoom` e `y = (clientY - rect.top) / currentZoom`; chama `addPin(id, x, y)` |

**Regras atuais:**

- Cada item só pode ter **um pin** — soltar de novo **reposiciona** (remove o pin existente do mesmo id);
- O drop é aceito somente sobre a área da artwork (`#pins-layer`);
- Não há suporte a touch (drag-and-drop HTML nativo) — alternativa touch é a Camada K3;
- Hover sobre o item dispara `highlightPin` (animação `pulse` no pin) e o mouseleave remove.

---

## Criação de pins

| Aspecto | Comportamento |
|---|---|
| Estrutura | `<div class="pin" data-pid="{id}">` com `.pin-marker` (círculo azul com a referência) e `.pin-tooltip` (título do item) |
| Posição | Absoluta dentro de `#pins-layer`, com `transform: translate(-50%, -100%)` (o marcador "aponta" o ponto exato) |
| Estado | `pins[id] = { x, y }` em **pixels relativos à artwork** (já compensados pelo zoom no momento do drop) |
| Tooltip | Aparece no hover do pin (fundo escuro, título do item) |
| Hover no pin | Marcador escala 1.15 com sombra azul |
| Feedback | Toast `Pinned 1A to artwork` |
| Limitação documentada | Posições em pixels **não** acompanham mudanças de dimensão/zoom futuro — a normalização para `xRatio/yRatio` é a Camada E1 |

---

## Navegação pin ↔ item

| Direção | Gatilho | Comportamento |
|---|---|---|
| **Pin → item** | Clique no pin | `scrollToItem(id)`: expande a seção se estiver recolhida, rola suavemente até o item (`scrollIntoView`, `block: center`) e destaca o fundo em azul (`#dbeafe`) por 1,2s |
| **Item → pin** | `mouseenter` no item | `highlightPin(id)`: adiciona classe `.pulse` (anel pulsante no marcador) |
| Fim do hover | `mouseleave` no item | `unhighlightPin(id)`: remove `.pulse` |

---

## Clear Pins

| Aspecto | Comportamento |
|---|---|
| Ação | Botão `Clear Pins` na toolbar (`clearPins()`) |
| Efeito | Esvazia `#pins-layer` (innerHTML) e remove todas as chaves do objeto `pins` |
| Feedback | Toast `All pins cleared` |
| Confirmação | **Não há** confirmação prévia (ação destrutiva sem diálogo — melhoria prevista na Camada K1) |

---

## Exportação JSON (Save Check)

| Aspecto | Comportamento |
|---|---|
| Ação | Botão `Save Check` no header (`saveCheck()`) |
| Estrutura do JSON | `{ product: {brand, name, weight, sku}, checks: {id: boolean}, pins, timestamp }` |
| npm: arquivo | Baixado via blob (`application/json`), nome `artwork-check-{Date.now()}.json` |
| Conteúdo | Dados do produto lidos dos inputs; `checks` lidos dos checkboxes (cada id do item → true/false); `pins` copiado do objeto; `timestamp` ISO no momento do clique |
| Feedback | Toast `Checklist saved! JSON file downloaded.` |
| **Não faz** | Não persiste nada no navegador; não valida o estado; não inclui versão de schema |

**Exemplo da estrutura exportada:**

```json
{
  "product": {
    "brand": "Paulig",
    "name": "Premium Basmati Rice",
    "weight": "250g",
    "sku": "123456"
  },
  "checks": {
    "1a": true,
    "1b": false
  },
  "pins": {
    "3a": { "x": 231, "y": 84 }
  },
  "timestamp": "2026-08-17T12:00:00.000Z"
}
```

---

## Toast (feedback visual)

| Aspecto | Comportamento |
|---|---|
| Elemento | `#toast` fixo no canto inferior direito |
| Função | `showToast(msg)` |
| Duração | 2,5s (auto-remove classe `.show`) |
| Disparos atuais | Pin adicionado, Clear Pins, Save Check |

---

## Mapa de estado atual

O estado lógico **vive no DOM** (fonte da verdade). Este é o ponto central a ser corrigido na Camada B1.

| Estado | Onde vive hoje | Representação |
|---|---|---|
| Item marcado | checkbox | `input[type=checkbox]:checked` |
| Aparência de concluído | classe CSS | `.check-item.checked` |
| Dados do produto | inputs | `#inp-brand`, `#inp-name`, `#inp-weight`, `#inp-sku` |
| Seção aberta/fechada | classes CSS | `.section-content.hidden`, `.section-btn.collapsed` |
| Posição dos pins | objeto JS `pins` | `pins[id] = {x, y}` (pixels) |
| Títulos dos itens | array `sections` | duplicado; alvo da refatoração (`itemTitles`) |
| Zoom | variável `currentZoom` | número (0.5–2.0) |

**Funções atuais do `app.js`:** `zoom()`, `toggleCheck()`, `updateProgress()`, `addPin()`, `findItemById()`, `scrollToItem()`, `highlightPin()`, `unhighlightPin()`, `clearPins()`, `saveCheck()`, `showToast()` — além da renderização inicial do checklist.

---

## Bateria de testes de regressão

Aplicável após **qualquer evolução**:

| # | Teste | Comportamento esperado |
|---|-------|------------------------|
| 1 | Abrir o app | Aplica aberto, sem erros no console, `0 / 49 checked` |
| 2 | Abrir/fechar categorias | Seções alternam entre expandida e recolhida; seta gira |
| 3 | Marcar/desmarcar itens | Classe `.checked` alterna; progresso atualiza |
| 4 | Zoom | 50%–200%; rótulo atualiza; barra de zoom suave |
| 5 | Arrastar item para a artwork | Pin criado na posição solta; toast exibido |
| 6 | Soltar o mesmo item novamente | Pin existente é reposicionado (não duplicado) |
| 7 | Clicar no pin | Rola até o item; seção recolhida expande; destaque azul temporário |
| 8 | Hover sobre item fixado | Pin pulsa; remover o mouse cessa a pulsação |
| 9 | Clear Pins | Todos os pins somem; toast exibido |
| 10 | Marcar vários itens | Texto `X / 49 checked` e barra % consistentes |
| 11 | Save Check | JSON baixado com product, checks, pins e timestamp |
| 12 | Editar dados do produto + save | Novos valores refletidos no JSON exportado |

---

*Documento de baseline gerado a partir da inspeção de `index.html`, `js/app.js` e `css/style.css`. Qualquer divergência entre código e este registro deve ser corrigida no código (P-002 — preservação) ou registrada como `OBSERVED ISSUE`.*