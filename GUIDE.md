# MDH Implementation Guide

How to build an MDH site. This guide walks through the key decisions and patterns. See the `example/` directory for a complete working site.

## Planning your pages

Before writing anything, sketch out your pages. Each piece of content that an agent should be able to read becomes a page. Think about:

- What are the main sections of your site?
- What actions can an agent perform?
- What reference data does an agent need?
- How do the pages connect?

For a product catalog site, you might have:

```
/ (root)
├── products (section overview)
│   ├── products-search (search action)
│   └── products-detail (how to look up a product)
├── orders (section overview)
│   └── orders-create (how to place an order)
├── categories (reference data)
└── help (getting started guide)
```

The root page links to the top-level sections. Each section links to its action pages. Reference pages cross-link where useful.

## Writing pages

Each page is a Markdown file with YAML frontmatter.

### Frontmatter

Every page needs `id`, `type`, and `title`. Use `links` for typed outgoing edges and `actions` (or `action` for a single one) for callable endpoints:

```yaml
---
id: products-search
type: page
title: Search Products
links:
  - rel: in_section
    target: products
    href: /products
  - rel: related_to
    target: categories
    href: /categories
action:
  id: products.search
  method: GET
  url: /api/products/search
  accept: application/json
  query:
    required: [q]
    optional: [category, max_price, limit, cursor]
---
```

The `id` is a lowercase, hyphenated name unique within the site. Each link has a `rel` (relationship type), `target` (destination page ID), and `href` (URL path to that page). Actions are HTTP operation contracts with method, URL, and parameter specs.

### Body content

Write for an agent. Be specific. Include example requests and explain what the parameters do. Use standard Markdown links to connect pages:

```markdown
See [categories](/categories) for the full list.
```

The link href is the page's URL path. Agents follow these with plain HTTP GET requests.

Don't repeat information across pages. If category names are listed on the categories page, link to it rather than duplicating the list.

## Discovery

Agents discover pages by reading the root page (`/`) and following links. Each page's frontmatter declares its relationships to other pages via `links[]`, and any callable actions via `actions[]` or `action`.

Request any page with `Accept: application/json` to get the frontmatter as structured JSON. This is useful for agents that want typed access to actions and links without parsing YAML.

## Serving humans and agents

An MDH site can serve both humans and agents from the same URLs. The simplest way is content negotiation based on the `Accept` header.

A basic route handler:

```js
// Given a request for /:page
const raw = readFile(`content/md/${page}.md`);
const accept = request.headers.get("accept") || "";

if (accept.includes("application/json")) {
  return jsonResponse(parseFrontmatter(raw));
}

if (accept.includes("text/html")) {
  return htmlResponse(renderToHtml(raw));
}

return markdownResponse(raw);
```

What each format is for:

- **Markdown** (default) is what agents read. The body explains what the page is about in plain text. The frontmatter gives the agent structured data about actions and links. Most agents get this by default when they use `webfetch`.
- **JSON** is for when the agent needs to programmatically work with the page data. Extracting action definitions, reading link targets, pulling parameter specs. Also useful for API responses where the agent needs to parse values out of the result.
- **HTML** is for humans in browsers. This can be as simple as rendering the Markdown, or as rich as a full UI with navigation and styling.

For API endpoints (search results, bookings, etc.), the same pattern works. Return readable Markdown by default so any agent can understand the response. Return JSON when the agent sends `Accept: application/json` and needs to parse specific fields.

### Other approaches

Content negotiation isn't the only way to serve both audiences. Depending on your setup, you might:

- Serve a full web app for browsers at your main URLs, and make MDH pages available at a subpath like `/md/products-search` or via Accept headers
- Run the human site and agent site as separate deployments sharing the same data
- Start with MDH pages only and add a human-facing layer later

The MDH pages are the source of truth for what the site does. The human UI can be built on top of the same data without duplicating the content or action definitions.

## Handling pagination

If an action returns a list, use cursor-based pagination. Declare the pagination contract in the action's frontmatter. The response should include a cursor for the next page:

```json
{
  "results": [ ... ],
  "total": 15,
  "next_cursor": "item_42"
}
```

The cursor is an opaque string. The agent passes it back as a query parameter to get the next page. When `next_cursor` is `null`, there are no more results.

Document the `cursor` and `limit` parameters in the action's page so the agent knows how to paginate.

## Linking between pages

Use standard Markdown links with the target page's URL path as the href:

```markdown
See [search products](/products-search) for the search action.
Check [categories](/categories) for valid values.
```

These are plain HTTP paths. Any agent with a GET request can follow them. The link text is whatever reads naturally in the prose.

In frontmatter, links also include `rel` and `target` for typed relationships:

```yaml
links:
  - rel: related_to
    target: categories
    href: /categories
```

## Page types

Types are server-defined. Use what makes sense for your content. Some common patterns:

- **section** for grouping pages (like "Products")
- **page** for pages that document something specific (like the search action)
- **reference** for static data (like category lists)
- **guide** for instructional content

Types help agents decide which pages to prioritize. An agent looking to do something will gravitate toward pages with actions.

## Authentication

If your site has private data or user-specific actions, declare the auth requirements on each action so the agent knows what credentials it needs.

### Declaring auth on actions

Add an `auth` field to any action that requires credentials:

```yaml
action:
  id: orders.create
  method: GET
  url: /api/orders/create
  auth:
    type: bearer
    token_help: "Create a token at /settings/tokens"
  query:
    required: [product_id, name]
```

The `type` tells the agent what kind of credential to send. The `token_help` field points to where the credential can be obtained. This could be a page on your site, a developer portal, or just a short description.

MDH defines several auth types:

- `none` for public endpoints that don't need credentials
- `bearer` for token-based auth sent as `Authorization: Bearer <token>`
- `api_key` for keys sent via a header or query parameter
- `cookie` for session-based auth
- `oauth2` for OAuth2 token flows

For public sites, use `none` on everything. The example site does this since it's a demo with no real user data.

### Where this is headed

How agents actually obtain and manage credentials is still evolving. Most agents today make stateless HTTP requests with no built-in way to persist tokens or cookies between calls. This limits what auth patterns work in practice, but it's changing fast.

**Tokens** (bearer, API key) are the most agent-friendly approach right now. They're stateless, the agent can include them in any request, and there's no session to manage. The main question is how the token gets to the agent in the first place. Some possibilities: the agent framework has a credential store, the agent reads it from its environment, or the agent follows the `token_help` link and goes through a self-service flow. None of this is standardized yet, but tokens are the path of least resistance.

**Sessions** (cookies) need more from the agent. The agent would call a login endpoint, store the session cookie, and attach it to subsequent requests. This requires the agent or its framework to handle state across requests. It also means CSRF protection for any state-changing actions (see the spec, §10.4). As agent frameworks add session management, this becomes more viable.

**Scoped credentials** are worth supporting regardless of the mechanism. If you issue tokens, offer different permission levels. A read-only token for browsing and search, a write token for creating and modifying things. This lets the agent operate with just the access it needs for a given task.

## Keeping things in sync

The frontmatter and the inline links should agree. When you add a page:

1. Create the Markdown file with frontmatter (`id`, `type`, `title`, `links`, `actions`)
2. Link to it from a parent or related page
3. Add a route to serve it (or use a dynamic route that reads from the content directory)

## Static vs dynamic

Nothing in MDH requires a server. You can generate all the files at build time and host them on any static file host. The example uses Next.js to also serve the API, but the MDH content itself is just Markdown files.

For sites with content that changes, regenerate on deploy. For fully static sites, generate once and host anywhere.
