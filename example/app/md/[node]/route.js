import { NextResponse } from "next/server";
import { readNode, parseFrontmatter } from "@/lib/content";

export async function GET(request, { params }) {
  const { node } = await params;

  try {
    const raw = readNode(node);
    const accept = request.headers.get("accept") || "";

    if (accept.includes("application/json")) {
      return NextResponse.json(parseFrontmatter(raw));
    }

    return new Response(raw, {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "node not found" }, { status: 404 });
  }
}
