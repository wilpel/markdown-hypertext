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
    target: airports
---

# Flights

This section covers flight search across all supported cities.

## Searching

Use the [search action](/md/flights-search) to find offers between two airports. You can filter by date, cabin class, and maximum price. Results are paginated with cursor-based pagination.

Each search result includes an `offer_id`. Use it with `GET /api/flights/offers/{id}` to get full details for a specific flight. See [search flights](/md/flights-search) for the complete API reference.

## Cities

Wayfare covers 15 cities. Every city connects to every other city — search any pair to see available offers.

| City | Code |
|------|------|
| Stockholm | ARN |
| London | LHR |
| Paris | CDG |
| Amsterdam | AMS |
| Frankfurt | FRA |
| Barcelona | BCN |
| Madrid | MAD |
| Rome | FCO |
| Berlin | BER |
| Copenhagen | CPH |
| Oslo | OSL |
| Helsinki | HEL |
| Vienna | VIE |
| Zurich | ZRH |
| New York | JFK |

All routes are one-way. For return trips, search each direction separately.

## Offer data

Each offer includes: airline, flight number, departure and arrival times, duration in minutes, number of stops, price (amount + currency), and cabin class (economy or business).

For the full list of airport codes and names, see [airports](/md/airports). Looking for hotels too? See [hotels](/md/hotels).
