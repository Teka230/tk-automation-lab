import { expect, type APIRequestContext } from '@playwright/test';

export const API_URL = (process.env.SUT_API_URL ?? 'https://api.practicesoftwaretesting.com').replace(/\/$/, '');

export interface Product {
  id: string;
  name: string;
  price: number;
  in_stock?: boolean;
  discount_price?: number | null;
}

export interface ProductPage {
  data: Product[];
  total: number;
  current_page?: number;
}

export async function getCatalog(request: APIRequestContext): Promise<ProductPage> {
  const response = await request.get(`${API_URL}/products`, { params: { page: '1' } });
  expect(response.ok(), `GET /products failed: ${response.status()}`).toBeTruthy();
  const body = (await response.json()) as ProductPage;
  expect(Array.isArray(body.data)).toBe(true);
  expect(body.data.length, 'Expected seeded catalog entries').toBeGreaterThan(0);
  return body;
}

export async function getProduct(request: APIRequestContext, id: string): Promise<Product> {
  const response = await request.get(`${API_URL}/products/${id}`);
  expect(response.ok(), `GET /products/${id} failed: ${response.status()}`).toBeTruthy();
  return (await response.json()) as Product;
}
