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

Each result is a flight offer with an `offer_id`. Use the offer ID to get full details.

Example — economy flights from Stockholm to Barcelona on March 10:

`GET /api/flights/search?from=ARN&to=BCN&date=2026-03-10&cabin=economy`

## Flight offer details

`GET /api/flights/offers/{id}`

Returns full details for a single flight offer by its `offer_id`. Each offer includes airline, flight number, departure and arrival times, duration, stops, price, and cabin class.

Example: `GET /api/flights/offers/off_arn_bcn_1`

See [airports](/airports) for valid airport codes.
