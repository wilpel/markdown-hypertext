---
id: hotels-search
type: page
title: Search Hotels
links:
  - rel: in_section
    target: hotels
  - rel: related_to
    target: airports
actions:
  - id: hotels.search
    method: GET
    url: /api/hotels/search
    accept: application/json
    query:
      required: [city]
      optional: [checkin, checkout, min_stars, max_price, guests, limit, cursor]
    pagination:
      type: cursor
      request:
        cursor_param: cursor
        limit_param: limit
      response:
        next_cursor_jsonpath: "$.next_cursor"
  - id: hotels.get
    method: GET
    url: /api/hotels/{id}
    accept: application/json
---

# Search Hotels

Search for hotels in a city.

## Search endpoint

`GET /api/hotels/search`

| Parameter | Required | Description |
|-----------|----------|-------------|
| city      | yes      | City airport code (e.g. ARN, CDG, JFK) |
| checkin   | no       | Check-in date in YYYY-MM-DD format |
| checkout  | no       | Check-out date in YYYY-MM-DD format |
| min_stars | no       | Minimum star rating (2-5) |
| max_price | no       | Maximum price per night in EUR |
| guests    | no       | Number of guests (filters to rooms that fit) |
| cursor    | no       | Hotel ID to paginate from (returned as `next_cursor`) |
| limit     | no       | Results per page, default 10, max 50 |

Response:

```json
{
  "results": [ ... ],
  "total": 5,
  "next_cursor": null,
  "dates": { "checkin": "2026-03-10", "checkout": "2026-03-13", "nights": 3 }
}
```

Each result is a hotel with a `hotel_id`. Use the hotel ID to get full details.

Example — 4+ star hotels in Paris:

`GET /api/hotels/search?city=CDG&min_stars=4`

Example — hotels in Barcelona under 100 EUR/night:

`GET /api/hotels/search?city=BCN&max_price=100`

## Hotel details

`GET /api/hotels/{id}`

Returns full details for a single hotel by its `hotel_id`, including all room types, prices, amenities, and neighborhood.

Example: `GET /api/hotels/htl_cdg_1`

See [airports](/md/airports) for valid city codes (use the same IATA codes).
