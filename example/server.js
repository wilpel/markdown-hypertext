const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const flightData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "flights.json"), "utf8")
);

// --- Static content ---

// root → index node
app.get("/", (req, res) => {
  const mdPath = path.join(__dirname, "content", "md", "index.md");
  const raw = fs.readFileSync(mdPath, "utf8");

  const accept = req.get("Accept") || "";
  if (accept.includes("application/json")) {
    return res.json(parseFrontmatter(raw));
  }

  res.type("text/markdown").send(raw);
});

// mdh artifacts
app.get("/mdh/:file", (req, res) => {
  const filePath = path.join(__dirname, "content", "mdh", req.params.file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "not found" });
  res.sendFile(filePath);
});

// markdown nodes — content negotiation
app.get("/md/:node", (req, res) => {
  const mdPath = path.join(__dirname, "content", "md", req.params.node + ".md");
  if (!fs.existsSync(mdPath)) return res.status(404).json({ error: "node not found" });

  const raw = fs.readFileSync(mdPath, "utf8");

  const accept = req.get("Accept") || "";
  if (accept.includes("application/json")) {
    const parsed = parseFrontmatter(raw);
    return res.json(parsed);
  }

  res.type("text/markdown").send(raw);
});

// --- Flight search API ---

app.get("/api/flights/search", (req, res) => {
  const { from, to, date, cabin, max_price, cursor, limit: rawLimit } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: "from and to are required query parameters" });
  }

  let offers = [];
  for (const route of flightData.routes) {
    if (route.from.toUpperCase() === from.toUpperCase() &&
        route.to.toUpperCase() === to.toUpperCase()) {
      offers = offers.concat(route.offers);
    }
  }

  // filter by date prefix
  if (date) {
    offers = offers.filter(o => o.departure.startsWith(date));
  }

  // filter by cabin
  if (cabin) {
    offers = offers.filter(o => o.cabin === cabin.toLowerCase());
  }

  // filter by max price
  if (max_price) {
    const mp = parseFloat(max_price);
    if (!isNaN(mp)) {
      offers = offers.filter(o => o.price.amount <= mp);
    }
  }

  // sort by departure
  offers.sort((a, b) => a.departure.localeCompare(b.departure));

  // cursor pagination
  const pageSize = Math.min(parseInt(rawLimit) || 10, 50);
  let startIdx = 0;

  if (cursor) {
    const idx = offers.findIndex(o => o.offer_id === cursor);
    if (idx !== -1) startIdx = idx + 1;
  }

  const page = offers.slice(startIdx, startIdx + pageSize);
  const hasMore = startIdx + pageSize < offers.length;
  const nextCursor = hasMore ? page[page.length - 1].offer_id : null;

  res.json({
    results: page,
    total: offers.length,
    next_cursor: nextCursor
  });
});

// --- Single offer lookup ---

app.get("/api/flights/offers/:id", (req, res) => {
  for (const route of flightData.routes) {
    const offer = route.offers.find(o => o.offer_id === req.params.id);
    if (offer) {
      return res.json({
        ...offer,
        route: { from: route.from, to: route.to }
      });
    }
  }
  res.status(404).json({ error: "offer not found" });
});

// --- Helpers ---

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { body: raw };

  // Extract top-level scalar fields from YAML frontmatter.
  // Nested structures (links, actions) are left in frontmatter_raw
  // since we don't bundle a YAML parser.
  const meta = {};
  for (const line of match[1].split("\n")) {
    // Only parse top-level keys (no leading whitespace)
    if (line.startsWith(" ") || line.startsWith("\t")) continue;
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    let val = line.slice(colon + 1).trim();
    if (!val) continue; // skip keys with block values (links, actions)
    // strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // handle inline arrays like [a, b]
    if (val.startsWith("[") && val.endsWith("]")) {
      val = val.slice(1, -1).split(",").map(s => s.trim().replace(/^["']|["']$/g, ""));
    }
    meta[key] = val;
  }

  return { meta, frontmatter_raw: match[1], body: match[2].trim() };
}

app.listen(PORT, () => {
  console.log(`MDH example server running on http://localhost:${PORT}`);
});
