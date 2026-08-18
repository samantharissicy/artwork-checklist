# Artwork & Pack Copy Checklist

<p align="center">
  <img src="https://img.shields.io/badge/status-MVP%20E2-success" alt="MVP E2">
  <img src="https://img.shields.io/badge/checklist%20items-49-blue" alt="49 itens">
  <img src="https://img.shields.io/badge/sections-6-blue" alt="6 seções">
  <img src="https://img.shields.io/badge/tests-156%2F156%20passing-success" alt="156/156 testes passando">
  <img src="https://img.shields.io/badge/schema-v2-blue" alt="Schema v2">
  <img src="https://img.shields.io/badge/dependencies-none-green" alt="Sem dependências">
  <img src="https://img.shields.io/badge/framework-none-green" alt="Sem framework">
</p>

Ferramenta web de apoio à **revisão de artworks e textos de embalagens de produtos alimentícios**, alinhada ao padrão **BRCGS Product Labelling 5.2.1 | Multi-Site Aligned**.

A aplicação combina um checklist regulatório estruturado com um fluxo visual de revisão. É possível classificar requisitos, adicionar comentários, sugerir correções de copy, associar itens a posições exatas da artwork, salvar a revisão localmente, exportar e reabrir arquivos de revisão e trabalhar com imagens reais de artwork.

> **Estágio atual:** MVP funcional desenvolvido incrementalmente por meio de um roadmap orientado por especificação.  
> As camadas **A0, B1, C1, C2, C3, D1, D2, D3, D4, E1 e E2** estão concluídas.  
> A **Camada E — Geometria e identidade da artwork está completa.**

---

## Índice

1. [Para que serve](#para-que-serve)
2. [Funcionalidades atuais](#funcionalidades-atuais)
3. [Workflow de revisão](#workflow-de-revisão)
4. [Comentários e validação de rejeição](#comentários-e-validação-de-rejeição)
5. [Correções inline de copy](#correções-inline-de-copy)
6. [Workflow da artwork](#workflow-da-artwork)
7. [Pins e coordenadas proporcionais](#pins-e-coordenadas-proporcionais)
8. [Persistência e arquivos JSON](#persistência-e-arquivos-json)
9. [As 6 seções do checklist](#as-6-seções-do-checklist)
10. [Como executar](#como-executar)
11. [Como usar](#como-usar)
12. [Estrutura do projeto](#estrutura-do-projeto)
13. [Arquitetura](#arquitetura)
14. [Testes automatizados](#testes-automatizados)
15. [Limitações conhecidas](#limitações-conhecidas)
16. [Roadmap](#roadmap)
17. [Workflow de desenvolvimento](#workflow-de-desenvolvimento)
18. [Como contribuir](#como-contribuir)

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

Cada item possui exatamente um status:

```text
Pending
Approved
Rejected
```

O revisor também pode:

```text
adicionar comentários
registrar justificativas de rejeição
sugerir correções de copy
restaurar o texto original
associar requisitos à artwork através de pins
navegar entre checklist e artwork
salvar a revisão localmente
exportar a revisão completa em JSON
reabrir uma revisão exportada
carregar uma artwork real
```

O projeto continua propositalmente simples durante o MVP:

```text
HTML puro
CSS puro
JavaScript vanilla
sem framework
sem npm
sem build
sem backend
sem banco de dados
```

---

## Funcionalidades atuais

| Funcionalidade                       | Descrição                                      |
| ------------------------------------ | ---------------------------------------------- |
| ✅ Checklist interativo              | 49 itens regulatórios                          |
| ✅ Seções recolhíveis                | 6 categorias                                   |
| ✅ Dados do produto                  | Brand, Product Name, Weight e SKU              |
| ✅ Estado centralizado               | Dados de domínio em `appState`                 |
| ✅ Single Source of Truth            | O DOM representa o estado, não o define        |
| ✅ Workflow tri-state                | Pending / Approved / Rejected                  |
| ✅ Troca de status                   | Approved ↔ Rejected ↔ Pending                  |
| ✅ Progresso da revisão              | Approved + Rejected contam como revisados      |
| ✅ Comentários por item              | Cada item possui seu próprio comentário        |
| ✅ Validação de rejeição             | Rejected exige comentário                      |
| ✅ Abertura automática               | Reject abre o editor de comentário             |
| ✅ Edição inline de copy             | Texto atual pode ser alterado diretamente      |
| ✅ Original preservado               | `originalTitle` permanece imutável             |
| ✅ Indicador Edited                  | Itens alterados são identificados              |
| ✅ Restore original                  | Restaura a copy original                       |
| ✅ Autosave                          | Estado salvo automaticamente no `localStorage` |
| ✅ Restauração após reload           | Estado salvo é restaurado ao abrir a página    |
| ✅ Proteção contra estado corrompido | Storage inválido não derruba a aplicação       |
| ✅ Serialização versionada           | Estado canônico usa schema versão 3            |
| ✅ Migração de estado                | Dados legados de schema v1/v2 migram para v3   |
| ✅ Domínio multi-layer               | Layers, active layer e pins por layer (schema v3) |
| ✅ Export JSON versionado            | Save Check exporta o estado completo           |
| ✅ Import JSON                       | Open Check restaura revisões compatíveis       |
| ✅ Artwork demonstrativa             | Mock Front & Back em HTML/CSS                  |
| ✅ Artwork real                      | Imagens locais podem ser carregadas no viewer  |
| ✅ Metadata da artwork               | Nome, tipo, tamanho, largura e altura          |
| ✅ Proteção na troca da artwork      | Troca com pins exige confirmação               |
| ✅ Arquivo somente em sessão         | A imagem binária não é persistida              |
| ✅ Pins normalizados                 | Posições armazenadas proporcionalmente         |
| ✅ Pins resistentes ao zoom          | Geometria permanece coerente                   |
| ✅ Drag-and-drop                     | Arrastar requisitos para a artwork             |
| ✅ Pin → item                        | Clique no pin localiza o item                  |
| ✅ Item → pin                        | Hover no item destaca o pin                    |
| ✅ Sincronização da copy             | Tooltip utiliza `currentTitle`                 |
| ✅ Clear Pins                        | Remove pins do estado e interface              |
| ✅ Toasts                            | Feedback visual de ações                       |
| ✅ Testes automatizados              | 156 testes de regressão no navegador           |

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

O requisito ainda não recebeu uma decisão.

### Approved

O requisito foi considerado em conformidade.

O item fica visualmente verde.

### Rejected

Foi identificado algum problema.

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

Clicar novamente no status já ativo retorna o item para Pending.

O progresso atual considera:

```js
reviewed = status !== REVIEW_STATUSES.PENDING;
```

Logo, tanto Approved quanto Rejected contam como revisados.

Exemplo:

```text
10 Approved
5 Rejected
34 Pending

= 15 / 49 reviewed
```

Métricas mais detalhadas pertencem à Camada F.

---

## Comentários e validação de rejeição

Cada item possui um controle de comentário.

O valor faz parte do domínio:

```js
item.comment;
```

Recolher o textarea não apaga seu conteúdo.

Alterar status, copy ou pin também não remove o comentário.

### Regra de rejeição

```text
IF status = rejected
THEN comment.trim().length > 0
```

Portanto:

```text
Rejected + comentário vazio
= inválido
```

e:

```text
Rejected + comentário válido
= válido
```

Ao selecionar Reject:

1. o status passa para Rejected;
2. o editor de comentário abre;
3. a rejeição é validada;
4. um comentário vazio gera feedback visual;
5. uma justificativa válida remove o estado inválido.

Itens Approved e Pending não exigem comentário.

---

## Correções inline de copy

A aplicação preserva o requisito original e permite registrar uma sugestão de correção.

Cada item possui:

```js
originalTitle;
currentTitle;
```

Exemplo:

```text
Original:
Product Name / Legal Name

Suggested:
Tikka Masala Spices
```

### `originalTitle`

Representa a copy original.

É imutável.

### `currentTitle`

Representa a copy atual ou sugerida.

Pode ser alterada.

### Controles da edição

```text
Enter
→ confirma

Escape
→ cancela

Blur
→ confirma uma edição válida
```

Valores vazios ou compostos apenas por espaços não substituem o título atual.

### Estado Edited

Um item é considerado editado quando:

```js
item.currentTitle !== item.originalTitle;
```

A interface mostra:

```text
Edited
Original: ...
Restore original
```

Restore original executa:

```js
currentTitle = originalTitle;
```

A correção da copy não altera:

```text
status
comentário
coordenadas do pin
originalTitle
```

Os tooltips dos pins sempre utilizam:

```js
item.currentTitle;
```

Portanto, editar um item já fixado atualiza imediatamente o texto do pin.

---

## Workflow da artwork

O viewer aceita tanto a artwork demonstrativa quanto imagens reais.

### Modo demo

Caso o produto ativo não possua metadata de artwork:

```js
product.artwork === null;
```

a aplicação mostra a artwork demonstrativa Front & Back.

### Selecionar artwork

Clique:

```text
Set Artwork
```

e escolha uma imagem.

A aplicação lê a imagem e armazena apenas seus metadados:

```js
{
  (name, type, size, width, height);
}
```

Exemplo:

```js
{
  name: "product-label.png",
  type: "image/png",
  size: 2481934,
  width: 1600,
  height: 2400
}
```

O arquivo binário não é salvo em `appState`, JSON ou `localStorage`.

### Imagem somente durante a sessão

A imagem real é exibida utilizando um Object URL durante a sessão atual do navegador.

Isso evita armazenar arquivos grandes no estado textual do MVP.

### Reload ou importação

Depois de recarregar a página ou importar um JSON:

```text
metadata → preservada
pins → preservados
arquivo da imagem → indisponível
```

A interface mostra:

```text
Artwork file not loaded
```

e solicita que o usuário selecione novamente a mesma imagem.

### Selecionar novamente a mesma artwork

A identidade considera:

```text
name
type
size
width
height
```

Selecionar exatamente a mesma artwork:

```text
não invalida pins
não exige confirmação
restaura a imagem durante a sessão
```

### Substituir artwork

Quando existe uma artwork diferente e já existem pins:

```text
Replacing this artwork will invalidate existing pins.
Continue?
```

Se o usuário cancelar:

```text
artwork atual permanece
pins permanecem
```

Se confirmar:

```text
nova artwork torna-se ativa
pins anteriores são removidos
```

---

## Pins e coordenadas proporcionais

Cada item pode possuir:

```js
item.pin = {
  xRatio,
  yRatio,
};
```

Exemplo:

```js
{
  xRatio: 0.438,
  yRatio: 0.286
}
```

Os valores devem permanecer entre:

```text
0 e 1
```

A renderização utiliza porcentagem:

```text
left = xRatio × 100%
top  = yRatio × 100%
```

Assim, o pin continua apontando para a mesma posição relativa quando o tamanho visual da artwork muda.

A geometria normalizada permanece coerente em:

```text
zoom 50%
zoom 100%
zoom 200%
imagens de diferentes dimensões
redimensionamento da janela
serialização
localStorage
export/import JSON
```

Pins legados em pixels do schema v1 podem ser convertidos para o formato proporcional do schema v2.

---

## Persistência e arquivos JSON

A Camada D criou persistência independente do DOM.

### Autosave local

Alterações relevantes da revisão são persistidas em `localStorage`.

Entre elas:

```text
dados do produto
status dos itens
comentários
correções de copy
pins
metadata da artwork
produto ativo
timestamps
```

Uma gravação bem-sucedida pode mostrar:

```text
Saved locally
```

O sistema também trata storage corrompido.

Um JSON inválido no navegador nunca deve impedir a aplicação de abrir.

### Schema atual

```js
const CURRENT_SCHEMA_VERSION = 2;
```

Existe suporte à migração compatível do schema v1, no qual pins ainda podiam utilizar coordenadas em pixels.

### Save Check

Clique:

```text
Save Check
```

para baixar a revisão atual em JSON versionado.

O arquivo inclui:

```text
schemaVersion
exportedAt
product
items
artwork
reviewer
```

e preserva:

```text
Pending / Approved / Rejected
comentários
currentTitle
originalTitle
pins normalizados
dados do produto
metadata da artwork
timestamps
```

### Open Check

Clique:

```text
Open Check
```

para selecionar um JSON anteriormente exportado.

A aplicação:

```text
lê o arquivo
faz parse do JSON
migra versões compatíveis
valida a estrutura
rehidrata o modelo de domínio
restaura a revisão
renderiza checklist
restaura pins
restaura dados do produto
restaura metadata da artwork
```

Arquivos incompatíveis ou malformados são rejeitados sem derrubar a aplicação.

---

## As 6 seções do checklist

| #   | Seção                            | Itens | Foco                        |
| --- | -------------------------------- | :---: | --------------------------- |
| 1   | **Legal Core (BRCGS 5.2.1)**     |  10   | Identificação legal         |
| 2   | **Ingredients & Allergens**      |   5   | Ingredientes e alergênicos  |
| 3   | **Nutrition & Serving**          |  10   | Nutrição e porções          |
| 4   | **Storage & Cooking**            |   4   | Conservação e preparo       |
| 5   | **Claims & Certifications**      |  12   | Claims e certificações      |
| 6   | **Packaging, Marks & Languages** |   8   | Marcas, idiomas e embalagem |

Total:

```text
49 itens de revisão
```

---

## Como executar

O MVP atualmente não exige:

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

Durante o desenvolvimento, utilize um servidor HTTP local simples.

Python:

```bash
python -m http.server 5500
```

Windows:

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

Os valores atualizam o produto ativo em `appState` e são persistidos automaticamente.

### 2. Selecione uma artwork

Clique:

```text
Set Artwork
```

e escolha uma imagem.

Ela será exibida durante a sessão atual e sua metadata ficará associada à revisão.

### 3. Revise os itens

Utilize:

```text
✓ Approve
× Reject
```

Clicar novamente no status ativo retorna o item para Pending.

### 4. Adicione comentários

Clique no ícone de comentário.

Reject abre automaticamente o editor de comentário.

### 5. Corrija a copy

Clique no lápis/Edit.

Utilize:

```text
Enter → salvar
Escape → cancelar
clicar fora → salvar valor válido
```

Após uma alteração aparecem:

```text
Edited
Original: ...
Restore original
```

### 6. Crie pins

Arraste um item do checklist para a artwork.

A posição proporcional fica em:

```js
item.pin;
```

### 7. Navegue

Clique em um pin para localizar o item correspondente.

Passe o mouse sobre um item fixado para destacar seu pin.

### 8. Zoom

Use:

```text
−
+
```

Faixa:

```text
50% → 200%
```

Os pins permanecem proporcionalmente posicionados.

### 9. Clear Pins

Clique:

```text
Clear Pins
```

Todos os pins passam para:

```js
null;
```

### 10. Salve a revisão

Clique:

```text
Save Check
```

Um JSON versionado contendo a revisão completa será baixado.

### 11. Reabra uma revisão

Clique:

```text
Open Check
```

e selecione um JSON compatível.

O domínio da revisão é restaurado.

Caso exista metadata de artwork, selecione novamente a mesma imagem para restaurar a visualização do arquivo.

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
│
├── baseline.en.md
├── baseline.pt-BR.md
│
├── README.md
└── README.pt-BR.md
```

### `index.html`

Estrutura da aplicação, toolbar, inputs de arquivo e viewer da artwork.

O checklist é gerado pelo JavaScript.

### `css/style.css`

Contém estilos para:

```text
layout
checklist
estados de revisão
comentários
validação
edição inline
indicador Edited
artwork demonstrativa
artwork real
estado de arquivo ausente
pins
progresso
toolbar
```

### `js/app.js`

Contém:

```text
definições do checklist
modelo de domínio
appState centralizado
factory de produtos
workflow de status
comentários
validação
edição inline
Restore original
renderização
sincronização dos inputs
autosave
serialização
migração de schema
export/import JSON
metadata da artwork
estado de sessão da artwork
pins normalizados
zoom
drag-and-drop
navegação dos pins
toasts
```

### `js/tests.js`

Suíte automatizada executada diretamente no navegador.

Não utiliza Jest, Vitest ou outras dependências externas.

### `baseline.*.md`

Documentação histórica do protótipo original.

Esses arquivos permanecem intencionalmente congelados.

---

## Arquitetura

### Single Source of Truth

O domínio vive em:

```js
const appState = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  activeProductId: "product-1",
  products: {},
};
```

Schema atual:

```js
const CURRENT_SCHEMA_VERSION = 2;
```

O fluxo principal é:

```text
ação do usuário
      ↓
alteração de domínio
      ↓
appState
      ↓
persistência quando necessária
      ↓
renderização
      ↓
DOM
```

O DOM não é a fonte oficial de estado.

---

### Modelo de produto

```js
{
  (id,
    brand,
    productName,
    weight,
    sku,
    artwork,
    items,
    reviewer,
    signature,
    createdAt,
    updatedAt);
}
```

A arquitetura já armazena produtos dentro de uma coleção, embora a interface atual ainda exponha um fluxo de produto único.

Operações de múltiplos produtos pertencem à Camada G.

---

### Metadata da artwork

```js
artwork: {
  (name, type, size, width, height);
}
```

ou:

```js
artwork: null;
```

O arquivo binário da imagem não pertence ao estado persistido.

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

Quando existe um pin:

```js
pin: {
  (xRatio, yRatio);
}
```

---

### Domínio vs estado temporário

Dados persistíveis pertencem ao `appState`.

Exemplos:

```text
dados do produto
status
comentários
currentTitle
pins
metadata da artwork
reviewer
timestamps
```

Estados temporários da interface permanecem fora do domínio.

Exemplos:

```text
currentZoom
openCommentItemIds
editingTitleItemId
```

A disponibilidade do arquivo binário da artwork também é temporária.

Seu Object URL permanece fora do `appState`.

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

Regra principal de rejeição:

```text
Rejected + comentário vazio = inválido
```

A validação pertence ao domínio e não é inferida pelo DOM ou pelo CSS.

---

### Serialização

O estado canônico é serializado independentemente da interface renderizada.

Isso permite preservar a revisão através de:

```text
reload
export JSON
import JSON
migração de schema
futuras mudanças de interface
```

---

## Testes automatizados

Arquivo:

```text
js/tests.js
```

Abra a aplicação e execute no Console do navegador:

```js
runArtworkTests();
```

Checkpoint atual:

```text
156 / 156 testes passando
```

A suíte cobre:

```text
Camada B
Camada C1
Camada C2
Camada C3
Camada D1
Camada D2
Camada D3
Camada D4
Camada E1
Camada E2
Camada G4A
```

Entre os comportamentos testados:

```text
estrutura do appState
produto ativo
49 itens
6 seções

status válidos
Pending inicial
exclusividade Approved / Rejected
proteção contra status inválido

transições de status
progresso

comentários
persistência de comentários
validação de rejeição

originalTitle imutável
currentTitle editável
edição inline
Enter / Escape / Blur
indicador Edited
Restore original

sincronização dos dados do produto

serialização
desserialização
validação do estado
rehydration
migração de schema

persistência local
tratamento de localStorage corrompido

export JSON versionado
import JSON
roundtrip export/import

validação de pins normalizados
conversão tela → ratios
renderização percentual
preservação durante zoom
migração de pins em pixels
migração schema v1 → v2

validação da metadata da artwork
comparação de identidade
detecção de pins existentes
cancelamento de substituição
substituição confirmada
seleção da mesma artwork
serialização da artwork
export/import da artwork
estado visual de arquivo ausente

artwork multi-layer
factories e getters de layers
pins por layer (item.pins[])
sessions por layer
identidade da artwork por layer
migração schema v2 → v3
cadeia schema v1 → v2 → v3
migração da chave legada de storage
renderização por active layer

regressão do DOM
regressão do zoom
```

A suíte cria um snapshot antes da execução e restaura o estado original posteriormente.

Os testes automatizados complementam testes manuais, especialmente para seleção real de arquivos, drag-and-drop e comportamento visual.

---

## Limitações conhecidas

### 1. Interface de produto único

O domínio já possui:

```js
products;
activeProductId;
```

mas a interface ainda trabalha com uma revisão de produto por vez.

Criação, alternância, duplicação, exclusão e tabs de produtos pertencem à Camada G.

### 2. Métricas ainda básicas

A interface atual exibe principalmente:

```text
X / 49 reviewed
```

Contadores detalhados de Approved, Rejected e Pending e os percentuais separados de revisão e aprovação pertencem à Camada F.

### 3. Arquivo da artwork somente em sessão

A metadata da artwork é persistida, mas o arquivo local da imagem não.

Depois de:

```text
recarregar a página
reiniciar o navegador
importar uma revisão
```

é necessário selecionar novamente o mesmo arquivo.

Metadata e posições dos pins permanecem preservadas.

### 4. Sem reviewer e assinatura final

Identificação do revisor e assinatura pertencem à Camada H.

### 5. Sem relatório e PDF

O domínio já preserva:

```text
originalTitle
currentTitle
status
comentário
pins
dados do produto
metadata da artwork
```

mas relatório imprimível e PDF pertencem à Camada J.

### 6. Interface orientada a desktop

A interface ainda é desenvolvida principalmente para desktop.

Responsividade e hardening para touchscreen pertencem às próximas fases do roadmap.

### 7. Sem backend compartilhado

O MVP é local ao navegador.

Ainda não existem:

```text
autenticação
banco compartilhado
sincronização multiusuário
auditoria no servidor
histórico de revisões
```

Essas funcionalidades pertencem à Camada M caso o uso real justifique a introdução de backend.

---

## Roadmap

O desenvolvimento é guiado por um roadmap separado, mantido fora deste repositório.

| Status | Camada    | Entrega                                          |
| :----: | --------- | ------------------------------------------------ |
|   ✅   | **A0**    | Baseline congelado + documentação                |
|   ✅   | **B1**    | `appState` central / Single Source of Truth      |
|   ✅   | **C1**    | Pending / Approved / Rejected                    |
|   ✅   | **C2**    | Comentários + validação de rejeição              |
|   ✅   | **C3**    | Correções inline de copy                         |
|   ✅   | **D1**    | Serialização canônica                            |
|   ✅   | **D2**    | Persistência em `localStorage`                   |
|   ✅   | **D3**    | Export JSON versionado                           |
|   ✅   | **D4**    | Import JSON / Open Check                         |
|   ✅   | **E1**    | Pins proporcionais normalizados                  |
|   ✅   | **E2**    | Identidade da artwork e proteção na substituição |
|   📋   | **F1**    | Métricas da revisão                              |
|   📋   | **G1**    | Modelo de múltiplos produtos                     |
|   📋   | **G2**    | Interface de tabs                                |
|   📋   | **H1–H2** | Reviewer + assinatura                            |
|   📋   | **I1–I2** | Alta resolução + responsividade                  |
|   📋   | **J1–J3** | Relatório imprimível + PDF                       |
|   📋   | **K1–K4** | UX, acessibilidade, touch e regressão            |
|   📋   | **L1**    | Separação em módulos                             |
|   ⏳   | **M1–M4** | Backend, autenticação, revisões e auditoria      |

O fluxo de produto único está considerado estável até a Camada E.

Caso F e G sejam desenvolvidas em paralelo, cada uma deve permanecer isolada em sua própria branch.

---

## Workflow de desenvolvimento

O projeto segue:

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

1. analisar o estado atual;
2. definir requisitos testáveis;
3. registrar regras de negócio;
4. confirmar o modelo de dados;
5. documentar decisões;
6. analisar impactos;
7. dividir a implementação em pequenas tasks;
8. implementar somente o escopo solicitado;
9. executar testes manuais;
10. executar a suíte de regressão;
11. registrar a conclusão;
12. criar commit de checkpoint e Pull Request.

Princípios:

```text
Incrementalidade
Preservação
Simplicidade
Single Source of Truth
Data-first
Compatibilidade com o MVP
Não misturar fases
```

---

## Como contribuir

Ao trabalhar no projeto:

1. atualize sua `main`;
2. crie uma branch específica;
3. trabalhe em um problema do roadmap por vez;
4. mantenha dados persistíveis em `appState`;
5. mantenha o DOM como representação do estado;
6. mantenha dados de sessão fora do domínio;
7. preserve funcionalidades anteriores;
8. adicione ou atualize testes;
9. execute regressão manual;
10. revise `git diff`;
11. faça commit descritivo;
12. abra um Pull Request;
13. revise antes de fazer merge na `main`.

Exemplos de branches:

```text
feat/review-status
feat/review-comments
feat/copy-corrections
feat/state-serialization
feat/local-storage
feat/normalized-pins
feat/artwork-identity
feat/review-metrics
feat/multiple-products
```

### Critérios globais de aceite

Todo milestone deve garantir:

```text
aplicação abre normalmente
nenhum erro funcional no console
recursos anteriores continuam funcionando
requisitos foram atendidos
testes automatizados passam
testes manuais passam
nenhuma feature futura foi introduzida acidentalmente
```

---

## Licença

Privado / uso interno.

Este repositório é um protótipo educacional em desenvolvimento ativo. Consulte os responsáveis antes de distribuição externa.
