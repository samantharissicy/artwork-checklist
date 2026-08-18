# Artwork & Pack Copy Checklist

<p align="center">
  <img src="https://img.shields.io/badge/status-MVP%20C3-success" alt="MVP C3">
  <img src="https://img.shields.io/badge/checklist%20items-49-blue" alt="49 itens">
  <img src="https://img.shields.io/badge/sections-6-blue" alt="6 seções">
  <img src="https://img.shields.io/badge/tests-60%2F60%20passing-success" alt="60/60 testes passando">
  <img src="https://img.shields.io/badge/dependencies-none-green" alt="Sem dependências">
  <img src="https://img.shields.io/badge/framework-none-green" alt="Sem framework">
</p>

Ferramenta web de apoio à **revisão de artworks e textos de embalagens de produtos alimentícios**, alinhada ao padrão **BRCGS Product Labelling 5.2.1 | Multi-Site Aligned**.

A aplicação combina um checklist regulatório estruturado com um workflow visual de revisão de artwork. Cada item pode ser classificado como **Pending**, **Approved** ou **Rejected**, receber comentários, registrar sugestões de correção de copy e ser fixado diretamente sobre a artwork.

> **Estágio atual:** MVP funcional evoluindo incrementalmente por meio de um roadmap orientado por especificação.  
> As camadas **A0**, **B1**, **C1**, **C2** e **C3** estão concluídas.  
> A **Camada C — Workflow de revisão** está completa.

---

## Índice

1. [Para que serve](#para-que-serve)
2. [Funcionalidades atuais](#funcionalidades-atuais)
3. [Workflow de revisão](#workflow-de-revisão)
4. [Comentários e validação de rejeição](#comentários-e-validação-de-rejeição)
5. [Correções inline de copy](#correções-inline-de-copy)
6. [As 6 seções do checklist](#as-6-seções-do-checklist)
7. [Como executar](#como-executar)
8. [Como usar](#como-usar)
9. [Estrutura do projeto](#estrutura-do-projeto)
10. [Arquitetura](#arquitetura)
11. [Testes automatizados](#testes-automatizados)
12. [Limitações conhecidas](#limitações-conhecidas)
13. [Roadmap](#roadmap)
14. [Workflow de desenvolvimento](#workflow-de-desenvolvimento)
15. [Como contribuir](#como-contribuir)

---

## Para que serve

Antes de uma embalagem de alimento ir para produção, diversos elementos precisam ser revisados, como:

- nome legal do produto;
- quantidade líquida;
- ingredientes;
- alergênicos;
- informações nutricionais;
- instruções de armazenamento;
- instruções de preparo;
- claims;
- certificações;
- código de barras;
- lote;
- dados do fabricante;
- reciclagem;
- textos multilíngues.

A aplicação organiza essa revisão em **49 itens distribuídos em 6 seções**.

Cada item possui um estado:

```text
Pending
Approved
Rejected
```

O revisor também pode:

```text
adicionar comentários
registrar correções de copy
restaurar o texto original
associar itens à artwork através de pins
navegar entre checklist e artwork
```

O projeto continua propositalmente simples durante o MVP, sem framework, backend ou banco de dados enquanto essas tecnologias ainda não forem necessárias.

---

## Funcionalidades atuais

| Funcionalidade | Descrição |
|---|---|
| ✅ Checklist interativo | 49 itens regulatórios |
| ✅ Seções recolhíveis | 6 categorias |
| ✅ Dados do produto | Brand, Product Name, Weight e SKU |
| ✅ Estado centralizado | Dados de domínio armazenados em `appState` |
| ✅ Workflow tri-state | Pending / Approved / Rejected |
| ✅ Estado Approved | Visual verde |
| ✅ Estado Rejected | Visual vermelho |
| ✅ Estado Pending | Visual neutro |
| ✅ Troca de status | Approved ↔ Rejected |
| ✅ Reset para Pending | Clicar novamente no status ativo |
| ✅ Progresso | `X / 49 reviewed` |
| ✅ Comentários por item | Cada item possui seu comentário |
| ✅ Abrir/recolher comentários | Textarea recolhível |
| ✅ Validação de rejeição | Rejected exige comentário |
| ✅ Feedback de validação | Mensagem clara para rejeição inválida |
| ✅ Abertura automática | Reject abre o comentário |
| ✅ Edição inline de copy | Alteração direta do título |
| ✅ Enter confirma | Salva a correção |
| ✅ Escape cancela | Descarta edição não confirmada |
| ✅ Blur confirma | Clicar fora confirma edição válida |
| ✅ Proteção contra título vazio | Texto vazio não substitui o atual |
| ✅ Indicador Edited | Itens modificados são identificados |
| ✅ Exibição do original | Texto original permanece disponível |
| ✅ Restore original | Restaura `currentTitle` |
| ✅ Artwork demonstrativa | Mock Front & Back em HTML/CSS |
| ✅ Zoom | 50% a 200% |
| ✅ Drag-and-drop | Arrastar requisitos para a artwork |
| ✅ Pins | Pin criado no local do drop |
| ✅ Pin → item | Clique leva ao checklist |
| ✅ Item → pin | Hover destaca o pin |
| ✅ Sincronização de copy | Tooltip do pin usa `currentTitle` |
| ✅ Clear Pins | Remove pins do estado e UI |
| ✅ Save Check | Exporta JSON legado |
| ✅ Toast | Feedback visual |
| ✅ Testes automatizados | Suíte B + C1 + C2 + C3 |

---

## Workflow de revisão

Cada item possui exatamente um status:

```text
pending
approved
rejected
```

### Pending

Estado inicial.

Ainda não existe uma decisão de revisão.

### Approved

O requisito foi considerado em conformidade.

O item fica visualmente verde.

### Rejected

Foi identificado um problema.

O item fica visualmente vermelho.

### Transições

```text
Pending → Approved
Pending → Rejected

Approved → Rejected
Rejected → Approved

Approved → Pending
Rejected → Pending
```

Clicar novamente no status já ativo retorna para Pending.

O progresso considera revisados todos os itens cujo status não seja Pending:

```js
item.status !== REVIEW_STATUSES.PENDING
```

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

---

## Comentários e validação de rejeição

Cada item possui um botão de comentário.

Ao clicar nele, um textarea é aberto.

O conteúdo digitado é armazenado diretamente em:

```js
item.comment
```

Recolher o textarea não apaga o comentário.

Alterar status, título ou pin também não remove o comentário.

### Regra de negócio

```text
IF status = rejected
THEN comment.trim().length > 0
```

Portanto:

```text
Rejected sem comentário
=
inválido
```

e:

```text
Rejected com comentário
=
válido
```

Ao selecionar Reject:

1. o status passa para Rejected;
2. o textarea abre automaticamente;
3. o item é validado;
4. caso o comentário esteja vazio, uma mensagem clara é mostrada;
5. ao escrever uma justificativa válida, o erro desaparece.

Itens Approved e Pending não exigem comentário.

Exemplo:

```text
Status:
Rejected

Comentário:
"Declared net quantity does not match the approved specification."
```

---

## Correções inline de copy

A Camada C3 permite registrar o texto existente e uma sugestão de correção sem destruir o valor original.

Cada item possui:

```js
originalTitle
currentTitle
```

Exemplo:

```text
Original:
Product Name / Legal Name

Suggested:
Tikka Masala Spices
```

### `originalTitle`

Representa o texto original do checklist.

É imutável.

### `currentTitle`

Representa o texto atualmente sugerido.

Pode ser alterado.

### Fluxo de edição

Clique no lápis/Edit.

O título passa a ser um input.

Controles:

```text
Enter
→ confirma

Escape
→ cancela

Blur
→ confirma edição válida
```

Valores vazios ou compostos apenas por espaços não substituem o título atual.

### Indicador `Edited`

Quando:

```js
item.currentTitle !== item.originalTitle
```

o item é considerado editado.

A interface mostra:

```text
Edited
```

e também exibe o título original.

### Restore original

Itens modificados oferecem:

```text
Restore original
```

Ao clicar:

```js
currentTitle = originalTitle
```

O estado Edited desaparece.

### Integração com pins

Os tooltips dos pins utilizam:

```js
item.currentTitle
```

Portanto uma correção de copy em um item já fixado na artwork atualiza imediatamente o texto do pin.

Editar a copy não altera:

```text
status
comentário
coordenadas do pin
originalTitle
```

A dupla:

```text
originalTitle
currentTitle
```

fica preparada para o futuro relatório mostrar Original / Suggested.

---

## As 6 seções do checklist

| # | Seção | Itens | Foco |
|---|---|:---:|---|
| 1 | **Legal Core (BRCGS 5.2.1)** | 10 | Identificação legal |
| 2 | **Ingredients & Allergens** | 5 | Ingredientes e alergênicos |
| 3 | **Nutrition & Serving** | 10 | Nutrição e porções |
| 4 | **Storage & Cooking** | 4 | Conservação e preparo |
| 5 | **Claims & Certifications** | 12 | Claims e certificações |
| 6 | **Packaging, Marks & Languages** | 8 | Marcas, idiomas e embalagem |

Total:

```text
49 itens
```

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

Clone:

```bash
git clone https://github.com/samantharissicy/artwork-checklist.git
cd artwork-checklist
```

Durante o desenvolvimento:

```bash
python -m http.server 5500
```

ou:

```bash
py -m http.server 5500
```

Acesse:

```text
http://127.0.0.1:5500
```

---

## Como usar

### 1. Preencha os dados do produto

```text
Brand
Product Name / Legal Name
Weight
SKU / Code
```

Os valores atualizam o produto ativo no `appState`.

### 2. Revise um item

Todos começam como:

```text
Pending
```

Use:

```text
✓ Approve
× Reject
```

### 3. Adicione comentário

Clique no ícone de comentário.

O textarea abre.

O texto digitado é armazenado em:

```js
item.comment
```

Clique novamente para recolher sem perder o conteúdo.

### 4. Rejeite um item

Clique Reject.

A aplicação:

```text
define Rejected
abre comentário
valida a rejeição
mostra erro se comentário estiver vazio
```

Digite a justificativa para tornar o item válido.

### 5. Corrija o texto

Clique no lápis.

Digite a nova copy.

Use:

```text
Enter → salvar
Escape → cancelar
clicar fora → salvar valor válido
```

Depois da alteração:

```text
Edited
Original: ...
Restore original
```

são exibidos.

### 6. Fixe um item na artwork

Arraste o corpo do item para a artwork.

A posição é armazenada em:

```js
item.pin
```

### 7. Navegue

Clique em um pin para localizar o item.

Passe o mouse sobre um item fixado para destacar seu pin.

### 8. Zoom

```text
−
+
```

Faixa aproximada:

```text
50% → 200%
```

### 9. Clear Pins

Remove todos os pins.

### 10. Save Check

Baixa o JSON legado atual.

A serialização completa será implementada na Camada D.

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

Estrutura principal da aplicação e artwork demonstrativa.

### `css/style.css`

Contém:

- layout;
- checklist;
- Pending / Approved / Rejected;
- controles de revisão;
- comentários;
- validação;
- edição inline;
- estado Edited;
- artwork;
- pins;
- progresso;
- toolbar.

### `js/app.js`

Contém:

- definições estáticas;
- domínio;
- `appState`;
- criação de produtos;
- workflow de status;
- comentários;
- validação;
- edição inline;
- restauração da copy;
- renderização;
- progresso;
- inputs;
- zoom;
- drag-and-drop;
- pins;
- navegação;
- exportação;
- toast.

### `js/tests.js`

Suíte automatizada executada no próprio navegador.

Sem Jest, Vitest ou outras dependências.

### `baseline.*.md`

Registro histórico do comportamento original do protótipo.

Não deve ser atualizado a cada evolução do sistema.

### `roadmap.md`

Plano incremental de evolução.

---

## Arquitetura

### Single Source of Truth

O domínio vive em:

```js
const appState = {
  schemaVersion: 1,
  activeProductId: "product-1",
  products: {}
};
```

O fluxo é:

```text
ação do usuário
      ↓
alteração de domínio
      ↓
appState
      ↓
renderização
      ↓
DOM
```

O DOM não é fonte oficial de estado.

---

### Modelo de produto

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

### Modelo do item

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

---

### Domínio vs estado de interface

Dados persistíveis da revisão:

```text
status
comment
currentTitle
pin
dados do produto
```

ficam em `appState`.

Estados temporários da interface:

```text
currentZoom
openCommentItemIds
editingTitleItemId
```

ficam fora do domínio.

---

### Status

```js
const REVIEW_STATUSES = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});
```

Existe apenas um status por item.

---

### Validação

```text
Rejected + comentário vazio = inválido
```

Essa regra pertence ao domínio e não ao DOM.

---

### Correção de copy

O texto original nunca é substituído.

```text
originalTitle
→ valor original

currentTitle
→ valor atual/sugerido
```

Isso possibilita comparação futura no relatório.

---

### Pins

Cada pin pertence ao item:

```js
item.pin = {
  x,
  y
};
```

O tooltip utiliza:

```js
item.currentTitle
```

As posições ainda são armazenadas em pixels.

Coordenadas proporcionais serão implementadas na Camada E.

---

## Testes automatizados

Arquivo:

```text
js/tests.js
```

Execute no Console:

```js
runArtworkTests()
```

Checkpoint atual:

```text
60 / 60 testes passando
```

A suíte cobre **B + C1 + C2 + C3**.

Entre os comportamentos testados:

```text
estrutura do appState
produto ativo
49 itens
6 seções

status válidos
Pending inicial
Approved / Rejected exclusivos
proteção contra status inválido

Pending → Approved
Approved → Rejected
Rejected → Approved
Approved → Pending
Rejected → Pending

progresso

comentários
abrir / recolher comentário
sincronização textarea → appState
Reject abre comentário
Rejected sem comentário inválido
Rejected com comentário válido
Approved sem comentário válido

originalTitle imutável
currentTitle editável

Edit
input inline
Enter confirma
Escape cancela
Blur confirma
proteção contra título vazio
indicador Edited
exibição do original
Restore original

edição preserva:
status
comentário
pin

pins
renderização dos pins
tooltip atualizado após correção
Clear Pins
drag/drop

campos do produto
exportação JSON legada
regressão do zoom
```

A suíte cria um snapshot antes da execução e restaura o estado depois.

Os testes automatizados complementam testes manuais de comportamento visual e drag-and-drop real.

---

## Limitações conhecidas

### 1. Sem persistência

Recarregar a página perde a revisão.

A Camada D adicionará serialização e persistência local.

### 2. JSON ainda é legado

O formato atual ainda não representa corretamente todo o domínio.

Ele não preserva completamente:

```text
Pending vs Rejected
comentários
correções de copy
estado completo do produto
```

A serialização versionada pertence à Camada D.

### 3. Sem importação

Ainda não é possível abrir novamente uma revisão exportada.

### 4. Sem upload real da artwork

A interface usa atualmente um mock Front & Back feito em HTML/CSS.

### 5. Pins em pixels

Formato atual:

```js
{
  x,
  y
}
```

A Camada E implementará coordenadas proporcionais.

### 6. Sem relatório

O domínio já preserva:

```text
originalTitle
currentTitle
comment
status
pin
```

mas a interface de relatório ainda não existe.

A futura Camada J usará os dados para mostrar Original / Suggested e decisões da revisão.

### 7. Foco em desktop

A interface ainda é orientada principalmente a desktop.

Melhorias touch/tablet serão feitas posteriormente.

---

## Roadmap

| Status | Camada | Entrega |
|:---:|---|---|
| ✅ | **A0** | Baseline congelado + documentação |
| ✅ | **B1** | `appState` central |
| ✅ | **C1** | Pending / Approved / Rejected |
| ✅ | **C2** | Comentários + validação de rejeição |
| ✅ | **C3** | Correções inline de copy |
| 📋 | **D1** | Serialização canônica |
| 📋 | **D2** | Persistência em `localStorage` |
| 📋 | **D3** | Export JSON versionado |
| 📋 | **D4** | Import JSON / Open Check |
| 📋 | **E1** | Pins proporcionais |
| 📋 | **E2** | Identidade da artwork |
| 📋 | **F1** | Métricas |
| 📋 | **G1–G2** | Múltiplos produtos |
| 📋 | **H1–H2** | Revisor + assinatura |
| 📋 | **I1–I2** | Alta resolução + responsividade |
| 📋 | **J1–J3** | Relatório + PDF |
| 📋 | **K1–K4** | UX, acessibilidade e touch |
| 📋 | **L1** | Separação em módulos |
| ⏳ | **M1–M4** | Backend, autenticação, revisões e auditoria |

Próxima implementação:

```text
D1 — Serialização canônica
```

---

## Workflow de desenvolvimento

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

1. analisar estado atual;
2. definir requisitos;
3. registrar regras de negócio;
4. confirmar modelo de dados;
5. documentar decisões;
6. analisar impactos;
7. decompor tarefas;
8. implementar somente o escopo;
9. testar manualmente;
10. executar regressões;
11. registrar conclusão.

Princípios:

```text
Incrementalidade
Preservação
Simplicidade
Single Source of Truth
Data-first
Compatibilidade com MVP
Não misturar fases
```

---

## Como contribuir

1. Trabalhe em uma feature por vez;
2. crie uma branch específica;
3. não antecipe outras camadas;
4. mantenha domínio em `appState`;
5. mantenha DOM como representação do estado;
6. preserve funcionalidades anteriores;
7. atualize testes;
8. execute regressão manual;
9. revise `git diff`;
10. faça commit descritivo;
11. abra Pull Request.

Branches de exemplo:

```text
feat/domain-model
feat/review-status
feat/review-comments
feat/copy-corrections
feat/state-serialization
feat/local-storage
```

Checkpoints concluídos da Camada C:

```text
feat: add tri-state artwork review workflow
feat: add per-item review comments
feat: support inline copy corrections
```

### Critérios globais

Todo milestone deve garantir:

1. aplicação abre normalmente;
2. nenhum erro funcional no console;
3. recursos anteriores continuam funcionando;
4. requisitos são atendidos;
5. testes automatizados passam;
6. testes manuais passam;
7. nenhuma feature futura foi implementada acidentalmente.

---

## Licença

Privado / uso interno.

Este repositório é um protótipo educacional em desenvolvimento ativo. Consulte os responsáveis antes de distribuição externa.