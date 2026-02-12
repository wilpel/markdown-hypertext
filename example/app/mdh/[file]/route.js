import { NextResponse } from "next/server";
import { readArtifact } from "@/lib/content";

export async function GET(request, { params }) {
  const { file } = await params;

  try {
    const raw = readArtifact(file);
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
