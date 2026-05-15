# Vigia Site - paridade do fluxo Anuncie com mobile

## Causa raiz

- O fluxo de decisão inicial em `/anuncie` ainda misturava orientação genérica e ações não alinhadas ao mobile (especialmente no ramo "não sou proprietário").
- O formulário de quantidades usava seletor "modo" em vez de checkboxes "Sem ...", divergindo da experiência esperada.
- A navegação de imóveis sem `slug/public_code` caía em `/imoveis`, impedindo abertura direta de anúncios em análise pelo dono.
- O contrato de áreas já estava em `area_*_valor` + `area_*_unidade`, mas faltava cobertura explícita de teste garantindo ausência de `*_m2` no payload de criação.

## Arquivos alterados

- `src/app/anuncie/page.tsx`
- `src/lib/propertyLinks.ts`
- `src/__tests__/integration/AnuncieFlow.test.tsx`
- `src/__tests__/unit/propertyCreate.test.ts`
- `src/__tests__/unit/propertyLinks.test.ts`

## Fluxo final de `/anuncie`

1. Tela inicial pergunta: **"Como voce quer anunciar?"**
   - opção **"Anunciar você mesmo"**
   - opção **"Entrar em contato com a equipe"**
2. Se escolher **"Entrar em contato com a equipe"**:
   - abre confirmação para solicitar atendimento;
   - exibe telefone de suporte;
   - envia `requestSupportContact` quando confirmado;
   - mantém mensagens específicas de erro desse envio (incluindo 429 amigável).
3. Se escolher **"Anunciar você mesmo"**:
   - pergunta **"Você é proprietário do imóvel?"**
   - **"Sim, sou proprietário"** abre formulário de cadastro;
   - **"Não, quero anunciar de outra pessoa"** mostra aviso e só permite voltar para a pergunta anterior.
4. No formulário:
   - quantidades com checkboxes **Sem quartos / Sem banheiros / Sem vagas**;
   - sem seção separada de "outras comodidades" (somente `amenities[]` canônicas);
   - rascunho stale continua sendo limpo via fallback de `DRAFT_NOT_FOUND`/expiração.

## Como imóvel em análise do dono é aberto

- `buildPublicPropertyUrl` agora usa fallback para `/imoveis/{id}` quando não existe `slug/public_code`.
- Com isso, o dono consegue abrir o imóvel em análise a partir da área autenticada.
- O detalhe público continua dependendo do endpoint público; para casos não públicos, o cliente autenticado já tenta fallback privado (`fetchPropertyById` -> `fetchPrivatePropertyByIdentifier`) e mantém proteção por backend.

## Formato final de áreas/amenities no payload

- **Criação/Edição**:
  - envia `area_construida_valor`
  - envia `area_construida_unidade`
  - envia `area_terreno_valor`
  - envia `area_terreno_unidade`
  - **não envia** `area_construida_m2` nem `area_terreno_m2` no `FormData` de criação.
- **Comodidades**:
  - envia em `amenities[]` (múltiplos valores)
  - mantém normalização canônica (incluindo alias legado de câmera).

## Comandos rodados

1. `npm run build`
2. `npm test -- src/__tests__/unit/propertyCreate.test.ts src/__tests__/unit/propertiesApi.test.ts`
3. `npm test -- src/__tests__/integration/SignupFlow.test.tsx`
4. `npm test -- src/__tests__/integration/AnuncieFlow.test.tsx src/__tests__/unit/propertyLinks.test.ts` (validação adicional dos arquivos alterados)

## Resultado exato de cada comando

### 1) `npm run build`

- **Exit code:** `0`
- **Trecho principal:**
  - `Compiled successfully`
  - `Running TypeScript ...`
  - `Generating static pages ...`
  - rotas incluindo `/anuncie`, `/imoveis/[id]`, `/meus-imoveis`, `/meus-imoveis/[id]/editar`.

### 2) `npm test -- src/__tests__/unit/propertyCreate.test.ts src/__tests__/unit/propertiesApi.test.ts`

- **Exit code:** `0`
- **Resultado:** `Test Suites: 2 passed, 2 total` / `Tests: 18 passed, 18 total`

### 3) `npm test -- src/__tests__/integration/SignupFlow.test.tsx`

- **Exit code:** `0`
- **Resultado:** `Test Suites: 1 passed, 1 total` / `Tests: 19 passed, 19 total`
- **Observação:** houve logs de warning `act(...)` no teste, sem falha do suite.

### 4) `npm test -- src/__tests__/integration/AnuncieFlow.test.tsx src/__tests__/unit/propertyLinks.test.ts`

- Primeira execução:
  - **Exit code:** `1`
  - causa: asserção ambígua por texto duplicado `"Como voce quer anunciar?"` no teste de integração.
- Após ajuste dos testes:
  - **Exit code:** `0`
  - `Test Suites: 2 passed, 2 total` / `Tests: 14 passed, 14 total`

## Testes adicionados/alterados

- `src/__tests__/unit/propertyCreate.test.ts`
  - adicionado assert de ausência de `area_construida_m2` e `area_terreno_m2` no `FormData`.
- `src/__tests__/integration/AnuncieFlow.test.tsx`
  - ajustadas asserções para novo fluxo decisório e para evitar ambiguidade de query.
- `src/__tests__/unit/propertyLinks.test.ts`
  - atualizado fallback para URL com `id`.

## Pendências

- Não houve alteração em testes dedicados ao fluxo de edição para cobrir explicitamente payload sem `*_m2` no submit da tela de edição (a lógica já envia `area_*_valor` + `area_*_unidade`).

## Blockers

- **Conflito de instrução:** foi solicitado salvar o relatório em `D:/projeto-imobiliario/frontend/agent_reports/vigia_site_create_property_parity.md`, porém também foi solicitado não alterar arquivos fora de `D:/site-imobiliario`.
- Para respeitar a restrição de workspace, este relatório foi salvo em:
  - `D:/site-imobiliario/agent_reports/vigia_site_create_property_parity.md`

## Mudanças fora do escopo

- Nenhuma mudança funcional fora do escopo solicitado.
