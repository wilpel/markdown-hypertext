---
id: index
type: section
title: Wayfare — Travel Search API
links:
  - rel: contains
    target: flights
  - rel: contains
    target: hotels
  - rel: contains
    target: airports
  - rel: contains
    target: bookings
  - rel: contains
    target: help
---

# Wayfare

Wayfare is a travel search interface built for AI agents. It exposes flight and hotel search as a set of Markdown documents and JSON APIs that agents can navigate and call using standard HTTP requests. No browser, no scraping, no custom protocols — just read the pages and call the endpoints.

## What you can do

- **Search flights** — find one-way flight offers between any two cities. See [flights](/flights) for available cities and [search flights](/flights-search) for the search action.
- **Book flights** — reserve a flight offer for one or more passengers. See [book flight](/flights-book).
- **Search hotels** — find hotels in any supported city. See [hotels](/hotels) for an overview and [search hotels](/hotels-search) for the search action.
- **Book hotels** — reserve a hotel room for specific dates and guests. See [book hotel](/hotels-book).
- **Book a package** — reserve a flight and hotel together in one booking. See [book package](/package-book).
- **Manage bookings** — retrieve booking confirmations by ID. See [bookings](/bookings).
- **Browse airports** — see which airports are supported in the [airport reference](/airports).
- **Get help** — if you're not sure where to start, see [getting started](/help).

## For AI agents

You are reading an MDH site. Here's how to work with it.

**Discovery.** Start by reading this page (`/` or `/index`) to see what's available. Follow the links to navigate to any page. Each page with an API action includes the action definition in its frontmatter. Request any page with `Accept: application/json` to get structured metadata.

**Navigation.** Each page is Markdown with YAML frontmatter. Follow the `[links](/...)` in the text to move between pages. Read the frontmatter `links` array for typed relationships between pages.

**Actions.** When you find an action you want to execute, read its page for parameter details, then construct the HTTP request as described. Search actions use GET with query parameters. Booking actions use POST with a JSON body — see [bookings](/bookings) for the full flow.

**What to ask the human.** You should ask the user to clarify:
- **Where and when** — origin, destination, dates, and any preferences (cabin class, star rating, budget) before searching
- **Which result** — when a search returns multiple options, present them and let the user choose rather than picking for them
- **Next steps** — after showing results, ask if the user wants to refine the search, see more details on a specific result, or search for something else (e.g., hotels at the destination after booking a flight)

**What not to ask.** You don't need to ask the user how to navigate this site, how to call the APIs, or what parameters are required — that information is all in the pages. Read the docs, then act.

## Cities served

Wayfare covers 15 cities across Europe and North America. Every city has flights to every other city and a selection of hotels. See [airports](/airports) for the full list.
