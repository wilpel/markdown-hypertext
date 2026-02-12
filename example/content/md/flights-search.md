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
    pagination:
      type: cursor
      request:
        cursor_param: cursor
        limit_param: limit
      response:
        next_cursor_jsonpath: "$.next_cursor"
  - id: flights.get_offer
    method: GET
    url: /api/flights/offers/{id}
    accept: application/json
---

# Search Flights

Search for flight offers between two airports.

## Search endpoint

`GET /api/flights/search`

| Parameter | Required | Description |
|-----------|----------|-------------|
| from      | yes      | Departure airport IATA code (e.g. ARN) |
| to        | yes      | Arrival airport IATA code (e.g. BCN) |
| date      | no       | Date filter in YYYY-MM-DD format |
| cabin     | no       | Cabin class: `economy` or `business` |
| max_price | no       | Maximum price in EUR |
| cursor    | no       | Offer ID to paginate from (returned as `next_cursor`) |
| limit     | no       | Results per page, default 10, max 50 |

Response:

```json
{
  "results": [ ... ],
  "total": 3,
  "next_cursor": null
}
```

Each result is an offer object. See [[doc:flights]] for the offer schema.

Example — economy flights from Stockholm to Barcelona on March 10:

`GET /api/flights/search?from=ARN&to=BCN&date=2026-03-10&cabin=economy`

## Single offer lookup

`GET /api/flights/offers/{id}`

Returns a single offer by its ID. Example: `GET /api/flights/offers/off_arn_bcn_1`

See [[doc:airports]] for valid airport codes.
