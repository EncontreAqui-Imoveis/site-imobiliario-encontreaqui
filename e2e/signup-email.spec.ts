import { test, expect } from '@playwright/test'

async function fillSixDigitCode(page: import('@playwright/test').Page) {
    const inputs = page.locator('input[inputmode="numeric"]')
    for (let index = 0; index < 6; index += 1) {
        await inputs.nth(index).fill(String(index + 1))
    }
}

test('cadastro cliente por e-mail conclui e redireciona para meus imóveis', async ({ page }) => {
    let authRegisterCalls = 0
    let draftFinalizeCalls = 0
    let draftFinalizeAction: string | null = null

    let viacepCalls = 0
    await page.route('**/viacep.com.br/ws/74000000/json/**', async (route) => {
        viacepCalls += 1
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                cep: '74000-000',
                logradouro: 'Rua Teste',
                bairro: 'Centro',
                localidade: 'Goiânia',
                uf: 'GO',
            }),
        })
    })

    await page.route('**/auth/register', async (route) => {
        authRegisterCalls += route.request().method() === 'POST' ? 1 : 0
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                user: {
                    id: 10,
                    role: 'client',
                    email: 'cliente-e2e@example.com',
                    email_verified: true,
                    phone: '62999999999',
                    street: 'Rua Teste',
                    number: '100',
                    bairro: 'Centro',
                    city: 'Goiânia',
                    state: 'GO',
                    cep: '74000000',
                },
                token: 'site-client-token',
                needsCompletion: false,
                requiresDocuments: false,
            }),
        })
    })
    await page.route('**/auth/register/draft/*/finalize', async (route) => {
        if (route.request().method() === 'POST') {
            draftFinalizeCalls += 1
            const body = route.request().postData()
            const parsed = body ? JSON.parse(body) : {}
            if (parsed && typeof parsed === 'object' && 'action' in parsed) {
                draftFinalizeAction = String(parsed.action)
            }
        }
        await route.continue()
    })

    await page.goto('/auth/cadastro')

    await page.getByRole('button', { name: /quero cadastrar como cliente/i }).click()
    await page.getByRole('button', { name: /^continuar$/i }).click()

    await page.getByLabel('Nome completo *').fill('Cliente E2E')
    await page.getByLabel('E-mail *').fill('cliente-e2e@example.com')
    await page.getByLabel('Senha *').fill('123456')
    await page.getByLabel('Telefone *').fill('62999999999')
    await page.getByRole('button', { name: /^continuar$/i }).click()

    await page.getByLabel('CEP (opcional)').fill('74000000')
    await expect(page.getByLabel('Rua')).toHaveValue('Rua Teste')
    await expect(page.getByLabel('Bairro')).toHaveValue('Centro')
    await expect(page.getByLabel('Cidade')).toHaveValue('Goiânia')
    await expect(page.getByLabel('Estado *')).toHaveValue('GO')
    await page.getByLabel('Número *').fill('100')

    await expect.poll(async () => viacepCalls).toBe(1)

    await page.getByRole('button', { name: /ir para a página de verificação/i }).click()

    await expect(page).toHaveURL(/\/cadastro\/verificar-metodo/)
    await page.getByRole('button', { name: /E-mail/i }).first().click()

    await expect(page).toHaveURL(/\/verificacao\?flow=signup/)
    await page.locator('input[inputmode="numeric"]').first().waitFor()
    await fillSixDigitCode(page)

    await page.getByRole('button', { name: /não, continuar sem verificar/i }).click()
    await expect(page).toHaveURL(/\/meus-imoveis/)
    await expect(page.getByRole('heading', { name: /meus imóveis/i })).toBeVisible()

    expect(draftFinalizeCalls).toBe(1)
    expect(draftFinalizeAction).toBe('client_finalize')
    expect(authRegisterCalls).toBe(0)
})

test('cadastro cliente com e-mail já existente é bloqueado na etapa de dados', async ({ page }) => {
    await page.route('**/auth/check-email**', async (route) => {
        const body = new URL(route.request().url()).searchParams
        const email = body.get('email')
        if (email === 'duplicado@example.com') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ exists: true, hasFirebaseUid: true }),
            })
            return
        }
        await route.continue()
    })

    await page.goto('/auth/cadastro')

    await page.getByRole('button', { name: /quero cadastrar como cliente/i }).click()
    await page.getByRole('button', { name: /^continuar$/i }).click()

    await page.getByLabel('Nome completo *').fill('Cliente Duplicado')
    await page.getByLabel('E-mail *').fill('duplicado@example.com')
    await page.getByLabel('Senha *').fill('123456')
    await page.getByLabel('Telefone *').fill('62999999999')
    await page.getByRole('button', { name: /^continuar$/i }).click()

    await expect(page.getByText('Já existe uma conta com este e-mail.')).toBeVisible()
    await expect(page).toHaveURL('/auth/cadastro')
})

test('cadastro cliente conclui endereço sem informar CEP', async ({ page }) => {
    await page.goto('/auth/cadastro')

    await page.getByRole('button', { name: /quero cadastrar como cliente/i }).click()
    await page.getByRole('button', { name: /^continuar$/i }).click()

    await page.getByLabel('Nome completo *').fill('Cliente Sem CEP')
    await page.getByLabel('E-mail *').fill('cliente-sem-cep@example.com')
    await page.getByLabel('Senha *').fill('123456')
    await page.getByLabel('Telefone *').fill('62999999999')
    await page.getByRole('button', { name: /^continuar$/i }).click()

    await page.getByLabel('Estado *').selectOption('GO')
    await page.getByLabel('Cidade').fill('Goiânia')
    await page.getByLabel('Bairro').fill('Centro')
    await page.getByLabel('Rua').fill('Rua Teste')
    await page.getByLabel('Número *').fill('100')

    await page.getByRole('button', { name: /ir para a página de verificação/i }).click()
    await expect(page).toHaveURL(/\/cadastro\/verificar-metodo/)
})

test('retorno de 409 com EMAIL_ALREADY_EXISTS direciona para login', async ({ page }) => {
    await page.route('**/auth/register/draft', async (route) => {
        if (route.request().method() === 'POST') {
            await route.fulfill({
                status: 409,
                contentType: 'application/json',
                body: JSON.stringify({
                    code: 'EMAIL_ALREADY_EXISTS',
                    message: 'e-mail já cadastrado',
                }),
            })
            return
        }
        await route.continue()
    })

    await page.goto('/auth/cadastro')

    await page.getByRole('button', { name: /quero cadastrar como cliente/i }).click()
    await page.getByRole('button', { name: /^continuar$/i }).click()

    await page.getByLabel('Nome completo *').fill('Cliente E2E')
    await page.getByLabel('E-mail *').fill('cliente-conflict@example.com')
    await page.getByLabel('Senha *').fill('123456')
    await page.getByLabel('Telefone *').fill('62999999999')
    await page.getByRole('button', { name: /^continuar$/i }).click()

    await expect(page.getByText('Este e-mail já está cadastrado. Faça login para continuar.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Entrar' }).nth(1)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Descartar cadastro' })).toBeVisible()
})

test('correção no draft existente usa PATCH e não cria novo POST', async ({ page }) => {
    let postCalls = 0
    let patchCalls = 0

    await page.route('**/*', async (route) => {
        const url = route.request().url()
        const method = route.request().method()
        if (!url.includes('/register/draft')) {
            await route.continue()
            return
        }

        if (method === 'POST' && url.endsWith('/auth/register/draft')) {
            postCalls += 1
        }
        if (method === 'PATCH') {
            patchCalls += 1
        }

        if (method === 'POST' && url.endsWith('/auth/register/draft')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ draftId: 'ignored', draftToken: 'ignored', draft: { currentStep: 'CONTACT' } }),
            })
            return
        }
        if (method === 'PATCH') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ draft: { currentStep: 'VERIFICATION' } }),
            })
            return
        }
        await route.continue()
    })

    await page.addInitScript(() => {
        const draft = {
            source: 'email',
            userType: 'client',
            draftId: 'existing-patch-draft',
            draftToken: 'existing-patch-token',
            step: 'address',
            emailVerified: false,
            phoneVerified: false,
            data: {
                name: 'Cliente Existente',
                email: 'cliente-existente@example.com',
                password: '123456',
                phone: '62999990000',
                street: 'Rua Antiga',
                number: '10',
                semNumero: false,
                complement: '',
                bairro: 'Centro',
                city: 'Goiânia',
                state: 'GO',
                cep: '74000000',
                creci: '',
                googleIdToken: '',
                googleUid: '',
            },
            updatedAt: new Date().toISOString(),
        }
        window.localStorage.setItem('ea_signup_draft_v1', JSON.stringify(draft))
        window.localStorage.setItem('ea_signup_draft_ts_v1', String(Date.now()))
    })

    await page.route('**/viacep.com.br/ws/74000000/json/**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                cep: '74000-000',
                logradouro: 'Rua Teste',
                bairro: 'Centro',
                localidade: 'Goiânia',
                uf: 'GO',
            }),
        })
    })

    await page.goto('/auth/cadastro')
    await page.getByRole('textbox', { name: 'Rua' }).fill('Rua Atualizada')
    await page.getByLabel('Número *').fill('10')
    await page.getByLabel('Bairro').fill('Centro')
    await page.getByLabel('Cidade').fill('Goiânia')
    await page.getByLabel('Estado *').selectOption('GO')

    await page.getByRole('button', { name: /ir para a página de verificação/i }).click()

    await expect.poll(() => patchCalls).toBe(1)
    await expect.poll(() => postCalls).toBe(0)
})
