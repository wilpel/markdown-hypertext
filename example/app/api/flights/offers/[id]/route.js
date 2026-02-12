import { NextResponse } from "next/server";
import { getFlightData } from "@/lib/content";

export async function GET(request, { params }) {
  const { id } = await params;
  const flightData = getFlightData();

  for (const route of flightData.routes) {
    const offer = route.offers.find((o) => o.offer_id === id);
    if (offer) {
      return NextResponse.json({
        ...offer,
        route: { from: route.from, to: route.to },
      });
    }
  }

  return NextResponse.json({ error: "offer not found" }, { status: 404 });
}
