import { test, expect } from '@playwright/test';
import { API_URL, getCatalog, getProduct, type ProductPage } from '../src/sut';

test.describe('API: public catalog contract', () => {
  test('catalog returns paginated, usable product data', async ({ request }, testInfo) => {
    const catalog = await getCatalog(request);
    await testInfo.attach('catalog-id-contract', {
      body: Buffer.from(JSON.stringify({ ids: catalog.data.map(p => p.id) })),
      contentType: 'application/json',
    });
    expect(catalog.total).toBeGreaterThanOrEqual(catalog.data.length);
    expect(new Set(catalog.data.map(p => p.id)).size).toBe(catalog.data.length);
    for (const p of catalog.data) {
      expect(typeof p.id).toBe('string');
      expect(p.id.trim().length).toBeGreaterThan(0);
      expect(p.name.trim().length).toBeGreaterThan(0);
      expect(p.price).toBeGreaterThanOrEqual(0);
    }
  });

  test('item detail resolves to the same identity and price as the catalog', async ({ request }) => {
    const catalog = await getCatalog(request);
    const summary = catalog.data[0];
    const detail = await getProduct(request, summary.id);
    expect(detail).toMatchObject({ id: summary.id, name: summary.name, price: summary.price });
  });

  test('GET and HTTP QUERY return equivalent catalog results for the same criteria', async ({ request }, testInfo) => {
    const get = await request.get(`${API_URL}/products`, { params: { page: '1' } });
    const query = await request.fetch(`${API_URL}/products`, {
      method: 'QUERY',
      headers: { 'Content-Type': 'application/json' },
      data: { page: '1' },
    });
    await testInfo.attach('catalog-method-comparison', {
      body: Buffer.from(JSON.stringify({ getStatus: get.status(), queryStatus: query.status() })),
      contentType: 'application/json',
    });
    expect(get.status()).toBe(200);
    expect(query.status()).toBe(200);
    const left = (await get.json()) as ProductPage;
    const right = (await query.json()) as ProductPage;
    expect(right.total).toBe(left.total);
    expect(right.data.map(p => p.id)).toEqual(left.data.map(p => p.id));
  });
});
