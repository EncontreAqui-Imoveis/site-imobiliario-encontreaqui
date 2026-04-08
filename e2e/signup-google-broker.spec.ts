import { test, expect } from '@playwright/test'

async function fillSixDigitCode(page: import('@playwright/test').Page) {
    const inputs = page.locator('input[inputmode="numeric"]')
    for (let index = 0; index < 6; index += 1) {
        await inputs.nth(index).fill(String(index + 1))
    }
}

test('cadastro corretor em fluxo Google pendente segue para onboarding de documentos', async ({ page }) => {
    await page.addInitScript(() => {
        const draft = {
            source: 'google',
            userType: null,
            step: 'profile',
            emailVerified: true,
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
    await page.getByRole('button', { name: /^continuar$/i }).click()

    await page.getByLabel('Telefone *').fill('62999999998')
    await page.getByLabel('CRECI *').fill('12345-F')
    await page.getByRole('button', { name: /^continuar$/i }).click()

    await page.getByLabel('CEP *').fill('74000000')
    await page.getByLabel('Estado *').selectOption('GO')
    await page.getByLabel('Cidade *').fill('Goiânia')
    await page.getByLabel('Bairro *').fill('Centro')
    await page.getByLabel('Rua *').fill('Rua Broker')
    await page.getByLabel('Número *').fill('200')
    await page.getByRole('button', { name: /ir para verificação do telefone/i }).click()

    await expect(page).toHaveURL(/\/cadastro\/verificar-telefone\?flow=signup/)
    await page.locator('input[inputmode="numeric"]').first().waitFor()
    await fillSixDigitCode(page)

    await expect(page).toHaveURL(/\/onboarding\/broker\?mode=signup/)
    await expect(page.getByRole('heading', { name: /enviar documentos/i })).toBeVisible()
})
