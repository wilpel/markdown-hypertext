const bookings = new Map();

function randomHex(length) {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function confirmationCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function createBooking(type, details) {
  const prefixes = { flight: "bkg_f_", hotel: "bkg_h_", package: "bkg_p_" };
  const prefix = prefixes[type] || "bkg_";
  const booking_id = prefix + randomHex(8);
  const confirmation_code = confirmationCode();
  const booking = {
    booking_id,
    confirmation_code,
    type,
    status: "confirmed",
    created_at: new Date().toISOString(),
    ...details,
  };
  bookings.set(booking_id, booking);
  return booking;
}

export function getBooking(id) {
  return bookings.get(id) || null;
}
