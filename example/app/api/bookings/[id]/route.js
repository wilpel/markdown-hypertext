import { NextResponse } from "next/server";
import { getBooking } from "@/lib/bookings";
import { wantsJson, mdResponse, formatBooking, formatError } from "@/lib/format";

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request, { params }) {
  const { id } = await params;
  const booking = getBooking(id);
  const json = wantsJson(request);

  if (!booking) {
    if (!json) return mdResponse(formatError("Booking not found"), 404);
    return NextResponse.json(
      { error: "Booking not found" },
      { status: 404, headers: NO_CACHE }
    );
  }

  if (!json) return mdResponse(formatBooking(booking));
  return NextResponse.json(booking, { headers: NO_CACHE });
}
