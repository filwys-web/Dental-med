export type ClinicTime = { day: number; minute: number };

export function formatBookingDate(day: number) {
  return new Date(day).toISOString().slice(0, 10);
}

export function parseBookingDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const day = Date.parse(date);
  return Number.isFinite(day) && formatBookingDate(day) === date ? day : null;
}

const clinicTimeFormat = new Intl.DateTimeFormat("pl-PL", {
  timeZone: "Europe/Warsaw",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

// A calendar day is represented by its date at midnight UTC, independent of the browser's time zone.
export function getClinicTime(now: number): ClinicTime {
  const parts = Object.fromEntries(
    clinicTimeFormat.formatToParts(now).map(({ type, value }) => [type, Number(value)]),
  );

  return {
    day: Date.UTC(parts.year, parts.month - 1, parts.day),
    minute: parts.hour * 60 + parts.minute,
  };
}
