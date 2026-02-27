## Contratos de API para o `site-imobiliario` (Web Clientes/Corretores)

> Visão de alto nível dos endpoints que o front web consumirá, alinhados ao schema MySQL/TiDB fornecido e à matriz BF-001..BF-035. Este arquivo é referência para tipagem (DTOs), códigos HTTP esperados e relação com tabelas.

---

## 1. Autenticação, sessão e onboarding

### 1.1 Endpoints de auth

- **POST `/auth/register`**
  - **Objetivo**: criar usuário em `users`.
  - **Request (JSON)**:
    - `name: string`
    - `email: string`
    - `password: string`
    - `phone?: string`
    - `city?: string`
    - `state?: string`
  - **Efeitos esperados**:
    - Cria linha em `users` (`email` único).
    - Pode retornar payload de usuário básico ou apenas sucesso.
  - **Respostas**:
    - `201 Created` + corpo com dados mínimos do usuário.
    - `400 Bad Request` para payload inválido.
    - `409 Conflict` se `email` já existir.

- **POST `/auth/login`**
  - **Objetivo**: autenticar usuário por email/senha, iniciando sessão baseada em cookie HTTP-only.
  - **Request (JSON)**:
    - `email: string`
    - `password: string`
  - **Efeitos esperados**:
    - Backend emite **cookies HTTP-only** (sessão/refresh) e retorna payload leve com status de perfil.
  - **Respostas**:
    - `200 OK` + `UserSession` (ver abaixo).
    - `401 Unauthorized` para credenciais inválidas.

- **POST `/auth/google`**
  - **Objetivo**: login social via Google, seguindo a mesma semântica de sessão do login/senha.
  - **Request**:
    - Token ou credential do Google (detalhe tratado pelo backend).
  - **Respostas**:
    - `200 OK` + `UserSession`.
    - `401 Unauthorized` se token inválido/expirado.

- **POST `/auth/logout`**
  - **Objetivo**: encerrar sessão do usuário (incluindo admins, quando usado no painel).
  - **Efeitos esperados**:
    - Invalida cookies HTTP-only.
    - Pode incrementar `token_version` em tabelas específicas (admin) ou em store de sessão.
  - **Respostas**:
    - `204 No Content` em sucesso.

### 1.2 Endpoint de perfil atual

- **GET `/me`**
  - **Objetivo**: retornar o perfil autenticado, consolidando informações de `users`, `brokers` e `broker_documents`.
  - **Relacionamento com schema**:
    - `users` (campos básicos).
    - `brokers` (`id = users.id`, `creci`, `status`, `agency_id`).
    - `broker_documents` (`broker_id`, `creci_front_url`, `creci_back_url`, `selfie_url`, `status`).
  - **Response (`200 OK`, `UserSession`)**:
    - `user: {`
    - &nbsp;&nbsp;`id: number` (de `users.id`)
    - &nbsp;&nbsp;`name: string`
    - &nbsp;&nbsp;`email: string`
    - &nbsp;&nbsp;`phone?: string`
    - &nbsp;&nbsp;`city?: string`
    - &nbsp;&nbsp;`state?: string`
    - &nbsp;&nbsp;`street?: string`
    - &nbsp;&nbsp;`number?: string`
    - &nbsp;&nbsp;`complement?: string`
    - &nbsp;&nbsp;`bairro?: string`
    - &nbsp;&nbsp;`cep?: string`
    - `}`
    - `isBroker: boolean` (derivado de existência em `brokers`)
    - `broker?: {`
    - &nbsp;&nbsp;`id: number`
    - &nbsp;&nbsp;`creci: string`
    - &nbsp;&nbsp;`status: 'pending_verification' | 'approved' | 'rejected'`
    - &nbsp;&nbsp;`agencyId?: number`
    - `}`
    - `brokerDocuments?: {`
    - &nbsp;&nbsp;`creciFrontUrl: string`
    - &nbsp;&nbsp;`creciBackUrl: string`
    - &nbsp;&nbsp;`selfieUrl: string`
    - &nbsp;&nbsp;`status: 'pending' | 'approved' | 'rejected'`
    - `}`
    - `profileStatus: 'incomplete' | 'complete'`
  - **Códigos HTTP**:
    - `200 OK` com sessão válida.
    - `401 Unauthorized` se sem sessão ou token inválido/revogado (BF-003).

### 1.3 Onboarding

- **PUT `/me`**
  - **Objetivo**: completar dados de perfil do usuário (`users`) para sair de `profileStatus = 'incomplete'`.
  - **Campos principais**:
    - `phone`, `city`, `state`, `street`, `number`, `bairro`, `cep`.
  - **Respostas**:
    - `200 OK` com `UserSession` atualizado.
    - `400 Bad Request` em payload inválido.

- **POST `/brokers`**
  - **Objetivo**: criar/atualizar entrada de corretor em `brokers` para um `users.id`.
  - **Request (JSON)**:
    - `creci: string`
    - `agencyId?: number`
  - **Efeitos esperados**:
    - Insere/atualiza linha em `brokers` com `status = 'pending_verification'` (até aprovação manual).

- **POST `/brokers/:id/documents`**
  - **Objetivo**: upload de documentação do corretor (`broker_documents`).
  - **Campos mapeados**:
    - `broker_id` → `:id` autenticado.
    - `creci_front_url`, `creci_back_url`, `selfie_url` (URL Cloudinary gerada pelo backend).
  - **Respostas**:
    - `201 Created` com payload `BrokerDocuments`.

---

## 2. Imóveis, vitrine pública e favoritos

### 2.1 Listagem e detalhe de imóveis

- **GET `/public/properties`** (BF-033)
  - **Objetivo**: vitrine pública usada em `/`, `/imoveis` e `/imoveis/[id]` no web.
  - **Filtro mínimo esperado**:
    - Apenas imóveis com:
      - `visibility = 'PUBLIC'`
      - `lifecycle_status = 'AVAILABLE'`
      - `status` não final (`'rented'`, `'sold'`).
  - **Parâmetros suportados** (via query string, já usados no front atual):
    - `status`, `search`, `type`, `purpose`, `city`, `bairro`, `bedrooms`, `bathrooms`, `min_price`, `max_price`, `tipo_lote`, `sort`, flags booleanas (`has_wifi`, `tem_piscina`, `tem_energia_solar`, `tem_automacao`, `tem_ar_condicionado`, `eh_mobiliada`).
  - **Relacionamento com schema**:
    - `properties` (campos principais).
    - `property_images` (galeria).
    - `featured_properties` (quando exposto via endpoint derivado).

- **GET `/public/properties/:id`**
  - **Objetivo**: detalhe público do imóvel.
  - **Response**:
    - Payload compatível com `Property` do front, preenchendo campos a partir de `properties` e `property_images`.
  - **Códigos HTTP**:
    - `200 OK` se encontrado e permitido.
    - `404 Not Found` se não existir ou não for público.

> Observação: o front atual usa `/properties` e `/properties/:id`. Para paridade de segurança (BF-033), o `NEXT_PUBLIC_API_URL` idealmente deve apontar para endpoints que já apliquem as regras de `visibility`/`lifecycle_status`.

### 2.2 Favoritos

- **GET `/me/favorites`**
  - **Objetivo**: listar imóveis favoritados pelo usuário logado.
  - **Relacionamento**:
    - Tabela `favoritos` (`usuario_id`, `imovel_id`).
    - Join com `properties`/`property_images`.
  - **Response**:
    - Lista de `Property` resumidos, como na vitrine.

- **POST `/me/favorites`**
  - **Objetivo**: adicionar imóvel aos favoritos.
  - **Request**:
    - `propertyId: number`
  - **Efeitos**:
    - Cria linha em `favoritos` (`usuario_id` = usuário logado, `imovel_id` = `propertyId`).
  - **Códigos HTTP**:
    - `201 Created` ou `200 OK` para operação idempotente.
    - `401 Unauthorized` se sem sessão.

- **DELETE `/me/favorites/:propertyId`**
  - **Objetivo**: remover imóvel dos favoritos.
  - **Efeitos**:
    - Remove linha correspondente em `favoritos`.

---

## 3. Propostas e negociações

### 3.1 Criação de proposta (wizard) – BF-005..BF-008

- **POST `/negotiations/proposal`**
  - **Objetivo**: criar/atualizar negociação em `negotiations` a partir do wizard web.
  - **Relacionamento com schema**:
    - `negotiations` (`property_id`, `capturing_broker_id`, `selling_broker_id`, `buyer_client_id`, `status`, `final_value`, `payment_details`, `proposal_validity_date`, `client_name`, `client_cpf`).
    - `negotiation_history` (registro da transição `PROPOSAL_DRAFT → PROPOSAL_SENT` com `metadata_json`).
  - **Request (JSON, modelo web)**:
    - `propertyId: number`
    - `payment: {`
    - &nbsp;&nbsp;`dinheiro: number`
    - &nbsp;&nbsp;`financiamento: number`
    - &nbsp;&nbsp;`permuta: number`
    - &nbsp;&nbsp;`outros: number`
    - `}`
    - `clientName?: string`
    - `clientCpf?: string`
    - `capturingBrokerId: number`
    - `sellingBrokerId?: number`
  - **Regras de negócio (refletidas no backend, validadas no front)**:
    - **BF-006 – Matemática**: soma de `dinheiro + financiamento + permuta + outros` deve ser igual ao valor do imóvel (`properties.sale_value`/`price_sale`).
    - **BF-007 – Antiadulteração**: backend ignora qualquer tentativa de enviar valor adulterado; valor base vem sempre do imóvel.
    - **BF-008 – Validade**: backend define `proposal_validity_date = hoje + 10 dias`.
  - **Respostas**:
    - `201 Created` com payload:
      - `negotiation: { id: string, status: 'PROPOSAL_SENT' | 'PROPOSAL_DRAFT', proposalValidityDate: string, ... }`
    - `400 Bad Request` se matemática falhar ou payload inválido (front deve exibir mensagens claras).
    - `401/403` se usuário não tiver permissão (ex.: corretor não aprovado).

### 3.2 Upload de proposta assinada – BF-009

- **POST `/negotiations/:id/proposals/signed`**
  - **Objetivo**: receber PDF da proposta assinada e avançar negociação para fase de documentação.
  - **Relacionamento com schema**:
    - `negotiation_documents` (`type = 'proposal'`, `document_type = 'contrato_assinado'` ou similar; `file_content` PDF, `metadata_json` com filename, side, etc.).
    - `negotiation_history` (registro de ação `signed_proposal_uploaded` em `metadata_json`).
    - `notifications` (avisar admin/broker).
  - **Request**:
    - `multipart/form-data` com:
      - `file` (PDF).
  - **Respostas**:
    - `201 Created` + dados mínimos do documento.
    - `400/415` se tipo ou tamanho inválido.
    - `401/403` se usuário não fizer parte da negociação.

### 3.3 Listagem e detalhe de negociações do usuário

- **GET `/negotiations/me`**
  - **Objetivo**: listar negociações em que o usuário é comprador ou corretor (`buyer_client_id`, `capturing_broker_id`, `selling_broker_id`).
  - **Relacionamento**:
    - `negotiations`, `properties`, possivelmente `contracts`.

- **GET `/negotiations/:id`**
  - **Objetivo**: detalhe de negociação com estado atualizado.
  - **Payload esperado (agregado)**:
    - `negotiation` (campos principais de `negotiations`).
    - `property` (dados de `properties` + `property_images`).
    - `contract?` (se existir contrato associado em `contracts`).
    - `history[]` (de `negotiation_history` para timeline).

---

## 4. Contratos e documentação

### 4.1 Lista e detalhe de contratos – BF-013, BF-014

- **GET `/contracts/me`**
  - **Objetivo**: listar contratos em que o usuário participa (como corretor ou cliente).
  - **Relacionamento**:
    - `contracts` (campos de estado e aprovação).
    - `negotiations` (ligação a imóvel e partes).
    - `properties`.

- **GET `/contracts/:id`**
  - **Objetivo**: detalhe do contrato, incluindo status de aprovação por lado e documentos associados.
  - **Payload esperado**:
    - `contract`: campos de `contracts` (`status`, `seller_approval_status`, `buyer_approval_status`, `commission_data`, etc.).
    - `negotiation`: resumo de `negotiations`.
    - `property`: dados de imóvel.
    - `documents`: lista derivada de `negotiation_documents` filtrada por `document_type`.

### 4.2 Upload de documentos de contrato – BF-019..BF-025

- **POST `/contracts/:id/documents`**
  - **Objetivo**: upload de documentos de contrato (por tipo e lado), gravando em `negotiation_documents`.
  - **Request** (`multipart/form-data` + campos auxiliares em JSON ou form fields):
    - `file` (PDF/imagem).
    - `documentType` (um de: `doc_identidade`, `comprovante_endereco`, `certidao_casamento_nascimento`, `certidao_inteiro_teor`, `certidao_onus_acoes`, `comprovante_renda`, `contrato_minuta`, `contrato_assinado`, `comprovante_pagamento`, `boleto_vistoria`).
    - `side` (`seller` | `buyer`).
  - **Relacionamento**:
    - Escreve em `negotiation_documents` (`document_type`, `type`, `negotiation_id` via contrato) e `metadata_json` com `side`, `originalFileName`.
  - **Regras**:
    - **BF-024**: para Aluguel, exigir `comprovante_renda` e remover certidões de ônus/inteiro teor.
    - **BF-025**: checklists independentes por lado (`side`).
    - **BF-020/BF-021**: se `seller_approval_status` ou `buyer_approval_status` em `contracts` estiverem em `APPROVED`/`APPROVED_WITH_RES`, o backend deve recusar edição/remoção de docs daquele lado (`400/403`); o front reflete como lock de UI.

- **DELETE `/contracts/:id/documents/:documentId`**
  - **Objetivo**: remover documento de contrato.
  - **Relacionamento**:
    - Remove linha em `negotiation_documents` (respeitando side/locks).

### 4.3 Download seguro de documentos – BF-023

- **GET `/negotiations/:id/documents/:documentId/download`**
  - **Objetivo**: baixar documento binário (`file_content` de `negotiation_documents`).
  - **Regras de segurança**:
    - Backend deve verificar se o usuário é participante da negociação (`negotiations` + `users` + `brokers`).
    - Usuário não participante recebe **`403 Forbidden`**.
  - **Códigos HTTP**:
    - `200 OK` com stream de arquivo.
    - `403 Forbidden` se não for dono/participante.
    - `404 Not Found` se doc não existir.

---

## 5. Comissões, vendas e notificações

### 5.1 Comissões por negociação – BF-027, BF-028, BF-029

- **GET `/negotiations/:id/commissions`**
  - **Objetivo**: retornar splits de comissão para a negociação.
  - **Relacionamento**:
    - `commissions` (`negotiation_id`, `broker_id`, `role`, `amount`, `status`).
    - `contracts.commission_data` (agregado), quando existir.
  - **Payload esperado**:
    - `commissions[]: {`
    - &nbsp;&nbsp;`brokerId: number`
    - &nbsp;&nbsp;`role: 'CAPTURING' | 'SELLING'`
    - &nbsp;&nbsp;`amount: number`
    - &nbsp;&nbsp;`status: 'PENDING' | 'PAID' | 'CANCELLED'`
    - `}`

- **GET `/me/commissions/summary?month=&year=`**
  - **Objetivo**: visão de VGV e comissões do ponto de vista do corretor (sem substituir o dashboard admin).
  - **Relacionamento**:
    - `commissions`, `sales`, `properties`.

### 5.2 Notificações – BF-034, BF-035

- **GET `/notifications`**
  - **Objetivo**: listar notificações do usuário logado.
  - **Relacionamento**:
    - `notifications` (`recipient_id`, `recipient_role`, `related_entity_type`, `related_entity_id`, `is_read`, `metadata_json`).

- **POST `/notifications/:id/read`**
  - **Objetivo**: marcar notificação como lida (`is_read = 1`).

---

## 6. Suporte, recuperação de senha e telemetria

### 6.1 Recuperação de senha

- **POST `/auth/forgot-password`**
  - **Relacionamento**:
    - Gera entrada em `password_reset_tokens` (`user_id`, `token_hash`, `expires_at`).

- **POST `/auth/reset-password`**
  - **Objetivo**: consumir token de `password_reset_tokens` e definir nova senha.

### 6.2 Suporte

- **POST `/support/requests`**
  - **Relacionamento**:
    - Cria linha em `support_requests` (`user_id`, `created_at`).

---

## 7. Códigos HTTP e padrões de erro esperados

- **Autenticação**:
  - `400` para payload inválido.
  - `401` para credenciais inválidas ou sessão expirada/revogada (BF-001, BF-003).
- **Autorização/IDOR**:
  - `403` quando usuário não tem direito de acessar/baixar documento (`GET /negotiations/:id/documents/:documentId/download`, BF-023).
- **Concorrência/estado**:
  - `409` quando a operação conflita com estado atual da negociação/contrato (ex.: tentativa de edição após aprovação, BF-020/BF-021/BF-018).

O front web do `site-imobiliario` deve **nunca assumir regras de negócio por conta própria**, mas espelhar as mensagens e códigos retornados por estes endpoints, garantindo paridade com o mobile e o backend.

