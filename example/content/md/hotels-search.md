---
id: hotels-search
type: page
title: Search Hotels
links:
  - rel: in_section
    target: hotels
    href: /hotels
  - rel: related_to
    target: airports
    href: /airports
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

Browse hotels in any of Wayfare's 15 cities. Each city has a mix of properties across star ratings and price ranges.

## How to search

Make a GET request to `/api/hotels/search` with a city code. You can optionally filter by dates, star rating, nightly budget, and guest count.

`GET /api/hotels/search?city=LHR&checkin=2026-03-10&checkout=2026-03-14&min_stars=4`

| Parameter | Required | Description |
|-----------|----------|-------------|
| `city` | yes | City airport code (e.g. LHR, CDG, JFK) |
| `checkin` | no | Check-in date in YYYY-MM-DD format |
| `checkout` | no | Check-out date in YYYY-MM-DD format |
| `min_stars` | no | Minimum star rating (2–5) |
| `max_price` | no | Maximum price per night in EUR |
| `guests` | no | Number of guests (filters to rooms that fit) |
| `limit` | no | Results per page (default 10, max 50) |
| `cursor` | no | Pagination cursor from a previous response |

When you include `checkin` and `checkout`, the response calculates the number of nights for you.

## What's in each result

Each hotel listing includes the name, city, star rating, neighborhood, amenities, and all available room types. Room types show the price per night, bed configuration, and maximum guests. Every hotel has a unique `hotel_id`.

## Getting full details

To see everything about a specific hotel, request it by ID:

`GET /api/hotels/{hotel_id}`

This returns the complete hotel record including all room options.

See [airports](/airports) for valid city codes, which use the same IATA codes. Ready to book? See [book hotel](/hotels-book).
