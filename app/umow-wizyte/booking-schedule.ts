import type { dentists } from "../../lib/dentists";
import { clinicHours } from "../../lib/site";
import type { ClinicTime } from "../../lib/clinic-time";

export { formatBookingDate, parseBookingDate, getClinicTime } from "../../lib/clinic-time";
export type { ClinicTime } from "../../lib/clinic-time";

type DentistId = keyof typeof dentists;

type Treatment = {
  id: string;
  name: string;
  duration: number;
  dentistIds: DentistId[];
};

// Default durations and dentist assignments used for online appointments.
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

export type BusyAppointment = { dentistId: DentistId; start: number; end: number };

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

export function getDentistSlots(
  day: number,
  duration: number,
  now: ClinicTime,
  dentistId: DentistId,
  appointments: BusyAppointment[],
) {
  const busy = appointments.filter((appointment) => appointment.dentistId === dentistId);
  return getTimeSlots(day, duration, now).filter(
    (slot) => !busy.some(({ start, end }) => slot < end && start < slot + duration),
  );
}

export function getAvailableTreatments(day: number, now: ClinicTime, appointments: BusyAppointment[]) {
  return treatments.filter(({ duration, dentistIds }) =>
    dentistIds.some((id) => getDentistSlots(day, duration, now, id, appointments).length > 0),
  );
}

export function hasAvailableTime(day: number, now: ClinicTime) {
  return getTimeSlots(day, shortestTreatment, now).length > 0;
}
