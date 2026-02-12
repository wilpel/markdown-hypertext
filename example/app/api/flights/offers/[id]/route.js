import { NextResponse } from "next/server";
import { getFlightData } from "@/lib/content";

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request, { params }) {
  const { id } = await params;
  const flightData = getFlightData();

  for (const route of flightData.routes) {
    const offer = route.offers.find((o) => o.offer_id === id);
    if (offer) {
      return NextResponse.json(
        { ...offer, route: { from: route.from, to: route.to } },
        { headers: NO_CACHE }
      );
    }
  }

  return NextResponse.json(
    { error: "offer not found" },
    { status: 404, headers: NO_CACHE }
  );
}
