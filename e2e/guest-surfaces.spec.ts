import { test, expect } from '@playwright/test'

for (const route of ['/perfil', '/favoritos', '/notificacoes', '/configuracoes']) {
    test(`visitante recebe soft gate amigável em ${route}`, async ({ page }) => {
        await page.goto(route)
        await expect(page).toHaveURL(/\/auth\/login/)
        await expect(page.getByRole('button', { name: /^entrar$/i })).toBeVisible()
        await expect(page.getByRole('link', { name: /cadastre-se/i })).toBeVisible()
    })
}
