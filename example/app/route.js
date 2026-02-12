import { NextResponse } from "next/server";
import { readNode, parseFrontmatter } from "@/lib/content";

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request) {
  const raw = readNode("index");
  const accept = request.headers.get("accept") || "";

  if (accept.includes("application/json")) {
    return NextResponse.json(parseFrontmatter(raw), { headers: NO_CACHE });
  }

  return new Response(raw, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      ...NO_CACHE,
    },
  });
}
