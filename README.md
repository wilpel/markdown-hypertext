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

## Content negotiation

Each page can return different formats based on the `Accept` header. With no header (or `text/markdown`) you get the raw Markdown. With `application/json` you get the parsed frontmatter as JSON, which is useful if the agent wants structured access to the actions and links without parsing YAML. With `text/html` you get a simple rendered version.

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
