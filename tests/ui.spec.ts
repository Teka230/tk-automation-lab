import { test, expect } from '@playwright/test';

test.describe('UI: catalog and discovery', () => {
  test('catalog renders product cards and navigates to the selected product', async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('a[data-test^="product-"]').first();
    await expect(firstCard).toBeVisible();
    const name = (await firstCard.locator('[data-test="product-name"]').innerText()).trim();
    await firstCard.click();
    await expect(page.locator('h1[data-test="product-name"]')).toContainText(name);
  });

  test('@regression search displays the searched term and matching results', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-test="search-query"]').fill('hammer');
    await page.locator('button[type="submit"][data-test="search-submit"]').click();
    await expect(page.locator('[data-test="search-term"]')).toHaveText('hammer');
    await expect(page.locator('[data-test="search_completed"]')).toBeVisible();
    const results = page.locator('a[data-test^="product-"] [data-test="product-name"]');
    await expect(results.first()).toBeVisible();
    const names = await results.allTextContents();
    expect(names.every(name => name.toLowerCase().includes('hammer')),
      `Search results must match hammer: ${JSON.stringify(names)}`).toBe(true);
  });

  test('@regression price ascending sort is respected by the visible catalog', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.locator('a[data-test^="product-"]').first()).toBeVisible();
    await page.locator('[data-test="sort"]').selectOption({ label: 'Price (Low - High)' });
    await expect(page.locator('[data-test="sorting_completed"]')).toBeVisible();
    const labels = await page.locator('a[data-test^="product-"] [data-test="product-price"]').allTextContents();
    const prices = labels.map(label => Number(label.replace(/[^\d.]/g, '')));
    await testInfo.attach('price-order-observation', {
      body: Buffer.from(JSON.stringify({
        url: page.url(),
        selectedValue: await page.locator('[data-test="sort"]').inputValue(),
        displayedPrices: prices,
        expectedAscending: [...prices].sort((a, b) => a - b),
      }, null, 2)),
      contentType: 'application/json',
    });
    expect(prices.length).toBeGreaterThan(1);
    expect(prices.every(Number.isFinite)).toBe(true);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});
