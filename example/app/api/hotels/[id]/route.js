import { NextResponse } from "next/server";
import { getHotelData } from "@/lib/content";
import { wantsJson, mdResponse, formatHotel, formatError } from "@/lib/format";

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
  const json = wantsJson(request);

  if (!hotel) {
    if (!json) return mdResponse(formatError("hotel not found"), 404);
    return NextResponse.json(
      { error: "hotel not found" },
      { status: 404, headers: NO_CACHE }
    );
  }

  if (!json) return mdResponse(formatHotel(hotel));
  return NextResponse.json(hotel, { headers: NO_CACHE });
}
