---
id: hotels
type: section
title: Hotels
links:
  - rel: in_section
    target: index
  - rel: related_to
    target: hotels-search
  - rel: related_to
    target: hotels-book
  - rel: related_to
    target: airports
---

# Hotels

Every city in the Wayfare network has a selection of hotels, from affordable hostels to luxury 5-star properties. There are 5 hotels per city, 75 in total.

## How to search

Go to [search hotels](/hotels-search) to browse what's available. You just need a city code. You can also filter by check-in/checkout dates, star rating, nightly budget, and number of guests.

Here's a quick example — hotels in London:

`GET /api/hotels/search?city=LHR`

Or 4+ star hotels in Paris for specific dates:

`GET /api/hotels/search?city=CDG&checkin=2026-03-10&checkout=2026-03-14&min_stars=4`

## What you'll get

Each hotel listing includes the name, star rating, neighborhood, amenities (wifi, breakfast, gym, etc.), and a list of room types with prices per night in EUR.

Room types vary by property — budget hotels offer standard rooms, while higher-rated hotels also have superior rooms and suites. Each room type shows the price per night, bed configuration, and maximum guest capacity.

Every hotel has a unique `hotel_id`. Use it to get full details:

`GET /api/hotels/{hotel_id}`

## Ready to book?

Found a hotel you like? Reserve a room on the [book hotel](/hotels-book) page. You can also book a flight and hotel together — see [bookings](/bookings).
