import { test, expect, type Page } from '@playwright/test';

function propertyLinkLocator(page: Page) {
  return page.locator('main a[href^="/imoveis/"]');
}

async function uniquePropertyCount(page: Page): Promise<number> {
  const hrefs = await propertyLinkLocator(page).evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.getAttribute('href') || '')
  );
  return new Set(hrefs.filter(Boolean)).size;
}

test('filtro por cidade mostra contagem e lazy loading carrega 10 em 10', async ({ page }) => {
  await page.goto('/imoveis');

  const sidebar = page.locator('[aria-label="Filtros de busca"]');
  await expect(sidebar).toBeVisible();
  await expect
    .poll(async () => {
      return sidebar.locator('select').first().locator('option').allTextContents();
    })
    .toContain('Goiânia (20)');

  const quickFilter = page.locator('[aria-label="Filtros rápidos na listagem"]');
  await expect(quickFilter).toBeVisible();

  await quickFilter.getByPlaceholder('Digite a cidade').fill('Goiânia');
  await quickFilter.getByRole('button', { name: 'Aplicar' }).click();

  await expect(page).toHaveURL(/city=Goi%C3%A2nia/);

  await expect.poll(() => uniquePropertyCount(page)).toBe(10);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(() => uniquePropertyCount(page)).toBe(20);
});
