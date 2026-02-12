---
id: "doc:flights"
type: section
title: Flights
links:
  - rel: in_section
    target: "doc:index"
  - rel: related_to
    target: "doc:flights-search"
  - rel: related_to
    target: "doc:airports"
---

# Flights

This section covers flight search and available routes.

## Searching

Use the search action described in [[doc:flights-search]] to find offers between two airports. You can filter by date, cabin class, and maximum price. Results are paginated with cursor-based pagination.

## Available routes

| From | To | Typical offers |
|------|-----|----------------|
| ARN  | BCN | 3 |
| ARN  | LHR | 3 |
| JFK  | CDG | 3 |
| LHR  | JFK | 2 |
| CDG  | ARN | 4 |

All routes are one-way. For return trips, search each direction separately.

## Offer data

Each offer includes: airline, flight number, departure and arrival times, duration in minutes, number of stops, price (amount + currency), and cabin class (economy or business).

For the full list of supported airport codes, see [[doc:airports]].
