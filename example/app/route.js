import { NextResponse } from "next/server";
import { readNode, parseFrontmatter } from "@/lib/content";

export async function GET(request) {
  const raw = readNode("index");
  const accept = request.headers.get("accept") || "";

  if (accept.includes("application/json")) {
    return NextResponse.json(parseFrontmatter(raw));
  }

  return new Response(raw, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
