---
id: hotels-book
type: page
title: Book Hotel
links:
  - rel: in_section
    target: hotels
  - rel: related_to
    target: hotels-search
  - rel: related_to
    target: bookings
action:
  id: hotels.book
  title: Book Hotel
  method: POST
  url: /api/hotels/book
  content_type: application/json
  accept: application/json
  auth:
    type: none
  body_schema:
    required:
      - hotel_id
      - room_type
      - checkin
      - checkout
      - guests
    properties:
      hotel_id:
        type: string
        description: The hotel_id from a hotel search result
      room_type:
        type: string
        description: "Room type (e.g. standard, superior, suite)"
      checkin:
        type: string
        description: Check-in date (YYYY-MM-DD)
      checkout:
        type: string
        description: Check-out date (YYYY-MM-DD)
      guests:
        type: array
        description: List of guest objects
        items:
          required:
            - first_name
            - last_name
          properties:
            first_name:
              type: string
            last_name:
              type: string
---

# Book Hotel

Book a hotel room by submitting a POST request with hotel details, dates, and guest information.

## Endpoint

`POST /api/hotels/book`

Content-Type: `application/json`

## Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hotel_id` | string | yes | The `hotel_id` from a hotel search result |
| `room_type` | string | yes | Room type (e.g. `standard`, `superior`, `suite`) |
| `checkin` | string | yes | Check-in date in `YYYY-MM-DD` format |
| `checkout` | string | yes | Check-out date in `YYYY-MM-DD` format |
| `guests` | array | yes | List of guests |
| `guests[].first_name` | string | yes | Guest first name |
| `guests[].last_name` | string | yes | Guest last name |

## Validation

- `checkout` must be after `checkin`
- Number of guests must not exceed the room's `max_guests` capacity
- `room_type` must be one of the types offered by that hotel

## Example request

```bash
curl -X POST http://<host>/api/hotels/book \
  -H "Content-Type: application/json" \
  -d '{
    "hotel_id": "htl_cdg_1",
    "room_type": "standard",
    "checkin": "2026-03-10",
    "checkout": "2026-03-13",
    "guests": [
      { "first_name": "Alice", "last_name": "Lindqvist" }
    ]
  }'
```

## Response

Returns a booking receipt with status `201 Created`:

```json
{
  "booking_id": "bkg_h_e5f6g7h8",
  "confirmation_code": "M3N8R5",
  "type": "hotel",
  "status": "confirmed",
  "created_at": "2026-03-01T12:00:00.000Z",
  "hotel": {
    "hotel_id": "htl_cdg_1",
    "name": "Hotel Le Marais",
    "city": "Paris",
    "city_code": "CDG",
    "stars": 4
  },
  "room": {
    "type": "standard",
    "beds": "1 queen"
  },
  "stay": {
    "checkin": "2026-03-10",
    "checkout": "2026-03-13",
    "nights": 3
  },
  "guests": [
    { "first_name": "Alice", "last_name": "Lindqvist" }
  ],
  "price": {
    "per_night": { "amount": 185, "currency": "EUR" },
    "nights": 3,
    "total": { "amount": 555, "currency": "EUR" },
    "guest_count": 1
  }
}
```

## Flow

1. Search for hotels with [search hotels](/hotels-search)
2. Pick a hotel and room type from the results
3. POST to this endpoint with hotel ID, room type, dates, and guests
4. Save the `booking_id` from the response
5. Retrieve the booking anytime with `GET /api/bookings/{booking_id}` — see [bookings](/bookings)

Total price is calculated as `per_night × number of nights`.
