---
id: flights-book
type: page
title: Book Flight
links:
  - rel: in_section
    target: flights
    href: /flights
  - rel: related_to
    target: flights-search
    href: /flights-search
  - rel: related_to
    target: bookings
    href: /bookings
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

Reserve a flight for one or more passengers. You'll need an `offer_id` from a flight search — see [search flights](/flights-search) to find one.

## Important: confirm with the user first

Before making this booking request, always show the user a summary of what will be booked — the flight details (airline, route, times, cabin class), the price per passenger, the total price, and the passenger names. Only proceed after the user confirms.

## How to book

Send a POST request to `/api/flights/book` with the offer ID and passenger details:

```json
{
  "offer_id": "off_arn_lhr_1",
  "passengers": [
    { "first_name": "Alice", "last_name": "Lindqvist" }
  ]
}
```

The total price is calculated as the per-passenger price multiplied by the number of passengers.

## What you'll get back

A confirmed booking with a `booking_id` and `confirmation_code`. The response includes the full flight details, passenger list, and price breakdown.

You can retrieve the booking anytime with `GET /api/bookings/{booking_id}` — see [bookings](/bookings).

## Steps

1. [Search for flights](/flights-search) and pick an offer
2. Show the user a summary and get confirmation
3. POST to `/api/flights/book` with the `offer_id` and passengers
4. Save the `booking_id` from the response
