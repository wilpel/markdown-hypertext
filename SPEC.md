# MDH (Markdown Hypertext) 1.0 Specification

**Status:** Draft 1.0

---

## Abstract

MDH defines a convention for agent-readable websites built from Markdown pages connected by standard links, with callable actions declared in YAML frontmatter. A conforming client needs only:

- **webfetch** (HTTP GET) to read Markdown and JSON resources

MDH requires no proprietary agent protocols, plugins, or tool schemas. It is web-native: stable URLs, plain text, predictable conventions.

### Conventions

The key words "MUST", "MUST NOT", "SHOULD", "SHOULD NOT", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

---

## 1. Key Concepts

### 1.1 Page

A **Page** is a Markdown document addressed by a stable identifier (`id`) and served at a stable URL. Pages MAY additionally be served as JSON or HTML via content negotiation. A page MAY declare outgoing links and actions in its frontmatter.

### 1.2 Links

Pages link to each other using standard Markdown links:

```markdown
See [airports](/airports) for valid airport codes.
```

Links use regular HTTP paths. An agent follows them with a standard GET request.

Links are also declared in frontmatter with typed relationships and an `href` for the URL path:

```yaml
links:
  - rel: related_to
    target: airports
    href: /airports
```

### 1.3 Graph

The **Graph** is the set of all pages and directed edges derived from:

- **Explicit links** declared in page frontmatter (`links[]`)
- **Inline Markdown links** in body text

### 1.4 Action

An **Action** is a callable HTTP operation described in a page's frontmatter. Actions can be read-only (GET) or state-changing (POST/PUT/PATCH/DELETE). See the [Security](#10-safety-and-correctness) section for notes on GET-only vs POST approaches.

---

## 2. Design Goals

1. **Readable first.** Markdown is the canonical representation for navigation and comprehension.
2. **Deterministic.** IDs, schemas, and link resolution follow predictable rules.
3. **Discoverable.** Agents find pages and actions by reading the root page and following links.
4. **Executable.** Actions are plain HTTP endpoints with declarative contracts.
5. **Tool-minimal.** Full navigation works with GET-only readers.
6. **Safe.** State-changing actions should require explicit auth; cookie-based auth requires CSRF protection.

---

## 3. Protocol Surface

### 3.1 Serving Pages

Each page MUST have a canonical Markdown representation at a stable URL. Implementations MAY choose any URL layout. Recommended patterns:

- `GET /<id>` - dedicated path per page
- `GET /page/<id>` - with content negotiation (§4)

Agents discover pages by reading the root page and following links declared in frontmatter and body text.

---

## 4. Content Negotiation

Servers SHOULD support the following `Accept` header values:

| Accept | Response |
|--------|----------|
| `text/markdown` | Markdown with YAML frontmatter |
| `application/json` | Structured JSON representation of the page |
| (default / browser) | HTML rendering (OPTIONAL) |

If content negotiation is not implemented, the server MUST still expose Markdown at stable URLs.

---

## 5. Page Format

### 5.1 Frontmatter

Every page MUST begin with YAML frontmatter delimited by `---`.

**Required keys:**

| Key | Type | Description |
|-----|------|-------------|
| `id` | string | Globally unique, stable identifier |
| `type` | string | Page type from a server-defined vocabulary |
| `title` | string | Human-readable title |

**Optional keys:**

| Key | Type | Description |
|-----|------|-------------|
| `aliases` | string[] | Alternative names for the page |
| `tags` | string[] | Categorization tags |
| `links` | Link[] | Typed outgoing edges (§5.2) |
| `actions` | Action[] | Callable HTTP operations (§8) |
| `action` | Action | Single callable HTTP operation (§8) |
| `summary` | string | Brief description of the page |
| `updated` | string | ISO 8601 date-time of last modification |
| `canonical_url` | string | Preferred URL for this page |

Pages can use either `actions` (array) for multiple actions or `action` (singular) for a single action.

### 5.2 Link Object

```yaml
links:
  - rel: in_section
    target: flights
    href: /flights
  - rel: related_to
    target: airports
    href: /airports
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rel` | string | Yes | Relation type (server-defined vocabulary) |
| `target` | string | Yes | Target page ID |
| `href` | string | Yes | URL path to the target page |

### 5.3 Example Page

```markdown
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
    pagination:
      type: cursor
      request:
        cursor_param: cursor
        limit_param: limit
      response:
        next_cursor_jsonpath: "$.next_cursor"
---

# Search Flights

Find flights between any two cities. Use IATA airport codes.
See [airports](/airports) for valid codes.

`GET /api/flights/search?from=ARN&to=LHR&date=2026-03-10`
```

---

## 6. Link Resolution

Inline links in body text MUST use standard Markdown link syntax with the page's URL path as the href:

```markdown
See [airports](/airports) for valid airport codes.
```

The link target is a relative URL path. Agents follow links with standard HTTP GET requests.

Frontmatter `links[]` declare typed relationships with both the target page ID and its `href`. The body uses inline Markdown links for navigation.

---

## 7. Discovery

Agents discover pages and actions by reading the root page (`/`) and following links. Each page's frontmatter declares relationships to other pages via `links[]` and callable actions via `actions[]` or `action`.

Request any page with `Accept: application/json` to get the frontmatter as structured JSON.

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
| `body_schema` | string or object | No | JSON Schema for request body (URL or inline) |
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
| `cookie` | Session cookie (requires CSRF protection for state-changing methods; see §10.4) |
| `oauth2` | Token endpoint reference (full OAuth2 flow is out of scope) |

**Example:**

```yaml
auth:
  type: bearer
  token_help: "Create a token at /tokens"
```

The `token_help` field is OPTIONAL and provides a hint for obtaining credentials.

### 8.3 QuerySpec

```yaml
query:
  required: [from, to]
  optional: [date, cabin, max_price, limit, cursor]
```

| Field | Type | Description |
|-------|------|-------------|
| `required` | string[] | Parameters that MUST be provided |
| `optional` | string[] | Parameters that MAY be provided |

QuerySpec can optionally include a `properties` object with per-parameter type annotations and descriptions:

```yaml
query:
  required: [offer_id, passenger]
  properties:
    offer_id:
      type: string
      description: The offer_id from a search result
    passenger:
      type: string
      description: "Full name (e.g. Alice Lindqvist). Repeat for multiple."
```

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
    limit_param: limit
  response:
    next_cursor_jsonpath: "$.next_cursor"
```

| Field | Description |
|-------|-------------|
| `request.cursor_param` | Query parameter name for the cursor value |
| `request.limit_param` | Query parameter name for page size |
| `response.next_cursor_jsonpath` | JSONPath to the next-page cursor in the response |
| `response.prev_cursor_jsonpath` | JSONPath to the previous-page cursor (OPTIONAL) |
| `response.next_link_jsonpath` | JSONPath to a fully-formed next-page URL (OPTIONAL) |

### 9.2 Response Envelope

Paginated responses SHOULD include a cursor for the next page:

```json
{
  "results": [...],
  "total": 42,
  "next_cursor": "abc123"
}
```

A `null` value for `next_cursor` indicates the final page.

---

## 10. Safety and Correctness

### 10.1 HTTP Semantics

- Read-only operations (search, retrieval, listing) MUST use GET.
- Servers MUST NOT perform side effects on GET requests unless the site explicitly uses GET-only actions for agent compatibility (see §10.5).

### 10.2 Caching

For endpoints returning sensitive or user-specific data, servers SHOULD set:

```
Cache-Control: no-store
```

For public, infrequently-changing resources (static Markdown pages), servers SHOULD set appropriate `Cache-Control` and `ETag` headers.

### 10.3 Idempotency

For non-idempotent operations (typically POST), servers SHOULD support the `Idempotency-Key` request header to allow safe retries.

### 10.4 CSRF Protection

If an action uses `auth.type: cookie`, then state-changing requests (POST/PUT/PATCH/DELETE) MUST require CSRF protection. The server SHOULD document the CSRF mechanism in the action's metadata or a linked page.

### 10.5 GET-only Actions

Most AI agents today are restricted to read-only HTTP tools (`webfetch` or equivalent) due to security concerns including prompt injection, data exfiltration, and SSRF. Sites MAY expose state-changing actions as GET endpoints with query parameters to support these agents. When doing so:

- Pages SHOULD include guidance telling the agent to confirm with the user before executing state-changing actions.
- The site SHOULD document that GET is used for compatibility, not because the operations are safe.
- Sites can add POST support alongside GET when agent capabilities improve.

---

## 11. Conformance

An MDH 1.0 conforming site MUST:

1. Provide a Markdown representation for every page at a stable URL.
2. Include YAML frontmatter with `id`, `type`, and `title` in every page.
3. Ensure all inline link targets in published Markdown resolve to valid page URLs.
4. Declare actions in page frontmatter with at minimum `id`, `method`, and `url`.

A conforming site SHOULD additionally:

5. Support content negotiation (§4) for page URLs.
6. Declare `auth` on all actions.
7. Include `href` on all frontmatter links.

