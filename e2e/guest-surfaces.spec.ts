import { test, expect } from '@playwright/test'

for (const route of ['/perfil', '/favoritos', '/notificacoes', '/configuracoes']) {
    test(`visitante recebe soft gate amigável em ${route}`, async ({ page }) => {
        await page.goto(route)
        await expect(page.getByRole('link', { name: /entrar/i }).first()).toBeVisible()
        await expect(page.getByRole('link', { name: /criar conta/i }).first()).toBeVisible()
    })
}
