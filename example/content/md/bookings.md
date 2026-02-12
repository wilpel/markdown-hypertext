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

This section covers booking flights and hotels, and retrieving booking confirmations.

## Booking flow

1. **Search** — find flights with [search flights](/md/flights-search) or hotels with [search hotels](/md/hotels-search)
2. **Select** — pick an offer (flight) or hotel + room type from the results
3. **Book** — submit a POST request to [book flight](/md/flights-book) or [book hotel](/md/hotels-book)
4. **Confirm** — the response includes a `booking_id` and `confirmation_code`
5. **Retrieve** — look up any booking with `GET /api/bookings/{booking_id}`

## Retrieve a booking

`GET /api/bookings/{booking_id}`

Returns the full booking record including confirmation code, details, and price breakdown.

### Example

```bash
curl http://localhost:3000/api/bookings/bkg_f_a1b2c3d4
```

### Response

Returns the same receipt object that was returned when the booking was created.

## Booking types

- **Flight bookings** — ID prefix `bkg_f_`. See [book flight](/md/flights-book).
- **Hotel bookings** — ID prefix `bkg_h_`. See [book hotel](/md/hotels-book).

## Notes

Bookings are stored in memory and reset when the server restarts. This is a mock API for demonstration purposes.
