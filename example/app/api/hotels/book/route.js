import { NextResponse } from "next/server";
import { getHotelData } from "@/lib/content";
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

  const { hotel_id, room_type, checkin, checkout, guests } = body;

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
  if (!guests || !Array.isArray(guests) || guests.length === 0) {
    return NextResponse.json(
      { error: "guests must be a non-empty array" },
      { status: 400, headers: NO_CACHE }
    );
  }

  for (const g of guests) {
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

  if (guests.length > room.max_guests) {
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

  return NextResponse.json(booking, { status: 201, headers: NO_CACHE });
}
