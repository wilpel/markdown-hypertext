import { NextResponse } from "next/server";
import { getFlightData } from "@/lib/content";
import { createBooking } from "@/lib/bookings";
import { wantsJson, mdResponse, formatBooking, formatError } from "@/lib/format";

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const offer_id = searchParams.get("offer_id");
  const passengerNames = searchParams.getAll("passenger");
  const json = wantsJson(request);

  if (!offer_id) {
    if (!json) return mdResponse(formatError("offer_id is required"), 400);
    return NextResponse.json(
      { error: "offer_id is required" },
      { status: 400, headers: NO_CACHE }
    );
  }

  if (passengerNames.length === 0) {
    if (!json) return mdResponse(formatError("At least one passenger is required (e.g. passenger=Alice+Lindqvist)"), 400);
    return NextResponse.json(
      { error: "At least one passenger is required (e.g. passenger=Alice+Lindqvist)" },
      { status: 400, headers: NO_CACHE }
    );
  }

  const passengers = passengerNames.map((name) => {
    const parts = name.trim().split(/\s+/);
    return { first_name: parts[0] || "", last_name: parts.slice(1).join(" ") || "" };
  });

  for (const p of passengers) {
    if (!p.first_name || !p.last_name) {
      if (!json) return mdResponse(formatError("Each passenger must have a first and last name (e.g. passenger=Alice+Lindqvist)"), 400);
      return NextResponse.json(
        { error: "Each passenger must have a first and last name (e.g. passenger=Alice+Lindqvist)" },
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
    if (!json) return mdResponse(formatError(`Offer not found: ${offer_id}`), 404);
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

  if (!json) return mdResponse(formatBooking(booking));
  return NextResponse.json(booking, { headers: NO_CACHE });
}
