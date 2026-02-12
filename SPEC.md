# MDH (Markdown Hypertext) 1.0 Specification

**Status:** Draft 1.0

---

## Abstract

MDH defines a convention for agent-readable websites built from Markdown documents connected by standard links, augmented by machine-readable indexes and action contracts. A conforming client needs only:

- **webfetch** (HTTP GET) — to read Markdown and JSON resources

MDH requires no proprietary agent protocols, plugins, or tool schemas. It is web-native: stable URLs, plain text, predictable conventions.

### Conventions

The key words "MUST", "MUST NOT", "SHOULD", "SHOULD NOT", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

---

## 1. Key Concepts

### 1.1 Node

A **Node** is a document addressed by a stable identifier (`id`) and representable as Markdown. Nodes MAY additionally be served as JSON or HTML via content negotiation. A node MAY declare outgoing links and actions in its frontmatter.

### 1.2 Links

Nodes link to each other using standard Markdown links with paths matching the node's `md_url`:

```markdown
See [airports](/airports) for valid airport codes.
```

Links use regular HTTP paths. An agent can follow them with a standard GET request.

### 1.3 Graph

The **Graph** is the set of all nodes and directed edges derived from:

- **Explicit links** declared in node frontmatter (`links[]`)
- **Inline markdown links** extracted from body text

### 1.4 Action

An **Action** is a callable HTTP operation described in a node's frontmatter. Actions are typed as either read-only (GET) or state-changing (POST/PUT/PATCH/DELETE).

---

## 2. Design Goals

1. **Readable first** — Markdown is the canonical representation for navigation and comprehension.
2. **Deterministic** — IDs, schemas, and link resolution follow predictable rules.
3. **Discoverable** — Node and action indexes let agents understand the full site without crawling.
4. **Executable** — Actions are plain HTTP endpoints with declarative contracts.
5. **Tool-minimal** — Full navigation works with GET-only readers; execution requires only curl-equivalent HTTP.
6. **Safe** — State-changing actions require explicit auth; cookie-based auth requires CSRF protection.

---

## 3. Protocol Surface

### 3.1 Markdown Node Rendering

Each node MUST have a canonical Markdown representation at a stable URL. Implementations MAY choose any URL layout. Recommended patterns:

- `GET /<path>` — dedicated path per node
- `GET /node/<id>` — with content negotiation (§4)

Agents discover pages by reading the root node and following links declared in frontmatter and body text.

---

## 4. Content Negotiation

Servers SHOULD support the following `Accept` header values:

| Accept | Response |
|--------|----------|
| `text/markdown` | Markdown with YAML frontmatter |
| `application/json` | Structured JSON representation of the node |
| (default / browser) | HTML rendering (OPTIONAL) |

If content negotiation is not implemented, the server MUST still expose Markdown at stable URLs.

---

## 5. Node Format

### 5.1 Frontmatter

Every node MUST begin with YAML frontmatter delimited by `---`.

**Required keys:**

| Key | Type | Description |
|-----|------|-------------|
| `id` | string | Globally unique, stable identifier |
| `type` | string | Node type from a server-defined vocabulary |
| `title` | string | Human-readable title |

**Optional keys:**

| Key | Type | Description |
|-----|------|-------------|
| `aliases` | string[] | Alternative names for the node |
| `tags` | string[] | Categorization tags |
| `links` | Link[] | Typed outgoing edges (§5.2) |
| `actions` | Action[] | Callable HTTP operations (§8) |
| `summary` | string | Brief description of the node |
| `updated` | string | ISO 8601 date-time of last modification |
| `canonical_url` | string | Preferred URL for this node |

### 5.2 Link Object

```yaml
links:
  - rel: related_to
    target: flights-search
  - rel: depends_on
    target: svc:pricing
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rel` | string | Yes | Relation type (server-defined vocabulary) |
| `target` | string | Yes | Node ID or `url:...` literal |

### 5.3 Example Node

```markdown
---
id: flights-search
type: page
title: Flight search
aliases: [Search flights]
tags: [travel, flights]
links:
  - rel: in_section
    target: flights
actions:
  - id: flights.search
    method: GET
    url: /api/flights/search
    accept: application/json
    query:
      required: [from, to, date]
      optional: [return_date, adults, cabin, currency, locale, page_size, cursor]
    pagination:
      type: cursor
      request:
        cursor_param: cursor
        limit_param: page_size
      response:
        next_cursor_jsonpath: "$.page.next_cursor"
        next_link_jsonpath: "$.links.next"
---

# Flight search

Use IATA airport codes. Examples:
- One-way: `/api/flights/search?from=ARN&to=BCN&date=2026-03-10`
- Round-trip: `/api/flights/search?from=ARN&to=BCN&date=2026-03-10&return_date=2026-03-17`
```

---

## 6. Link Resolution

Inline links in node body text MUST use standard Markdown link syntax with the node's `md_url` as the href:

```markdown
See [airports](/airports) for valid airport codes.
```

The link target is a relative URL path. Agents follow links with standard HTTP GET requests — no custom resolution needed.

Frontmatter `links[]` use node IDs. The agent follows inline Markdown links to navigate between pages.

---

## 7. Graph Artifacts

Actions are declared in node frontmatter (§8). Agents discover actions by navigating to pages and reading their frontmatter. Request any page with `Accept: application/json` to get the frontmatter as structured JSON.

---

## 8. Actions

### 8.1 Action Object

An action declares how to call an HTTP endpoint.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique within the site |
| `title` | string | No | Human-readable name |
| `method` | string | Yes | HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) |
| `url` | string | Yes | Endpoint path (relative to site root) |
| `accept` | string | No | Expected response MIME type |
| `content_type` | string | No | Request body MIME type |
| `auth` | Auth | No | Authentication requirements (§8.2) |
| `query` | QuerySpec | No | Query parameter specification |
| `body_schema` | string \| object | No | JSON Schema for request body (URL or inline) |
| `response_schema` | string | No | URL to JSON Schema for response |
| `pagination` | PaginationSpec | No | Pagination contract (§9) |
| `examples` | Example[] | No | Request/response examples |

### 8.2 Auth

MDH does not mandate an authentication system; it describes how a client should authenticate.

**Supported `auth.type` values:**

| Type | Mechanism |
|------|-----------|
| `none` | No authentication required |
| `bearer` | `Authorization: Bearer <token>` (PAT/JWT) |
| `api_key` | Token sent via header or query parameter |
| `cookie` | Session cookie (requires CSRF protection for state-changing methods; see §11.4) |
| `oauth2` | Token endpoint reference (full OAuth2 flow is out of scope) |

**Example:**

```yaml
auth:
  type: bearer
  token_help: "Create a token at /tokens"
```

The `token_help` field is OPTIONAL and provides a human/agent-readable hint for obtaining credentials.

### 8.3 QuerySpec

```yaml
query:
  required: [from, to, date]
  optional: [return_date, adults, cabin, currency, locale, page_size, cursor]
```

| Field | Type | Description |
|-------|------|-------------|
| `required` | string[] | Parameters that MUST be provided |
| `optional` | string[] | Parameters that MAY be provided |

Servers MAY extend QuerySpec with per-parameter type annotations or defaults in future minor versions.

### 8.4 Execution

Clients construct HTTP requests from the action definition:

1. Set the HTTP method and resolve the URL relative to the site root.
2. Append query parameters (from `query` spec and user input).
3. Set request body (if `content_type` and `body_schema` are declared).
4. Apply authentication (per `auth` spec).
5. Set `Accept` header (from `accept` field).

---

## 9. Pagination

MDH RECOMMENDS cursor-based pagination for listing endpoints.

### 9.1 Cursor Pagination Spec

```yaml
pagination:
  type: cursor
  request:
    cursor_param: cursor
    limit_param: page_size
  response:
    next_cursor_jsonpath: "$.page.next_cursor"
    prev_cursor_jsonpath: "$.page.prev_cursor"
    next_link_jsonpath: "$.links.next"
    self_link_jsonpath: "$.links.self"
```

| Field | Description |
|-------|-------------|
| `request.cursor_param` | Query parameter name for the cursor value |
| `request.limit_param` | Query parameter name for page size |
| `response.next_cursor_jsonpath` | JSONPath to the next-page cursor in the response |
| `response.prev_cursor_jsonpath` | JSONPath to the previous-page cursor (OPTIONAL) |
| `response.next_link_jsonpath` | JSONPath to a fully-formed next-page URL (OPTIONAL) |
| `response.self_link_jsonpath` | JSONPath to the current page URL (OPTIONAL) |

### 9.2 Response Envelope

Paginated responses SHOULD include:

```json
{
  "page": {
    "page_size": 20,
    "next_cursor": "abc123",
    "prev_cursor": null
  },
  "links": {
    "self": "/api/flights/search?from=ARN&to=BCN&date=2026-03-10",
    "next": "/api/flights/search?from=ARN&to=BCN&date=2026-03-10&cursor=abc123"
  }
}
```

A `null` value for `next_cursor` or the absence of `links.next` indicates the final page.

---

## 10. Safety and Correctness

### 10.1 HTTP Semantics

- Read-only operations (search, retrieval, listing) MUST use GET.
- State-changing operations MUST NOT use GET.
- Servers MUST NOT perform side effects on GET requests.

### 10.2 Caching

For endpoints returning sensitive or user-specific data, servers SHOULD set:

```
Cache-Control: no-store
```

For public, infrequently-changing resources (graph artifacts, static Markdown), servers SHOULD set appropriate `Cache-Control` and `ETag` headers.

### 10.3 Idempotency

For non-idempotent operations (typically POST), servers SHOULD support the `Idempotency-Key` request header to allow safe retries.

### 10.4 CSRF Protection

If an action uses `auth.type: cookie`, then state-changing requests (POST/PUT/PATCH/DELETE) MUST require CSRF protection. The server SHOULD document the CSRF mechanism in the action's metadata or a linked node.

---

## 11. Conformance

An MDH 1.0 conforming site MUST:

1. Provide a Markdown representation for every node at a stable URL.
2. Include YAML frontmatter with `id`, `type`, and `title` in every node document.
3. Ensure all inline link targets in published Markdown resolve to valid node URLs.
4. Declare actions in node frontmatter with at minimum `id`, `method`, and `url`.

A conforming site SHOULD additionally:

5. Support content negotiation (§4) for node URLs.
6. Declare `auth` on all actions.

---

## Appendix A: Reference Example — Flight Search API

*This appendix is non-normative.*

### A.1 Search Endpoint

```
GET /api/flights/search
```

**Query parameters:**

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `from` | Yes | — | IATA departure airport code |
| `to` | Yes | — | IATA arrival airport code |
| `date` | Yes | — | Departure date (`YYYY-MM-DD`) |
| `return_date` | No | — | Return date for round-trip |
| `adults` | No | `1` | Number of passengers |
| `cabin` | No | `economy` | Cabin class |
| `page_size` | No | `20` | Results per page |
| `cursor` | No | — | Pagination cursor |

### A.2 Response Shape

```json
{
  "query": {
    "from": "ARN",
    "to": "BCN",
    "date": "2026-03-10"
  },
  "page": {
    "page_size": 20,
    "next_cursor": "abc",
    "prev_cursor": null
  },
  "links": {
    "self": "/api/flights/search?from=ARN&to=BCN&date=2026-03-10",
    "next": "/api/flights/search?from=ARN&to=BCN&date=2026-03-10&cursor=abc"
  },
  "offers": [
    {
      "offer_id": "off_123",
      "price": {
        "amount": 199,
        "currency": "EUR"
      }
    }
  ]
}
```