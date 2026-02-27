# Matriz de Paridade Mobile -> Web (Site Imobiliário)

> Objetivo: transformar o `site-imobiliario` em réplica funcional do app mobile, preservando regras de negócio, segurança e contratos.

## Legenda de prioridade
- `P0`: bloqueia produção/compliance (segurança, estado, financeiro, LGPD)
- `P1`: fluxo core de negócio
- `P2`: melhoria/otimização

## Business Flows + Segurança + Requisitos

| ID | Feature | Endpoint(s) Backend | Regra de Negócio / Segurança | Status Mobile | Status Web Atual | Gap | Prioridade |
|---|---|---|---|---|---|---|---|
| BF-001 | Login/Cadastro com sessão válida | `POST /auth/login`, `POST /auth/register`, `POST /auth/google` | Sessão autenticada + tratamento de perfil incompleto | Implementado e testado | Parcial (páginas existem, sem paridade contratual validada) | Implementar fluxo web completo com guards e estados de onboarding | P0 |
| BF-002 | Guardas por papel (admin/broker/client) | Middlewares `auth`, `isAdmin`, `isBroker`, `isClient` | Acesso por função sem BFLA | Implementado e testado | Não validado no site | Replicar guardas no front web + rotas privadas | P0 |
| BF-003 | Revogação de sessão admin (`token_version`) | `POST /admin/logout` + validação middleware | Token roubado deve ser invalidável antes do TTL | Implementado e testado | Não aplicado no cliente web admin | Consumir logout + limpar sessão + tratar 401 de token revogado | P0 |
| BF-004 | CSP estrita e headers de hardening | `helmet(contentSecurityPolicy)` | Mitigar XSS/injeções | Implementado no backend | Parcial (depende do host/reverse proxy) | Validar CSP efetiva para domínio do site em produção | P0 |
| BF-005 | Fluxo de gerar proposta | `POST /negotiations/proposal` | Cria negociação `PROPOSAL_SENT` e gera PDF | Implementado e testado | Não implementado no site | Portar wizard de proposta para web | P1 |
| BF-006 | Matemática do pagamento | `POST /negotiations/proposal` | Soma pagamento == valor do imóvel | Implementado e testado | Não implementado | Reutilizar validações do mobile no web | P0 |
| BF-007 | Antiadulteração do valor do imóvel | `POST /negotiations/proposal` | Ignorar `value/price` do payload; usar valor do imóvel no banco | Implementado e testado | Não implementado | Garantir UI somente leitura + validar erro backend | P0 |
| BF-008 | Validade da proposta (10 dias) | `POST /negotiations/proposal` | Persistir `proposal_validity_date = +10 dias` | Implementado e testado | Não implementado | Exibir validade e bloquear envios inconsistentes | P1 |
| BF-009 | Upload de proposta assinada | `POST /negotiations/:id/proposals/signed` | Move para análise/documentação e notifica admin | Implementado e testado | Não implementado | Tela web de upload e status de envio | P1 |
| BF-010 | Aprovação da proposta pelo admin | `PUT /admin/negotiations/:id/approve` | Muda negociação para `IN_NEGOTIATION`, imóvel para `negociacao`, cria contrato `AWAITING_DOCS` | Implementado e testado | Não implementado no site | Painel web admin com ação de aprovar + refresh de estado | P0 |
| BF-011 | Rejeição da proposta com motivo obrigatório | `PUT /admin/negotiations/:id/reject` | Sem motivo -> erro 400 | Implementado e testado | Não implementado | Formulário com validação obrigatória de observação | P0 |
| BF-012 | Idempotência na aprovação | `PUT /admin/negotiations/:id/approve` | Aprovar 2x não duplica contrato | Implementado e testado | Não implementado | UX resiliente (double-click) + feedback idempotente | P1 |
| BF-013 | Lista de contratos por usuário | `GET /contracts/me` | Broker visualiza somente contratos elegíveis | Implementado e testado | Não implementado | Criar módulo "Meus Contratos" no web | P1 |
| BF-014 | Detalhe de contrato | `GET /contracts/:id` | Exibir infos e docs filtrados | Implementado e testado | Não implementado | Tela web de detalhe com status e documentos | P1 |
| BF-015 | Aprovação granular seller/buyer | `PUT /admin/contracts/:id/evaluate-side` | Só vai para `IN_DRAFT` quando ambos aprovados | Implementado e testado | Não implementado | Subaba admin com decisões granulares e trilha | P0 |
| BF-016 | Upload de minuta | `POST /admin/contracts/:id/draft` | `IN_DRAFT` -> `AWAITING_SIGNATURES` apenas com minuta válida | Implementado e testado | Não implementado | Upload admin de minuta + confirmação de transição | P0 |
| BF-017 | Guarda de transição para assinaturas | `PUT /admin/contracts/:id/transition` | Bloquear avanço sem `contrato_minuta` | Implementado e testado | Não implementado | Botão avançar com validação prévia e mensagens de bloqueio | P0 |
| BF-018 | Bloqueio de rollback pós-finalização | `PUT /admin/contracts/:id/transition` | `FINALIZED` não retorna etapa | Implementado e testado | Não implementado | UI sem ação indevida + tratamento 400/403 | P0 |
| BF-019 | Upload docs assinados | `POST /admin/contracts/:id/signed-docs` | Persistir doc e indicar pronto para finalização | Implementado e testado | Não implementado | Subaba admin de assinaturas | P1 |
| BF-020 | Update dados seller/buyer com lock por aprovação | `PUT /contracts/:id/data` | Lado aprovado não pode mais editar | Implementado e testado | Não implementado | Bloqueio de formulário por lado no web | P0 |
| BF-021 | Remoção de documento com lock por aprovação | `DELETE /contracts/:id/documents/:documentId` | Lado aprovado não pode remover docs | Implementado e testado | Não implementado | Botão remover condicionado ao estado real | P0 |
| BF-022 | Side metadata de documento | `POST /contracts/:id/documents` | Persistir `side` e `originalFileName` | Implementado e testado | Não implementado | Upload web com side explícito | P1 |
| BF-023 | Download de documento com BOLA/IDOR | `GET /negotiations/:id/documents/:documentId/download` | Não-participante recebe `403` | Implementado e testado | Não implementado | Consumir endpoint com UX de 403 seguro | P0 |
| BF-024 | Regras documentais Venda x Aluguel | Regra de domínio (`requiredContractDocumentTypes`) | Aluguel exclui certidões e exige comprovante renda | Implementado e testado | Não implementado no site | Portar matriz documental para web | P1 |
| BF-025 | Regras distintas por lado (Captador x Vendedor) | `side=seller/buyer` + UI por seção | Checklist por lado com lock independente | Implementado e testado no mobile/backend | Parcial no site (sem módulo contratos) | Implementar seções e validações por lado | P1 |
| BF-026 | Finalização com evidências obrigatórias | `POST /admin/contracts/:id/finalize` | Exige contrato assinado + comprovante pagamento | Implementado e testado | Não implementado | Bloquear botão finalizar sem evidências | P0 |
| BF-027 | Integridade financeira das comissões | `POST /admin/contracts/:id/finalize` | splits >= 0 e soma <= valorVenda | Implementado e testado | Não implementado | Form web com validação matemática antes de submit | P0 |
| BF-028 | Efeito de finalização no imóvel/negociação | `POST /admin/contracts/:id/finalize` | Aluguel -> `RENTED`; venda -> `SOLD`; sai da vitrine | Implementado e testado | Não implementado no site de gestão | Atualizar estados e visibilidade em tela/admin | P0 |
| BF-029 | VGV mensal e totais de comissão | `GET /admin/commissions?month=&year=` | Resumo mensal consistente | Implementado e testado | Não implementado | Dashboard financeiro web | P1 |
| BF-030 | Home com dados reais | `GET /properties`, `GET /properties/featured` | Home usa dados reais da API | Implementado no site com testes | Implementado e testado no site | Sem gap funcional crítico | P2 |
| BF-031 | Lista de imóveis com filtros | `GET /properties` | Busca/filtragem por parâmetros | Implementado no site com testes | Implementado e testado no site | Refinar paridade visual/estado com mobile | P2 |
| BF-032 | Detalhe de imóvel + links para app stores | `GET /properties/:id` | Botões "Abrir no app", Android e iOS | Implementado no site com testes | Implementado e testado no site | Sem gap funcional crítico | P2 |
| BF-033 | Exposição pública somente do que é permitido | `GET /public/properties` etc | Imóvel vendido/alugado não deve aparecer | Implementado no backend | Parcial no site (depende da query usada e filtros) | Garantir fonte pública correta e filtros de status | P0 |
| BF-034 | Observabilidade de erros e falhas de fluxo | N/A | Erros críticos com rastreamento sem vazar PII | Parcial | Não validado | Sentry/telemetria + redaction | P1 |
| BF-035 | LGPD no front (mínima exposição de PII) | N/A | Mostrar apenas dados necessários; sem leaks em logs/browser | Parcial | Não validado | Revisar logs/client storage + mascaramento | P0 |

## Falhas de segurança a prevenir na réplica web (checklist de implementação)
- BFLA no front: esconder botão não é segurança; backend decide sempre.
- BOLA/IDOR: nunca montar URL de download sem checagem de ownership.
- XSS: CSP + escaping rigoroso em conteúdo dinâmico.
- Session fixation/token leak: política de armazenamento e rotação de sessão.
- Upload abuse: limitar tipo/tamanho e validar resposta de erro sem detalhes sensíveis.
- Exposição de segredo: sem chaves em client bundle/commits.

## Plano de execução recomendado (sequencial)
1. **P0 Segurança + Auth base** (`BF-001..004`, `BF-023`, `BF-033`, `BF-035`)
2. **P0 Proposta + Contrato core** (`BF-006..011`, `BF-015..021`, `BF-026..028`)
3. **P1 Expansão operacional** (`BF-005`, `BF-013..014`, `BF-022`, `BF-024..025`, `BF-029`, `BF-034`)
4. **P2 Refinos de experiência** (`BF-030..032`)

## Critério de pronto da réplica web
- Mesmo resultado de negócio do mobile para os mesmos cenários.
- Mesmos bloqueios de segurança e máquina de estados.
- Testes automatizados cobrindo os cenários P0 e P1 críticos.
- Zero regressão nos fluxos já aprovados contratualmente.
