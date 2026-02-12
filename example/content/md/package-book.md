---
id: package-book
type: page
title: Book Package
links:
  - rel: in_section
    target: bookings
    href: /bookings
  - rel: related_to
    target: flights-search
    href: /flights-search
  - rel: related_to
    target: hotels-search
    href: /hotels-search
  - rel: related_to
    target: flights-book
    href: /flights-book
  - rel: related_to
    target: hotels-book
    href: /hotels-book
action:
  id: bookings.book_package
  title: Book Package
  method: GET
  url: /api/bookings/package
  accept: application/json
  auth:
    type: none
  query:
    required:
      - offer_id
      - hotel_id
      - room_type
      - checkin
      - checkout
      - passenger
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
      passenger:
        type: string
        description: "Passenger full name (e.g. Alice Lindqvist). Repeat for multiple passengers."
      guest:
        type: string
        description: "Hotel guest full name. Optional — defaults to passengers if omitted. Repeat for multiple guests."
---

# Book Package

Book a flight and hotel together in one request. This creates a single booking with one `booking_id` and `confirmation_code` covering both the flight and the hotel stay.

This is a convenient alternative to booking separately with [book flight](/flights-book) and [book hotel](/hotels-book).

## Important: confirm with the user first

Before making this booking request, always show the user a complete summary — the flight (airline, route, times, cabin, price), the hotel (name, stars, room type, dates, nightly rate), the total combined price, and the traveler names. Only proceed after the user confirms.

## How to book

Fetch `/api/bookings/package` with the flight offer, hotel details, dates, and traveler names:

`GET /api/bookings/package?offer_id=off_arn_lhr_1&hotel_id=htl_lhr_1&room_type=standard&checkin=2026-03-10&checkout=2026-03-14&passenger=Alice+Lindqvist`

The `guest` parameter is optional — if omitted, the passengers are used as the hotel guests too. To specify different hotel guests, add `guest` parameters:

`GET /api/bookings/package?offer_id=off_arn_lhr_1&hotel_id=htl_lhr_1&room_type=standard&checkin=2026-03-10&checkout=2026-03-14&passenger=Alice+Lindqvist&guest=Alice+Lindqvist&guest=Bob+Smith`

## What you'll get back

A confirmed booking with flight details, hotel details, stay info, and a combined price breakdown showing the flight cost, hotel cost, and grand total.

You can retrieve the booking anytime with `GET /api/bookings/{booking_id}` — see [bookings](/bookings).

## Steps

1. [Search for flights](/flights-search) and pick an offer
2. [Search for hotels](/hotels-search) and pick a hotel and room type
3. Show the user a full summary and get confirmation
4. Fetch `/api/bookings/package` with both selections, dates, and traveler names
5. Save the `booking_id` from the response
