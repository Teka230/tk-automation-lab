import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { isolatedSutTargets } from '../src/local-sut-guard.mjs';

const { api } = isolatedSutTargets();
type Item = { product_id: string; quantity: number };
type Cart = { cart_items: Item[] };
type Product = { id: string; name: string; in_stock: boolean | number; is_rental?: boolean };

// Laravel validation failures redirect (302) unless the client asks for JSON.
// Without this header Playwright follows the redirect and surfaces a misleading 404.
const jsonHeaders = { Accept: 'application/json', 'Content-Type': 'application/json' };

// Fixture owns a unique cart per API test and deletes ONLY this cart.
// Cleanup failures are test failures, not warnings.
const test = base.extend<{ ownedCart: { id: string } }>({
  ownedCart: async ({ request }, use) => {
    const created = await request.post(`${api}/carts`, { headers: jsonHeaders, data: {} });
    expect(created.status(), `Create cart: ${await created.text()}`).toBe(201);
    const { id } = (await created.json()) as { id: string };
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    try {
      await use({ id });
    } finally {
      const deleted = await request.delete(`${api}/carts/${encodeURIComponent(id)}`, {
        headers: jsonHeaders,
      });
      expect(deleted.status(), `Cleanup of owned cart ${id}: ${await deleted.text()}`).toBe(204);
    }
  },
});

async function stockedProduct(request: APIRequestContext): Promise<Product> {
  const response = await request.get(`${api}/products`, {
    headers: jsonHeaders,
    params: { page: '1' },
  });
  expect(response.status(), `Catalog: ${await response.text()}`).toBe(200);
  const body = (await response.json()) as { data: Product[] };
  const product = body.data.find(p =>
    Boolean(p.in_stock) && p.is_rental !== true &&
    p.name !== 'Thor Hammer' && typeof p.id === 'string'
  );
  expect(product, 'Seed requires a stocked ordinary product on the first page').toBeDefined();
  return product!;
}

async function readCart(request: APIRequestContext, id: string): Promise<Cart> {
  const response = await request.get(`${api}/carts/${encodeURIComponent(id)}`, {
    headers: jsonHeaders,
  });
  expect(response.status(), `Read cart ${id}: ${await response.text()}`).toBe(200);
  return (await response.json()) as Cart;
}

test.describe('AUTOMATION-2A: isolated cart data', () => {
  test('API adds, updates and removes a product from an owned cart', async ({ request, ownedCart }) => {
    const product = await stockedProduct(request);
    expect((await readCart(request, ownedCart.id)).cart_items).toEqual([]);
    const added = await request.post(`${api}/carts/${ownedCart.id}`, {
      headers: jsonHeaders,
      data: { product_id: product.id, quantity: 2 },
    });
    expect(added.status(), await added.text()).toBe(200);
    const afterAdd = await readCart(request, ownedCart.id);
    expect(afterAdd.cart_items).toEqual(
      expect.arrayContaining([expect.objectContaining({ product_id: product.id, quantity: 2 })]),
    );
    const updated = await request.put(`${api}/carts/${ownedCart.id}/product/quantity`, {
      headers: jsonHeaders,
      data: { product_id: product.id, quantity: 3 },
    });
    expect(updated.status(), await updated.text()).toBe(200);
    const afterUpdate = await readCart(request, ownedCart.id);
    expect(afterUpdate.cart_items.filter(i => i.product_id === product.id)).toEqual([
      expect.objectContaining({ quantity: 3 }),
    ]);
    const removed = await request.delete(`${api}/carts/${ownedCart.id}/product/${product.id}`, {
      headers: jsonHeaders,
    });
    expect(removed.status(), await removed.text()).toBe(204);
    expect((await readCart(request, ownedCart.id)).cart_items).toEqual([]);
  });

  test('API rejects zero quantity and does not modify the owned cart', async ({ request, ownedCart }) => {
    const product = await stockedProduct(request);
    const invalid = await request.post(`${api}/carts/${ownedCart.id}`, {
      headers: jsonHeaders,
      data: { product_id: product.id, quantity: 0 },
    });
    expect(invalid.status(), await invalid.text()).toBe(422);
    expect((await readCart(request, ownedCart.id)).cart_items).toEqual([]);
  });

  test('UI add-to-cart is observable through API and its cart is deleted', async ({ page, request }) => {
    const product = await stockedProduct(request);
    let cartId: string | null = null;
    try {
      await page.goto(`/product/${encodeURIComponent(product.id)}`);
      await expect(page.locator('h1[data-test="product-name"]')).toContainText(product.name);
      await page.locator('[data-test="add-to-cart"]').click();
      await expect.poll(async () => {
        cartId = await page.evaluate(() => sessionStorage.getItem('cart_id'));
        if (!cartId) return 0;
        const response = await request.get(`${api}/carts/${encodeURIComponent(cartId)}`, {
          headers: jsonHeaders,
        });
        if (response.status() !== 200) return 0;
        const cart = (await response.json()) as Cart;
        return cart.cart_items.filter(i => i.product_id === product.id)
          .reduce((sum, i) => sum + i.quantity, 0);
      }, { message: 'UI must create a cart containing one chosen product' }).toBe(1);
    } finally {
      if (cartId) {
        const cleanup = await request.delete(`${api}/carts/${encodeURIComponent(cartId)}`, {
          headers: jsonHeaders,
        });
        expect(cleanup.status(), `Cleanup of UI cart ${cartId}: ${await cleanup.text()}`).toBe(204);
      }
    }
  });
});
