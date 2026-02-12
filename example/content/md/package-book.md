---
id: package-book
type: page
title: Book Package (Flight + Hotel)
links:
  - rel: in_section
    target: bookings
  - rel: related_to
    target: flights-search
  - rel: related_to
    target: hotels-search
  - rel: related_to
    target: flights-book
  - rel: related_to
    target: hotels-book
action:
  id: bookings.book_package
  title: Book Package
  method: POST
  url: /api/bookings/package
  content_type: application/json
  accept: application/json
  auth:
    type: none
  body_schema:
    required:
      - offer_id
      - hotel_id
      - room_type
      - checkin
      - checkout
      - passengers
    properties:
      offer_id:
        type: string
        description: The offer_id from a flight search result
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
      passengers:
        type: array
        description: List of passenger objects (used for the flight)
        items:
          required:
            - first_name
            - last_name
          properties:
            first_name:
              type: string
            last_name:
              type: string
      guests:
        type: array
        description: "List of hotel guest objects. Optional — defaults to passengers if omitted."
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

# Book Package (Flight + Hotel)

Book a flight and hotel together in a single request. This creates one combined booking with a single `booking_id` and `confirmation_code`.

## Endpoint

`POST /api/bookings/package`

Content-Type: `application/json`

## Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `offer_id` | string | yes | The `offer_id` from a flight search result |
| `hotel_id` | string | yes | The `hotel_id` from a hotel search result |
| `room_type` | string | yes | Room type (e.g. `standard`, `superior`, `suite`) |
| `checkin` | string | yes | Check-in date in `YYYY-MM-DD` format |
| `checkout` | string | yes | Check-out date in `YYYY-MM-DD` format |
| `passengers` | array | yes | List of passengers for the flight |
| `passengers[].first_name` | string | yes | Passenger first name |
| `passengers[].last_name` | string | yes | Passenger last name |
| `guests` | array | no | List of hotel guests. Defaults to `passengers` if omitted. |
| `guests[].first_name` | string | yes | Guest first name |
| `guests[].last_name` | string | yes | Guest last name |

## Validation

- `checkout` must be after `checkin`
- Number of guests must not exceed the room's `max_guests` capacity
- `room_type` must be one of the types offered by the hotel
- Both `offer_id` and `hotel_id` must exist

## Example request

```bash
curl -X POST http://<host>/api/bookings/package \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id": "off_arn_bcn_1",
    "hotel_id": "htl_bcn_1",
    "room_type": "standard",
    "checkin": "2026-03-10",
    "checkout": "2026-03-13",
    "passengers": [
      { "first_name": "Alice", "last_name": "Lindqvist" }
    ]
  }'
```

## Response

Returns a booking receipt with status `201 Created`:

```json
{
  "booking_id": "bkg_p_a1b2c3d4",
  "confirmation_code": "X7K9P2",
  "type": "package",
  "status": "confirmed",
  "created_at": "2026-03-01T12:00:00.000Z",
  "flight": {
    "offer_id": "off_arn_bcn_1",
    "airline": "SAS",
    "flight_number": "SK1001",
    "departure": "2026-03-10T07:15:00",
    "arrival": "2026-03-10T10:45:00",
    "route": { "from": "ARN", "to": "BCN" }
  },
  "passengers": [
    { "first_name": "Alice", "last_name": "Lindqvist" }
  ],
  "hotel": {
    "hotel_id": "htl_bcn_1",
    "name": "Hotel Arts Barcelona",
    "city": "Barcelona",
    "city_code": "BCN",
    "stars": 5
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
    "flight": {
      "per_passenger": { "amount": 189, "currency": "EUR" },
      "total": { "amount": 189, "currency": "EUR" },
      "passenger_count": 1
    },
    "hotel": {
      "per_night": { "amount": 185, "currency": "EUR" },
      "nights": 3,
      "total": { "amount": 555, "currency": "EUR" },
      "guest_count": 1
    },
    "total": { "amount": 744, "currency": "EUR" }
  }
}
```

## Flow

1. Search for flights with [search flights](/flights-search)
2. Search for hotels with [search hotels](/hotels-search)
3. Pick a flight offer and a hotel + room type
4. POST to this endpoint with both selections, dates, and traveler info
5. Save the `booking_id` from the response
6. Retrieve the booking anytime with `GET /api/bookings/{booking_id}` — see [bookings](/bookings)

Total price is `(flight per_passenger × passengers) + (hotel per_night × nights)`.
