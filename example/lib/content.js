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
  const { meta, body } = parseFrontmatter(raw);
  const title = meta?.title || "Wayfare";
  const html = mdToHtml(body || raw);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; line-height: 1.6; }
a { color: #0055d4; }
a:hover { text-decoration: none; }
h1 { font-size: 1.8rem; margin-top: 0; }
h2 { font-size: 1.3rem; margin-top: 2rem; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.3rem; }
h3 { font-size: 1.1rem; margin-top: 1.5rem; }
code { background: #f4f4f4; padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.9em; }
pre { background: #f4f4f4; padding: 1rem; border-radius: 6px; overflow-x: auto; }
pre code { background: none; padding: 0; }
table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
th, td { border: 1px solid #ddd; padding: 0.5rem 0.75rem; text-align: left; }
th { background: #f8f8f8; font-weight: 600; }
blockquote { border-left: 3px solid #ddd; margin-left: 0; padding-left: 1rem; color: #555; }
nav { margin-bottom: 1.5rem; font-size: 0.9rem; color: #666; }
nav a { margin-right: 1rem; }
</style>
</head>
<body>
<nav><a href="/">Home</a><a href="/flights">Flights</a><a href="/hotels">Hotels</a><a href="/bookings">Bookings</a><a href="/airports">Airports</a><a href="/help">Help</a></nav>
${html}
</body>
</html>`;
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function mdToHtml(md) {
  let html = "";
  const lines = md.split("\n");
  let i = 0;
  let inList = false;
  let inOrderedList = false;
  let inCodeBlock = false;
  let codeContent = "";

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html += `<pre><code>${esc(codeContent.trimEnd())}</code></pre>\n`;
        codeContent = "";
        inCodeBlock = false;
        i++;
        continue;
      }
      inCodeBlock = true;
      i++;
      continue;
    }
    if (inCodeBlock) {
      codeContent += line + "\n";
      i++;
      continue;
    }

    // Close open lists if needed
    if (inList && !line.startsWith("- ")) {
      html += "</ul>\n";
      inList = false;
    }
    if (inOrderedList && !/^\d+\.\s/.test(line)) {
      html += "</ol>\n";
      inOrderedList = false;
    }

    // Blank line
    if (line.trim() === "") { i++; continue; }

    // Table
    if (line.includes("|") && line.trim().startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim().startsWith("|")) {
        rows.push(lines[i]);
        i++;
      }
      html += renderTable(rows);
      continue;
    }

    // Headings
    const hMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (hMatch) {
      const level = hMatch[1].length;
      html += `<h${level}>${inline(hMatch[2])}</h${level}>\n`;
      i++;
      continue;
    }

    // Unordered list
    if (line.startsWith("- ")) {
      if (!inList) { html += "<ul>\n"; inList = true; }
      html += `<li>${inline(line.slice(2))}</li>\n`;
      i++;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      if (!inOrderedList) { html += "<ol>\n"; inOrderedList = true; }
      html += `<li>${inline(olMatch[2])}</li>\n`;
      i++;
      continue;
    }

    // Paragraph
    html += `<p>${inline(line)}</p>\n`;
    i++;
  }

  if (inList) html += "</ul>\n";
  if (inOrderedList) html += "</ol>\n";
  return html;
}

function inline(text) {
  // Links: [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Bold: **text**
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic: *text*
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // Inline code: `text`
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  return text;
}

function renderTable(rows) {
  const parseRow = (r) =>
    r.split("|").slice(1, -1).map((c) => c.trim());

  if (rows.length < 2) return "";
  const headers = parseRow(rows[0]);
  // Skip separator row
  const startIdx = rows[1].includes("---") ? 2 : 1;
  let html = "<table><thead><tr>";
  for (const h of headers) html += `<th>${inline(h)}</th>`;
  html += "</tr></thead><tbody>";
  for (let i = startIdx; i < rows.length; i++) {
    const cells = parseRow(rows[i]);
    html += "<tr>";
    for (const c of cells) html += `<td>${inline(c)}</td>`;
    html += "</tr>";
  }
  html += "</tbody></table>\n";
  return html;
}

export function getFlightData() {
  return JSON.parse(readFileSync(join(dataDir, "flights.json"), "utf8"));
}

export function getHotelData() {
  return JSON.parse(readFileSync(join(dataDir, "hotels.json"), "utf8"));
}
