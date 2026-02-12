import { readFileSync } from "fs";
import { join } from "path";
import yaml from "js-yaml";

const contentDir = join(process.cwd(), "content");
const dataDir = join(process.cwd(), "data");

export function readNode(name) {
  const filePath = join(contentDir, "md", name + ".md");
  return readFileSync(filePath, "utf8");
}

export function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { body: raw };

  const meta = yaml.load(match[1]);

  return { meta, frontmatter_raw: match[1], body: match[2].trim() };
}

export function renderMarkdown(raw) {
  const { body } = parseFrontmatter(raw);
  const md = body || raw;
  // Just replace [text](url) with <a href="url">text</a>, keep everything else as raw markdown
  const html = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return `<pre style="white-space:pre-wrap;font-family:monospace">${html}</pre>`;
}

export function getFlightData() {
  return JSON.parse(readFileSync(join(dataDir, "flights.json"), "utf8"));
}

export function getHotelData() {
  return JSON.parse(readFileSync(join(dataDir, "hotels.json"), "utf8"));
}
