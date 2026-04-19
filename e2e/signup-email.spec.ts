import { test, expect } from '@playwright/test'

async function fillSixDigitCode(page: import('@playwright/test').Page) {
    const inputs = page.locator('input[inputmode="numeric"]')
    for (let index = 0; index < 6; index += 1) {
        await inputs.nth(index).fill(String(index + 1))
    }
}

test('cadastro cliente por e-mail conclui e redireciona para meus imóveis', async ({ page }) => {
    await page.goto('/auth/cadastro')

    await page.getByRole('button', { name: /quero cadastrar como cliente/i }).click()
    await page.getByRole('button', { name: /^continuar$/i }).click()

    await page.getByLabel('Nome completo *').fill('Cliente E2E')
    await page.getByLabel('E-mail *').fill('cliente-e2e@example.com')
    await page.getByLabel('Senha *').fill('123456')
    await page.getByLabel('Telefone *').fill('62999999999')
    await page.getByRole('button', { name: /^continuar$/i }).click()

    await page.getByLabel('CEP *').fill('74000000')
    await page.getByLabel('Estado *').selectOption('GO')
    await page.getByLabel('Cidade *').fill('Goiânia')
    await page.getByLabel('Bairro *').fill('Centro')
    await page.getByLabel('Rua *').fill('Rua Teste')
    await page.getByLabel('Número *').fill('100')
    await page.getByRole('button', { name: /ir para a página de verificação/i }).click()

    await expect(page).toHaveURL(/\/cadastro\/verificar-metodo/)
    await page.getByRole('button', { name: /E-mail/i }).first().click()

    await expect(page).toHaveURL(/\/verificacao\?flow=signup/)
    await page.locator('input[inputmode="numeric"]').first().waitFor()
    await fillSixDigitCode(page)

    await expect(page).toHaveURL(/\/meus-imoveis/)
    await expect(page.getByRole('heading', { name: /meus imóveis/i })).toBeVisible()
})
