# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: signup-google-broker.spec.ts >> enviar documentos leva para etapa de análise
- Location: e2e\signup-google-broker.spec.ts:366:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Documentos enviados!/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/Documentos enviados!/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e4]:
      - link "Encontre Aqui Imóveis" [ref=e5] [cursor=pointer]:
        - /url: /
        - img "Encontre Aqui Imóveis" [ref=e6]
      - generic [ref=e8]:
        - img [ref=e9]
        - textbox "Buscar imóveis..." [ref=e12]
      - navigation [ref=e13]:
        - link "Início" [ref=e14] [cursor=pointer]:
          - /url: /
        - link "Imóveis" [ref=e15] [cursor=pointer]:
          - /url: /imoveis
      - generic [ref=e16]:
        - link "Entrar" [ref=e17] [cursor=pointer]:
          - /url: /auth/login
        - link "Cadastrar" [ref=e18] [cursor=pointer]:
          - /url: /auth/cadastro
  - main [ref=e19]:
    - generic [ref=e21]:
      - generic [ref=e22]:
        - heading "Criar conta" [level=1] [ref=e23]
        - paragraph [ref=e24]: Selecione seu tipo de perfil para avançarmos para o próximo passo.
      - generic [ref=e25]:
        - generic [ref=e26]:
          - button "Quero cadastrar como cliente Para favoritar imóveis, gerar propostas e acompanhar contratos. Acesso focado em busca, proposta e acompanhamento." [ref=e27] [cursor=pointer]:
            - generic [ref=e28]:
              - generic [ref=e29]:
                - paragraph [ref=e31]: Quero cadastrar como cliente
                - paragraph [ref=e32]: Para favoritar imóveis, gerar propostas e acompanhar contratos.
              - img [ref=e34]
            - paragraph [ref=e37]: Acesso focado em busca, proposta e acompanhamento.
          - button "Quero cadastrar como corretor Para anunciar imóveis, gerar propostas e operar a carteira. Acesso para operação comercial e gestão da carteira." [ref=e38] [cursor=pointer]:
            - generic [ref=e39]:
              - generic [ref=e40]:
                - paragraph [ref=e42]: Quero cadastrar como corretor
                - paragraph [ref=e43]: Para anunciar imóveis, gerar propostas e operar a carteira.
              - img [ref=e45]
            - paragraph [ref=e48]: Acesso para operação comercial e gestão da carteira.
        - generic [ref=e53]: ou continue com
        - button "Continuar com Google" [ref=e54] [cursor=pointer]:
          - img [ref=e55]
          - text: Continuar com Google
        - button "Continuar" [disabled] [ref=e60]
      - paragraph [ref=e62]:
        - text: Já tem conta?
        - link "Entrar" [ref=e63] [cursor=pointer]:
          - /url: /auth/login
  - contentinfo [ref=e64]:
    - generic [ref=e66]:
      - generic [ref=e67]:
        - link "Encontre Aqui Imóveis" [ref=e68] [cursor=pointer]:
          - /url: /
          - img "Encontre Aqui Imóveis" [ref=e69]
        - paragraph [ref=e70]: Vitrine oficial de imóveis. Para interações completas, utilize o aplicativo da imobiliária.
        - generic [ref=e71]:
          - link "Instagram Encontre Aqui Imóveis" [ref=e72] [cursor=pointer]:
            - /url: https://www.instagram.com/encontre.aquiimoveis?igsh=MXI2N3ZmZzY4a281eQ==
            - img [ref=e73]
          - link "WhatsApp (número em atualização)" [ref=e76] [cursor=pointer]:
            - /url: https://wa.me/5511999999999
            - img [ref=e77]
      - generic [ref=e80]:
        - generic [ref=e81]:
          - heading "Navegação" [level=3] [ref=e82]
          - list [ref=e83]:
            - listitem [ref=e84]:
              - link "Início" [ref=e85] [cursor=pointer]:
                - /url: /
            - listitem [ref=e86]:
              - link "Imóveis" [ref=e87] [cursor=pointer]:
                - /url: /imoveis
            - listitem [ref=e88]:
              - link "Anunciar imóvel" [ref=e89] [cursor=pointer]:
                - /url: /anuncie
        - generic [ref=e90]:
          - heading "Minha Conta" [level=3] [ref=e91]
          - list [ref=e92]:
            - listitem [ref=e93]:
              - link "Favoritos" [ref=e94] [cursor=pointer]:
                - /url: /favoritos
            - listitem [ref=e95]:
              - link "Propostas" [ref=e96] [cursor=pointer]:
                - /url: /propostas
            - listitem [ref=e97]:
              - link "Contratos" [ref=e98] [cursor=pointer]:
                - /url: /contratos
            - listitem [ref=e99]:
              - link "Meu perfil" [ref=e100] [cursor=pointer]:
                - /url: /perfil
      - generic [ref=e101]:
        - heading "Aplicativo" [level=3] [ref=e102]
        - generic [ref=e103]:
          - link "Baixar no Android" [ref=e104] [cursor=pointer]:
            - /url: https://play.google.com/store
            - img [ref=e105]
            - text: Baixar no Android
          - link "Baixar no iOS" [ref=e108] [cursor=pointer]:
            - /url: https://apps.apple.com
            - img [ref=e109]
            - text: Baixar no iOS
    - generic [ref=e114]:
      - paragraph [ref=e115]: © 2026 Encontre Aqui Imóveis. Todos os direitos reservados.
      - generic [ref=e116]:
        - link "Termos de Uso" [ref=e117] [cursor=pointer]:
          - /url: /termos
        - link "Privacidade" [ref=e118] [cursor=pointer]:
          - /url: /privacidade
  - alert [ref=e119]
```

# Test source

```ts
  417 |         }
  418 |         route.continue()
  419 |     })
  420 |     await page.route('**/users/register', (route) => {
  421 |         if (route.request().method() === 'POST') {
  422 |             usersRegisterCalls += 1
  423 |         }
  424 |         route.continue()
  425 |     })
  426 | 
  427 |     await page.addInitScript(() => {
  428 |         const draft = {
  429 |             source: 'google',
  430 |             userType: 'broker',
  431 |             draftId: 'draft-broker-upload',
  432 |             draftToken: 'draft-broker-upload-token',
  433 |             step: 'verify_method',
  434 |             emailVerified: true,
  435 |             phoneVerified: false,
  436 |             data: {
  437 |                 name: 'Corretor Upload',
  438 |                 email: 'broker-upload@example.com',
  439 |                 password: '',
  440 |                 phone: '62999998899',
  441 |                 street: 'Rua Teste',
  442 |                 number: '100',
  443 |                 complement: '',
  444 |                 bairro: 'Centro',
  445 |                 city: 'Goiânia',
  446 |                 state: 'GO',
  447 |                 cep: '74000000',
  448 |                 creci: 'GO988',
  449 |                 googleIdToken: 'google-pending-token',
  450 |                 googleUid: 'google-uid-e2e',
  451 |             },
  452 |             updatedAt: new Date().toISOString(),
  453 |         }
  454 |         window.localStorage.setItem('ea_signup_draft_v1', JSON.stringify(draft))
  455 |         window.localStorage.setItem('ea_signup_draft_ts_v1', String(Date.now()))
  456 |     })
  457 | 
  458 |     await page.route('**/users/me', async (route) => {
  459 |         await route.fulfill({
  460 |             status: 200,
  461 |             contentType: 'application/json',
  462 |             body: JSON.stringify({
  463 |                 user: {
  464 |                     id: 2,
  465 |                     name: 'Corretor Upload',
  466 |                     email: 'broker-upload@example.com',
  467 |                     email_verified: true,
  468 |                     phone: '62999998899',
  469 |                     street: 'Rua Teste',
  470 |                     number: '100',
  471 |                     bairro: 'Centro',
  472 |                     city: 'Goiânia',
  473 |                     state: 'GO',
  474 |                     cep: '74000000',
  475 |                     role: 'broker',
  476 |                     broker_status: 'pending_verification',
  477 |                     token_hint: 'site-broker-token',
  478 |                 },
  479 |                 requiresDocuments: true,
  480 |                 role: 'broker',
  481 |                 status: 'pending_verification',
  482 |             }),
  483 |         })
  484 |     })
  485 |     await page.route('**/brokers/me/verify-documents', async (route) => {
  486 |         await route.fulfill({
  487 |             status: 200,
  488 |             contentType: 'application/json',
  489 |             body: JSON.stringify({}),
  490 |         })
  491 |     })
  492 | 
  493 |     await page.goto('/cadastro/verificar-metodo')
  494 |     await page.getByRole('button', { name: /prosseguir com verificação de corretor/i }).click()
  495 |     await expect(page.getByRole('heading', { name: /enviar documentos/i })).toBeVisible()
  496 | 
  497 |     const fileChooser = page.locator('input[type="file"]')
  498 |     await fileChooser.first().setInputFiles({
  499 |         name: 'frente.jpg',
  500 |         mimeType: 'image/jpeg',
  501 |         buffer: Buffer.from('frente'),
  502 |     })
  503 |     const backInput = page.locator('input[type="file"]').nth(1)
  504 |     await backInput.setInputFiles({
  505 |         name: 'verso.jpg',
  506 |         mimeType: 'image/jpeg',
  507 |         buffer: Buffer.from('verso'),
  508 |     })
  509 |     const selfieInput = page.locator('input[type="file"]').nth(2)
  510 |     await selfieInput.setInputFiles({
  511 |         name: 'selfie.jpg',
  512 |         mimeType: 'image/jpeg',
  513 |         buffer: Buffer.from('selfie'),
  514 |     })
  515 | 
  516 |     await page.getByRole('button', { name: /enviar documentos/i }).click()
> 517 |     await expect(page.getByText(/Documentos enviados!/i)).toBeVisible()
      |                                                           ^ Error: expect(locator).toBeVisible() failed
  518 |     await expect(page.getByRole('link', { name: /Explorar imóveis/i })).toBeVisible()
  519 |     expect(finalizeAction).toBe('broker_submit_documents')
  520 |     expect(submitDocumentsCalls).toBe(1)
  521 |     expect(finalizeCalls).toBe(1)
  522 |     expect(createDraftCalls).toBe(0)
  523 |     expect(usersRegisterCalls).toBe(0)
  524 | })
  525 | 
  526 | 
```