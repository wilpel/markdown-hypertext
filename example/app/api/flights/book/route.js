import { NextResponse } from "next/server";
import { getFlightData } from "@/lib/content";
import { createBooking } from "@/lib/bookings";

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: NO_CACHE }
    );
  }

  const { offer_id, passengers } = body;

  if (!offer_id) {
    return NextResponse.json(
      { error: "offer_id is required" },
      { status: 400, headers: NO_CACHE }
    );
  }

  if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
    return NextResponse.json(
      { error: "passengers must be a non-empty array" },
      { status: 400, headers: NO_CACHE }
    );
  }

  for (const p of passengers) {
    if (!p.first_name || !p.last_name) {
      return NextResponse.json(
        { error: "Each passenger must have first_name and last_name" },
        { status: 400, headers: NO_CACHE }
      );
    }
  }

  const flightData = getFlightData();
  let offer = null;
  let route = null;

  for (const r of flightData.routes) {
    const found = r.offers.find((o) => o.offer_id === offer_id);
    if (found) {
      offer = found;
      route = { from: r.from, to: r.to };
      break;
    }
  }

  if (!offer) {
    return NextResponse.json(
      { error: `Offer not found: ${offer_id}` },
      { status: 404, headers: NO_CACHE }
    );
  }

  const total_amount = offer.price.amount * passengers.length;

  const booking = createBooking("flight", {
    flight: {
      offer_id: offer.offer_id,
      airline: offer.airline,
      flight_number: offer.flight_number,
      departure: offer.departure,
      arrival: offer.arrival,
      duration_minutes: offer.duration_minutes,
      stops: offer.stops,
      cabin: offer.cabin,
      route,
    },
    passengers,
    price: {
      per_passenger: offer.price,
      total: { amount: total_amount, currency: offer.price.currency },
      passenger_count: passengers.length,
    },
  });

  return NextResponse.json(booking, { status: 201, headers: NO_CACHE });
}
