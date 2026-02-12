<img src="logo_mdh.png" alt="MDH" width="350">

# MDH (Markdown Hypertext)

MDH is a way to build websites that AI agents can actually use. Instead of scraping HTML, building MCP servers, or needing custom protocols, the agent just reads Markdown pages and follows links. Each page has YAML frontmatter that describes what the page is, how it connects to other pages, and what API actions are available. The agent reads pages with plain HTTP GET requests, the same way it would fetch any URL. No tools to install, no schemas to register, no server to run alongside your app.

## What a page looks like

```markdown
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
  query:
    required: [q]
    optional: [category, max_price, limit, cursor]
---

# Search Products

Find products by keyword. Filter by category and price range.
See [categories](/categories) for the full list.

`GET /api/products/search?q=shoes&category=footwear&max_price=100`
```

The frontmatter at the top is structured data: the page ID, links to other pages, and an action definition with the endpoint and its parameters. The body below is regular Markdown that explains what the page is about and how to use it.

An agent reads this page and knows: this is the product search page, it links to `/products` and `/categories`, and there's a search API at `/api/products/search` that takes a required `q` parameter.

## How agents use it

An agent starts at the root page (`/`), which lists the main sections and key actions. From there it follows links to find what it needs.

```
GET /                        -> root page, lists sections and main actions
GET /products                -> products section, links to search
GET /products-search         -> search page with action definition
GET /api/products/search?q=shoes  -> actual API call, returns JSON
```

Every page is just a GET request. The agent reads Markdown, follows links, and calls APIs. No special protocols or client libraries needed.

## Dynamic tool discovery

With most agent tool systems (MCP, function calling, custom toolkits), you define the tools upfront before the agent starts. The agent gets a fixed set of tools and can only call what's been registered.

MDH flips this around. The agent discovers tools as it navigates. When it reads a page, the frontmatter tells it exactly what actions are available on that page: the endpoint, the method, the parameters, what's required and what's optional. The agent can turn each action into a callable tool on the fly, scoped to just that page.

```yaml
action:
  id: products.search
  method: GET
  url: /api/products/search
  query:
    required: [q]
    optional: [category, max_price, limit, cursor]
```

An agent framework could parse this frontmatter and register `products.search` as a tool with typed parameters, then unregister it when the agent moves to a different page. The agent only ever sees the actions that are relevant to where it currently is in the site. No upfront tool catalog, no stale definitions, no tools for pages the agent hasn't visited.

This also means the site controls what's available. Add a new action to a page's frontmatter and every agent that visits that page can use it immediately. No SDK update, no tool schema push, no client-side changes.

For agent frameworks that support it, requesting the page as JSON (`Accept: application/json`) gives the frontmatter as structured data, which is easier to parse than YAML when you're building tool definitions programmatically.

## Serving humans and agents from the same URL

A traditional website serves HTML for browsers. An API serves JSON for programs. MDH sites can do both from the same URL using content negotiation, so you don't need separate endpoints for humans and agents.

When an agent requests a page, it gets Markdown with YAML frontmatter. The agent reads the body to understand what the page is about and parses the frontmatter to discover actions and links. When a browser requests the same URL, it gets rendered HTML. Same content, same URL, different format.

This works through the `Accept` header:

- **No header or `text/markdown`** returns raw Markdown. This is what most agents get by default when they use `webfetch` or similar tools.
- **`application/json`** returns the frontmatter as structured JSON. Useful when the agent needs to programmatically extract action definitions, parse parameters, or follow links without reading YAML. Also useful for API responses where the agent needs to pull out specific values like an `offer_id` or compare prices.
- **`text/html`** returns a rendered page for browsers. You can make this as simple or as polished as you want. A basic implementation just renders the Markdown. A production site might serve a full UI with navigation, styling, and interactive elements.

The same pattern works for API endpoints. A flight search can return readable Markdown by default (the agent sees a list of flights it can present to the user) or structured JSON when the agent needs to parse the data (to extract an offer ID for booking, paginate through results, or do price comparisons).

You can also go further than content negotiation. Some approaches:

- Serve a rich single-page app for browsers at the same URL, with the MDH Markdown available at a subpath like `/md/products-search` or via the Accept header
- Use User-Agent detection to serve different HTML layouts for humans vs agents (though Accept headers are more reliable)
- Keep the MDH pages at their own paths entirely separate from the human-facing site, linked from a shared root

The key idea is that your site can be fully usable by both humans and agents without maintaining two separate systems. The structured frontmatter and Markdown body serve double duty: the frontmatter drives agent behavior, and the body is readable by both.

## Actions

Actions are API endpoints declared in a page's frontmatter. They spell out the HTTP method, URL, and parameters so the agent knows exactly what to call.

### GET actions

Most agents today only have `webfetch` or similar tools that can do GET requests. So the simplest approach is to put all parameters in the query string:

```yaml
action:
  id: orders.create
  method: GET
  url: /api/orders/create
  query:
    required: [product_id, name]
```

```
GET /api/orders/create?product_id=prod_123&name=Alice+Lindqvist
```

For multiple values, repeat the parameter: `&name=Alice+Lindqvist&name=Bob+Smith`

### POST actions

POST is more correct for things that change state (GET is supposed to be safe and idempotent). It also handles complex nested data better. But not all agents can send POST requests with custom bodies yet.

```yaml
action:
  id: orders.create
  method: POST
  url: /api/orders
  content_type: application/json
  body_schema:
    required: [product_id, customer]
    properties:
      product_id:
        type: string
      customer:
        type: object
        required: [first_name, last_name]
```

You can support both GET and POST on the same endpoint if you want. Start with GET-only for compatibility, add POST when more agents can handle it.

## Best practices

**Write for agents.** The page body is what the agent reads to figure out what to do. Be specific. Show the exact endpoint, exact parameters, and a real example.

**Put key actions on the root page.** Don't make agents click through three levels to find a search endpoint.

**One topic per page.** Don't mix product search and order creation on the same page.

**Link when you mention something.** That's how agents get around.

**Ask agents to confirm state changes.** For anything that creates, updates, or deletes something, tell the agent to show the user a summary and wait for confirmation before proceeding.

## Authentication

Actions can declare what kind of auth they need:

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

The `auth` field tells the agent what credentials are required. The `token_help` field points to where credentials can be obtained.

How agents actually manage credentials is still an open problem. Most agents today make stateless requests with no built-in way to store tokens or manage sessions between calls. But this is changing. Some directions this could go:

**Token-based auth** (bearer tokens, API keys) is the most compatible approach right now. The token is stateless, works across requests, and doesn't require the agent to manage any session state. The open question is how the agent gets the token in the first place and where it stores it during a session.

**Session-based auth** (cookies) requires the agent to log in, receive a session cookie, and include it in subsequent requests. This needs agents or agent frameworks that can persist state across requests. It also requires CSRF protection for state-changing actions. As agent frameworks mature, session handling will likely become a standard capability.

**Scoped credentials** are worth thinking about regardless of the mechanism. A token that only allows read access is safer to hand to an agent than one with full write permissions. Sites that issue tokens could offer different scopes so the agent only gets access to what it actually needs.

For public data, `auth.type: none` means no credentials needed.

## Security

Most AI agents today can only do read-only `webfetch` calls. They can't freely send POST requests or run arbitrary HTTP calls. This is intentional.

Unrestricted HTTP access lets a malicious page trick an agent into sending data to the wrong server, leaking private info from the conversation, or triggering actions the user didn't ask for (prompt injection, data exfiltration, SSRF). Agent frameworks restrict HTTP access to prevent this.

MDH works within these constraints. All navigation is read-only GET. Actions are declared in structured frontmatter so the agent doesn't have to guess. Pages can include confirmation guidance for state-changing actions. And since GET-only actions are a supported approach, even the most restricted agents can use a site fully.

As agent security improves and more agents get safe POST support, MDH sites can adopt POST for state-changing actions without changing how navigation works. The spec supports both.

## Example

The [example/](example/) directory has a working MDH site: a travel search app called Wayfare with flights, hotels, and bookings across 15 cities. It shows how to structure pages, define actions, handle pagination, and do content negotiation. All endpoints use GET.

Try it live at [markdown-hypertext-example.vercel.app](https://markdown-hypertext-example.vercel.app).

## Project

- [Specification](SPEC.md) - the MDH 1.0 spec
- [Implementation guide](GUIDE.md) - how to build an MDH site
- [Example site](example/) - travel search site with full MDH implementation
