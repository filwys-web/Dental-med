import type { dentists } from "../../lib/dentists";
import { clinicHours } from "../../lib/site";

type Treatment = {
  id: string;
  name: string;
  duration: number;
  dentistIds: (keyof typeof dentists)[];
};

// Example durations and staff assignments for the demo calendar.
export const treatments: Treatment[] = [
  { id: "konsultacja", name: "Konsultacja stomatologiczna", duration: 30, dentistIds: ["alicja", "marek"] },
  { id: "kontrola", name: "Wizyta kontrolna", duration: 30, dentistIds: ["alicja", "natalia"] },
  { id: "higienizacja", name: "Pełna higienizacja", duration: 60, dentistIds: ["alicja"] },
  { id: "wypelnienie", name: "Wypełnienie kompozytowe", duration: 60, dentistIds: ["alicja"] },
  { id: "kanalowe", name: "Leczenie kanałowe", duration: 120, dentistIds: ["marek"] },
  { id: "ekstrakcja", name: "Usunięcie zęba stałego", duration: 45, dentistIds: ["tomasz"] },
  { id: "osemka", name: "Chirurgiczne usunięcie ósemki", duration: 90, dentistIds: ["tomasz"] },
  { id: "adaptacja", name: "Wizyta adaptacyjna", duration: 30, dentistIds: ["natalia"] },
  { id: "zab-mleczny", name: "Wypełnienie w zębie mlecznym", duration: 45, dentistIds: ["natalia"] },
  { id: "protetyka", name: "Konsultacja protetyczna", duration: 45, dentistIds: ["ewa"] },
  { id: "wybielanie", name: "Wybielanie gabinetowe obu łuków", duration: 90, dentistIds: ["ewa"] },
  { id: "bonding", name: "Bonding (jeden ząb)", duration: 60, dentistIds: ["ewa"] },
];

export type ClinicTime = { day: number; minute: number };

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

export function isClinicWorkday(day: number) {
  return clinicHours.weekdays.includes(new Date(day).getUTCDay());
}

const slotInterval = 30;

export function getTimeSlots(day: number, duration: number, now: ClinicTime) {
  if (day < now.day || !isClinicWorkday(day)) return [];

  const slots: number[] = [];
  for (let start = clinicHours.opensAt; start + duration <= clinicHours.closesAt; start += slotInterval) {
    if (day > now.day || start > now.minute) slots.push(start);
  }

  return slots;
}

const shortestTreatment = Math.min(...treatments.map(({ duration }) => duration));

export function getAvailableTreatments(day: number, now: ClinicTime) {
  return treatments.filter(({ duration }) => getTimeSlots(day, duration, now).length > 0);
}

export function hasAvailableTime(day: number, now: ClinicTime) {
  return getTimeSlots(day, shortestTreatment, now).length > 0;
}
