import { NextResponse } from "next/server";
import { getFlightData } from "@/lib/content";

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date");
  const cabin = searchParams.get("cabin");
  const maxPrice = searchParams.get("max_price");
  const cursor = searchParams.get("cursor");
  const rawLimit = searchParams.get("limit");

  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to are required query parameters" },
      { status: 400, headers: NO_CACHE }
    );
  }

  const flightData = getFlightData();
  let offers = [];

  for (const route of flightData.routes) {
    if (
      route.from.toUpperCase() === from.toUpperCase() &&
      route.to.toUpperCase() === to.toUpperCase()
    ) {
      offers = offers.concat(route.offers);
    }
  }

  if (date) {
    offers = offers.filter((o) => o.departure.startsWith(date));
  }

  if (cabin) {
    offers = offers.filter((o) => o.cabin === cabin.toLowerCase());
  }

  if (maxPrice) {
    const mp = parseFloat(maxPrice);
    if (!isNaN(mp)) {
      offers = offers.filter((o) => o.price.amount <= mp);
    }
  }

  offers.sort((a, b) => a.departure.localeCompare(b.departure));

  const pageSize = Math.min(parseInt(rawLimit) || 10, 50);
  let startIdx = 0;

  if (cursor) {
    const idx = offers.findIndex((o) => o.offer_id === cursor);
    if (idx !== -1) startIdx = idx + 1;
  }

  const page = offers.slice(startIdx, startIdx + pageSize);
  const hasMore = startIdx + pageSize < offers.length;
  const nextCursor = hasMore ? page[page.length - 1].offer_id : null;

  return NextResponse.json(
    { results: page, total: offers.length, next_cursor: nextCursor },
    { headers: NO_CACHE }
  );
}
