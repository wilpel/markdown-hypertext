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
  method: GET
  url: /api/flights/book
  accept: application/json
  auth:
    type: none
  query:
    required:
      - offer_id
      - passenger
    properties:
      offer_id:
        type: string
        description: The offer_id from a flight search result
      passenger:
        type: string
        description: "Passenger full name (e.g. Alice Lindqvist). Repeat for multiple passengers."
---

# Book Flight

Reserve a flight for one or more passengers. You'll need an `offer_id` from a flight search. See [search flights](/flights-search) to find one.

## Important: confirm with the user first

Before making this booking request, always show the user a summary of what will be booked: the flight details (airline, route, times, cabin class), the price per passenger, the total price, and the passenger names. Only proceed after the user confirms.

## How to book

Fetch `/api/flights/book` with the offer ID and passenger names:

`GET /api/flights/book?offer_id=off_arn_lhr_1&passenger=Alice+Lindqvist`

For multiple passengers, repeat the `passenger` parameter:

`GET /api/flights/book?offer_id=off_arn_lhr_1&passenger=Alice+Lindqvist&passenger=Bob+Smith`

The total price is calculated as the per-passenger price multiplied by the number of passengers.

## What you'll get back

A confirmed booking with a `booking_id` and `confirmation_code`. The response includes the full flight details, passenger list, and price breakdown.

You can retrieve the booking anytime with `GET /api/bookings/{booking_id}`. See [bookings](/bookings).

## Steps

1. [Search for flights](/flights-search) and pick an offer
2. Show the user a summary and get confirmation
3. Fetch `/api/flights/book` with the `offer_id` and passengers
4. Save the `booking_id` from the response
