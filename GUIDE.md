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
doc:index (section)
├── doc:flights (section)
│   └── doc:flights-search (page)
├── doc:airports (reference)
└── doc:help (guide)
```

Five nodes. The index links to the three top-level sections. The flights section links to the search action page. Reference pages cross-link where useful.

## Writing nodes

Each node is a Markdown file with YAML frontmatter.

### Frontmatter

Every node needs `id`, `type`, and `title`. Use `links` for typed outgoing edges and `actions` for callable endpoints:

```yaml
---
id: "doc:flights-search"
type: page
title: Search Flights
links:
  - rel: in_section
    target: "doc:flights"
  - rel: related_to
    target: "doc:airports"
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

The `id` uses the `doc:` prefix followed by a lowercase, hyphenated name. The `links` array declares typed edges — `rel` is the relationship type, `target` is the destination node ID. Actions are full HTTP operation contracts with method, URL, and parameter specs.

### Body content

Write for an agent. Be specific. Include parameter tables, example requests, and response shapes. Wikilinks connect nodes:

```markdown
See [[doc:airports]] for valid airport codes.
```

The wikilink target must be a valid node ID. Agents resolve `[[doc:airports]]` to the node's `md_url` from `nodes.json`.

Don't repeat information across nodes. If airport codes are listed in the airports node, link to it rather than duplicating the table.

## Setting up artifacts

You need two JSON files. Put them wherever you want — `/mdh/` is the conventional path.

### nodes.json

List every node:

```json
{
  "spec": "mdh/1.0",
  "nodes": [
    {
      "id": "doc:flights-search",
      "type": "page",
      "title": "Search Flights",
      "md_url": "/md/flights-search"
    }
  ]
}
```

The `md_url` is the HTTP path where the agent fetches the node's Markdown content. It must match your server's routing.

### actions.json

Catalog every action an agent can call:

```json
{
  "spec": "mdh/1.0",
  "actions": [
    {
      "id": "flights.search",
      "node_id": "doc:flights-search",
      "title": "Search Flights",
      "method": "GET",
      "url": "/api/flights/search",
      "accept": "application/json",
      "auth": { "type": "none" },
      "query": {
        "required": ["from", "to"],
        "optional": ["date", "cabin", "max_price", "limit", "cursor"]
      },
      "pagination": {
        "type": "cursor",
        "request": { "cursor_param": "cursor", "limit_param": "limit" },
        "response": { "next_cursor_jsonpath": "$.next_cursor" }
      }
    }
  ]
}
```

The `node_id` links back to the markdown node that documents this action in detail. The action catalog gives agents enough to call the API; the node gives them context about what it does and how to use it. The `auth` field tells agents how to authenticate. The `pagination` block describes how to page through results.

## Serving content

The simplest approach: serve the markdown files and JSON artifacts as static files. An Express server can do this in a few routes.

For markdown nodes, support content negotiation. If the agent sends `Accept: application/json`, return the frontmatter as a structured JSON object and the body as a string. Otherwise return raw markdown.

```js
app.get("/md/:node", (req, res) => {
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

## Wikilink forms

The spec defines three wikilink forms:

- `[[doc:flights-search]]` — ID link, exact match on node ID
- `[[Flight search]]` — alias link, resolved via title or aliases
- `[[url:/api/flights/search?from=ARN]]` — literal URL, escape hatch

Prefer ID links. They're unambiguous and resolve in one step. Alias links work when you want the prose to read naturally, but they can be ambiguous if multiple nodes share a title.

## Node types

Types are server-defined — use what makes sense for your content. The example uses:

- **section** — grouping pages (like "Flights")
- **page** — pages that document something specific (like the search action)
- **reference** — static data (like airport codes)
- **guide** — instructional content

Types help agents decide which nodes to prioritize — an agent looking to do something will gravitate toward pages with actions.

## Keeping things in sync

The artifacts, the frontmatter, and the wikilinks should all agree. When you add a node:

1. Create the markdown file with frontmatter (`id`, `type`, `title`, `links`, `actions`)
2. Add the node to `nodes.json` with its `md_url`
3. If it declares actions, add them to `actions.json` with the `node_id`

If you automate this, generate the artifacts from the markdown files. The frontmatter has everything you need.

## Static vs dynamic

Nothing in MDH requires a server. You can generate all the files at build time and host them on any static file host. The example uses Express to also serve the flight search API, but the MDH content itself is just files.

For sites with content that changes, generate the artifacts on deploy. For fully static sites, generate once and host anywhere.
