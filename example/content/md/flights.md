---
id: flights
type: section
title: Flights
links:
  - rel: in_section
    target: index
  - rel: related_to
    target: flights-search
  - rel: related_to
    target: flights-book
  - rel: related_to
    target: airports
---

# Flights

Wayfare offers one-way flights between all 15 cities in our network. Every city connects to every other city, giving you 210 possible routes to choose from.

## How to search

Head over to [search flights](/flights-search) to find available offers. You'll need two airport codes — one for departure and one for arrival. You can also narrow results by date, cabin class, and maximum price.

Here's a quick example — flights from Stockholm to London:

`GET /api/flights/search?from=ARN&to=LHR`

## What you'll get

Each search result is a flight offer with details like airline, flight number, departure and arrival times, number of stops, and price in EUR. Flights are available in economy and business class.

Every offer has a unique `offer_id`. You can use it to get the full details of a specific flight:

`GET /api/flights/offers/{offer_id}`

## Cities and codes

| City | Code | City | Code | City | Code |
|------|------|------|------|------|------|
| Stockholm | ARN | London | LHR | Paris | CDG |
| Amsterdam | AMS | Frankfurt | FRA | Barcelona | BCN |
| Madrid | MAD | Rome | FCO | Berlin | BER |
| Copenhagen | CPH | Oslo | OSL | Helsinki | HEL |
| Vienna | VIE | Zurich | ZRH | New York | JFK |

For return trips, search each direction separately — all routes are one-way.

## Ready to book?

Once you've picked a flight, you can reserve it on the [book flight](/flights-book) page. You can also book a flight and hotel together as a package — see [bookings](/bookings).
