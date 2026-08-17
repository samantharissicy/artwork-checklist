# Artwork & Pack Copy Checklist

<p align="center">
  <img src="https://img.shields.io/badge/status-MVP%20C1-success" alt="MVP C1">
  <img src="https://img.shields.io/badge/checklist%20items-49-blue" alt="49 itens">
  <img src="https://img.shields.io/badge/sections-6-blue" alt="6 seções">
  <img src="https://img.shields.io/badge/tests-40%2F40%20passing-success" alt="40/40 testes passando">
  <img src="https://img.shields.io/badge/dependencies-none-green" alt="Sem dependências">
  <img src="https://img.shields.io/badge/framework-none-green" alt="Sem framework">
</p>

Ferramenta web de apoio à **revisão de artworks e textos de embalagens de produtos alimentícios**, alinhada ao padrão **BRCGS Product Labelling 5.2.1 | Multi-Site Aligned**.

A aplicação combina um checklist regulatório estruturado com um fluxo visual de revisão de artwork. Cada item pode ser classificado como **Pending**, **Approved** ou **Rejected**, além de poder ser fixado diretamente sobre a embalagem por meio de pins, relacionando o requisito ao ponto exato da artwork onde ele foi verificado.

> **Estágio atual:** MVP funcional evoluindo incrementalmente por meio de um roadmap orientado por especificação.  
> As camadas **A0**, **B1** e **C1** estão concluídas.

---

## Índice

1. [Para que serve](#para-que-serve)
2. [Funcionalidades atuais](#funcionalidades-atuais)
3. [Workflow de revisão](#workflow-de-revisão)
4. [As 6 seções do checklist](#as-6-seções-do-checklist)
5. [Os 49 itens de revisão](#os-49-itens-de-revisão)
6. [Como executar](#como-executar)
7. [Como usar — passo a passo](#como-usar--passo-a-passo)
8. [Estrutura do projeto](#estrutura-do-projeto)
9. [Como funciona por dentro](#como-funciona-por-dentro)
10. [Testes automatizados](#testes-automatizados)
11. [Limitações conhecidas](#limitações-conhecidas)
12. [Roadmap](#roadmap)
13. [Workflow de desenvolvimento](#workflow-de-desenvolvimento)
14. [Como contribuir](#como-contribuir)

---

## Para que serve

Antes de uma embalagem de alimento ir para produção, alguém precisa conferir diversos elementos impressos nela, como:

- nome legal do produto;
- quantidade líquida;
- declaração de ingredientes;
- alergênicos;
- informações nutricionais;
- instruções de armazenamento;
- instruções de preparo;
- alegações do produto;
- certificações;
- código de barras;
- lote;
- dados do fabricante;
- informações de reciclagem;
- textos em múltiplos idiomas.

Este aplicativo organiza essa conferência em um **checklist de 49 itens distribuídos em 6 seções**.

Cada item atualmente pode assumir um dos estados:

```text
Pending
Approved
Rejected
```

Os itens também podem ser arrastados para a artwork, criando pins visuais que identificam exatamente onde determinado requisito foi conferido.

O objetivo é transformar gradualmente o protótipo em um workflow estruturado de aprovação de artwork sem introduzir complexidade antes que ela seja realmente necessária.

---

## Funcionalidades atuais

Tudo abaixo faz parte da aplicação funcional atual e deve continuar operando durante as próximas evoluções.

| Funcionalidade | Descrição | Como testar |
|---|---|---|
| ✅ Checklist interativo | 49 itens com notas explicativas | Navegar pelo checklist |
| ✅ Seções recolhíveis | 6 categorias que abrem/recolhem | Clicar no título |
| ✅ Dados do produto | Brand, Product Name, Weight e SKU | Digitar nos campos amarelos |
| ✅ Workflow tri-state | Pending / Approved / Rejected | Usar os botões ✓ e × |
| ✅ Estado Approved | Itens aprovados ficam verdes | Clicar em Approve |
| ✅ Estado Rejected | Itens rejeitados ficam vermelhos | Clicar em Reject |
| ✅ Estado Pending | Itens pendentes permanecem neutros | Deixar/resetar item |
| ✅ Alternância de status | Approved ↔ Rejected | Alternar entre os botões |
| ✅ Reset para Pending | Clicar novamente no status ativo volta para Pending | Aprovar/rejeitar duas vezes |
| ✅ Progresso da revisão | `X / 49 reviewed` + barra percentual | Aprovar ou rejeitar itens |
| ✅ Estado centralizado | Dados de domínio vivem em `appState` | Inspecionar `appState` no DevTools |
| ✅ Artwork de demonstração | Frente e verso construídos em HTML/CSS | Abrir visualizador |
| ✅ Zoom | Escala entre 50% e 200% | Botões `−` e `+` |
| ✅ Drag-and-drop | Arrastar item para a artwork | Arrastar item |
| ✅ Criação de pins | Pin criado no local do drop | Soltar item sobre artwork |
| ✅ Pin → item | Clique no pin leva ao item | Clicar em um pin |
| ✅ Item → pin | Hover do item destaca seu pin | Passar o mouse |
| ✅ Clear Pins | Remove pins do estado e da interface | Clicar `Clear Pins` |
| ✅ Save Check | Baixa a representação JSON legada atual | Clicar `Save Check` |
| ✅ Toast | Feedback visual para determinadas ações | Fixar, limpar ou salvar |
| ✅ Testes automatizados | Suíte de regressão das camadas B + C1 | Executar `runArtworkTests()` |

---

## Workflow de revisão

O checklist não utiliza mais o modelo binário marcado/desmarcado.

Cada item possui exatamente um status:

```text
pending
approved
rejected
```

### Pending

Estado inicial.

Significa que ainda não existe uma decisão de revisão para aquele item.

Visual:

```text
neutro
```

### Approved

O revisor determinou que o requisito está em conformidade.

Visual:

```text
verde
```

### Rejected

O revisor identificou algum problema relacionado ao requisito.

Visual:

```text
vermelho
```

### Transições disponíveis

O workflow atual permite:

```text
Pending → Approved
Pending → Rejected

Approved → Rejected
Rejected → Approved

Approved → Pending
Rejected → Pending
```

Clicar novamente na ação que já está ativa retorna o item para `Pending`.

Exemplo:

```text
Pending
   ↓ Approve

Approved
   ↓ Approve novamente

Pending
```

A justificativa de rejeição e a interface de comentários pertencem à **Camada C2** e ainda não estão disponíveis visualmente.

---

## As 6 seções do checklist

| # | Seção | Itens | Foco |
|---|---|:---:|---|
| 1 | **Legal Core (BRCGS 5.2.1)** | 10 | Identificação legal do produto |
| 2 | **Ingredients & Allergens** | 5 | Ingredientes e alergênicos |
| 3 | **Nutrition & Serving** | 10 | Informações nutricionais e porções |
| 4 | **Storage & Cooking** | 4 | Conservação e preparo |
| 5 | **Claims & Certifications** | 12 | Alegações e certificações |
| 6 | **Packaging, Marks & Languages** | 8 | Marcas legais, idiomas e embalagem |

Total:

```text
49 itens de revisão
```

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

> Os nomes e notas permanecem em inglês de propósito, pois representam os critérios utilizados no processo de revisão alinhado ao BRCGS.

---

## Como executar

O projeto atualmente não exige:

```text
npm
framework
build
backend
banco de dados
```

Clone o repositório:

```bash
git clone https://github.com/samantharissicy/artwork-checklist.git
cd artwork-checklist
```

É possível abrir o projeto diretamente em um navegador moderno.

Durante o desenvolvimento, é recomendado usar um servidor HTTP local simples.

Com Python:

```bash
python -m http.server 5500
```

ou no Windows:

```bash
py -m http.server 5500
```

Depois acesse:

```text
http://127.0.0.1:5500
```

Requisito mínimo: navegador moderno com suporte a JavaScript, drag-and-drop e SVG inline.

---

## Como usar — passo a passo

### 1. Preencha os dados do produto

Utilize os campos amarelos:

```text
Brand
Product Name / Legal Name
Weight
SKU / Code
```

Esses valores ficam sincronizados com o produto ativo dentro do `appState`.

### 2. Revise os itens

Abra uma das seis seções.

Todo item começa como:

```text
Pending
```

Utilize:

```text
✓ Approve
× Reject
```

para registrar uma decisão.

Itens aprovados ficam verdes.

Itens rejeitados ficam vermelhos.

Clique novamente no status ativo para retornar o item para Pending.

### 3. Acompanhe o progresso

O rodapé mostra:

```text
X / 49 reviewed
```

Tanto itens Approved quanto Rejected contam como revisados.

Itens Pending não contam.

Exemplo:

```text
10 Approved
5 Rejected
34 Pending
```

resulta em:

```text
15 / 49 reviewed
```

### 4. Fixe um requisito na artwork

Arraste um item do checklist e solte sobre a artwork.

Um pin com a referência do item aparece no local do drop.

Exemplo:

```text
1A
3B
5G
```

### 5. Navegue entre checklist e artwork

**Pin → item**

Clique no pin para rolar o checklist até o item correspondente.

Caso a seção esteja recolhida, ela será aberta automaticamente.

**Item → pin**

Passe o mouse sobre um item com pin para destacar sua posição na artwork.

### 6. Use o zoom

Os botões:

```text
−
+
```

alteram a escala aproximadamente entre:

```text
50% → 200%
```

### 7. Limpe os pins

Clique em:

```text
Clear Pins
```

Todos os pins são removidos tanto da interface quanto do `appState`.

### 8. Exporte a revisão

Clique em:

```text
Save Check
```

A aplicação baixa um arquivo JSON contendo a representação legada atual da revisão.

> O formato de exportação ainda é mantido compatível com o MVP original. A serialização versionada correta será implementada na Camada D.

---

## Estrutura do projeto

```text
artwork-checklist/
├── index.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── app.js
│   └── tests.js
│
├── roadmap.md
├── prompt-mestre.md
│
├── baseline.en.md
├── baseline.pt-BR.md
│
├── README.md
└── README.pt-BR.md
```

### `index.html`

Contém o layout principal da aplicação e o mock da artwork.

O checklist é injetado dinamicamente pelo JavaScript.

### `css/style.css`

Contém:

- layout geral;
- estilos do checklist;
- estados visuais Pending / Approved / Rejected;
- controles de revisão;
- artwork viewer;
- pins;
- barra de progresso;
- toolbar;
- bases de responsividade.

### `js/app.js`

Contém a lógica da aplicação:

- definições estáticas do checklist;
- modelo de domínio;
- estado central;
- criação de produtos;
- gerenciamento de status;
- renderização;
- progresso;
- sincronização dos campos do produto;
- zoom;
- drag-and-drop;
- pins;
- navegação;
- exportação JSON;
- notificações.

### `js/tests.js`

Contém a suíte automatizada de testes executada diretamente no navegador.

Não utiliza framework externo.

### `baseline.*.md`

Documentação histórica do protótipo original.

Esses arquivos propositalmente descrevem o comportamento antigo e não devem ser reescritos continuamente conforme a aplicação evolui.

### `roadmap.md`

Plano de evolução por camadas orientado por especificação.

---

## Como funciona por dentro

### Definições estáticas

As seis seções do checklist são definidas em:

```js
sectionDefinitions
```

Essas definições representam o template original do checklist.

Elas não representam o estado atual de uma revisão.

---

### Estado central da aplicação

O estado lógico vive em:

```js
const appState = {
  schemaVersion: 1,
  activeProductId: "product-1",
  products: {}
};
```

O DOM não é mais considerado a fonte oficial dos dados de domínio.

Agora o fluxo é:

```text
Ação do usuário
      ↓
appState
      ↓
funções de renderização
      ↓
DOM
```

e não:

```text
DOM
 ↓
descobrir qual é o estado
```

---

### Modelo de produto

Cada produto possui aproximadamente:

```js
{
  id,
  brand,
  productName,
  weight,
  sku,
  artwork,
  items,
  reviewer,
  signature,
  createdAt,
  updatedAt
}
```

---

### Modelo de item

Cada item possui:

```js
{
  id: "1a",
  sectionId: "legal-core",

  originalTitle: "Product Name / Legal Name",
  currentTitle: "Product Name / Legal Name",

  note: "...",

  status: "pending",

  comment: "",

  pin: null
}
```

`originalTitle` é imutável.

`currentTitle` foi preparado para futuras correções de copy.

---

### Status da revisão

Os status permitidos são centralizados:

```js
const REVIEW_STATUSES = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});
```

Cada item possui somente um status por vez.

Portanto não existem combinações contraditórias como:

```js
approved: true,
rejected: true
```

---

### Ações de revisão

Os botões Approve e Reject utilizam um handler central.

Fluxo conceitual:

```text
clique Approve / Reject
        ↓
handleReviewAction()
        ↓
setItemStatus()
        ↓
appState
        ↓
renderItemState()
        ↓
interface
```

Clicar novamente no status já ativo retorna o item para:

```text
pending
```

---

### Progresso

O progresso é calculado a partir do `appState`.

Um item é considerado revisado quando:

```js
item.status !== REVIEW_STATUSES.PENDING
```

Portanto:

```text
Approved
Rejected
```

contam para o progresso.

A interface mostra:

```text
itens revisados / 49 reviewed
```

---

### Campos do produto

Os campos possuem sincronização nos dois sentidos.

```text
evento do input
      ↓
appState
```

e:

```text
appState
      ↓
renderProductInputs()
      ↓
interface
```

---

### Pins

O pin pertence ao próprio item:

```js
item.pin = {
  x,
  y
}
```

O antigo objeto de pins separado deixou de ser a fonte oficial do domínio.

Os pins são renderizados a partir do estado do item.

O tooltip utiliza:

```js
item.currentTitle
```

Portanto futuras correções de texto poderão ser refletidas automaticamente nos pins.

As coordenadas ainda são armazenadas em pixels.

A normalização proporcional está prevista para a Camada E.

---

### Validação de domínio

O domínio já reconhece a regra:

```text
IF status = rejected
THEN comment must not be empty
```

Assim, um item Rejected sem comentário é considerado inválido pela validação de domínio.

Entretanto, a interface de comentários e o enforcement visual dessa regra foram propositalmente adiados para a **Camada C2**.

---

### Funções principais

| Função | Responsabilidade |
|---|---|
| `createInitialItems()` | Cria o estado inicial dos itens |
| `createProduct()` | Cria um produto |
| `getActiveProduct()` | Retorna o produto ativo |
| `getItemById()` | Retorna um item |
| `setItemStatus()` | Altera o status com segurança |
| `setItemCurrentTitle()` | Altera o título editável |
| `setItemComment()` | Atualiza comentário |
| `setItemPin()` | Atualiza o pin |
| `validateItemState()` | Valida regras de domínio |
| `renderChecklist()` | Cria o checklist no DOM |
| `renderItemState()` | Atualiza um item a partir do estado |
| `handleReviewAction()` | Processa Approve / Reject |
| `updateProgress()` | Calcula itens revisados |
| `renderProductInputs()` | Reflete produto nos inputs |
| `zoom()` | Controla o zoom |
| `addPin()` | Adiciona ou move um pin |
| `renderPins()` | Renderiza pins a partir do estado |
| `scrollToItem()` | Navega do pin para o checklist |
| `clearPins()` | Limpa pins do estado e UI |
| `saveCheck()` | Baixa o JSON atual |
| `renderAppState()` | Sincroniza a interface com o estado |

---

## Testes automatizados

O projeto possui uma suíte leve de testes em:

```text
js/tests.js
```

Ela propositalmente não utiliza:

```text
Jest
Vitest
npm
dependências externas
```

A suíte atual cobre as **Camadas B + C1**.

Para executar, abra o console do navegador e rode:

```js
runArtworkTests()
```

Checkpoint atual:

```text
40 / 40 testes passando
```

Os testes verificam, entre outros pontos:

- estrutura do `appState`;
- produto ativo;
- 49 itens;
- 6 seções;
- estado inicial Pending;
- status válidos;
- exclusividade Approved / Rejected;
- rejeição de status inválido;
- validação de Rejected + comentário;
- imutabilidade de `originalTitle`;
- alteração de `currentTitle`;
- renderização estado → interface;
- sincronização dos campos do produto;
- Pending → Approved;
- Approved → Rejected;
- Rejected → Approved;
- Approved → Pending;
- Rejected → Pending;
- contadores;
- estado dos pins;
- renderização dos pins;
- tooltip dos pins;
- Clear Pins;
- caminho de drag/drop;
- exportação JSON legada;
- remoção do antigo `itemTitles`;
- regressão do zoom.

Antes de executar os testes, a suíte tira um snapshot do estado atual.

Ao finalizar, restaura o estado original para evitar deixar dados artificiais na aplicação.

Os testes automatizados não substituem totalmente os testes manuais de interação real com mouse e comportamento visual.

---

## Limitações conhecidas

As limitações abaixo são intencionais nesta fase do MVP.

### 1. Sem persistência

Recarregar a página perde a revisão atual.

Persistência com `localStorage` está prevista na Camada D.

### 2. Sem upload real de artwork

A artwork atual é uma demonstração Front & Back construída em HTML/CSS.

Upload real e identidade da artwork serão implementados posteriormente.

### 3. Pins ainda usam pixels

Atualmente:

```js
{
  x,
  y
}
```

é utilizado para armazenar a posição.

Coordenadas proporcionais serão implementadas na Camada E.

### 4. Exportação JSON legada não representa completamente o tri-state

A exportação atual ainda converte os checks para booleanos.

Portanto:

```text
approved → true
pending  → false
rejected → false
```

Isso significa que o JSON exportado ainda não consegue preservar a diferença entre Pending e Rejected.

A serialização versionada correta será implementada na Camada D.

### 5. Sem importação JSON

Uma revisão salva ainda não pode ser reaberta dentro da aplicação.

### 6. Interface de comentários ainda não existe

O domínio já reconhece que um item Rejected exige comentário.

Entretanto, textarea e interação de comentário ainda não existem na interface.

Essa funcionalidade corresponde à Camada C2.

### 7. Interface de correção de copy ainda não existe

`originalTitle` e `currentTitle` já existem no modelo de domínio, mas a edição visual ainda não foi implementada.

Essa funcionalidade pertence à Camada C3.

### 8. Interface orientada a desktop

A aplicação atual foi projetada principalmente para uso em desktop.

Otimizações para touch/tablet estão previstas para camadas posteriores.

---

## Roadmap

Os detalhes completos estão em [`roadmap.md`](roadmap.md).

| Status | Camada | Entrega |
|:---:|---|---|
| ✅ | **A0** | Baseline congelado + documentação |
| ✅ | **B1** | `appState` central / single source of truth |
| ✅ | **C1** | Workflow Pending / Approved / Rejected |
| 📋 | **C2** | Comentários por item + validação de rejeição |
| 📋 | **C3** | Correções inline de copy |
| 📋 | **D1–D4** | Serialização, persistência local e import/export |
| 📋 | **E1–E2** | Pins proporcionais + identidade da artwork |
| 📋 | **F1** | Métricas da revisão |
| 📋 | **G1–G2** | Múltiplos produtos e abas |
| 📋 | **H1–H2** | Revisor + assinatura |
| 📋 | **I1–I2** | Alta resolução + responsividade |
| 📋 | **J1–J3** | Relatório imprimível + PDF |
| 📋 | **K1–K4** | UX, acessibilidade, touch e regressões |
| 📋 | **L1** | Separação estrutural em módulos |
| ⏳ | **M1–M4** | Backend, autenticação, revisões e audit trail |

Próxima implementação:

```text
C2 — Comentários
```

---

## Workflow de desenvolvimento

O projeto segue desenvolvimento orientado por especificação:

```text
AUDIT
  ↓
SPEC
  ↓
PLAN
  ↓
TASKS
  ↓
IMPLEMENT
  ↓
VERIFY
  ↓
REPORT
```

Para cada feature:

1. **Current State** — entender o funcionamento atual;
2. **Requirements** — criar requisitos testáveis;
3. **Business Rules** — explicitar regras de negócio;
4. **Data Model** — definir primeiro os dados necessários;
5. **Design Decisions** — registrar decisões e alternativas;
6. **Impact Analysis** — identificar áreas afetadas;
7. **Task Breakdown** — dividir em alterações pequenas;
8. **Implementation** — modificar somente o necessário;
9. **Manual Tests** — validar comportamento esperado;
10. **Regression Tests** — garantir que nada existente quebrou;
11. **Completion Report** — registrar resultado e próximos passos.

Princípios principais:

```text
Incrementalidade
Preservação
Simplicidade
Single Source of Truth
Data-first
Compatibilidade com o MVP
Não misturar fases
```

O projeto permanece propositalmente sem framework durante esta fase do MVP.

---

## Como contribuir

Ao contribuir:

1. Trabalhe em **uma feature do roadmap por vez**;
2. Crie uma branch específica;
3. Não antecipe funcionalidades de outras camadas;
4. Mantenha o estado de domínio dentro do `appState`;
5. Utilize o DOM como representação do estado;
6. Preserve todas as funcionalidades existentes;
7. Execute a suíte automatizada;
8. Execute testes manuais de regressão;
9. Revise o `git diff`;
10. Faça um commit de checkpoint descritivo;
11. Abra um Pull Request para revisão.

Exemplos de branches:

```text
feat/domain-model
feat/review-status
feat/review-comments
feat/copy-corrections
feat/local-storage
```

Checkpoint concluído mais recente:

```text
feat: add tri-state artwork review workflow
```

### Critérios globais de aceite

Todo milestone deve atender:

1. Aplicação abre normalmente;
2. Nenhum erro funcional no console;
3. Funcionalidades anteriores continuam operacionais;
4. Requisitos da feature foram atendidos;
5. Testes automatizados passam;
6. Testes manuais passam;
7. Nenhuma funcionalidade de fase futura foi implementada acidentalmente.

---

## Licença

Privado / uso interno.

Este repositório é um protótipo educacional em desenvolvimento ativo. Consulte os responsáveis antes de distribuição externa.