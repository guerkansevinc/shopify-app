import { describe, it, expect, vi } from 'vitest';
import worker, { Env } from './index';

const MOCK_ENV: Env = {
  SHOPIFY_API_KEY: 'test_api_key',
  SHOPIFY_API_SECRET: 'test_api_secret',
  SCOPES: 'read_products,write_products',
  FORWARDING_ADDRESS: 'https://test-app.com',
  KV: {
    get: vi.fn(),
    put: vi.fn(),
  } as any,
};

describe('worker', () => {
  it('should redirect to Shopify auth URL on /auth', async () => {
    const request = new Request('https://test.com/auth?shop=test-shop.myshopify.com');
    const response = await worker.fetch(request, MOCK_ENV, {} as any);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(
      'https://test-shop.myshopify.com/admin/oauth/authorize?client_id=test_api_key&scope=read_products,write_products&redirect_uri=https://test.com/auth/callback'
    );
  });

  it('should exchange code for token and redirect on /auth/callback', async () => {
    const request = new Request('https://test.com/auth/callback?code=test_code&shop=test-shop.myshopify.com');
    const mockTokenResponse = { access_token: 'test_access_token' };

    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockTokenResponse)));

    const mockMutationResponse = { data: { cartTransformCreate: { id: 'gid://shopify/CartTransform/123' } } };
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockMutationResponse)));

    const response = await worker.fetch(request, MOCK_ENV, {} as any);

    expect(MOCK_ENV.KV.put).toHaveBeenCalledWith('test-shop.myshopify.com', 'test_access_token');
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('https://test-app.com/');
  });

  it('should return products on /api/products', async () => {
    (MOCK_ENV.KV.get as any).mockResolvedValue('test_access_token');
    const request = new Request('https://test.com/api/products?shop=test-shop.myshopify.com');
    const mockProductsResponse = { products: [{ id: 1, title: 'Test Product' }] };

    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockProductsResponse)));

    const response = await worker.fetch(request, MOCK_ENV, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockProductsResponse);
  });
});
