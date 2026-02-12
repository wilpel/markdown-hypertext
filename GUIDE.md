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

## Serving content

Each page needs a stable URL that returns its Markdown content. Support content negotiation if you can: if the client sends `Accept: application/json`, return the parsed frontmatter as JSON. Otherwise return the raw Markdown.

A simple dynamic route handler looks like this:

```js
// Given a request for /:page
const raw = readFile(`content/md/${page}.md`);

if (acceptsJson(request)) {
  const parsed = parseFrontmatter(raw);
  return jsonResponse(parsed);
}

return markdownResponse(raw);
```

The JSON format is convenient for agents that want structured access to frontmatter without parsing YAML themselves. You can also return HTML for browser users.

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

If your site has user accounts or private data, you need auth on your actions. MDH supports several approaches, but the practical choice comes down to how agents handle credentials today.

### Bearer tokens

The most straightforward option. Generate a token for the user (a personal access token, a JWT, whatever you use), and the user gives it to the agent. The agent sends it with every request:

```
Authorization: Bearer sk_live_abc123...
```

In your action frontmatter, declare it:

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

The `token_help` field tells the agent (or the user) where to get credentials. This could be a page on your site, a link to a developer portal, or just a short instruction.

How the agent gets the token depends on the setup. Common patterns:

- The user pastes the token into the chat and the agent uses it for subsequent requests
- The token is set in the agent's environment or configuration before the session starts
- The agent framework provides it through a credential store

Bearer tokens are stateless. The agent doesn't need to manage sessions, handle cookies, or call a login endpoint. One token works for the whole session.

### API keys

Same idea as bearer tokens, but sent in a different way. Typically a custom header (`X-API-Key: ...`) or a query parameter (`?api_key=...`). Declare it the same way:

```yaml
auth:
  type: api_key
  token_help: "Get your API key from /developer"
```

For GET-only sites, putting the key in a query parameter is convenient since the agent doesn't need to set custom headers. But keys in URLs can leak into logs and browser history, so headers are better when the agent supports them.

### Cookie-based sessions

This is the trickiest option for agents. The flow looks like: agent calls a login endpoint, gets a session cookie, stores it, and sends it with every request after that.

Most agents today don't do this. They make stateless requests and don't manage cookies between calls. But some agent frameworks do handle session storage, and this approach works fine for those.

If you use cookies for state-changing actions, you need CSRF protection. Include a CSRF token endpoint or document the mechanism on a page the agent can read. See the spec (§10.4) for requirements.

### No auth

For public sites or read-only data, just set `auth.type: none`. Search endpoints, reference data, and public listings don't need credentials. The example site uses `none` on everything since it's a demo with no real user data.

### Scoping tokens

If you issue tokens, consider scoping them. A read-only token for search and browsing, a write token for creating orders. This way the user can give the agent a limited token that only lets it do what they want. If the agent only needs to search, it doesn't need write access.

## Keeping things in sync

The frontmatter and the inline links should agree. When you add a page:

1. Create the Markdown file with frontmatter (`id`, `type`, `title`, `links`, `actions`)
2. Link to it from a parent or related page
3. Add a route to serve it (or use a dynamic route that reads from the content directory)

## Static vs dynamic

Nothing in MDH requires a server. You can generate all the files at build time and host them on any static file host. The example uses Next.js to also serve the API, but the MDH content itself is just Markdown files.

For sites with content that changes, regenerate on deploy. For fully static sites, generate once and host anywhere.
