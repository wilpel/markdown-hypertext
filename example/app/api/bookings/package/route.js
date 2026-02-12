import { NextResponse } from "next/server";
import { getFlightData, getHotelData } from "@/lib/content";
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

  const { offer_id, hotel_id, room_type, checkin, checkout, passengers, guests } = body;

  // --- Validate flight fields ---
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

  // --- Validate hotel fields ---
  if (!hotel_id) {
    return NextResponse.json(
      { error: "hotel_id is required" },
      { status: 400, headers: NO_CACHE }
    );
  }
  if (!room_type) {
    return NextResponse.json(
      { error: "room_type is required" },
      { status: 400, headers: NO_CACHE }
    );
  }
  if (!checkin || !checkout) {
    return NextResponse.json(
      { error: "checkin and checkout dates are required" },
      { status: 400, headers: NO_CACHE }
    );
  }

  const guestList = guests || passengers;
  for (const g of guestList) {
    if (!g.first_name || !g.last_name) {
      return NextResponse.json(
        { error: "Each guest must have first_name and last_name" },
        { status: 400, headers: NO_CACHE }
      );
    }
  }

  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);
  if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
    return NextResponse.json(
      { error: "checkin and checkout must be valid dates (YYYY-MM-DD)" },
      { status: 400, headers: NO_CACHE }
    );
  }
  if (checkoutDate <= checkinDate) {
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
    return NextResponse.json(
      { error: `Offer not found: ${offer_id}` },
      { status: 404, headers: NO_CACHE }
    );
  }

  // --- Look up hotel ---
  const hotelData = getHotelData();
  const hotel = hotelData.hotels.find((h) => h.hotel_id === hotel_id);

  if (!hotel) {
    return NextResponse.json(
      { error: `Hotel not found: ${hotel_id}` },
      { status: 404, headers: NO_CACHE }
    );
  }

  const room = hotel.rooms.find((r) => r.type === room_type);
  if (!room) {
    const available = hotel.rooms.map((r) => r.type).join(", ");
    return NextResponse.json(
      { error: `Room type '${room_type}' not available. Options: ${available}` },
      { status: 400, headers: NO_CACHE }
    );
  }

  if (guestList.length > room.max_guests) {
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

  return NextResponse.json(booking, { status: 201, headers: NO_CACHE });
}
