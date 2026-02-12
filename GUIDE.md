# MDH Implementation Guide

How to build an MDH site. This guide uses the example flight search API throughout — see `example/` for the complete code.

## Planning your graph

Before writing any files, sketch out your nodes. Each page of content that an agent should be able to read becomes a node. Ask:

- What are the main sections of your site?
- What actions can an agent perform?
- What reference data does an agent need?
- How do the pieces connect?

For the flight search example:

```
index (section)
├── flights (section)
│   └── flights-search (page)
├── airports (reference)
└── help (guide)
```

Five nodes. The index links to the three top-level sections. The flights section links to the search action page. Reference pages cross-link where useful.

## Writing nodes

Each node is a Markdown file with YAML frontmatter.

### Frontmatter

Every node needs `id`, `type`, and `title`. Use `links` for typed outgoing edges and `actions` for callable endpoints:

```yaml
---
id: flights-search
type: page
title: Search Flights
links:
  - rel: in_section
    target: flights
  - rel: related_to
    target: airports
actions:
  - id: flights.search
    method: GET
    url: /api/flights/search
    accept: application/json
    query:
      required: [from, to]
      optional: [date, cabin, max_price, limit, cursor]
---
```

The `id` is a lowercase, hyphenated name unique within the site. The `links` array declares typed edges — `rel` is the relationship type, `target` is the destination node ID. Actions are full HTTP operation contracts with method, URL, and parameter specs.

### Body content

Write for an agent. Be specific. Include parameter tables, example requests, and response shapes. Use standard Markdown links to connect nodes:

```markdown
See [airports](/airports) for valid airport codes.
```

The link href is the node's URL path. Agents follow these with plain HTTP GET requests — no custom resolution needed.

Don't repeat information across nodes. If airport codes are listed in the airports node, link to it rather than duplicating the table.

## Discovery

Agents discover pages by reading the root node (`/`) and following links. Each page's YAML frontmatter declares its relationships to other pages via `links[]`, and any callable actions via `actions[]` or `action`.

Request any page with `Accept: application/json` to get the frontmatter as structured JSON — useful for agents that want typed access to actions and links without parsing YAML.

## Serving content

The simplest approach: serve the markdown files and JSON artifacts as static files. An Express server can do this in a few routes.

For markdown nodes, support content negotiation. If the agent sends `Accept: application/json`, return the frontmatter as a structured JSON object and the body as a string. Otherwise return raw markdown.

```js
app.get("/:node", (req, res) => {
  const mdPath = path.join(__dirname, "content", "md", req.params.node + ".md");
  const raw = fs.readFileSync(mdPath, "utf8");

  if (req.get("Accept")?.includes("application/json")) {
    const parsed = parseFrontmatter(raw);
    return res.json(parsed);
  }

  res.type("text/markdown").send(raw);
});
```

The JSON format is convenient for agents that want structured access to frontmatter without parsing YAML.

## Handling pagination

If an action returns a list, use cursor-based pagination. Declare the pagination contract in both the action's frontmatter and `actions.json`. The response should include a cursor for the next page:

```json
{
  "results": [ ... ],
  "total": 15,
  "next_cursor": "off_arn_bcn_3"
}
```

The cursor is an opaque string. The agent passes it back as a query parameter to get the next page. When `next_cursor` is `null`, there are no more results.

Document the `cursor` and `limit` parameters in both the action catalog and the action's markdown node.

## Linking between nodes

Use standard Markdown links with the target node's `md_url` as the href:

```markdown
See [search flights](/flights-search) for the search action.
Check [airports](/airports) for valid codes.
```

These are plain HTTP paths. Any agent with a GET request can follow them. The link text is whatever reads naturally in the prose.

## Node types

Types are server-defined — use what makes sense for your content. The example uses:

- **section** — grouping pages (like "Flights")
- **page** — pages that document something specific (like the search action)
- **reference** — static data (like airport codes)
- **guide** — instructional content

Types help agents decide which nodes to prioritize — an agent looking to do something will gravitate toward pages with actions.

## Keeping things in sync

The artifacts, the frontmatter, and the inline links should all agree. When you add a node:

1. Create the markdown file with frontmatter (`id`, `type`, `title`, `links`, `actions`)
2. Link to it from a parent or related node
3. Add a route to serve it (or use a dynamic `[node]` route)

## Static vs dynamic

Nothing in MDH requires a server. You can generate all the files at build time and host them on any static file host. The example uses Express to also serve the flight search API, but the MDH content itself is just files.

For sites with content that changes, generate the artifacts on deploy. For fully static sites, generate once and host anywhere.
