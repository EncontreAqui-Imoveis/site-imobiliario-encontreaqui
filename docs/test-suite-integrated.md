# Suite Integrada - Plano 1 e 2

Este documento consolida os cenarios de negocio mais criticos envolvendo app, site, painel e backend apos as entregas dos Planos 1 e 2.

## Cenario 1 - Proposta assinada remove da vitrine

1. **Acao**: Cliente cria proposta no site/app, assinatura e concluida, e o backend atualiza para status bloqueante de vitrine.
2. **Resultado Esperado**: O imovel deixa de aparecer em listagens publicas e a contagem de `GET /properties/cities-with-count` e decrementada na cidade correspondente.
3. **Status**: Passou (teste de integracao backend)

## Cenario 2 - Proposta do app aparece para revisao no painel

1. **Acao**: Cliente envia proposta no app para imovel valido.
2. **Resultado Esperado**: A solicitacao aparece no Painelweb em "Solicitacoes de Propostas" com status de revisao, permitindo triagem pelo admin.
3. **Status**: Pendente (sem automacao neste pacote)

## Cenario 3 - Filtro por cidade/bairro com contagem real

1. **Acao**: Usuario abre listagem no site, seleciona cidade e depois bairro usando os seletores com contagem.
2. **Resultado Esperado**: Opcoes aparecem no formato `Cidade (N)` e `Bairro (N)` apenas com dados cadastrados/publicos; resultados sao filtrados conforme selecao.
3. **Status**: Passou (E2E site)

## Cenario 4 - Lazy loading 10 em 10 na listagem publica

1. **Acao**: Usuario acessa `/imoveis`, visualiza os 10 primeiros resultados e rola ate o final para disparar o carregamento progressivo.
2. **Resultado Esperado**: A lista carrega mais 10 itens por pagina (ou restante final), sem duplicar cards e mantendo estado de loading consistente.
3. **Status**: Passou (E2E site)

## Cenario 5 - Navegacao painel para site publico de imovel

1. **Acao**: Admin abre um imovel via fluxo do painel para pagina publica no site.
2. **Resultado Esperado**: A navegacao abre a pagina publica sem 401 indevido; filtros e listagem publica continuam funcionais no contexto aberto.
3. **Status**: Bloqueado por ambiente (spec criado no painel, requer `SITE_E2E_BASE_URL` apontando para instância do site em execucao)

## Evidencias de execucao

- Backend (Vitest): `tests/routes/properties.cities-with-count.signed-proposal.spec.ts` -> passou.
- Site (Playwright): `e2e/city-filter-lazy-loading.spec.ts` -> passou.
- Painel (Playwright): `e2e/site-filter-lazy-from-panel.spec.ts` -> executado e pulado sem `SITE_E2E_BASE_URL`.

## Analise QA - concorrencia no handleSearch e lazy loading

### Pergunta
O que acontece se o usuario trocar o filtro de cidade enquanto o lazy loading ainda esta carregando a pagina anterior?

### Achado
Ha mitigacao parcial importante no `InfinitePropertyResults`:

- `requestVersionRef` invalida respostas antigas quando a query muda.
- `isLoadingRef` evita concorrencia de chamadas simultaneas.
- `dedupeProperties` reduz risco de duplicidade visual.

Com isso, o risco de estado corrompido e **baixo**, mas nao zero em termos de UX/rede:

- a requisicao antiga continua trafegando (nao e abortada);
- pode haver gasto de rede desnecessario;
- em cenarios de alta latencia, o usuario pode perceber troca de loading entre filtros.

### Correcao sugerida (hardening)

Adicionar `AbortController` por ciclo de query:

1. Criar `abortRef` no `InfinitePropertyResults`.
2. Ao resetar por mudanca de `queryString`, abortar a requisicao em voo anterior.
3. Passar `signal` para `fetchPublicPropertiesPage`.
4. Ignorar `AbortError` sem log de erro.

Resultado esperado: cancelamento real de requests obsoletas, menor chance de flicker e estado mais previsivel ao trocar filtros durante scroll infinito.
