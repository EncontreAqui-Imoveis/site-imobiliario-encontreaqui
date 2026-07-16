import { test, expect } from '@playwright/test'

test('cadastro corretor em fluxo Google pendente segue para onboarding de documentos', async ({ page }) => {
    await page.route('**/auth/check-creci**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ exists: false }),
        })
    })

    await page.addInitScript(() => {
        const draft = {
            source: 'google',
            userType: null,
            step: 'profile',
            emailVerified: false,
            phoneVerified: false,
            data: {
                name: 'Corretor Google',
                email: 'broker-e2e@example.com',
                password: '',
                phone: '',
                street: '',
                number: '',
                complement: '',
                bairro: '',
                city: '',
                state: 'GO',
                cep: '',
                creci: '',
                googleIdToken: 'google-pending-token',
                googleUid: 'google-uid-e2e',
            },
            updatedAt: new Date().toISOString(),
        }
        window.localStorage.setItem('ea_signup_draft_v1', JSON.stringify(draft))
        window.localStorage.setItem('ea_signup_draft_ts_v1', String(Date.now()))
    })

    await page.goto('/auth/cadastro')

    await page.getByRole('button', { name: /quero cadastrar como corretor/i }).click()

    await page.getByLabel('Nome completo *').fill('Corretor Google')
    await page.getByLabel(/Telefone/).fill('62999999998')
    await page.getByLabel('CRECI *').fill('12345-F')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /^criar conta$/i }).click()

    await page.getByLabel(/CEP/).fill('74000000')
    await page.getByLabel(/Estado/).selectOption('GO')
    await page.getByLabel('Cidade').fill('Goiânia')
    await page.getByLabel('Bairro').fill('Centro')
    await page.getByLabel('Rua').fill('Rua Broker')
    await page.getByLabel(/Número/).fill('200')
    await page.getByRole('button', { name: /^criar conta$/i }).click()
    await expect(page).toHaveURL(/\/cadastro\/verificar-metodo/)
    await expect(page.getByText(/Seu e-mail já foi (confirmado|verificado)\. Você quer verificar seu telefone\?/i)).toBeVisible()
    await page.getByRole('button', { name: /prosseguir com verificação de corretor/i }).click()
    await expect(page).toHaveURL(/\/onboarding\/broker\?mode=signup/)
    await expect(page.getByRole('heading', { name: /Quero ser corretor/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /número creci/i })).toBeVisible()
})

test('Google após escolha prévia de perfil mantém o tipo e inicia em Dados básicos', async ({ page }) => {
    await page.addInitScript(() => {
        const draft = {
            source: 'google',
            userType: 'broker',
            step: 'basic',
            emailVerified: true,
            phoneVerified: false,
            data: {
                name: 'Corretor Google',
                email: 'broker-presel@example.com',
                password: '',
                phone: '',
                street: '',
                number: '',
                complement: '',
                bairro: '',
                city: '',
                state: 'GO',
                cep: '',
                creci: '12345-F',
                googleIdToken: 'google-pending-token',
                googleUid: 'google-uid-e2e',
            },
            updatedAt: new Date().toISOString(),
        }
        window.localStorage.setItem('ea_signup_draft_v1', JSON.stringify(draft))
        window.localStorage.setItem('ea_signup_draft_ts_v1', String(Date.now()))
    })

    await page.goto('/auth/cadastro')
    await expect(page.getByRole('textbox', { name: 'Nome completo *' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'E-mail *' })).toHaveValue('broker-presel@example.com')
    await expect(page.getByRole('button', { name: /quero cadastrar como cliente/i })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /quero cadastrar como corretor/i })).not.toBeVisible()
})

test('Não, continuar sem verificar em verificar-método leva cliente para meus imóveis', async ({ page }) => {
    let finalizeAction: string | null = null
    let finalizeBody: Record<string, unknown> | null = null
    await page.route('**/auth/register/draft/*/finalize', async (route) => {
        if (route.request().method() === 'POST') {
            const body = route.request().postData()
            const parsed = body ? JSON.parse(body) : {}
            if (parsed && typeof parsed === 'object') {
                finalizeBody = parsed as Record<string, unknown>
            }
            if (parsed && typeof parsed === 'object' && 'action' in parsed) {
                finalizeAction = String(parsed.action)
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    token: 'site-client-token',
                    user: {
                        id: 10,
                        name: 'Cliente E2E',
                        email: 'cliente-e2e@example.com',
                        role: 'client',
                        email_verified: true,
                        phone: '62999999999',
                        street: 'Rua Teste',
                        number: '100',
                        bairro: 'Centro',
                        city: 'Goiânia',
                        state: 'GO',
                        cep: '74000000',
                        token_hint: 'site-client-token',
                    },
                    needsCompletion: false,
                    requiresDocuments: false,
                }),
            })
            return
        }
        await route.continue()
    })

    await page.addInitScript(() => {
        const draft = {
            source: 'google',
            userType: 'client',
            draftId: 'draft-google-client',
            draftToken: 'draft-google-client-token',
            step: 'verify_method',
            emailVerified: true,
            phoneVerified: false,
            data: {
                name: 'Cliente Google',
                email: 'cliente-e2e@example.com',
                password: '',
                phone: '62999999999',
                street: 'Rua Teste',
                number: '100',
                complement: '',
                bairro: 'Centro',
                city: 'Goiânia',
                state: 'GO',
                cep: '74000000',
                creci: '',
                googleIdToken: 'google-pending-token',
                googleUid: 'google-uid-e2e',
            },
            updatedAt: new Date().toISOString(),
        }
        window.localStorage.setItem('ea_signup_draft_v1', JSON.stringify(draft))
        window.localStorage.setItem('ea_signup_draft_ts_v1', String(Date.now()))
    })

    await page.route('**/users/me', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                role: 'client',
                status: null,
                requiresDocuments: false,
                user: {
                    id: 10,
                    name: 'Cliente E2E',
                    email: 'cliente-e2e@example.com',
                    email_verified: true,
                    phone: '62999999999',
                    street: 'Rua Teste',
                    number: '100',
                    bairro: 'Centro',
                    city: 'Goiânia',
                    state: 'GO',
                    cep: '74000000',
                    createdAt: '2026-04-07T10:00:00.000Z',
                    token_hint: 'site-client-token',
                },
            }),
        })
    })

    await page.goto('/cadastro/verificar-metodo')
    await page.getByRole('button', { name: /Não, continuar sem verificar/i }).click()
    await expect(page).toHaveURL('/meus-imoveis')
    expect(finalizeAction).toBe('submit_documents')
    expect(finalizeBody).toMatchObject({
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        action: 'submit_documents',
        termsVersion: '2026-04-28',
        privacyPolicyVersion: '2026-04-28',
    })
})

test('Google com e-mail já verificado não mostra escolha de método de verificação por e-mail', async ({ page }) => {
    await page.route('**/auth/check-creci**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ exists: false }),
        })
    })

    await page.addInitScript(() => {
        const draft = {
            source: 'google',
            userType: 'broker',
            step: 'verify_method',
            emailVerified: true,
            phoneVerified: false,
            data: {
                name: 'Cliente Google',
                email: 'cliente-e2e@example.com',
                password: '',
                phone: '62999999999',
                street: 'Rua Teste',
                number: '100',
                complement: '',
                bairro: 'Centro',
                city: 'Goiânia',
                state: 'GO',
                cep: '74000000',
                creci: '',
                googleIdToken: 'google-pending-token',
                googleUid: 'google-uid-e2e',
            },
            updatedAt: new Date().toISOString(),
        }
        window.localStorage.setItem('ea_signup_draft_v1', JSON.stringify(draft))
        window.localStorage.setItem('ea_signup_draft_ts_v1', String(Date.now()))
    })

    await page.goto('/cadastro/verificar-metodo')

    await expect(page.getByText(/Seu e-mail já foi (confirmado|verificado)\. Você quer verificar seu telefone\?/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Sim, verificar por SMS/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Prosseguir com verificação de corretor/i })).toBeVisible()
})

test('corretor cria pendência documental com Enviar depois sem exigir CRECI novamente', async ({ page }) => {
    let upgradeCalls = 0
    let finalizeAction: string | null = null
    let finalizeBody: Record<string, unknown> | null = null
    let usersRegisterCalls = 0
    let submitDocumentsCalls = 0
    await page.route('**/brokers/me/request-upgrade', async (route) => {
        upgradeCalls += 1
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({}),
        })
    })
    await page.route('**/auth/register/draft/*/finalize', async (route) => {
        if (route.request().method() === 'POST') {
            const body = route.request().postData()
            const parsed = body ? JSON.parse(body) : {}
            if (parsed && typeof parsed === 'object') {
                finalizeBody = parsed as Record<string, unknown>
            }
            if (parsed && typeof parsed === 'object' && 'action' in parsed) {
                finalizeAction = String(parsed.action)
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    token: 'site-broker-token',
                    user: {
                        id: 2,
                        name: 'Corretor Pendencia',
                        email: 'broker-pendente@example.com',
                        role: 'broker',
                        email_verified: true,
                        phone: '62999998898',
                        street: 'Rua Teste',
                        number: '100',
                        bairro: 'Centro',
                        city: 'Goiânia',
                        state: 'GO',
                        cep: '74000000',
                        token_hint: 'site-broker-token',
                    },
                    needsCompletion: false,
                    requiresDocuments: true,
                }),
            })
            return
        }
        await route.continue()
    })
    await page.route('**/auth/register/draft/*/submit-documents', async (route) => {
        if (route.request().method() === 'POST') {
            submitDocumentsCalls += 1
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true }),
        })
    })
    await page.route('**/auth/check-creci*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ exists: false }),
        })
    })
    await page.route('**/users/register', async (route) => {
        if (route.request().method() === 'POST') {
            usersRegisterCalls += 1
        }
        await route.continue()
    })
    await page.route('**/users/me', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                user: {
                    id: 2,
                    name: 'Corretor Pendencia',
                    email: 'broker-pendente@example.com',
                    email_verified: true,
                    phone: '62999998898',
                    street: 'Rua Teste',
                    number: '100',
                    bairro: 'Centro',
                    city: 'Goiânia',
                    state: 'GO',
                    cep: '74000000',
                    role: 'broker',
                    broker_status: 'pending_verification',
                    token_hint: 'site-broker-token',
                },
                requiresDocuments: true,
                role: 'broker',
                status: 'pending_verification',
            }),
        })
    })
    await page.addInitScript(() => {
        const draft = {
            source: 'google',
            userType: 'broker',
            draftId: 'draft-broker-send-later',
            draftToken: 'draft-broker-send-later-token',
            step: 'verify_method',
            emailVerified: true,
            phoneVerified: false,
            data: {
                name: 'Corretor Pendencia',
                email: 'broker-pendente@example.com',
                password: '',
                phone: '62999998898',
                street: 'Rua Teste',
                number: '100',
                complement: '',
                bairro: 'Centro',
                city: 'Goiânia',
                state: 'GO',
                cep: '74000000',
                creci: 'GO987',
                googleIdToken: 'google-pending-token',
                googleUid: 'google-uid-e2e',
            },
            updatedAt: new Date().toISOString(),
        }
        window.localStorage.setItem('ea_signup_draft_v1', JSON.stringify(draft))
        window.localStorage.setItem('ea_signup_draft_ts_v1', String(Date.now()))
    })

    await page.goto('/cadastro/verificar-metodo')
    await page.getByRole('button', { name: /prosseguir com verificação de corretor/i }).click()
    await expect(page).toHaveURL(/\/onboarding\/broker\?mode=signup&creci=GO987/i)
    await expect(page.getByRole('heading', { name: /Quero ser corretor/i })).toBeVisible()
    await expect(page.getByLabel(/Número CRECI/i)).toHaveValue('GO987')
    await page.getByRole('button', { name: /solicitar upgrade para corretor/i }).click()
    await expect(page.getByRole('heading', { name: /enviar documentos/i })).toBeVisible()
    await page.getByTestId('broker-agreement-content').evaluate((element) => {
        element.scrollTop = element.scrollHeight
    })
    await page.getByRole('checkbox', { name: /li e aceito integralmente o termo de adesão de corretor/i }).check()

    await page.getByRole('button', { name: /enviar depois/i }).click()
    await expect(page.getByText(/Envie seus documentos para iniciar a análise/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /Ir para Meus imóveis/i })).toBeVisible()
    await expect(page.getByText(/Documentos enviados \/ em análise\./i)).not.toBeVisible()
    expect(finalizeAction).toBe('send_later')
    expect(finalizeBody).toMatchObject({
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        acceptedBrokerAgreement: true,
        termsVersion: '2026-04-28',
        privacyPolicyVersion: '2026-04-28',
        brokerAgreementVersion: '2026-04-28',
        action: 'send_later',
    })
    expect(submitDocumentsCalls).toBe(0)

    expect(upgradeCalls).toBe(0)
    expect(usersRegisterCalls).toBe(0)
})

test('enviar documentos leva para etapa de análise', async ({ page }) => {
    let finalizeAction: string | null = null
    let submitDocumentsCalls = 0
    let finalizeCalls = 0
    let createDraftCalls = 0
    let usersRegisterCalls = 0
    let finalizeBody: Record<string, unknown> | null = null
    await page.route('**/auth/check-creci*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ exists: false }),
        })
    })
    await page.route('**/auth/register/draft/*/submit-documents', async (route) => {
        if (route.request().method() === 'POST') {
            submitDocumentsCalls += 1
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    })
    await page.route('**/auth/register/draft/*/finalize', async (route) => {
        if (route.request().method() === 'POST') {
            const body = route.request().postData()
            const parsed = body ? JSON.parse(body) : {}
            if (parsed && typeof parsed === 'object') {
                finalizeBody = parsed as Record<string, unknown>
            }
            if (parsed && typeof parsed === 'object' && 'action' in parsed) {
                finalizeAction = String(parsed.action)
            }
            finalizeCalls += 1
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    token: 'site-broker-token',
                    user: {
                        id: 2,
                        name: 'Corretor Upload',
                        email: 'broker-upload@example.com',
                        role: 'broker',
                        email_verified: true,
                        phone: '62999998899',
                        street: 'Rua Teste',
                        number: '100',
                        bairro: 'Centro',
                        city: 'Goiânia',
                        state: 'GO',
                        cep: '74000000',
                        token_hint: 'site-broker-token',
                    },
                    needsCompletion: false,
                    requiresDocuments: true,
                }),
            })
            return
        }
        await route.continue()
    })
    await page.route('**/auth/register/draft', (route) => {
        if (route.request().method() === 'POST') {
            createDraftCalls += 1
        }
        route.continue()
    })
    await page.route('**/users/register', (route) => {
        if (route.request().method() === 'POST') {
            usersRegisterCalls += 1
        }
        route.continue()
    })

    await page.addInitScript(() => {
        const draft = {
            source: 'google',
            userType: 'broker',
            draftId: 'draft-broker-upload',
            draftToken: 'draft-broker-upload-token',
            step: 'verify_method',
            emailVerified: true,
            phoneVerified: false,
            data: {
                name: 'Corretor Upload',
                email: 'broker-upload@example.com',
                password: '',
                phone: '62999998899',
                street: 'Rua Teste',
                number: '100',
                complement: '',
                bairro: 'Centro',
                city: 'Goiânia',
                state: 'GO',
                cep: '74000000',
                creci: 'GO988',
                googleIdToken: 'google-pending-token',
                googleUid: 'google-uid-e2e',
            },
            updatedAt: new Date().toISOString(),
        }
        window.localStorage.setItem('ea_signup_draft_v1', JSON.stringify(draft))
        window.localStorage.setItem('ea_signup_draft_ts_v1', String(Date.now()))
    })

    await page.route('**/users/me', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                user: {
                    id: 2,
                    name: 'Corretor Upload',
                    email: 'broker-upload@example.com',
                    email_verified: true,
                    phone: '62999998899',
                    street: 'Rua Teste',
                    number: '100',
                    bairro: 'Centro',
                    city: 'Goiânia',
                    state: 'GO',
                    cep: '74000000',
                    role: 'broker',
                    broker_status: 'pending_verification',
                    token_hint: 'site-broker-token',
                },
                requiresDocuments: true,
                role: 'broker',
                status: 'pending_verification',
            }),
        })
    })
    await page.route('**/brokers/me/verify-documents', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({}),
        })
    })

    await page.goto('/cadastro/verificar-metodo')
    await page.getByRole('button', { name: /prosseguir com verificação de corretor/i }).click()
    await expect(page.getByRole('heading', { name: /Quero ser corretor/i })).toBeVisible()
    await expect(page.getByLabel(/Número CRECI/i)).toHaveValue('GO988')
    await page.getByRole('button', { name: /solicitar upgrade para corretor/i }).click()
    await expect(page.getByRole('heading', { name: /enviar documentos/i })).toBeVisible()
    await page.getByTestId('broker-agreement-content').evaluate((element) => {
        element.scrollTop = element.scrollHeight
    })
    await page.getByRole('checkbox', { name: /li e aceito integralmente o termo de adesão de corretor/i }).check()

    const fileChooser = page.locator('input[type="file"]')
    await fileChooser.first().setInputFiles({
        name: 'frente.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('frente'),
    })
    const backInput = page.locator('input[type="file"]').nth(1)
    await backInput.setInputFiles({
        name: 'verso.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('verso'),
    })
    const selfieInput = page.locator('input[type="file"]').nth(2)
    await selfieInput.setInputFiles({
        name: 'selfie.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('selfie'),
    })

    await page.getByRole('button', { name: /enviar documentos/i }).click()
    await expect(page.getByText(/Documentos enviados \/ em análise\./i)).toBeVisible()
    await expect(page.getByRole('link', { name: /Explorar imóveis/i })).toBeVisible()
    expect(finalizeAction).toBe('submit_documents')
    expect(finalizeBody).toMatchObject({
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        acceptedBrokerAgreement: true,
        termsVersion: '2026-04-28',
        privacyPolicyVersion: '2026-04-28',
        brokerAgreementVersion: '2026-04-28',
        action: 'submit_documents',
    })
    expect(submitDocumentsCalls).toBe(1)
    expect(finalizeCalls).toBe(1)
    expect(createDraftCalls).toBe(0)
    expect(usersRegisterCalls).toBe(0)
})
