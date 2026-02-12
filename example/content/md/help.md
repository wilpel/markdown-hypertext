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
    target: flights-book
  - rel: related_to
    target: hotels-search
  - rel: related_to
    target: hotels-book
  - rel: related_to
    target: bookings
  - rel: related_to
    target: airports
---

# Getting Started

This site is an MDH-enabled travel search API. Here's how to navigate it.

## Discovery

Start at `/` or `/index` to read this site's root page. It lists all available sections and links to them.

Action definitions live in each page's YAML frontmatter. Request any page with `Accept: application/json` to get structured metadata including actions.

## Navigation

Each page is a Markdown document at `/{name}`. Pages link to each other using standard markdown links. Follow the links to navigate between pages.

Read the frontmatter at the top of each page to see its `id`, `type`, and `links` (connections to other pages).

## Doing things

The [search flights](/flights-search) page describes the flight search action. The [search hotels](/hotels-search) page describes the hotel search action. Both are GET requests — build the URL with query parameters and fetch it.

Each search result includes an ID (`offer_id` for flights, `hotel_id` for hotels). Use the ID with the detail endpoint to get the full record.

To book, use the POST actions described in [book flight](/flights-book) and [book hotel](/hotels-book). After booking, retrieve confirmations via [bookings](/bookings).

## Typical flow

1. Read `/` or `/index` for an overview
2. Follow the links to navigate to sections of interest
3. Navigate to [search flights](/flights-search) or [search hotels](/hotels-search) to learn the parameters
4. Call `GET /api/flights/search?from=ARN&to=BCN` to search flights
5. Call `GET /api/flights/offers/off_arn_bcn_1` to get flight details
6. Call `POST /api/flights/book` with `offer_id` and passengers to book — see [book flight](/flights-book)
7. Call `GET /api/hotels/search?city=BCN` to find hotels at the destination
8. Call `POST /api/hotels/book` with hotel details and guests to book — see [book hotel](/hotels-book)
9. Call `GET /api/bookings/{booking_id}` to retrieve a booking confirmation

See [airports](/airports) for valid city/airport codes.
