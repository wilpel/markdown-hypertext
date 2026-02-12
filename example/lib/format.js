// Markdown formatters for API responses

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export function wantsJson(request) {
  const accept = request.headers.get("accept") || "";
  return accept.includes("application/json");
}

export function mdResponse(md, status = 200) {
  return new Response(md, {
    status,
    headers: { "Content-Type": "text/markdown; charset=utf-8", ...NO_CACHE },
  });
}

export function formatFlightResults(data) {
  const lines = [`# Flight Search Results\n`];
  lines.push(`${data.total} result${data.total !== 1 ? "s" : ""}\n`);

  for (const f of data.results) {
    lines.push(`## ${f.airline} ${f.flight_number}`);
    lines.push(`- **Offer ID:** ${f.offer_id}`);
    lines.push(`- **Route:** ${f.route?.from || "?"} to ${f.route?.to || "?"}`);
    lines.push(`- **Departure:** ${f.departure}`);
    lines.push(`- **Arrival:** ${f.arrival}`);
    lines.push(`- **Duration:** ${f.duration_minutes} minutes`);
    lines.push(`- **Stops:** ${f.stops}`);
    lines.push(`- **Cabin:** ${f.cabin}`);
    lines.push(`- **Price:** ${f.price.amount} ${f.price.currency}`);
    lines.push("");
  }

  if (data.next_cursor) {
    lines.push(`Next page: \`cursor=${data.next_cursor}\``);
  }

  return lines.join("\n");
}

export function formatHotelResults(data) {
  const lines = [`# Hotel Search Results\n`];
  lines.push(`${data.total} result${data.total !== 1 ? "s" : ""}\n`);

  if (data.dates) {
    const parts = [];
    if (data.dates.checkin) parts.push(`Check-in: ${data.dates.checkin}`);
    if (data.dates.checkout) parts.push(`Check-out: ${data.dates.checkout}`);
    if (data.dates.nights) parts.push(`${data.dates.nights} nights`);
    if (parts.length) lines.push(parts.join(", ") + "\n");
  }

  for (const h of data.results) {
    lines.push(`## ${h.name} (${"*".repeat(h.stars)})`);
    lines.push(`- **Hotel ID:** ${h.hotel_id}`);
    lines.push(`- **City:** ${h.city} (${h.city_code})`);
    lines.push(`- **Address:** ${h.address || "N/A"}`);
    lines.push("");
    lines.push("**Rooms:**\n");
    for (const r of h.rooms) {
      lines.push(`- **${r.type}:** ${r.price_per_night.amount} ${r.price_per_night.currency}/night, ${r.beds}, max ${r.max_guests} guests`);
    }
    lines.push("");
  }

  if (data.next_cursor) {
    lines.push(`Next page: \`cursor=${data.next_cursor}\``);
  }

  return lines.join("\n");
}

export function formatFlightOffer(offer) {
  const lines = [`# ${offer.airline} ${offer.flight_number}\n`];
  lines.push(`- **Offer ID:** ${offer.offer_id}`);
  if (offer.route) lines.push(`- **Route:** ${offer.route.from} to ${offer.route.to}`);
  lines.push(`- **Departure:** ${offer.departure}`);
  lines.push(`- **Arrival:** ${offer.arrival}`);
  lines.push(`- **Duration:** ${offer.duration_minutes} minutes`);
  lines.push(`- **Stops:** ${offer.stops}`);
  lines.push(`- **Cabin:** ${offer.cabin}`);
  lines.push(`- **Price:** ${offer.price.amount} ${offer.price.currency}`);
  return lines.join("\n");
}

export function formatHotel(hotel) {
  const lines = [`# ${hotel.name} (${"*".repeat(hotel.stars)})\n`];
  lines.push(`- **Hotel ID:** ${hotel.hotel_id}`);
  lines.push(`- **City:** ${hotel.city} (${hotel.city_code})`);
  lines.push(`- **Address:** ${hotel.address || "N/A"}`);
  lines.push("");
  lines.push("## Rooms\n");
  for (const r of hotel.rooms) {
    lines.push(`### ${r.type}`);
    lines.push(`- **Price:** ${r.price_per_night.amount} ${r.price_per_night.currency}/night`);
    lines.push(`- **Beds:** ${r.beds}`);
    lines.push(`- **Max guests:** ${r.max_guests}`);
    lines.push("");
  }
  return lines.join("\n");
}

function formatPassengers(passengers) {
  return passengers.map((p) => `${p.first_name} ${p.last_name}`).join(", ");
}

function formatGuests(guests) {
  return guests.map((g) => `${g.first_name} ${g.last_name}`).join(", ");
}

export function formatBooking(booking) {
  const lines = [`# Booking Confirmation\n`];
  lines.push(`- **Booking ID:** ${booking.booking_id}`);
  lines.push(`- **Confirmation:** ${booking.confirmation_code}`);
  lines.push(`- **Type:** ${booking.type}`);
  lines.push(`- **Status:** ${booking.status}`);
  lines.push(`- **Created:** ${booking.created_at}`);
  lines.push("");

  if (booking.flight) {
    lines.push("## Flight\n");
    lines.push(`- **${booking.flight.airline} ${booking.flight.flight_number}**`);
    if (booking.flight.route) lines.push(`- **Route:** ${booking.flight.route.from} to ${booking.flight.route.to}`);
    lines.push(`- **Departure:** ${booking.flight.departure}`);
    lines.push(`- **Arrival:** ${booking.flight.arrival}`);
    lines.push(`- **Cabin:** ${booking.flight.cabin}`);
    lines.push("");
  }

  if (booking.passengers) {
    lines.push(`**Passengers:** ${formatPassengers(booking.passengers)}\n`);
  }

  if (booking.hotel) {
    lines.push("## Hotel\n");
    lines.push(`- **${booking.hotel.name}** (${"*".repeat(booking.hotel.stars)})`);
    lines.push(`- **City:** ${booking.hotel.city}`);
    lines.push("");
  }

  if (booking.room) {
    lines.push(`- **Room:** ${booking.room.type} (${booking.room.beds})`);
    lines.push("");
  }

  if (booking.stay) {
    lines.push(`- **Check-in:** ${booking.stay.checkin}`);
    lines.push(`- **Check-out:** ${booking.stay.checkout}`);
    lines.push(`- **Nights:** ${booking.stay.nights}`);
    lines.push("");
  }

  if (booking.guests) {
    lines.push(`**Guests:** ${formatGuests(booking.guests)}\n`);
  }

  if (booking.price) {
    lines.push("## Price\n");
    if (booking.price.per_passenger) {
      lines.push(`- **Per passenger:** ${booking.price.per_passenger.amount} ${booking.price.per_passenger.currency}`);
      lines.push(`- **Passengers:** ${booking.price.passenger_count}`);
    }
    if (booking.price.per_night) {
      lines.push(`- **Per night:** ${booking.price.per_night.amount} ${booking.price.per_night.currency}`);
      lines.push(`- **Nights:** ${booking.price.nights}`);
    }
    if (booking.price.flight) {
      lines.push(`- **Flight total:** ${booking.price.flight.total.amount} ${booking.price.flight.total.currency} (${booking.price.flight.passenger_count} passenger${booking.price.flight.passenger_count !== 1 ? "s" : ""})`);
    }
    if (booking.price.hotel) {
      lines.push(`- **Hotel total:** ${booking.price.hotel.total.amount} ${booking.price.hotel.total.currency} (${booking.price.hotel.nights} night${booking.price.hotel.nights !== 1 ? "s" : ""})`);
    }
    if (booking.price.total) {
      lines.push(`- **Total:** ${booking.price.total.amount} ${booking.price.total.currency}`);
    }
  }

  return lines.join("\n");
}

export function formatError(message) {
  return `# Error\n\n${message}`;
}
