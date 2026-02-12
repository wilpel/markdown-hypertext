---
id: index
type: section
title: SkySearch — Flight Search API
links:
  - rel: contains
    target: flights
  - rel: contains
    target: airports
  - rel: contains
    target: help
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

# SkySearch

SkySearch is a flight search interface built for AI agents. Search for flights between 15 cities, compare offers, and filter by cabin class or price — all through HTTP GET requests.

## Search flights

`GET /api/flights/search`

| Parameter | Required | Description |
|-----------|----------|-------------|
| from      | yes      | Departure airport IATA code |
| to        | yes      | Arrival airport IATA code |
| date      | no       | Date filter (YYYY-MM-DD) |
| cabin     | no       | `economy` or `business` |
| max_price | no       | Maximum price in EUR |
| limit     | no       | Results per page (default 10, max 50) |
| cursor    | no       | Pagination cursor from `next_cursor` in previous response |

Example: `GET /api/flights/search?from=ARN&to=BCN&cabin=economy`

Each result includes airline, flight number, departure/arrival times, duration, stops, price, and cabin class. When `next_cursor` is not null, pass it as `cursor` to get the next page.

## Look up an offer

`GET /api/flights/offers/{id}`

Returns a single offer by ID. Example: `GET /api/flights/offers/off_arn_bcn_1`

## Airports

| Code | City |
|------|------|
| ARN  | Stockholm |
| LHR  | London |
| CDG  | Paris |
| AMS  | Amsterdam |
| FRA  | Frankfurt |
| BCN  | Barcelona |
| MAD  | Madrid |
| FCO  | Rome |
| BER  | Berlin |
| CPH  | Copenhagen |
| OSL  | Oslo |
| HEL  | Helsinki |
| VIE  | Vienna |
| ZRH  | Zurich |
| JFK  | New York |

Every city connects to every other city. Search any pair.

## More pages

- [Search flights](/md/flights-search) — full search action details
- [Flights](/md/flights) — offer schema and route info
- [Airports](/md/airports) — full airport names
- [Getting started](/md/help) — how to navigate this site
