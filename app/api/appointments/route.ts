import { createHash } from "node:crypto";
import {
  getClinicTime,
  getTimeSlots,
  parseBookingDate,
  treatments,
  type BusyAppointment,
} from "../../umow-wizyte/booking-schedule";

const unavailable = "Ten termin jest już niedostępny. Wybierz inną godzinę.";
const serviceError = "Nie udało się połączyć z systemem rezerwacji. Spróbuj ponownie.";

function errorResponse(message: string, status: number) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

function appointmentsRequest(params: Record<string, string>, init?: RequestInit) {
  const projectUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!projectUrl || !secretKey) throw new Error("Supabase appointment configuration is missing");

  const url = new URL("/rest/v1/appointments", projectUrl);
  url.search = new URLSearchParams(params).toString();
  const headers = new Headers(init?.headers);
  headers.set("apikey", secretKey);

  return fetch(url, {
    ...init,
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
}

type AvailabilityRow = {
  dentist_id: BusyAppointment["dentistId"];
  starts_at_minute: number;
  ends_at_minute: number;
};

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");
  if (!date || parseBookingDate(date) === null) return errorResponse("Wybierz poprawną datę.", 400);

  try {
    const response = await appointmentsRequest({
      select: "dentist_id,starts_at_minute,ends_at_minute",
      appointment_date: `eq.${date}`,
    });
    if (!response.ok) throw new Error("Could not read availability");

    const rows: AvailabilityRow[] = await response.json();
    const appointments: BusyAppointment[] = rows.map((row) => ({
      dentistId: row.dentist_id,
      start: row.starts_at_minute,
      end: row.ends_at_minute,
    }));
    return Response.json({ appointments }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Booking availability could not be loaded");
    return errorResponse(serviceError, 503);
  }
}

function parseAppointment(input: unknown) {
  if (!input || typeof input !== "object") return null;

  const { requestId, date, dentistId, treatmentId, start, name, email, phone } = input as Record<string, unknown>;
  if (
    typeof requestId !== "string" || !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(requestId) ||
    typeof date !== "string" || typeof start !== "number" || !Number.isInteger(start) ||
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

export async function POST(request: Request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("Content-Type") ?? "")) {
    return errorResponse("Prześlij formularz rezerwacji.", 415);
  }

  const appointment = parseAppointment(await request.json().catch(() => null));
  if (!appointment) return errorResponse("Sprawdź dane wizyty, adres e-mail i numer telefonu.", 400);

  const { day, duration, row } = appointment;
  if (!getTimeSlots(day, duration, getClinicTime(Date.now())).includes(row.starts_at_minute)) {
    return errorResponse(unavailable, 409);
  }

  const fingerprint = createHash("sha256").update(JSON.stringify(row)).digest("hex");

  try {
    const response = await appointmentsRequest({}, {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ ...row, request_fingerprint: fingerprint }),
    });
    if (response.ok) return new Response(null, { status: 201 });

    const { code } = await response.json().catch(() => ({}));
    if (code !== "23P01" && code !== "23505") throw new Error("Could not insert appointment");

    // The same confirmation can be retried safely after a lost response.
    const existing = await appointmentsRequest({
      select: "id",
      id: `eq.${row.id}`,
      request_fingerprint: `eq.${fingerprint}`,
    });
    if (!existing.ok) throw new Error("Could not check previous appointment");
    const matches: Array<{ id: string }> = await existing.json();
    return matches.length > 0 ? new Response(null, { status: 200 }) : errorResponse(unavailable, 409);
  } catch {
    console.error("Booking could not be saved");
    return errorResponse(serviceError, 503);
  }
}
