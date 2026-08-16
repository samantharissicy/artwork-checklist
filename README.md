# Artwork & Pack Copy Checklist

<p align="center">
  <img src="https://img.shields.io/badge/status-MVP%20baseline-yellow" alt="Status">
  <img src="https://img.shields.io/badge/checklist%20items-49-blue" alt="49 items">
  <img src="https://img.shields.io/badge/sections-6-blue" alt="6 sections">
  <img src="https://img.shields.io/badge/dependencies-none-green" alt="No dependencies">
  <img src="https://img.shields.io/badge/framework-none-green" alt="No framework">
</p>

Ferramenta web de apoio à **revisão de artworks e textos de embalagens de produtos alimentícios**, alinhada ao padrão **BRCGS Product Labelling 5.2.1 | Multi-Site Aligned**.

O projeto acompanha um workflow de revisão visual: cada item do checklist pode ser *fixado (pin)* diretamente sobre a arte da embalagem, criando a ponte entre o requisito regulatório e o local exato da artwork onde ele se aplica.

---

## Índice

1. [Para que serve](#para-que-serve)
2. [Funcionalidades atuais](#funcionalidades-atuais)
3. [As 6 seções do checklist](#as-6-seções-do-checklist)
4. [Os 49 itens de revisão](#os-49-itens-de-revisão)
5. [Como executar](#como-executar)
6. [Como usar — passo a passo](#como-usar--passo-a-passo)
7. [Estrutura do projeto](#estrutura-do-projeto)
8. [Como funciona por dentro](#como-funciona-por-dentro)
9. [Limitações conhecidas](#limitações-conhecidas)
10. [Roadmap](#roadmap)
11. [Workflow de desenvolvimento](#workflow-de-desenvolvimento)
12. [Como contribuir](#como-contribuir)

---

## Para que serve

Antes de uma embalagem ir para produção, alguém precisa conferir se cada texto impresso nela está correto:

- o nome legal do produto;
- a declaração de ingredientes em ordem decrescente de peso;
- a tabela nutricional;
- as alegações (glúten free, vegano, orgânico);
- o código de barras, o lote, o peso líquido…

Este aplicativo organiza essa conferência em um **checklist de 49 itens distribuídos em 6 seções** e permite marcar visualmente, sobre a artwork, exatamente onde cada ponto foi verificado.

> **Obs.:** a revisão atual é um *protótipo funcional* — sem backend, sem banco de dados e sem framework. Ele evolui incrementalmente seguindo os arquivos [`prompt-mestre.md`](prompt-mestre.md) (especificação de engenharia) e [`roadmap.md`](roadmap.md) (plano por camadas).

---

## Funcionalidades atuais

Tudo documentado abaixo corresponde ao **baseline funcional** — nada pode quebrar entre uma evolução e outra.

| Funcionalidade | Descrição | Como testar |
|---|---|---|
| ✅ Checklist interativo | 49 itens com notas explicativas | Marcar/desmarcar checkboxes |
| ✅ Seções recolhíveis | As 6 categorias abrem/fecham | Clicar no título da seção |
| ✅ Dados do produto | Brand, Product Name, Weight, SKU | Digitar nos campos amarelos |
| ✅ Barra de progresso | `X / 49 checked` + barra em % | Marcar/desmarcar itens |
| ✅ Artwork de demonstração | Embalagem Frente e Verso em HTML/CSS puro | Abrir o painel direito |
| ✅ Zoom | Escala de 50% a 200% | Botões `−` e `+` na toolbar |
| ✅ Drag-and-drop | Arrastar um item do checklist até a artwork | `dragstart` no item → `drop` na artwork |
| ✅ Criação de pins | Pin posicionado no local solto da artwork, com tooltip | Soltar item sobre a arte |
| ✅ Pin → item | Clicar no pin rola o checklist até o item (expandindo a seção) | Clicar em qualquer pin |
| ✅ Item → pin | Passar o mouse sobre um item "pulsa" o pin correspondente | Hover sobre item fixado |
| ✅ Clear Pins | Remove todos os pins | Botão `Clear Pins` na toolbar |
| ✅ Save Check | Exporta o estado completo em JSON (download) | Botão `Save Check` no header |
| ✅ Toast | Feedback visual de ações (pin, clear, save) | Realizar ações acima |

### O que **ainda não** existe neste baseline

- Upload de imagem real (a artwork atual é demo embutida no HTML);
- Persistência em `localStorage` (recarregar a página perde o estado);
- Importação de JSON (`Open Check`);
- Estados `approved` / `rejected` (hoje só checked/unchecked);
- Comentários, assinatura e relatório.

Isso é intencional: essas features são as próximas camadas do roadmap.

---

## As 6 seções do checklist

| # | Seção | Itens | Foco |
|---|---|:---:|---|
| 1 | **Legal Core (BRCGS 5.2.1)** | 10 | Identificação legal do produto |
| 2 | **Ingredients & Allergens** | 5 | Declaração de ingredientes e alergênicos |
| 3 | **Nutrition & Serving** | 10 | Tabela nutricional e porções |
| 4 | **Storage & Cooking** | 4 | Conservação e instruções de preparo |
| 5 | **Claims & Certifications** | 12 | Alegações e certificações |
| 6 | **Packaging, Marks & Languages** | 8 | Marcas legais, idiomas e embalagem |

---

## Os 49 itens de revisão

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

## Como executar

O projeto **não precisa de instalação, npm, build ou servidor**.

```text
1. Baixe ou clone o repositório
2. Abra o arquivo index.html em qualquer navegador moderno
```

Ou pelo terminal:

```bash
git clone https://github.com/toled/artwork-checklist.git
cd artwork-checklist
start index.html
```

> Requisito mínimo: navegador com suporte a drag-and-drop e SVG inline (Chrome, Edge, Firefox, Safari).

---

## Como usar — passo a passo

1. **Preencha os dados do produto** (painel esquerdo, campos amarelos):
   Brand, Product Name / Legal Name, Weight e SKU.

2. **Revise cada seção**:
   - Clique no título da seção para expandir/recolher;
   - Cada item mostra uma **nota** com o critério a verificar;
   - Marque o checkbox quando o requisito estiver conforme.

3. **Fixe itens na artwork**:
   - Arraste um item do checklist e solte sobre a embalagem (frente ou verso);
   - Um **pin** com a referência do item (ex.: `3A`) aparece no local exato.

4. **Navegue entre pin ↔ item**:
   - **Pin → item:** clique no pin e o checklist rola até o item (seções recolhidas abrem sozinhas);
   - **Item → pin:** passe o mouse sobre um item para fazer seu pin "pulsar".

5. **Ajuste o zoom** (botões `−` / `+` na toolbar do viewer) para inspecionar detalhes.

6. **Limpe os pins** quando quiser recomeçar (`Clear Pins`).

7. **Exporte o resultado** (`Save Check`): um arquivo `.json` com dados do produto, checagens e pins é baixado automaticamente.

---

## Estrutura do projeto

```text
artwork-checklist/
├── index.html          # Interface completa (HTML + referência à CSS/JS)
├── css/
│   └── style.css       # Estilos visuais (299 linhas)
├── js/
│   └── app.js          # Toda a lógica em JavaScript puro (279 linhas)
├── prompt-mestre.md    # Especificação de engenharia / regras de evolução
├── roadmap.md          # Plano de desenvolvimento por camadas (A0 → N)
└── README.md           # Este documento
```

O estado atual ainda é a arquitetura "arquivo único": `index.html` + `app.js` + `style.css`, sem separação em módulos. A divisão progressiva em arquivos (state, storage, checklist, artwork, pins, products…) está prevista nas camadas finais do roadmap.

---

## Como funciona por dentro

Entender o protótipo ajuda a acompanhar as próximas evoluções.

### Fonte dos dados

As **6 seções e 49 itens** vivem em um único array `sections` (`js/app.js`), com `id`, `title` e `note`. O checklist é **renderizado por JavaScript** — o HTML só contém o container vazio `#checklist`.

### Estado atual: o DOM é a fonte da verdade

No baseline, o estado lógico fica espalhado no próprio DOM:

| Estado | Onde vive | Exemplo |
|---|---|---|
| Item marcado | `input[type=checkbox].checked` | checkbox |
| Aparência de concluído | classe CSS `.checked` | fundo do item |
| Dados do produto | inputs `#inp-brand`, `#inp-name`… | valores dos campos |
| Posição dos pins | objeto `pins[id] = {x, y}` | `{x: 723, y: 281}` |
| Títulos dos itens | duplicados no array `sections` | `itemTitles` |

Isso funciona no protótipo, mas **não é o modelo alvo**. A primeira grande evolução (Camada B do roadmap) é criar um estado central único:

```js
const appState = {
  schemaVersion: 1,
  activeProductId: null,
  products: {}
};
```

E cada item convergir para:

```js
{
  id: "1a",
  sectionId: "legal-core",
  originalTitle: "Product Name / Legal Name",
  currentTitle: "Product Name / Legal Name",
  note: "...",
  status: "pending",        // pending | approved | rejected
  comment: "",
  pin: null                 // futuro: { xRatio: 0.42, yRatio: 0.18 }
}
```

### Como os pins funcionam hoje

- O drop converte o ponto do mouse em **pixels relativos à artwork** (`wrapper.getBoundingClientRect()`), compensando o zoom atual;
- Cada pin é um `<div>` com `data-pid` = id do item, tooltip e marcador;
- `pins[id]` guarda `{x, y}` em pixels — limitação conhecida: posições fixas não acompanham outras dimensões de visualização (a normalização para **proporções** ± `xRatio/yRatio` é a Camada E).

### Funcionalidades-chave no código

| Função | Responsabilidade |
|---|---|
| `toggleCheck(cb)` | Alterna `.checked` e recalcula o progresso |
| `updateProgress()` | Conta checkboxes marcados → texto + largura da barra |
| `zoom(delta)` | Escala 0.5–2.0 no wrapper e atualiza o rótulo |
| `addPin(id, x, y)` | Cria o pin e registra em `pins` |
| `scrollToItem(id)` | Expande a seção recolhida e rola até o item |
| `clearPins()` | Esvazia a camada de pins e o objeto `pins` |
| `saveCheck()` | Será **exportação JSON** (product + checks + pins + timestamp) |
| `showToast(msg)` | Feedback visual temporário |

---

## Limitações conhecidas

Documentadas para não causar surpresa durante o uso e o desenvolvimento:

1. **Sem persistência** — recarregar a página perde checks, pins e dados do produto;
2. **Sem upload real** — a artwork exibida é um mock em HTML/CSS (frente e verso);
3. **Pins em pixels** — posições não se adaptam a redimensionamentos/zoom futuro;
4. **Estado no DOM** — o DOM é a fonte da verdade, dificultando validações e restauração;
5. **Sem importação** — o JSON exportado não pode ser reaberto no app;
6. **Checagem binária** — sem distinção entre aprovado e rejeitado, sem comentários;
7. **Essencialmente desktop** — sem otimização para touch/tablet.

Cada limitação tem uma camada correspondente no roadmap — eliminá-las todas de uma vez violaria o princípio de evolução incremental do projeto.

---

## Roadmap

Planos completos:

| Fase | Camada | Entrega |
|:---:|---|---|
| ✅ | **A0** | Baseline preservado + documentação (este README) |
| 📋 | **B1** | Estado central `appState` (single source of truth) |
| 📋 | **C1–C3** | Status tri-state, comentários, correções de copy |
| 📋 | **D1–D4** | Persistência local, import/export versionado |
| 📋 | **E1–E2** | Pins proporcionais, identidade da artwork |
| 📋 | **F1** | Métricas de revisão (aprovados / rejeitados / pendentes) |
| 📋 | **G1–G2** | Múltiplos produtos com abas |
| 📋 | **H1–H2** | Revisor + assinatura |
| 📋 | **I1–I2** | Alta resolução + responsividade |
| 📋 | **J1–J3** | Relatório imprimível e PDF |
| 📋 | **K1–K4** | UX, acessibilidade, touch, regressões |
| 📋 | **L1** | Separação estrutural em módulos |
| ⏳ | **M1–M4** | Backend, login, revisões, audit trail (só se houver uso real) |

**Regra de ouro:** implementar uma camada por vez, testar, revisar, commitar e só então avançar.

---

## Workflow de desenvolvimento

O projeto usa **desenvolvimento orientado por especificação**:

```text
AUDIT → SPEC → PLAN → TASKS → IMPLEMENT → VERIFY → REPORT
```

Para cada nova feature, o ciclo é:

1. **Current State** — como funciona hoje, funções/HTML envolvidos, riscos;
2. **Requirements** — requisitos testáveis (`REQ-XXX-001…`);
3. **Business Rules** — regras explícitas `IF … THEN …`;
4. **Data Model** — dados necessários antes de codificar;
5. **Design Decisions** — decisões com alternativas consideradas;
6. **Impact Analysis** — o que será afetado;
7. **Task Breakdown** — pequenas tasks verificáveis;
8. **Implementation** — alterações cirúrgicas, nunca reescrita total;
9. **Manual Tests** — casos `Precondition / Action / Expected`;
10. **Regression Tests** — baseline deve permanecer 100% funcional;
11. **Completion Report** — o que foi/não foi feito, limitações, próximo passo.

Princípios inegociáveis: **incrementalidade** (uma feature por vez), **preservação** (nada pode quebrar), **simplicidade** (código legível e comentado), **compatibilidade** (sem framework, npm, build ou backend enquanto MVP) e **não misturar fases** (cada camada é um commit dedicado).

---

## Como contribuir

1. Trabalhe **uma camada por vez**, seguindo o workflow acima;
2. Rode, teste, revise, verifique os critérios de aceite, corrija e commite (checkpoint com mensagem descritiva);
3. Ao final de cada milestone: aplicação abre, console limpo, funcionalidades anteriores operacionais, testes manuais aprovados.

**Critério global de aceite** (todo milestone):

1. O projeto abre normalmente;
2. Nenhum erro no console;
3. Funcionalidades anteriores continuam operacionais;
4. Requisitos da feature atendidos;
5. Testes manuais passam;
6. Nenhuma feature de fase posterior foi implementada acidentalmente.

---

## Licença

Privado / uso interno. Este repositório é um protótipo educacional em evolução — consulte os responsáveis antes de distribuir.