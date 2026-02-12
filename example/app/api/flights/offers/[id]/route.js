import { NextResponse } from "next/server";
import { getFlightData } from "@/lib/content";
import { wantsJson, mdResponse, formatFlightOffer, formatError } from "@/lib/format";

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request, { params }) {
  const { id } = await params;
  const flightData = getFlightData();
  const json = wantsJson(request);

  for (const route of flightData.routes) {
    const offer = route.offers.find((o) => o.offer_id === id);
    if (offer) {
      const data = { ...offer, route: { from: route.from, to: route.to } };
      if (!json) return mdResponse(formatFlightOffer(data));
      return NextResponse.json(data, { headers: NO_CACHE });
    }
  }

  if (!json) return mdResponse(formatError("offer not found"), 404);
  return NextResponse.json(
    { error: "offer not found" },
    { status: 404, headers: NO_CACHE }
  );
}
