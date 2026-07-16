# Briefing Stitch: Esteira Transacional

## Objetivo

Criar uma linguagem visual única para a esteira de fechamento da Encontre Aqui Imóveis. O usuário deve entender, sem conhecer termos técnicos, o que está aguardando ação, o que já foi concluído e qual é o próximo passo.

Este escopo cobre somente cinco telas-chave. Não redesenhar onboarding, cadastro de usuário ou cadastro/edição de imóvel nesta rodada.

## Direção visual

- Estilo: minimalismo acolhedor, profissional e orientado a tarefas.
- Fundo: `#F7F9FB`.
- Superfícies: branco, bordas suaves e sombra ambiente discreta.
- Primária: amarelo `#FFCE44`, reservado para ação principal e estado ativo.
- Texto principal: slate escuro `#1E293B`.
- Texto auxiliar: `#64748B`.
- Sucesso: verde esmeralda.
- Atenção/pendência: âmbar.
- Erro/bloqueio: vermelho somente quando exigir ação ou explicar indisponibilidade.
- Tipografia: DM Sans para títulos e valores; Hanken Grotesk para corpo, labels e estados.
- Raio: 8px para controles, 16px para cards, 24px para superfícies de destaque.
- Grid: 4 colunas mobile, 8 tablet, 12 desktop; margem mobile 20px e gutter padrão 24px.

## Regras transversais

- Uma ação primária por tela ou card.
- Status sempre acompanhado de texto, nunca apenas por cor.
- Não exibir UUID, IDs internos ou detalhes jurídicos que não ajudem na próxima ação.
- Contratos `CANCELLED` não aparecem para clientes.
- Contratos `FINALIZED` aparecem apenas em `Histórico de Processos`, recolhido por padrão.
- Dados do vendedor e comprador ficam separados por lado.
- Documento aprovado exibe estado bloqueado/cadeado e não oferece edição comum.
- Rejeição de documento volta a apresentar o requisito como pendente para novo envio.
- Estados de carregamento, vazio, erro, bloqueio `403` e entidade indisponível `404` precisam de composição própria.
- O design não substitui autorização da API; botões ocultos são apenas melhoria de UX.

## Tela 1: Hub “Meus Processos”

### Objetivo

Ser a única porta de entrada da área autenticada do cliente.

### Conteúdo

- Título: `Meus Processos`.
- Subtítulo: `Acompanhe suas propostas e contratos.`
- Card `Propostas`: descrição curta, contador de processos ativos e seta de entrada.
- Card `Contratos`: descrição curta, contador de pendências do lado do usuário e seta de entrada.
- Se houver contratos finalizados, seção recolhível `Histórico de Processos` no rodapé.

### Estados

- Sem propostas e sem contratos.
- Com pendências.
- Tudo em dia.
- Histórico fechado e aberto.
- Falha de carregamento com ação `Tentar novamente`.

### Integração

- Web: `src/components/processes/MyProcessesHub.tsx` em `/meus-processos`.
- Flutter: `lib/screens/documents_hub_screen.dart`.
- Fonte: negociações do usuário e `GET /contracts/me` ou contadores equivalentes.

## Tela 2: Lista de Contratos

### Objetivo

Permitir escolher rapidamente um contrato sem transformar a lista em uma auditoria.

### Conteúdo

- Título simples: `Contratos`.
- Filtros visíveis: `Em andamento` e `Finalizadas`.
- Card com nome do imóvel, status completo, data abaixo do status e uma frase de ação.
- Link/ícone secundário para `Ver imóvel`.
- Não exibir UUID nem contadores bilaterais para o cliente.

### Estados

- Lista em andamento.
- Lista finalizada.
- Nenhum contrato no filtro selecionado.
- Contrato cancelado nunca renderizado para cliente.
- Erro, carregamento e atualização por retorno à tela.

### Integração

- Web: `src/components/contracts/ContractList.tsx` e `/meus-processos/contratos`.
- Flutter: `lib/screens/contracts_list_screen.dart`.

## Tela 3: Detalhes do Contrato

### Objetivo

Concentrar resumo, dados e documentos em uma única tela, reduzindo navegação empilhada.

### Estrutura

- Cabeçalho compacto com imóvel, status e próxima ação.
- Duas abas internas: `Dados` e `Documentos`.
- Resumo mínimo, sem stepper grande nem cards repetidos.
- Voltar na aba interna retorna ao resumo; voltar no resumo retorna à lista.

### Dados

- Mostrar somente o lado autorizado para comprador/vendedor.
- Responsável/admin pode visualizar ambos os lados.
- Campos herdados aparecem protegidos; campos incompletos aparecem editáveis apenas quando a API liberar.
- Contrato em modo somente leitura deve comunicar isso antes dos campos.

### Documentos

- Uma linha por requisito.
- Status textual: `Pendente`, `Em análise`, `Aprovado` ou `Rejeitado`.
- Upload somente quando permitido.
- Aprovado: cadeado e ação de abertura/download padrão.
- Pendente: ação de envio.
- Rejeitado: motivo curto e ação de reenviar.

### Integração

- Web: `src/components/contracts/ContractDetailClient.tsx`.
- Flutter: `lib/screens/contract_details_screen.dart` e `lib/features/contracts/presentation/contract_documents_section_widget.dart`.

## Tela 4: Matriz de Documentação

### Cliente

- Checklist único, separado por `Dados do comprador` ou `Dados do vendedor` conforme `viewerSide`.
- Próxima ação sempre clara: enviar, corrigir ou apenas acompanhar.
- Não expor dados privados do outro lado.

### Admin

- Matriz aberta por padrão e formulário das partes recolhido acima dela.
- Quatro blocos de atores: Proponente, Comprador, Anunciante e Vendedor.
- Ações granulares por documento: aprovar, rejeitar e baixar quando aprovado.
- Rejeitados/excluídos não poluem o histórico visual; o requisito retorna como pendente.
- Ações críticas ficam agrupadas no rodapé.

### Integração

- Painel: `D:/painelweb/src/lib/components/ContractsModule.svelte` e `ContractDocumentMatrix.svelte`.
- Backend: matriz de requisitos e status individual dos documentos.

## Tela 5: Detalhes do Imóvel com Ação de Proposta

### Objetivo

Explicar a oportunidade e apresentar uma única ação coerente com o estado da negociação.

### Conteúdo

- Galeria e dados essenciais do imóvel.
- CTA `Criar proposta` quando não houver proposta ativa.
- CTA `Ver propostas` quando houver uma ou mais propostas.
- Bottom sheet para listar múltiplas propostas, com ações autorizadas por capability.
- `Ver contrato` somente quando houver `contract.id` físico e `canOpenContract === true`.
- WhatsApp corporativo permanece disponível independentemente de propostas existentes.

### Estados

- Sem proposta.
- Uma proposta.
- Múltiplas propostas.
- Proposta em verificação.
- Contrato ainda inexistente.
- Imóvel indisponível ou negociação cancelada.

### Integração

- Web: `src/components/property/PropertyDetailClient.tsx` e `src/components/proposals/ProposalWizard.tsx`.
- Flutter: `lib/screens/property_detail_screen.dart` e `lib/features/negotiations/presentation/proposal_action_card.dart`.

## Entrega esperada no Stitch

Para cada tela, gerar:

1. Desktop web.
2. Mobile Flutter.
3. Estado carregando.
4. Estado vazio.
5. Estado com pendência.
6. Estado bloqueado/indisponível.

Entregar também os tokens usados, componentes reutilizáveis, regras de espaçamento e microcopy exata dos status. O resultado deve ser exportável como referência visual, não como fonte de regras de negócio.

## Fora do escopo desta rodada

- Onboarding e cadastro.
- Cadastro e edição de imóveis.
- Alteração de endpoints ou máquina de estados.
- Redesign completo do painel administrativo fora da análise documental.
- Assinatura digital; o fluxo permanece presencial.
