export interface Env {
	SHOPIFY_API_KEY: string;
	SHOPIFY_API_SECRET: string;
	SCOPES: string;
	FORWARDING_ADDRESS: string;
	KV: KVNamespace;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		try {
			if (url.pathname === '/auth') {
				const shop = url.searchParams.get('shop');
				if (!shop) {
					return new Response('Missing shop parameter', { status: 400 });
				}

				const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${env.SHOPIFY_API_KEY}&scope=${env.SCOPES}&redirect_uri=${url.origin}/auth/callback`;
				return Response.redirect(authUrl);
			}

			if (url.pathname === '/auth/callback') {
				const code = url.searchParams.get('code');
				const shop = url.searchParams.get('shop');

				if (!code || !shop) {
					return new Response('Missing code or shop parameter', { status: 400 });
				}

				const tokenUrl = `https://${shop}/admin/oauth/access_token`;
				const response = await fetch(tokenUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						client_id: env.SHOPIFY_API_KEY,
						client_secret: env.SHOPIFY_API_SECRET,
						code,
					}),
				});

				if (!response.ok) {
					console.error('Failed to exchange authorization code for access token:', await response.text());
					return new Response('Failed to exchange authorization code for access token', { status: 500 });
				}

				const data: any = await response.json();
				const accessToken = data.access_token;

				await env.KV.put(shop, accessToken);

				return Response.redirect(env.FORWARDING_ADDRESS);
			}

			if (url.pathname === '/api/products') {
				const shop = url.searchParams.get('shop');
				if (!shop) {
					return new Response('Missing shop parameter', { status: 400 });
				}

				const accessToken = await env.KV.get(shop);
				if (!accessToken) {
					return new Response('Not authenticated', { status: 401 });
				}

				const productsUrl = `https://${shop}/admin/api/2023-07/products.json`;
				const response = await fetch(productsUrl, {
					headers: {
						'X-Shopify-Access-Token': accessToken,
					},
				});

				if (!response.ok) {
					console.error('Failed to fetch products:', await response.text());
					return new Response('Failed to fetch products', { status: 500 });
				}

				const data: any = await response.json();
				return new Response(JSON.stringify(data), {
					headers: {
						'Content-Type': 'application/json',
					},
				});
			}
		} catch (error) {
			console.error('Worker error:', error);
			return new Response('Internal server error', { status: 500 });
		}

		return new Response('Not found', { status: 404 });
	},
};
