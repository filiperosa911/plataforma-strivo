# Agenda: compromissos avulsos, criação por duplo clique e semana de 5 dias

Data: 18/08/2026 · Status: aprovado para implementação

## Problema

A agenda só sabe representar tarefas de lead. Três lacunas:

1. Não há como marcar um compromisso pelo calendário — é preciso abrir o lead,
   achar a aba de tarefas e criar por lá.
2. Compromisso sem cliente (reunião de time, banco, viagem) não tem onde existir.
3. A grade do mês trata sábado e domingo com o mesmo peso de uma terça, e a
   agenda abre na visão Semana mesmo quem trabalha olhando o mês.

## Decisões

| Questão | Decisão |
|---|---|
| Compromisso precisa de lead? | Não. Lead é opcional. |
| Onde mora o compromisso sem lead? | Tabela nova `compromissos` no Postgres. |
| E com lead? | Vira task dentro do lead, como hoje. |
| Fim de semana no modo 5 dias | Duas colunas estreitas à direita, semana começando na segunda. |
| Escopo do toggle 5/7 | Só na visão Mês. |
| Visão padrão | Mês. |

## Modelo de dados

```sql
CREATE TABLE IF NOT EXISTS "compromissos" (
    "id" BIGINT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'reuniao',
    "priority" SMALLINT NOT NULL DEFAULT 3,
    "leadId" BIGINT REFERENCES "leads"("id") ON DELETE SET NULL,
    "agentId" BIGINT NOT NULL REFERENCES "users"("id"),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdDate" TEXT NOT NULL
);
ALTER TABLE "compromissos" ENABLE ROW LEVEL SECURITY;
```

`date` é texto `AAAA-MM-DD` e `time` é `HH:MM`, iguais a `tasks.dueDate` e
`tasks.dueTime` — a agenda compara datas por string em todo lugar, e um `DATE`
nativo obrigaria a converter em cada ponto de comparação.

`ON DELETE SET NULL` no `leadId`: lead apagado deixa o compromisso vivo como
interno, em vez de sumir com a reunião da agenda de quem ia participar dela.

RLS espelha a de `leads`, sem `leaderId`: enxerga e edita quem é o `agentId`,
mais `diretoria` e `admin`.

O `id` vem de `Date.now()`. Os demais cadastros usam `Math.max(ids)+1`, que
colide quando duas pessoas criam ao mesmo tempo — risco tolerável para produto
ou usuário, não para compromisso, que vários assessores criam no mesmo minuto.

## Arquitetura no front

### A costura: `_agendaTarefasVisiveis()`

Passa a devolver as duas fontes normalizadas no mesmo formato, cada item com
`origem: 'task' | 'compromisso'`:

- task de lead → `{ ...task, origem: 'task', leadId, leadName, agentId }`
- compromisso → `{ id, text: title, dueDate: date, dueTime: time, type,
  priority, completed, description, origem: 'compromisso', leadId, leadName,
  agentId }`

Calendário, faixa da semana, blocos de prazo e contadores continuam iguais: não
sabem que existe uma segunda fonte. Só as ações roteiam por `origem` —
`toggleAgendaItem`, `abrirItemAgenda` e a gravação.

Visibilidade dos compromissos usa o mesmo `getVisibleUserIds()` das tasks, e o
filtro por assessor do topo se aplica aos dois.

### O que continua contando só tasks

`temProximaAtividade()` e o bloco "Leads sem próximo passo". Compromisso interno
não é próximo passo comercial de ninguém; contá-lo apagaria o alerta que existe
justamente para lead esfriando.

### Criação

Duplo clique na área livre da célula do dia abre `openNovoCompromissoModal(data)`
com a data preenchida. Duplo clique sobre um evento não cria nada: o evento já
trata o clique e chama `event.stopPropagation()`.

Campos: título (obrigatório), tipo, data, hora, lead (opcional), responsável,
prioridade, descrição. O seletor de responsável só aparece para `diretoria` e
`admin`; os demais entram como eles mesmos e o campo nem é renderizado.

**Roteamento na gravação:**

- com lead escolhido → `lead.tasks.push(...)` + `salvar({ leads: [lead] })`
- sem lead → `db.compromissos.push(...)` + `salvar({ compromissos: [novo] })`

Um compromisso com lead é indistinguível de uma tarefa criada pelo modal do
lead. Isso é proposital: evita dois conceitos concorrentes para a mesma coisa e
mantém o card do funil e o alerta de lead parado funcionando.

### Edição e exclusão

O modal de detalhe (`task-detail-modal`) passa a aceitar as duas origens, com
`_tdmOrigem` ao lado de `_tdmLeadId`/`_tdmTaskId`. Para compromisso: subtarefas e
label ficam ocultos (a tabela não tem essas colunas), o nome do lead vira
"Compromisso interno", e excluir chama `remover('compromissos', 'id', id)`, que
já existe para deleção de verdade no servidor.

### Toggle 5/7 dias

Terceiro grupo de botões na mesma linha de Semana/Mês, `hidden` quando a visão
Semana está ativa.

- **7 dias**: layout atual, `grid-cols-7`, semana começando no domingo.
- **5 dias**: semana começa na segunda; grid vira
  `grid-template-columns: repeat(5, 1fr) 0.45fr 0.45fr`. Sábado e domingo
  continuam sendo células próprias — clicáveis, com duplo clique e com eventos —
  só que estreitas. O cálculo do primeiro dia usa `(getDay() + 6) % 7` para
  deslocar a origem da semana.

### Padrão e preferências

`_agendaViewMode` nasce `'month'`; no HTML, `agenda-month-calendar` perde o
`hidden` e `agenda-week-strip` ganha, para a página não piscar a visão errada
antes do primeiro render.

A visão **não** é persistida: toda carga abre no Mês, que foi o pedido. Só a
densidade 5/7 dias vai para o `localStorage` (`strivo_agenda_dias`), ao lado de
`strivo_theme` — ela é preferência de leitura, não estado de navegação.

## Fora de escopo

Hora de término, local/link da reunião, recorrência, convite por e-mail,
arrastar evento entre dias, notificação. Cada um puxa modelo novo e nada disso
foi pedido.

## Riscos

| Risco | Mitigação |
|---|---|
| Banco sem a tabela derruba o carregamento | `loadDataStoreFromCloud` trata `compromissos` como `pipelines`: erro ou ausência cai para `[]` e a agenda segue com as tasks. |
| DDL em produção | Só `CREATE TABLE`/`CREATE POLICY`, aditivo. Nenhuma tabela existente é alterada e nenhum dado é tocado. |
| Duplo clique disparando o clique simples | O clique simples só filtra o dia — efeito visível, sem gravação. Filtro fica aplicado ao dia que o pop-up já está criando. |
| Colisão de `id` entre navegadores | `Date.now()` no cliente; o PK do Postgres rejeitaria a duplicata e o erro apareceria no banner de falha de sincronia que já existe. |

## Como validar

1. Duplo clique num dia vazio → pop-up com a data certa; salvar sem lead cria na
   tabela nova e o evento aparece na célula e na lista de baixo.
2. Mesma coisa com lead escolhido → a tarefa aparece também no modal do lead e o
   alerta "sem próximo passo" some para aquele lead.
3. Alternar 5/7 dias → sábado e domingo estreitam e vão para o fim da linha, sem
   perder eventos; recarregar mantém a escolha de densidade.
4. Recarregar a página → abre sempre no Mês, mesmo tendo saído na Semana.
5. Assessor comum não vê compromisso de outro assessor; admin vê todos e o filtro
   por assessor recorta os dois tipos.
6. Simular banco sem a tabela → agenda carrega com as tasks e sem erro fatal.
