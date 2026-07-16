import { test, expect, type Page } from '@playwright/test';

function propertyLinkLocator(page: Page) {
  return page.locator('main[aria-label="Resultados de imóveis"] a[href^="/imoveis/"]');
}

async function uniquePropertyCount(page: Page): Promise<number> {
  const hrefs = await propertyLinkLocator(page).evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.getAttribute('href') || '')
  );
  return new Set(hrefs.filter(Boolean)).size;
}

test('filtro por cidade mostra contagem e lazy loading carrega 12 em 12', async ({ page }) => {
  await page.goto('/imoveis');

  const cityFilter = page.getByRole('combobox', { name: 'Cidade' });
  await expect(cityFilter).toBeVisible();
  await cityFilter.fill('Goiânia');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page).toHaveURL(/city=Goi%C3%A2nia/);

  await expect.poll(() => uniquePropertyCount(page)).toBe(12);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(() => uniquePropertyCount(page)).toBe(20);
});
