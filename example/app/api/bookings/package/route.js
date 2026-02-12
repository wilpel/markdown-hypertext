import { NextResponse } from "next/server";
import { getFlightData, getHotelData } from "@/lib/content";
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
  const hotel_id = searchParams.get("hotel_id");
  const room_type = searchParams.get("room_type");
  const checkin = searchParams.get("checkin");
  const checkout = searchParams.get("checkout");
  const passengerNames = searchParams.getAll("passenger");
  const guestNames = searchParams.getAll("guest");
  const json = wantsJson(request);

  // --- Validate flight fields ---
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

  // --- Validate hotel fields ---
  if (!hotel_id) {
    if (!json) return mdResponse(formatError("hotel_id is required"), 400);
    return NextResponse.json(
      { error: "hotel_id is required" },
      { status: 400, headers: NO_CACHE }
    );
  }
  if (!room_type) {
    if (!json) return mdResponse(formatError("room_type is required"), 400);
    return NextResponse.json(
      { error: "room_type is required" },
      { status: 400, headers: NO_CACHE }
    );
  }
  if (!checkin || !checkout) {
    if (!json) return mdResponse(formatError("checkin and checkout dates are required"), 400);
    return NextResponse.json(
      { error: "checkin and checkout dates are required" },
      { status: 400, headers: NO_CACHE }
    );
  }

  // Use guests if provided, otherwise fall back to passengers
  const guestList = guestNames.length > 0
    ? guestNames.map((name) => {
        const parts = name.trim().split(/\s+/);
        return { first_name: parts[0] || "", last_name: parts.slice(1).join(" ") || "" };
      })
    : passengers;

  for (const g of guestList) {
    if (!g.first_name || !g.last_name) {
      if (!json) return mdResponse(formatError("Each guest must have a first and last name (e.g. guest=Alice+Lindqvist)"), 400);
      return NextResponse.json(
        { error: "Each guest must have a first and last name (e.g. guest=Alice+Lindqvist)" },
        { status: 400, headers: NO_CACHE }
      );
    }
  }

  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);
  if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
    if (!json) return mdResponse(formatError("checkin and checkout must be valid dates (YYYY-MM-DD)"), 400);
    return NextResponse.json(
      { error: "checkin and checkout must be valid dates (YYYY-MM-DD)" },
      { status: 400, headers: NO_CACHE }
    );
  }
  if (checkoutDate <= checkinDate) {
    if (!json) return mdResponse(formatError("checkout must be after checkin"), 400);
    return NextResponse.json(
      { error: "checkout must be after checkin" },
      { status: 400, headers: NO_CACHE }
    );
  }

  // --- Look up flight offer ---
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

  // --- Look up hotel ---
  const hotelData = getHotelData();
  const hotel = hotelData.hotels.find((h) => h.hotel_id === hotel_id);

  if (!hotel) {
    if (!json) return mdResponse(formatError(`Hotel not found: ${hotel_id}`), 404);
    return NextResponse.json(
      { error: `Hotel not found: ${hotel_id}` },
      { status: 404, headers: NO_CACHE }
    );
  }

  const room = hotel.rooms.find((r) => r.type === room_type);
  if (!room) {
    const available = hotel.rooms.map((r) => r.type).join(", ");
    if (!json) return mdResponse(formatError(`Room type '${room_type}' not available. Options: ${available}`), 400);
    return NextResponse.json(
      { error: `Room type '${room_type}' not available. Options: ${available}` },
      { status: 400, headers: NO_CACHE }
    );
  }

  if (guestList.length > room.max_guests) {
    if (!json) return mdResponse(formatError(`Room type '${room_type}' supports max ${room.max_guests} guests, but ${guestList.length} provided`), 400);
    return NextResponse.json(
      {
        error: `Room type '${room_type}' supports max ${room.max_guests} guests, but ${guestList.length} provided`,
      },
      { status: 400, headers: NO_CACHE }
    );
  }

  // --- Calculate prices ---
  const flightTotal = offer.price.amount * passengers.length;
  const nights = Math.round(
    (checkoutDate - checkinDate) / (1000 * 60 * 60 * 24)
  );
  const hotelTotal = room.price_per_night.amount * nights;
  const grandTotal = flightTotal + hotelTotal;

  const booking = createBooking("package", {
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
    hotel: {
      hotel_id: hotel.hotel_id,
      name: hotel.name,
      city: hotel.city,
      city_code: hotel.city_code,
      stars: hotel.stars,
    },
    room: {
      type: room.type,
      beds: room.beds,
    },
    stay: {
      checkin,
      checkout,
      nights,
    },
    guests: guestList,
    price: {
      flight: {
        per_passenger: offer.price,
        total: { amount: flightTotal, currency: offer.price.currency },
        passenger_count: passengers.length,
      },
      hotel: {
        per_night: room.price_per_night,
        nights,
        total: { amount: hotelTotal, currency: room.price_per_night.currency },
        guest_count: guestList.length,
      },
      total: { amount: grandTotal, currency: "EUR" },
    },
  });

  if (!json) return mdResponse(formatBooking(booking));
  return NextResponse.json(booking, { headers: NO_CACHE });
}
