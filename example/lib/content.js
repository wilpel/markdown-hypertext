import { readFileSync } from "fs";
import { join } from "path";

const contentDir = join(process.cwd(), "content");
const dataDir = join(process.cwd(), "data");

export function readNode(name) {
  const filePath = join(contentDir, "md", name + ".md");
  return readFileSync(filePath, "utf8");
}

export function readArtifact(name) {
  const filePath = join(contentDir, "mdh", name);
  return readFileSync(filePath, "utf8");
}

export function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { body: raw };

  const meta = {};
  for (const line of match[1].split("\n")) {
    if (line.startsWith(" ") || line.startsWith("\t")) continue;
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    let val = line.slice(colon + 1).trim();
    if (!val) continue;
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (val.startsWith("[") && val.endsWith("]")) {
      val = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""));
    }
    meta[key] = val;
  }

  return { meta, frontmatter_raw: match[1], body: match[2].trim() };
}

export function getFlightData() {
  return JSON.parse(readFileSync(join(dataDir, "flights.json"), "utf8"));
}

export function getHotelData() {
  return JSON.parse(readFileSync(join(dataDir, "hotels.json"), "utf8"));
}
