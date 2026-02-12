---
id: flights-book
type: page
title: Book Flight
links:
  - rel: in_section
    target: flights
  - rel: related_to
    target: flights-search
  - rel: related_to
    target: bookings
action:
  id: flights.book
  title: Book Flight
  method: POST
  url: /api/flights/book
  content_type: application/json
  accept: application/json
  auth:
    type: none
  body_schema:
    required:
      - offer_id
      - passengers
    properties:
      offer_id:
        type: string
        description: The offer_id from a flight search result
      passengers:
        type: array
        description: List of passenger objects
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

# Book Flight

Book a flight by submitting a POST request with an offer ID and passenger details.

## Endpoint

`POST /api/flights/book`

Content-Type: `application/json`

## Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `offer_id` | string | yes | The `offer_id` from a flight search result |
| `passengers` | array | yes | List of passengers |
| `passengers[].first_name` | string | yes | Passenger first name |
| `passengers[].last_name` | string | yes | Passenger last name |

## Example request

```bash
curl -X POST http://localhost:3000/api/flights/book \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id": "off_arn_bcn_1",
    "passengers": [
      { "first_name": "Alice", "last_name": "Lindqvist" }
    ]
  }'
```

## Response

Returns a booking receipt with status `201 Created`:

```json
{
  "booking_id": "bkg_f_a1b2c3d4",
  "confirmation_code": "X7K9P2",
  "type": "flight",
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
  "price": {
    "per_passenger": { "amount": 189, "currency": "EUR" },
    "total": { "amount": 189, "currency": "EUR" },
    "passenger_count": 1
  }
}
```

## Flow

1. Search for flights with [search flights](/md/flights-search)
2. Pick an offer from the results
3. POST to this endpoint with the `offer_id` and passenger list
4. Save the `booking_id` from the response
5. Retrieve the booking anytime with `GET /api/bookings/{booking_id}` — see [bookings](/md/bookings)

Total price is calculated as `per_passenger × number of passengers`.
