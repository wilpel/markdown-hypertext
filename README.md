# MDH — Markdown Hypertext

MDH is a specification for making websites navigable and executable by AI agents using Markdown, JSON, and HTTP.

## The problem

Agents interacting with the web today have bad options. They can scrape HTML and try to make sense of DOM soup. They can hope a site publishes an OpenAPI spec. They can wait for every site to adopt a protocol like MCP with server-side integration.

None of these work well. HTML scraping is fragile. OpenAPI specs describe APIs but not how to navigate a site or understand its content. MCP requires every site to run a protocol-specific server.

MDH takes a different approach: describe your site as a graph of Markdown documents, publish a few JSON files listing those documents and their relationships, and let agents navigate with plain HTTP GET requests.

## How it works

**Nodes** are Markdown files with YAML frontmatter. Each node has an ID (like `flights-search`), a type, and standard Markdown links to other nodes (`[flights](/flights)`). The body is the content — written for an agent to read and act on. Nodes can declare actions directly in their frontmatter.

Edges between nodes are declared in frontmatter links. Action definitions live in each page's YAML frontmatter — request any page with `Accept: application/json` to get structured metadata.

The flow: read the root node → follow links to sections of interest → find an action → call the API.

## Quick start

Run the example flight search site:

```bash
cd example
npm install
npm start
```

Then try the discovery flow:

```bash
# 1. Read the root node
curl <host>/

# 2. Navigate to the search action
curl <host>/flights-search

# 3. Execute a search
curl "<host>/api/flights/search?from=ARN&to=BCN&date=2026-03-10"

# 4. Look up a specific offer
curl <host>/api/flights/offers/off_arn_bcn_1
```

## Comparison

| | MDH | HTML scraping | OpenAPI | MCP |
|---|---------|--------------|---------|-----|
| Content format | Markdown | HTML | JSON Schema | Protocol-specific |
| Site structure | Frontmatter links | Implicit in links | Not modeled | Not modeled |
| Navigation | Markdown links + frontmatter links | DOM parsing | Not supported | Not supported |
| Actions | Declared in JSON | Reverse-engineered | Declared in YAML/JSON | Tool definitions |
| Transport | HTTP GET | HTTP | HTTP | Custom protocol |
| Server requirements | Static files | None | None | MCP server |
| Agent complexity | Read JSON + Markdown | Parse HTML + heuristics | Parse OpenAPI schema | MCP client |

## Project

- [Specification](SPEC.md) — the full MDH 1.0 spec
- [Implementation guide](GUIDE.md) — how to build an MDH site
- [Example site](example/) — working flight search API with MDH
