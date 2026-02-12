import { NextResponse } from "next/server";
import { getBooking } from "@/lib/bookings";

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request, { params }) {
  const { id } = await params;
  const booking = getBooking(id);

  if (!booking) {
    return NextResponse.json(
      { error: "Booking not found" },
      { status: 404, headers: NO_CACHE }
    );
  }

  return NextResponse.json(booking, { headers: NO_CACHE });
}
