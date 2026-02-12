---
id: index
type: section
title: Wayfare — Travel Search API
links:
  - rel: contains
    target: flights-search
  - rel: contains
    target: hotels-search
  - rel: contains
    target: flights-book
  - rel: contains
    target: hotels-book
  - rel: contains
    target: package-book
  - rel: contains
    target: bookings
  - rel: contains
    target: airports
actions:
  - id: flights.search
    method: GET
    url: /api/flights/search
    accept: application/json
    query:
      required: [from, to]
      optional: [date, cabin, max_price, limit, cursor]
  - id: hotels.search
    method: GET
    url: /api/hotels/search
    accept: application/json
    query:
      required: [city]
      optional: [checkin, checkout, min_stars, max_price, guests, limit, cursor]
  - id: flights.book
    method: POST
    url: /api/flights/book
    content_type: application/json
  - id: hotels.book
    method: POST
    url: /api/hotels/book
    content_type: application/json
  - id: bookings.book_package
    method: POST
    url: /api/bookings/package
    content_type: application/json
  - id: bookings.get
    method: GET
    url: /api/bookings/{id}
    accept: application/json
---

# Wayfare — Travel Search API

Search and book flights and hotels. 15 cities across Europe and North America.

## API endpoints

### Search flights

`GET /api/flights/search?from={IATA}&to={IATA}&date={YYYY-MM-DD}&cabin={economy|business}&max_price={EUR}`

Required: `from`, `to`. Optional: `date`, `cabin`, `max_price`, `limit`, `cursor`.

Example: `GET /api/flights/search?from=ARN&to=JFK&date=2026-03-10&cabin=economy`

### Search hotels

`GET /api/hotels/search?city={IATA}&checkin={YYYY-MM-DD}&checkout={YYYY-MM-DD}&min_stars={2-5}&max_price={EUR}&guests={n}`

Required: `city`. Optional: `checkin`, `checkout`, `min_stars`, `max_price`, `guests`, `limit`, `cursor`.

Example: `GET /api/hotels/search?city=JFK&checkin=2026-03-10&checkout=2026-03-14&min_stars=4`

### Get flight offer details

`GET /api/flights/offers/{offer_id}`

### Get hotel details

`GET /api/hotels/{hotel_id}`

### Book a flight

`POST /api/flights/book` with JSON body: `{ "offer_id": "...", "passengers": [{ "first_name": "...", "last_name": "..." }] }`

### Book a hotel

`POST /api/hotels/book` with JSON body: `{ "hotel_id": "...", "room_type": "...", "checkin": "YYYY-MM-DD", "checkout": "YYYY-MM-DD", "guests": [{ "first_name": "...", "last_name": "..." }] }`

### Book a package (flight + hotel)

`POST /api/bookings/package` with JSON body: `{ "offer_id": "...", "hotel_id": "...", "room_type": "...", "checkin": "YYYY-MM-DD", "checkout": "YYYY-MM-DD", "passengers": [{ "first_name": "...", "last_name": "..." }] }`

### Retrieve a booking

`GET /api/bookings/{booking_id}`

## Airport codes

| Code | City | Code | City | Code | City |
|------|------|------|------|------|------|
| ARN | Stockholm | LHR | London | CDG | Paris |
| AMS | Amsterdam | FRA | Frankfurt | BCN | Barcelona |
| MAD | Madrid | FCO | Rome | BER | Berlin |
| CPH | Copenhagen | OSL | Oslo | HEL | Helsinki |
| VIE | Vienna | ZRH | Zurich | JFK | New York |

## Agent guidelines

- **Search actions (GET) can be called freely** — go ahead and fetch results without asking.
- **Booking actions (POST) must be confirmed with the user first.** Before executing any booking request, show the user a summary of what will be booked (flight details, hotel, dates, price, passenger names) and the exact curl command or request body you intend to send. Only proceed after the user confirms.
- Present search results clearly — show price, times, airline, hotel stars, etc. Let the user pick.
- If a search returns many results, highlight the best options and ask what the user prefers.

## Detailed docs

For full parameter details, response shapes, and examples, see the individual pages:

- [Search flights](/flights-search) · [Book flight](/flights-book)
- [Search hotels](/hotels-search) · [Book hotel](/hotels-book)
- [Book package](/package-book) · [Bookings](/bookings)
- [Airports](/airports) · [Help](/help)
