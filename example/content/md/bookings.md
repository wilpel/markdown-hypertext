---
id: bookings
type: section
title: Bookings
links:
  - rel: in_section
    target: index
  - rel: related_to
    target: flights-book
  - rel: related_to
    target: hotels-book
  - rel: related_to
    target: package-book
action:
  id: bookings.get
  title: Get Booking
  method: GET
  url: /api/bookings/{id}
  accept: application/json
  auth:
    type: none
---

# Bookings

This is where you manage your reservations. You can book flights, hotels, or both together as a package.

## How booking works

1. **Search** — find flights with [search flights](/flights-search) or hotels with [search hotels](/hotels-search)
2. **Choose** — pick a flight offer or a hotel and room type from the results
3. **Confirm** — review the details and confirm with the user before proceeding
4. **Book** — submit the booking to [book flight](/flights-book), [book hotel](/hotels-book), or [book package](/package-book) for both at once
5. **Done** — the response includes a `booking_id` and `confirmation_code`

## Looking up a booking

To retrieve any booking by its ID:

`GET /api/bookings/{booking_id}`

This returns the full booking record — confirmation code, flight or hotel details, traveler info, and price breakdown.

## Booking types

There are three kinds of bookings:

- **Flight** — a flight reservation for one or more passengers. Booking IDs start with `bkg_f_`. See [book flight](/flights-book).
- **Hotel** — a hotel room reservation for specific dates. Booking IDs start with `bkg_h_`. See [book hotel](/hotels-book).
- **Package** — a flight and hotel booked together. Booking IDs start with `bkg_p_`. See [book package](/package-book).

## Good to know

Bookings are stored in memory and reset when the server restarts. This is a demo site for testing purposes.
