import { NextResponse } from "next/server";
import { getHotelData } from "@/lib/content";

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request, { params }) {
  const { id } = await params;
  const hotelData = getHotelData();
  const hotel = hotelData.hotels.find((h) => h.hotel_id === id);

  if (!hotel) {
    return NextResponse.json(
      { error: "hotel not found" },
      { status: 404, headers: NO_CACHE }
    );
  }

  return NextResponse.json(hotel, { headers: NO_CACHE });
}
