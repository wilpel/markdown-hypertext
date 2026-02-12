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

Reserve a hotel room for specific dates. You'll need a `hotel_id` and room type from a hotel search — see [search hotels](/hotels-search) to find one.

## Important: confirm with the user first

Before making this booking request, always show the user a summary of what will be booked — the hotel name, star rating, room type, check-in and checkout dates, number of nights, nightly rate, total price, and guest names. Only proceed after the user confirms.

## How to book

Send a POST request to `/api/hotels/book` with the hotel ID, room type, dates, and guest details:

```json
{
  "hotel_id": "htl_lhr_1",
  "room_type": "standard",
  "checkin": "2026-03-10",
  "checkout": "2026-03-14",
  "guests": [
    { "first_name": "Alice", "last_name": "Lindqvist" }
  ]
}
```

The checkout date must be after checkin. The number of guests must fit the room's capacity. The total price is the nightly rate multiplied by the number of nights.

## What you'll get back

A confirmed booking with a `booking_id` and `confirmation_code`. The response includes hotel details, room info, stay dates, guest list, and full price breakdown.

You can retrieve the booking anytime with `GET /api/bookings/{booking_id}` — see [bookings](/bookings).

## Steps

1. [Search for hotels](/hotels-search) and pick a hotel and room type
2. Show the user a summary and get confirmation
3. POST to `/api/hotels/book` with hotel ID, room type, dates, and guests
4. Save the `booking_id` from the response
