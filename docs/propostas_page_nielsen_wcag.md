# Análise Heurística: Página "Minhas Propostas"

## Contexto
Página analisada: `/propostas`

Objetivo operacional:
- permitir que o usuário entenda em que etapa cada proposta está
- acessar rapidamente a próxima ação correta
- diferenciar propostas ativas, finalizadas e canceladas

## Heurísticas de Nielsen

1. **Visibilidade do estado do sistema**
- Melhorado: a página agora expõe um resumo do ciclo da proposta logo no topo.
- Gap residual: ainda depende de badge + texto curto para alguns estados complexos.

2. **Compatibilidade entre sistema e mundo real**
- Melhorado: os estados passaram a usar rótulos mais próximos do fluxo do app.
- Gap residual: ainda há estados técnicos que precisam convergir totalmente com as microcopies do app em ondas futuras.

3. **Controle e liberdade do usuário**
- Parcial: filtros permitem mudar o recorte da lista.
- Gap residual: falta ação explícita de retorno/retry contextual em cada estado, além do link geral.

4. **Consistência e padrões**
- Melhorado: CTA textual por card agora indica a próxima ação esperada.
- Gap residual: contratos/propostas ainda precisam convergir visualmente com outras superfícies autenticadas do site.

5. **Prevenção de erro**
- Melhorado: a navegação de cada item agora comunica melhor o destino provável.
- Gap residual: ainda vale reforçar estados bloqueados e instruções quando o usuário não pode agir.

6. **Reconhecimento em vez de memorização**
- Melhorado: a página não exige mais que o usuário deduza sozinho o que fazer em cada etapa.
- Gap residual: pode haver ganho futuro com timeline visual por etapa.

7. **Flexibilidade e eficiência de uso**
- Parcial: filtros são rápidos e simples.
- Gap residual: usuários com muitas propostas ainda poderiam se beneficiar de busca e ordenação.

8. **Estética e design minimalista**
- Parcial: a página é limpa e objetiva.
- Gap residual: ainda pode haver melhor separação visual entre metadados e CTA por card.

9. **Reconhecimento, diagnóstico e recuperação de erros**
- Melhorado: erros carregam mensagem explícita e retry.
- Gap residual: falta diferenciar melhor erro de sessão, ausência de dados e falha de backend.

10. **Ajuda e documentação**
- Melhorado: resumo do ciclo no topo reduz necessidade de ajuda externa.
- Gap residual: não há glossário rápido para alguns estados menos óbvios.

## WCAG 2.0

### 1.3.1 Info and Relationships
- Atendido parcialmente: headings, filtros e lista estão estruturados.
- Próximo passo: reforçar landmarks e relação entre lista, filtros e estado atual.

### 1.4.3 Contrast (Minimum)
- Sem problema evidente no tema atual.
- Manter contraste dos badges em todos os estados futuros.

### 2.1.1 Keyboard
- A página é navegável, mas deve continuar sendo validada à medida que surgirem mais ações por card.

### 2.4.4 Link Purpose
- Melhorado: cada card agora expõe a finalidade da navegação em texto de ação.

### 2.4.6 Headings and Labels
- Melhorado: a página deixa mais claro o que é a lista e o que se espera do usuário.

### 3.3.2 Labels or Instructions
- Melhorado: o bloco superior explica o ciclo da proposta e reduz ambiguidade.

## Recomendações seguintes
1. Adicionar busca/ordenação na lista de propostas.
2. Introduzir uma timeline/resumo de etapa por card ou no detalhe da proposta.
3. Unificar totalmente os nomes de status com os equivalentes do app.
4. Diferenciar mensagens de erro por tipo: sessão, backend, vazio, conectividade.
