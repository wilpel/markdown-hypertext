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
    target: airports
---

# Getting Started

This site is an MDH-enabled travel search API. Here's how to navigate it.

## Discovery

Start at `/` or `/md/index` to read this site's root page. Two artifacts describe the site structure:

- **nodes.json** — lists every page on this site with its ID, title, and type (`/mdh/nodes.json`)
- **actions.json** — lists API actions you can call (`/mdh/actions.json`)

## Navigation

Each page is a Markdown document at `/md/{name}`. Pages link to each other using standard markdown links. Follow the links to navigate between pages.

Read the frontmatter at the top of each page to see its `id`, `type`, and `links` (connections to other pages).

## Doing things

The [search flights](/md/flights-search) page describes the flight search action. The [search hotels](/md/hotels-search) page describes the hotel search action. Both are GET requests — build the URL with query parameters and fetch it.

Each search result includes an ID (`offer_id` for flights, `hotel_id` for hotels). Use the ID with the detail endpoint to get the full record.

## Typical flow

1. Read `/` or `/md/index` for an overview
2. Read `/mdh/nodes.json` to see all pages
3. Read `/mdh/actions.json` to see available actions
4. Navigate to [search flights](/md/flights-search) or [search hotels](/md/hotels-search) to learn the parameters
5. Call `GET /api/flights/search?from=ARN&to=BCN` to search flights
6. Call `GET /api/flights/offers/off_arn_bcn_1` to get flight details
7. Call `GET /api/hotels/search?city=BCN` to find hotels at the destination
8. Call `GET /api/hotels/htl_bcn_1` to get hotel details

See [airports](/md/airports) for valid city/airport codes.
