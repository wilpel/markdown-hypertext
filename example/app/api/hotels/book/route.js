import { NextResponse } from "next/server";
import { getHotelData } from "@/lib/content";
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

  const hotel_id = searchParams.get("hotel_id");
  const room_type = searchParams.get("room_type");
  const checkin = searchParams.get("checkin");
  const checkout = searchParams.get("checkout");
  const guestNames = searchParams.getAll("guest");
  const json = wantsJson(request);

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
  if (guestNames.length === 0) {
    if (!json) return mdResponse(formatError("At least one guest is required (e.g. guest=Alice+Lindqvist)"), 400);
    return NextResponse.json(
      { error: "At least one guest is required (e.g. guest=Alice+Lindqvist)" },
      { status: 400, headers: NO_CACHE }
    );
  }

  const guests = guestNames.map((name) => {
    const parts = name.trim().split(/\s+/);
    return { first_name: parts[0] || "", last_name: parts.slice(1).join(" ") || "" };
  });

  for (const g of guests) {
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

  if (guests.length > room.max_guests) {
    if (!json) return mdResponse(formatError(`Room type '${room_type}' supports max ${room.max_guests} guests, but ${guests.length} provided`), 400);
    return NextResponse.json(
      {
        error: `Room type '${room_type}' supports max ${room.max_guests} guests, but ${guests.length} provided`,
      },
      { status: 400, headers: NO_CACHE }
    );
  }

  const nights = Math.round(
    (checkoutDate - checkinDate) / (1000 * 60 * 60 * 24)
  );
  const total_amount = room.price_per_night.amount * nights;

  const booking = createBooking("hotel", {
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
    guests,
    price: {
      per_night: room.price_per_night,
      nights,
      total: { amount: total_amount, currency: room.price_per_night.currency },
      guest_count: guests.length,
    },
  });

  if (!json) return mdResponse(formatBooking(booking));
  return NextResponse.json(booking, { headers: NO_CACHE });
}
