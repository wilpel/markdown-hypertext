import { NextResponse } from "next/server";
import { readPage, parseFrontmatter, renderMarkdown } from "@/lib/content";

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request) {
  const raw = readPage("index");
  const accept = request.headers.get("accept") || "";

  if (accept.includes("application/json")) {
    return NextResponse.json(parseFrontmatter(raw), { headers: NO_CACHE });
  }

  if (accept.includes("text/html")) {
    return new Response(renderMarkdown(raw), {
      headers: { "Content-Type": "text/html; charset=utf-8", ...NO_CACHE },
    });
  }

  return new Response(raw, {
    headers: { "Content-Type": "text/markdown; charset=utf-8", ...NO_CACHE },
  });
}
