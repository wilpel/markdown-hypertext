import { NextResponse } from "next/server";
import { getFlightData } from "@/lib/content";

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

function shiftDate(datetime, targetDate) {
  const time = datetime.split("T")[1];
  return `${targetDate}T${time}`;
}

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
      offers = offers.concat(route.offers.map((o) => ({ ...o })));
    }
  }

  // If a date is provided, shift all departure/arrival times to that date
  // and vary results by odd/even day
  if (date) {
    const day = parseInt(date.split("-")[2], 10);
    const isEven = day % 2 === 0;

    // Shift timestamps to the requested date
    const arrivalDate = offers.some((o) => o.arrival.split("T")[0] !== o.departure.split("T")[0])
      ? null // mixed, compute per-offer
      : date;

    offers = offers.map((o) => {
      const depDate = o.departure.split("T")[0];
      const arrDate = o.arrival.split("T")[0];
      const arrivalSpillover = depDate !== arrDate;

      const newDep = shiftDate(o.departure, date);
      // If the arrival was the next day, keep that offset
      let newArr;
      if (arrivalSpillover) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDateStr = nextDay.toISOString().split("T")[0];
        newArr = shiftDate(o.arrival, nextDateStr);
      } else {
        newArr = shiftDate(o.arrival, date);
      }

      return { ...o, departure: newDep, arrival: newArr };
    });

    // On even days: bump prices by 15% and reverse sort order
    if (isEven) {
      offers = offers.map((o) => ({
        ...o,
        price: {
          ...o.price,
          amount: Math.round(o.price.amount * 1.15),
        },
      }));
    }
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

  // On even days reverse sort, on odd days normal sort
  const day = date ? parseInt(date.split("-")[2], 10) : 1;
  const isEven = day % 2 === 0;
  if (isEven) {
    offers.sort((a, b) => b.departure.localeCompare(a.departure));
  } else {
    offers.sort((a, b) => a.departure.localeCompare(b.departure));
  }

  const pageSize = Math.min(parseInt(rawLimit) || 10, 50);
  let startIdx = 0;

  if (cursor) {
    const idx = offers.findIndex((o) => o.offer_id === cursor);
    if (idx !== -1) startIdx = idx + 1;
  }

  const page = offers.slice(startIdx, startIdx + pageSize);
  const hasMore = startIdx + pageSize < offers.length;
  const nextCursor = hasMore ? page[page.length - 1].offer_id : null;

  const response = {
    results: page,
    total: offers.length,
    next_cursor: nextCursor,
  };

  if (date) {
    response.date = date;
  }

  return NextResponse.json(response, { headers: NO_CACHE });
}
