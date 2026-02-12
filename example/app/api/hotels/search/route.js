import { NextResponse } from "next/server";
import { getHotelData } from "@/lib/content";

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const checkin = searchParams.get("checkin");
  const checkout = searchParams.get("checkout");
  const minStars = searchParams.get("min_stars");
  const maxPrice = searchParams.get("max_price");
  const guests = searchParams.get("guests");
  const cursor = searchParams.get("cursor");
  const rawLimit = searchParams.get("limit");

  if (!city) {
    return NextResponse.json(
      { error: "city is a required query parameter" },
      { status: 400, headers: NO_CACHE }
    );
  }

  const hotelData = getHotelData();
  let results = hotelData.hotels.filter(
    (h) => h.city_code.toUpperCase() === city.toUpperCase()
  );

  if (minStars) {
    const ms = parseInt(minStars);
    if (!isNaN(ms)) {
      results = results.filter((h) => h.stars >= ms);
    }
  }

  if (maxPrice) {
    const mp = parseFloat(maxPrice);
    if (!isNaN(mp)) {
      results = results.filter((h) =>
        h.rooms.some((r) => r.price_per_night.amount <= mp)
      );
    }
  }

  if (guests) {
    const g = parseInt(guests);
    if (!isNaN(g)) {
      results = results.filter((h) =>
        h.rooms.some((r) => r.max_guests >= g)
      );
    }
  }

  // Vary results by odd/even checkin day
  const day = checkin ? parseInt(checkin.split("-")[2], 10) : 1;
  const isEven = day % 2 === 0;

  if (isEven) {
    // Even days: bump room prices by 15%
    results = results.map((h) => ({
      ...h,
      rooms: h.rooms.map((r) => ({
        ...r,
        price_per_night: {
          ...r.price_per_night,
          amount: Math.round(r.price_per_night.amount * 1.15),
        },
      })),
    }));
    // Even days: sort by price descending (most expensive first)
    results.sort((a, b) => b.rooms[0].price_per_night.amount - a.rooms[0].price_per_night.amount || b.stars - a.stars);
  } else {
    // Odd days: normal sort (stars desc, then price asc)
    results.sort((a, b) => b.stars - a.stars || a.rooms[0].price_per_night.amount - b.rooms[0].price_per_night.amount);
  }

  const pageSize = Math.min(parseInt(rawLimit) || 10, 50);
  let startIdx = 0;

  if (cursor) {
    const idx = results.findIndex((h) => h.hotel_id === cursor);
    if (idx !== -1) startIdx = idx + 1;
  }

  const page = results.slice(startIdx, startIdx + pageSize);
  const hasMore = startIdx + pageSize < results.length;
  const nextCursor = hasMore ? page[page.length - 1].hotel_id : null;

  // Include date context in response if provided
  const response = {
    results: page,
    total: results.length,
    next_cursor: nextCursor,
  };

  if (checkin || checkout) {
    response.dates = { checkin: checkin || null, checkout: checkout || null };
    // Calculate nights
    if (checkin && checkout) {
      const nights = Math.round(
        (new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24)
      );
      response.dates.nights = nights > 0 ? nights : null;
    }
  }

  return NextResponse.json(response, { headers: NO_CACHE });
}
