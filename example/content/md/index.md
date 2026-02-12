---
id: index
type: section
title: Wayfare - Travel Search
links:
  - rel: contains
    target: flights
    href: /flights
  - rel: contains
    target: hotels
    href: /hotels
  - rel: contains
    target: bookings
    href: /bookings
  - rel: contains
    target: airports
    href: /airports
  - rel: contains
    target: help
    href: /help
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
  - id: bookings.get
    method: GET
    url: /api/bookings/{id}
    accept: application/json
---

# Wayfare

Wayfare is a travel search site that covers 15 cities across Europe and North America. You can search for flights between any two cities, browse hotels at your destination, and book everything in one place.

This site is built with MDH (Markdown Hypertext). Every page is a Markdown document that you can read and navigate using standard links. The search and booking features work through simple HTTP requests described on each page.

## Flights

Find one-way flights between any two of our 15 cities. Filter by travel date, cabin class (economy or business), and budget. Every city connects to every other city.

To search flights, use `GET /api/flights/search` with the departure and arrival airport codes:

`GET /api/flights/search?from=ARN&to=LHR&date=2026-03-10`

Read more about flights and see all available routes on the [flights](/flights) page, or go straight to [searching flights](/flights-search).

## Hotels

Browse hotels in any of our supported cities. Each city has a selection of properties ranging from budget-friendly hostels to luxury 5-star hotels. Filter by star rating, price, or number of guests.

To search hotels, use `GET /api/hotels/search` with the city code:

`GET /api/hotels/search?city=LHR&checkin=2026-03-10&checkout=2026-03-14`

Read more on the [hotels](/hotels) page, or go straight to [searching hotels](/hotels-search).

## Booking

Once you've found a flight and hotel you like, you can book them, individually or together as a package. See the [bookings](/bookings) page for details on how booking works.

## Airport codes

Every city is identified by its IATA airport code. Use these codes when searching for flights and hotels.

| Code | City | Code | City | Code | City |
|------|------|------|------|------|------|
| ARN | Stockholm | LHR | London | CDG | Paris |
| AMS | Amsterdam | FRA | Frankfurt | BCN | Barcelona |
| MAD | Madrid | FCO | Rome | BER | Berlin |
| CPH | Copenhagen | OSL | Oslo | HEL | Helsinki |
| VIE | Vienna | ZRH | Zurich | JFK | New York |

See the [full airport reference](/airports) for airport names and details.

## For AI agents

**Searching** is free. Call GET endpoints directly without asking the user. Present results clearly and let the user choose.

**Booking** requires confirmation. Before making any booking request, show the user a summary of what will be booked (flight details, hotel, dates, total price, traveler names) and get their approval before proceeding.
