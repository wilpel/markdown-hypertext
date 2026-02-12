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

Find available flight offers between any two cities in the Wayfare network. All 15 cities connect to each other, so you can search any origin-destination pair.

## How to search

Make a GET request to `/api/flights/search` with your departure and arrival airports. You can optionally filter by date, cabin class, and maximum price.

`GET /api/flights/search?from=ARN&to=LHR&date=2026-03-10&cabin=economy`

| Parameter | Required | Description |
|-----------|----------|-------------|
| `from` | yes | Departure airport IATA code (e.g. ARN) |
| `to` | yes | Arrival airport IATA code (e.g. LHR) |
| `date` | no | Travel date in YYYY-MM-DD format |
| `cabin` | no | `economy` or `business` |
| `max_price` | no | Maximum price in EUR |
| `limit` | no | Results per page (default 10, max 50) |
| `cursor` | no | Pagination cursor from a previous response |

Results are sorted by departure time. If there are more results than fit on one page, the response includes a `next_cursor` value — pass it as `cursor` in your next request to get the next page.

## What's in each result

Each flight offer includes the airline, flight number, departure and arrival times, flight duration, number of stops, price, and cabin class. Every offer has a unique `offer_id`.

## Getting full details

To see everything about a specific offer, request it by ID:

`GET /api/flights/offers/{offer_id}`

This returns the complete offer record.

See [airports](/airports) for valid airport codes. Ready to book? See [book flight](/flights-book).
