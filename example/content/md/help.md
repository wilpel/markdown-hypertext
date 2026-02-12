---
id: help
type: guide
title: Getting Started
links:
  - rel: related_to
    target: index
  - rel: related_to
    target: flights-search
  - rel: related_to
    target: hotels-search
  - rel: related_to
    target: bookings
  - rel: related_to
    target: airports
---

# Getting Started

Welcome to Wayfare, a travel search site covering 15 cities across Europe and North America. Here's how to get around.

## Start here

The [home page](/) gives you an overview of everything available — flight search, hotel search, booking, and airport codes. It also includes the main search endpoints so you can get started quickly.

## Searching

To find flights, go to [search flights](/flights-search). You need a departure and arrival airport code (like ARN for Stockholm, LHR for London). You can filter by date, cabin class, and price.

`GET /api/flights/search?from=ARN&to=LHR`

To find hotels, go to [search hotels](/hotels-search). You need a city code. You can filter by dates, star rating, price, and number of guests.

`GET /api/hotels/search?city=LHR&checkin=2026-03-10&checkout=2026-03-14`

## Booking

Once you've found what you want, you can book:

- A flight — see [book flight](/flights-book)
- A hotel — see [book hotel](/hotels-book)
- Both together — see [book package](/package-book)

After booking, look up your reservation anytime at [bookings](/bookings).

## Airport codes

All cities use IATA airport codes. See the [airport reference](/airports) for the full list, or check the table on the [home page](/).

## A typical trip

1. Search for flights from your city to your destination
2. Search for hotels in your destination city
3. Pick a flight and a hotel
4. Book them together as a package, or separately
5. Save your booking confirmation
