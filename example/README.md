# Wayfare (Example MDH Site)

A travel search site built with [MDH](../README.md). 15 cities across Europe and North America. Flights, hotels, and bookings, all through GET requests.

Live at [markdown-hypertext-example.vercel.app](https://markdown-hypertext-example.vercel.app).

## Running locally

```bash
npm install
npm run dev
```

Starts at `http://localhost:3000`.

## Why GET-only

Every endpoint uses GET, including bookings. Normally you'd use POST for state-changing operations, but most AI agents today only have read-only tools like `webfetch`. Using GET everywhere means any agent can use every feature without needing special HTTP capabilities. See the main README's [GET vs POST section](../README.md#get-actions) for more on this.

## How an agent uses the site

```
GET /                    -> root page: overview, airport codes, links to sections
GET /flights             -> flights section: routes, search examples
GET /flights-search      -> search page: parameters, pagination, action definition
GET /api/flights/search?from=ARN&to=LHR  -> actual search, returns JSON
GET /api/flights/offers/off_arn_lhr_1     -> details for one offer
GET /flights-book        -> booking page: how to book, confirms with user first
GET /api/flights/book?offer_id=off_arn_lhr_1&passenger=Alice+Lindqvist  -> books it
GET /api/bookings/bkg_f_1  -> look up the booking
```

The same pattern works for hotels: `/hotels` > `/hotels-search` > `/api/hotels/search?city=LHR` > `/hotels-book` > `/api/hotels/book?...`

You can also book a flight and hotel together through `/package-book` and `/api/bookings/package`.

## Content negotiation

Every page responds differently based on the `Accept` header:

- No header or `text/markdown`: raw Markdown with YAML frontmatter
- `application/json`: parsed frontmatter as structured JSON
- `text/html`: simple HTML with clickable links

## Pages

The site has 11 pages:

- `/` - root page with site overview, airport codes, and key search actions
- `/flights` and `/hotels` - section pages with overviews and examples
- `/flights-search` and `/hotels-search` - how to search, with parameter docs and action definitions
- `/flights-book`, `/hotels-book`, `/package-book` - how to book (all include "confirm with user first" guidance)
- `/bookings` - booking types and how to look up a booking
- `/airports` - reference page with all 15 IATA codes
- `/help` - getting started guide

## API endpoints

**Search:** `/api/flights/search?from=ARN&to=LHR`, `/api/hotels/search?city=LHR`

**Details:** `/api/flights/offers/{offer_id}`, `/api/hotels/{hotel_id}`

**Book:** `/api/flights/book?offer_id=...&passenger=...`, `/api/hotels/book?hotel_id=...&room_type=...&checkin=...&checkout=...&guest=...`, `/api/bookings/package?offer_id=...&hotel_id=...&room_type=...&checkin=...&checkout=...&passenger=...`

**Lookup:** `/api/bookings/{booking_id}`

Passenger and guest names are passed as query params. For multiple people, repeat the parameter: `&passenger=Alice+Lindqvist&passenger=Bob+Smith`

Full parameter docs are on the search and booking pages in the site itself.

## Airport codes

ARN (Stockholm), LHR (London), CDG (Paris), AMS (Amsterdam), FRA (Frankfurt), BCN (Barcelona), MAD (Madrid), FCO (Rome), BER (Berlin), CPH (Copenhagen), OSL (Oslo), HEL (Helsinki), VIE (Vienna), ZRH (Zurich), JFK (New York)

Every city connects to every other city for flights. Each city has 5 hotels.

## Date behavior

Search results change slightly depending on the requested date. Odd days (1st, 3rd, 5th...) return original prices in normal sort order. Even days (2nd, 4th, 6th...) bump prices by 15% and reverse the sort. This fakes price variation without a live pricing engine.

## Project structure

```
├── content/md/          # 11 Markdown pages
├── data/                # flights.json, hotels.json
├── app/                 # Next.js route handlers
│   ├── route.js         # root page
│   ├── [node]/route.js  # dynamic page handler
│   └── api/             # search, booking, and lookup endpoints
└── lib/
    ├── content.js       # reads markdown, parses frontmatter, renders HTML
    └── bookings.js      # in-memory booking store
```

Bookings live in memory and reset on server restart. All prices are in EUR.
