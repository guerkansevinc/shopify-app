# Shopify OAuth Cloudflare Worker

This project is a Cloudflare Worker that handles the Shopify OAuth2 flow and provides a simple API to interact with the Shopify API. It's built with TypeScript and uses Cloudflare Wrangler for development and deployment.

## Features

- **Shopify OAuth2 Flow**: Implements the server-side logic for the Shopify OAuth2 flow.
- **Access Token Storage**: Securely stores and retrieves Shopify access tokens using Cloudflare KV.
- **Shopify API Proxy**: Includes an example of how to proxy requests to the Shopify API.
- **GraphQL Mutation**: Demonstrates how to send a GraphQL mutation to Shopify after authentication.
- **TypeScript**: Written in TypeScript for type safety and better developer experience.
- **Testing**: Includes a suite of tests written with Vitest.

## Technologies Used

- [Cloudflare Workers](https://workers.cloudflare.com/): Serverless execution environment.
- [Cloudflare Wrangler](https://developers.cloudflare.com/workers/wrangler/): CLI tool for managing Cloudflare Workers.
- [TypeScript](https://www.typescriptlang.org/): Superset of JavaScript that adds static types.
- [Shopify API](https://shopify.dev/api): The API for interacting with Shopify stores.
- [Vitest](https://vitest.dev/): A fast and modern testing framework.
- [npm](https://www.npmjs.com/): Package manager for JavaScript.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have the following software installed:

- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Cloudflare Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

You can install Wrangler with npm:
```bash
npm install -g wrangler
```

You will also need a Cloudflare account and a Shopify Partner account to create a Shopify app.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd shopify-oauth-worker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Configuration

You need to configure your Cloudflare and Shopify credentials in the `wrangler.toml` file.

1. **Cloudflare Account ID:**
   - Log in to your Cloudflare dashboard.
   - Your Account ID is on the right-hand side of the homepage.
   - Replace the `account_id` value in `wrangler.toml` with your Cloudflare Account ID.

2. **Cloudflare KV Namespace:**
   - Create a KV namespace by running the following command:
     ```bash
     wrangler kv:namespace create "KV"
     ```
   - This command will output an `id`. Replace `your_kv_namespace_id` in `wrangler.toml` with this `id`.

3. **Shopify App Credentials:**
   - Create a new app in your Shopify Partner dashboard.
   - In your app's settings, you will find your **API key** and **API secret key**.
   - In the `[vars]` section of `wrangler.toml`, set the following values:
     - `SHOPIFY_API_KEY`: Your Shopify app's API key.
     - `SHOPIFY_API_SECRET`: Your Shopify app's API secret key.
   - Set the `SCOPES` you need for your app (e.g., `read_products,write_products`).
   - Set the `FORWARDING_ADDRESS` to the URL of your app's frontend.

4. **Allowed callback URL(s)**
   - In your Shopify app settings, you need to add the callback URL of your worker to the `Allowed callback URL(s)`.
   - The URL will be in the format `https://<your_worker_name>.<your_cloudflare_subdomain>.workers.dev/auth/callback`.

Here is an example of a configured `wrangler.toml`:
```toml
name = "shopify-oauth-worker"
main = "src/index.ts"
compatibility_date = "2023-07-24"
account_id = "your_cloudflare_account_id"

kv_namespaces = [
  { binding = "KV", id = "your_kv_namespace_id" }
]

[vars]
SHOPIFY_API_KEY = "your_shopify_api_key"
SHOPIFY_API_SECRET = "your_shopify_api_secret"
SCOPES = "read_products,write_products"
FORWARDING_ADDRESS = "https://your_app_url"
```

## Usage

### Development

To run the worker locally for development, use the following command:
```bash
npm run dev
```
This will start a local server, and you can test the worker's functionality at `http://localhost:8787`.

### Deployment

To deploy the worker to your Cloudflare account, run the following command:
```bash
npm run deploy
```

## API Reference

The worker exposes the following endpoints:

### `GET /auth`

Initiates the Shopify OAuth flow. It redirects the user to the Shopify authorization page for your app.

**Query Parameters:**

- `shop` (required): The name of the user's Shopify store (e.g., `your-store.myshopify.com`).

**Example:**
```
GET /auth?shop=your-store.myshopify.com
```

### `GET /auth/callback`

This endpoint is the callback URL that Shopify redirects to after the user has authorized the app. It handles exchanging the authorization code for an access token and stores the token in the KV namespace.

**Query Parameters:**

- `code` (required): The authorization code provided by Shopify.
- `shop` (required): The name of the user's Shopify store.

This endpoint is intended to be used by Shopify as a redirect URI and not to be called directly by the user.

### `GET /api/products`

Fetches a list of products from the Shopify store. This is an example of an authenticated API request.

**Query Parameters:**

- `shop` (required): The name of the user's Shopify store.

**Example:**
```
GET /api/products?shop=your-store.myshopify.com
```

**Responses:**

- `200 OK`: Returns a JSON object with the list of products.
- `400 Bad Request`: If the `shop` parameter is missing.
- `401 Unauthorized`: If there is no access token for the given `shop`.
- `500 Internal Server Error`: If there is an error fetching the products.

## Testing

To run the tests, use the following command:
```bash
npm test
```
This will run the test suite using Vitest and provide a coverage report.
