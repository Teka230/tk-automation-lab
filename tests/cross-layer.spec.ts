import { test, expect } from '@playwright/test';
import { getCatalog, getProduct } from '../src/sut';

test('UI ↔ API: product identity and base price remain consistent', async ({ page, request }) => {
  const summary = (await getCatalog(request)).data[0];
  const detail = await getProduct(request, summary.id);

  await page.goto('/');
  await page.locator(`a[data-test="product-${detail.id}"]`).click();
  await expect(page.locator('h1[data-test="product-name"]')).toContainText(detail.name);
  const displayedPrice = page.locator('[data-test="unit-price"]');
  await expect(displayedPrice).toHaveText(detail.price.toFixed(2));
});
