# MDH — Markdown Hypertext

MDH is a specification for building websites that AI agents can read, navigate, and interact with — using nothing but Markdown, YAML frontmatter, and plain HTTP.

## The problem

Agents interacting with the web today have bad options:

- **HTML scraping** is fragile. DOM structures change, CSS selectors break, and meaningful content is buried under layout markup.
- **OpenAPI specs** describe endpoints but not how to navigate a site, understand its content, or decide what to do next.
- **MCP** requires every site to run a protocol-specific server and every agent to implement a custom client.

MDH takes a different approach: describe your site as a graph of Markdown documents with YAML frontmatter that declares links, actions, and metadata. Agents navigate with standard HTTP GET requests and read plain text. No custom protocols, no DOM parsing, no tool schemas.

## How it works

Every page on an MDH site is a Markdown document with YAML frontmatter at the top. The frontmatter declares the page's identity, its relationships to other pages, and any actions (API calls) it describes. The body is natural Markdown prose — written for an agent to read and act on.

```
                 ┌─────────┐
                 │  index   │
                 │ (root)   │
                 └────┬─────┘
           ┌──────────┼──────────┐
           ▼          ▼          ▼
      ┌─────────┐ ┌─────────┐ ┌──────────┐
      │ flights │ │ hotels  │ │ bookings │
      └────┬────┘ └────┬────┘ └────┬─────┘
           ▼          ▼          ▼
    ┌────────────┐ ┌────────────┐ ┌──────────────┐
    │flights-    │ │hotels-     │ │flights-book  │
    │search      │ │search      │ │hotels-book   │
    │            │ │            │ │package-book  │
    └────────────┘ └────────────┘ └──────────────┘
```

The flow: read the root page → follow links to sections of interest → find an action → call the API.

## Page structure

Every MDH page has two parts: **frontmatter** (structured metadata) and **body** (Markdown prose).

### Frontmatter

The frontmatter is YAML between `---` delimiters. It declares who the page is, what it links to, and what actions are available:

```yaml
---
id: flights-search
type: page
title: Search Flights
links:
  - rel: in_section
    target: flights
    href: /flights
  - rel: related_to
    target: airports
    href: /airports
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

**Required fields:**

| Field | Description |
|-------|-------------|
| `id` | Unique identifier for this page (e.g. `flights-search`) |
| `type` | Page type — `section`, `page`, `reference`, `guide`, etc. |
| `title` | Human-readable title |

**Links** declare relationships to other pages. Each link has:

| Field | Description |
|-------|-------------|
| `rel` | Relationship type — `contains`, `in_section`, `related_to`, etc. |
| `target` | The target page's `id` |
| `href` | The URL path to the target page |

**Actions** declare callable HTTP endpoints. See [Actions](#actions) below.

### Body

The body is standard Markdown. Write it like you're explaining the page to someone who needs to understand it and do something with it. Use natural prose, include examples, and link to other pages with standard Markdown links:

```markdown
# Search Flights

Find available flights between any two cities. You need a departure
and arrival airport code — see [airports](/airports) for the full list.

`GET /api/flights/search?from=ARN&to=LHR&date=2026-03-10`
```

The body and frontmatter work together. The frontmatter gives agents structured, parseable metadata. The body gives context, explanations, and examples that help agents understand *how* and *when* to use the actions.

## Content negotiation

MDH pages support multiple response formats based on the `Accept` header:

| Accept header | Response format |
|---------------|-----------------|
| `text/markdown` (or no header) | Raw Markdown with YAML frontmatter |
| `application/json` | Structured JSON with parsed frontmatter |
| `text/html` | Lightweight HTML rendering |

```bash
# Raw markdown (default)
curl https://example.com/flights-search

# Structured JSON — useful for agents that want typed access to actions and links
curl -H "Accept: application/json" https://example.com/flights-search

# HTML — for humans clicking around in a browser
curl -H "Accept: text/html" https://example.com/flights-search
```

The JSON format returns the parsed frontmatter as structured data, making it easy for agents to extract actions, links, and metadata without parsing YAML:

```json
{
  "meta": {
    "id": "flights-search",
    "type": "page",
    "title": "Search Flights",
    "links": [
      { "rel": "in_section", "target": "flights", "href": "/flights" }
    ],
    "actions": [
      {
        "id": "flights.search",
        "method": "GET",
        "url": "/api/flights/search",
        "query": { "required": ["from", "to"], "optional": ["date", "cabin"] }
      }
    ]
  },
  "body": "# Search Flights\n\nFind available flights..."
}
```

## Actions

Actions are HTTP endpoints declared in a page's frontmatter. They tell agents exactly how to call an API — what method to use, what parameters are required, and what to expect back.

### GET-only actions (recommended for most agents)

The simplest and most compatible approach. All parameters go in the query string:

```yaml
action:
  id: flights.book
  method: GET
  url: /api/flights/book
  accept: application/json
  query:
    required:
      - offer_id
      - passenger
    properties:
      offer_id:
        type: string
        description: The offer_id from a flight search result
      passenger:
        type: string
        description: "Passenger full name (e.g. Alice Lindqvist). Repeat for multiple."
```

The agent calls it with a simple GET request:

```
GET /api/flights/book?offer_id=off_arn_lhr_1&passenger=Alice+Lindqvist
```

This works with any agent that can make HTTP GET requests — which is all of them. For parameters that accept multiple values (like passengers), the parameter is repeated:

```
GET /api/flights/book?offer_id=off_arn_lhr_1&passenger=Alice+Lindqvist&passenger=Bob+Smith
```

### POST actions with request bodies

For more complex operations, actions can use POST with a JSON request body:

```yaml
action:
  id: flights.book
  method: POST
  url: /api/flights/book
  content_type: application/json
  accept: application/json
  body_schema:
    required:
      - offer_id
      - passengers
    properties:
      offer_id:
        type: string
      passengers:
        type: array
        items:
          required: [first_name, last_name]
          properties:
            first_name:
              type: string
            last_name:
              type: string
```

The agent sends a POST with a JSON body:

```bash
curl -X POST https://example.com/api/flights/book \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id": "off_arn_lhr_1",
    "passengers": [
      { "first_name": "Alice", "last_name": "Lindqvist" }
    ]
  }'
```

POST is the more natural fit for state-changing operations — it follows HTTP semantics correctly (GET should be safe and idempotent), supports structured request bodies, and handles complex nested data cleanly.

### GET vs POST: choosing an approach

| | GET-only | POST |
|---|----------|------|
| **Agent compatibility** | Works with all agents (webfetch, curl, any HTTP client) | Requires agents that can send request bodies |
| **Simplicity** | Parameters in URL, easy to construct | Needs JSON body construction |
| **Complex data** | Flat key-value pairs only; arrays via repeated params | Full JSON — nested objects, arrays of objects |
| **HTTP correctness** | Technically wrong for state-changing operations | Follows HTTP semantics properly |
| **Caching/safety** | GET requests may be cached or retried by intermediaries | POST signals "this changes state" |
| **Current agent support** | All agents today can do GET | Not all agents can send POST with custom bodies |

**Our recommendation:** Start with GET-only. Most AI agents today navigate the web using tools like `webfetch` that only support GET requests. Even agents with full HTTP access (like those using `curl`) find GET simpler to construct. You can always add POST support later when agent capabilities catch up.

The example site (Wayfare) uses GET for everything — searches and bookings alike. This sacrifices HTTP purity for maximum agent compatibility.

### Supporting both

You can support GET and POST on the same endpoint. Declare both in the frontmatter and document both in the page body:

```yaml
action:
  id: flights.book
  title: Book Flight
  methods:
    - method: GET
      url: /api/flights/book
      query:
        required: [offer_id, passenger]
    - method: POST
      url: /api/flights/book
      content_type: application/json
      body_schema:
        required: [offer_id, passengers]
```

This lets agents use whichever approach they support.

## Navigation and discovery

Agents discover your site by starting at the root page and following links. There's no sitemap to fetch or index to crawl — just follow the links.

### The root page

The root page (`/`) is the entry point. It should give agents an overview of everything available and surface the most common actions directly:

```yaml
---
id: index
type: section
title: Wayfare — Travel Search
links:
  - rel: contains
    target: flights
    href: /flights
  - rel: contains
    target: hotels
    href: /hotels
  - rel: contains
    target: bookings
    href: /bookings
actions:
  - id: flights.search
    method: GET
    url: /api/flights/search
    query:
      required: [from, to]
      optional: [date, cabin, max_price, limit, cursor]
---
```

Putting the most common actions on the root page means agents can start searching immediately without navigating deeper. The links point to section pages with more detail.

### Following links

Every page links to related pages using standard Markdown links in the body and typed edges in the frontmatter. An agent reads a page, decides what it needs, and follows the relevant link:

```
Agent reads /           → sees flights section, follows link
Agent reads /flights    → sees search action, follows link
Agent reads /flights-search → sees action definition, makes API call
Agent calls /api/flights/search?from=ARN&to=LHR → gets results
```

### Link relationships

The `rel` field on frontmatter links helps agents understand the graph structure:

| Relationship | Meaning |
|-------------|---------|
| `contains` | Parent → child (section contains sub-pages) |
| `in_section` | Child → parent (page belongs to section) |
| `related_to` | Lateral connection (see also) |

## Best practices

### Write for agents, not humans

Your page body is what the agent reads to decide what to do. Be specific and concrete:

```markdown
# Search Flights

Find flights between any two cities. You need departure and arrival
airport codes — see [airports](/airports) for all 15 codes.

`GET /api/flights/search?from=ARN&to=LHR&date=2026-03-10`

| Parameter | Required | Description |
|-----------|----------|-------------|
| from      | yes      | Departure airport code (e.g. ARN) |
| to        | yes      | Arrival airport code (e.g. LHR) |
| date      | no       | Travel date (YYYY-MM-DD) |
```

Don't be vague. Show the exact endpoint, the exact parameters, and an example. The agent needs to construct a request — give it everything it needs on the page.

### Surface actions early

Put the most important actions on the root page. An agent shouldn't have to navigate through three levels of pages to find a search endpoint. The root page should include inline action definitions for the primary workflows.

### Use the root page as a landing page

The root page should explain what the site is and what you can do on it. Think of it as a homepage that orients the agent:

- What is this site?
- What are the main sections?
- What are the key actions and how do I call them?
- What reference data is available?

### Keep pages focused

Each page should cover one topic or one action. Don't put flight search and hotel search on the same page. Split them so agents can navigate to exactly what they need.

### Link generously

When you mention another page's topic, link to it. This is how agents navigate — they follow links to find what they need. A page about booking flights should link to the flight search page, the airports page, and the bookings overview.

### Include agent guidelines for sensitive actions

For actions that change state (booking, payments, account changes), include explicit guidance for the agent:

```markdown
## Important: confirm with the user first

Before making this booking request, always show the user a summary of
what will be booked — the flight details, price, and passenger names.
Only proceed after the user confirms.
```

This sets behavioral expectations that well-built agents will follow.

### Don't duplicate content

If airport codes are listed on the airports page, link to it rather than copying the table onto every other page. Keep information in one place and link to it.

## Pagination

For endpoints that return lists, use cursor-based pagination. Declare the pagination contract in the action's frontmatter:

```yaml
actions:
  - id: flights.search
    method: GET
    url: /api/flights/search
    pagination:
      type: cursor
      request:
        cursor_param: cursor
        limit_param: limit
      response:
        next_cursor_jsonpath: "$.next_cursor"
```

Responses include a cursor for the next page:

```json
{
  "results": [...],
  "total": 42,
  "next_cursor": "off_arn_bcn_11"
}
```

When `next_cursor` is `null`, there are no more results. The agent passes the cursor value back as a query parameter to get the next page.

## Example site

The `example/` directory contains a complete MDH site — Wayfare, a travel search site with flights, hotels, and bookings across 15 European and North American cities.

The example uses GET requests exclusively — including for booking actions that would traditionally use POST. This is a deliberate choice to maximize compatibility with current AI agents, most of which only have access to `webfetch` or equivalent GET-only tools. See [GET vs POST: choosing an approach](#get-vs-post-choosing-an-approach) for the trade-offs.

### Running it

```bash
cd example
npm install
npm run dev
```

### Trying the discovery flow

```bash
# 1. Read the root page — see what's available
curl http://localhost:3000/

# 2. Navigate to the flights section
curl http://localhost:3000/flights

# 3. Read the search page — learn how to search
curl http://localhost:3000/flights-search

# 4. Search for flights from Stockholm to London
curl "http://localhost:3000/api/flights/search?from=ARN&to=LHR"

# 5. Search with a specific date
curl "http://localhost:3000/api/flights/search?from=ARN&to=LHR&date=2026-03-10"

# 6. Get details on a specific offer
curl http://localhost:3000/api/flights/offers/off_arn_lhr_1

# 7. Book a flight
curl "http://localhost:3000/api/flights/book?offer_id=off_arn_lhr_1&passenger=Alice+Lindqvist"

# 8. Look up the booking
curl http://localhost:3000/api/bookings/bkg_f_1
```

### Get structured metadata

```bash
# Get any page as JSON — parsed frontmatter + body
curl -H "Accept: application/json" http://localhost:3000/flights-search
```

### Site structure

```
example/
├── content/md/          # Markdown pages
│   ├── index.md         # Root page — site overview and key actions
│   ├── flights.md       # Flights section
│   ├── flights-search.md # How to search flights (action defined here)
│   ├── flights-book.md  # How to book a flight
│   ├── hotels.md        # Hotels section
│   ├── hotels-search.md # How to search hotels
│   ├── hotels-book.md   # How to book a hotel
│   ├── bookings.md      # Bookings overview
│   ├── package-book.md  # Book flight + hotel together
│   ├── airports.md      # Airport code reference
│   └── help.md          # Getting started guide
├── data/                # Static data files
│   ├── flights.json     # Flight offers
│   └── hotels.json      # Hotel listings
├── app/                 # Next.js route handlers
│   ├── route.js         # Root page handler (/)
│   ├── [node]/route.js  # Dynamic page handler (/{page-id})
│   └── api/             # API endpoints
│       ├── flights/search/route.js
│       ├── flights/book/route.js
│       ├── flights/offers/[id]/route.js
│       ├── hotels/search/route.js
│       ├── hotels/book/route.js
│       ├── hotels/[id]/route.js
│       ├── bookings/[id]/route.js
│       └── bookings/package/route.js
└── lib/
    ├── content.js       # Markdown reading, frontmatter parsing, HTML rendering
    └── bookings.js      # In-memory booking store
```

### Live demo

The example site is deployed at [markdown-hypertext-example.vercel.app](https://markdown-hypertext-example.vercel.app).

## Security

A key reason most AI agents today are limited to read-only `webfetch` tools — and can't freely run `curl`, send POST requests, or execute arbitrary HTTP calls — is security.

### Why agents can't just curl anything

Giving an agent unrestricted HTTP access opens the door to serious risks:

- **Prompt injection.** A malicious website could embed instructions in its content that trick the agent into making unintended requests — sending data to attacker-controlled servers, calling APIs with harmful parameters, or leaking sensitive information from the conversation context.
- **Data exfiltration.** An agent with full HTTP access could be manipulated into sending private data (API keys, user details, conversation contents) to external endpoints via query parameters or request bodies.
- **Unintended side effects.** POST, PUT, and DELETE requests change state. An agent that misinterprets a page — or gets tricked by injected instructions — could create bookings, modify accounts, delete data, or trigger payments without the user's intent.
- **SSRF (Server-Side Request Forgery).** If an agent runs in a server environment, unrestricted HTTP access could let it probe internal networks, access metadata endpoints, or reach services that should never be publicly accessible.

This is why agent frameworks restrict HTTP tools to GET-only, require user confirmation for state-changing actions, or sandbox network access entirely. The restrictions aren't a temporary limitation — they're a deliberate security boundary.

### How MDH works within these constraints

MDH is designed with this reality in mind:

- **Navigation is read-only.** All page discovery and content reading uses plain GET requests. An agent with nothing but `webfetch` can fully navigate an MDH site, read every page, understand the graph structure, and discover all available actions.
- **Actions are explicit.** Rather than hoping agents will figure out how to interact with a site, MDH declares actions in structured frontmatter. The agent knows exactly what endpoint to call, what parameters are needed, and what the action does — reducing the chance of misinterpreting content or following injected instructions.
- **Confirmation guidance is embedded.** MDH pages can include explicit behavioral guidance ("confirm with the user before booking"). Well-built agents follow these instructions, keeping the human in the loop for anything that changes state.
- **GET-only actions are a pragmatic option.** For sites that want maximum agent compatibility today, actions can be exposed as GET endpoints with query parameters. This lets agents execute actions using only their existing `webfetch` tool, while the page content and confirmation guidance provide the safety layer.

### Looking ahead

As agent security models mature — with better sandboxing, permission scoping, and prompt injection defenses — more agents will gain the ability to make POST requests and send custom headers safely. When that happens, MDH sites can adopt POST for state-changing actions (which is the correct HTTP approach) without changing anything about how navigation and discovery work. The spec supports both today.

## Comparison

| | MDH | HTML scraping | OpenAPI | MCP |
|---|---------|--------------|---------|-----|
| Content format | Markdown | HTML | JSON Schema | Protocol-specific |
| Site structure | Frontmatter links | Implicit in DOM | Not modeled | Not modeled |
| Navigation | Follow Markdown links | Parse HTML, guess | Not supported | Not supported |
| Actions | Declared in YAML frontmatter | Reverse-engineered | Declared in YAML/JSON | Tool definitions |
| Content | Natural prose for agents | Markup for humans | Parameter descriptions | Tool descriptions |
| Transport | Plain HTTP | HTTP | HTTP | Custom protocol |
| Server requirements | Serve Markdown files | None | None | MCP server |
| Agent requirements | HTTP GET + read text | Parse HTML + heuristics | Parse OpenAPI schema | MCP client |

## Project

- [Specification](SPEC.md) — the full MDH 1.0 spec
- [Implementation guide](GUIDE.md) — how to build an MDH site
- [Example site](example/) — working travel search site with MDH
