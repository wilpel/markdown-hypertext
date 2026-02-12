import { NextResponse } from "next/server";
import { getHotelData } from "@/lib/content";

export async function GET(request, { params }) {
  const { id } = await params;
  const hotelData = getHotelData();
  const hotel = hotelData.hotels.find((h) => h.hotel_id === id);

  if (!hotel) {
    return NextResponse.json({ error: "hotel not found" }, { status: 404 });
  }

  return NextResponse.json(hotel);
}
