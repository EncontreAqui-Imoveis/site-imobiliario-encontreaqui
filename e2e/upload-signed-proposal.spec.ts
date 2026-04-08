import { test, expect } from '@playwright/test'

test('upload de proposta assinada redireciona para /propostas?signed=1', async ({ context, page }) => {
    await context.addCookies([
        {
            name: 'ea_auth_token',
            value: 'site-client-token',
            domain: '127.0.0.1',
            path: '/',
        },
    ])

    await page.goto('/propostas/neg-1/upload-assinada')

    await page.setInputFiles('input[type="file"]', {
        name: 'proposta-assinada.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4\n% mocked proposal pdf\n'),
    })

    await page.getByRole('button', { name: /enviar proposta assinada/i }).click()

    await expect(page).toHaveURL(/\/propostas\?signed=1/)
    await expect(page.getByText(/proposta assinada enviada com sucesso/i)).toBeVisible()
})
