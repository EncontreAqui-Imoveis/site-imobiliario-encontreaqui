import { test, expect } from '@playwright/test'

test('home, busca e detalhe público carregam com backend mockado', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await expect(page.locator('section[aria-label="Destaque da página inicial"]:visible')).toBeVisible()

    await page.goto('/imoveis?search=Casa')
    await expect(page.getByRole('heading', { name: /imóveis no brasil/i })).toBeVisible()
    await expect(page.getByRole('region', { name: /estado vazio da busca/i })).toBeVisible()

    await page.goto('/imoveis/101')
    await expect(page.getByRole('heading', { name: /imóvel e2e 101/i })).toBeVisible()
    await expect(page.getByRole('complementary', { name: /resumo e ações do imóvel/i })).toBeVisible()
})

test('a home mostra a vitrine da finalidade oposta para compra e locação', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const rentalShelf = page.locator('section').filter({
        has: page.getByRole('heading', { name: 'Imóveis para alugar' }),
    })
    await expect(rentalShelf).toBeVisible()
    await expect(rentalShelf.getByRole('link', { name: /ver todos os imóveis/i }).first()).toHaveAttribute(
        'href',
        /purpose=Aluguel/,
    )

    await page.goto('/?deal=rent', { waitUntil: 'domcontentloaded' })

    const saleShelf = page.locator('section').filter({
        has: page.getByRole('heading', { name: 'Imóveis à venda' }),
    })
    await expect(saleShelf).toBeVisible()
    await expect(saleShelf.getByRole('link', { name: /ver todos os imóveis/i }).first()).toHaveAttribute(
        'href',
        /purpose=Venda/,
    )
})
