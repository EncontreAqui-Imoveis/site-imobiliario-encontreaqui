import { test, expect } from '@playwright/test'

test('home, busca e detalhe público carregam com backend mockado', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('main', { name: /página inicial do catálogo/i })).toBeVisible()

    await page.goto('/imoveis?search=Casa')
    await expect(page.getByRole('heading', { name: /encontre seu imóvel ideal/i })).toBeVisible()
    await expect(page.getByText('Casa E2E')).toBeVisible()

    await page.goto('/imoveis/101')
    await expect(page.getByRole('heading', { name: 'Casa E2E' })).toBeVisible()
    await expect(page.getByRole('complementary', { name: /resumo e ações do imóvel/i })).toBeVisible()
})
