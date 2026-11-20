import { createHash } from "node:crypto";
import { getClinicTime, parseBookingDate } from "./clinic-time";
import { getTimeSlots, treatments } from "../app/umow-wizyte/booking-schedule";

const appointmentIdPattern = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
export const activeAppointment = { cancelled_at: "is.null" };

export function isAppointmentId(value: unknown): value is string {
  return typeof value === "string" && appointmentIdPattern.test(value);
}

export function isJsonRequest(request: Request) {
  return /^application\/json(?:\s*;|$)/i.test(request.headers.get("Content-Type") ?? "");
}

export function appointmentResponse(body: object, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function appointmentsRequest(params: Record<string, string>, init?: RequestInit) {
  const projectUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!projectUrl || !secretKey) throw new Error("Supabase appointment configuration is missing");

  const url = new URL("/rest/v1/appointments", projectUrl);
  url.search = new URLSearchParams(params).toString();
  const headers = new Headers(init?.headers);
  headers.set("apikey", secretKey);
  return fetch(url, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(8_000) });
}

export function parseAppointment(input: unknown) {
  if (!input || typeof input !== "object") return null;

  const { requestId, date, dentistId, treatmentId, start, name, email, phone } = input as Record<string, unknown>;
  if (
    !isAppointmentId(requestId) || typeof date !== "string" ||
    typeof start !== "number" || !Number.isInteger(start) ||
    typeof name !== "string" || typeof email !== "string" || typeof phone !== "string"
  ) return null;

  const day = parseBookingDate(date);
  const treatment = treatments.find(({ id }) => id === treatmentId);
  const dentist = treatment?.dentistIds.find((id) => id === dentistId);
  if (day === null || !treatment || !dentist) return null;

  const patientName = name.trim();
  const patientEmail = email.trim();
  const patientPhone = phone.trim();
  if (
    patientName.length < 2 || patientName.length > 120 || /[\x00-\x1f\x7f]/.test(patientName) ||
    patientEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail) ||
    patientPhone.length > 30 || !/^\+?(?:[ ()-]*[0-9]){7,15}[ ()-]*$/.test(patientPhone)
  ) return null;

  return {
    day,
    duration: treatment.duration,
    row: {
      id: requestId.toLowerCase(),
      appointment_date: date,
      dentist_id: dentist,
      treatment_id: treatment.id,
      starts_at_minute: start,
      ends_at_minute: start + treatment.duration,
      patient_name: patientName,
      patient_email: patientEmail,
      patient_phone: patientPhone,
    },
  };
}

export function canScheduleAppointment(day: number, duration: number, start: number) {
  return getTimeSlots(day, duration, getClinicTime(Date.now())).includes(start);
}

export async function saveAppointment(appointment: NonNullable<ReturnType<typeof parseAppointment>>) {
  const { day, duration, row } = appointment;
  const fingerprint = createHash("sha256").update(JSON.stringify(row)).digest("hex");

  if (canScheduleAppointment(day, duration, row.starts_at_minute)) {
    const response = await appointmentsRequest({}, {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ ...row, request_fingerprint: fingerprint }),
    });
    if (response.ok) return 201;

    const { code } = await response.json().catch(() => ({}));
    if (code !== "23P01" && code !== "23505") throw new Error("Could not insert appointment");
  }

  // A retry can arrive after the visit start or after reception has moved it.
  const existing = await appointmentsRequest({
    ...activeAppointment,
    select: "id",
    id: `eq.${row.id}`,
    request_fingerprint: `eq.${fingerprint}`,
  });
  if (!existing.ok) throw new Error("Could not check previous appointment");
  const matches: Array<{ id: string }> = await existing.json();
  return matches.length > 0 ? 200 : 409;
}
