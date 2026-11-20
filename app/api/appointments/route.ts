import { parseBookingDate } from "../../../lib/clinic-time";
import {
  activeAppointment,
  appointmentResponse,
  appointmentsRequest,
  isJsonRequest,
  parseAppointment,
  saveAppointment,
} from "../../../lib/appointments-server";
import type { BusyAppointment } from "../../umow-wizyte/booking-schedule";

const unavailable = "Ten termin jest już niedostępny. Wybierz inną godzinę.";
const serviceError = "Nie udało się połączyć z systemem rezerwacji. Spróbuj ponownie.";

function errorResponse(message: string, status: number) {
  return appointmentResponse({ message }, status);
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
      ...activeAppointment,
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

export async function POST(request: Request) {
  if (!isJsonRequest(request)) return errorResponse("Prześlij formularz rezerwacji.", 415);

  const appointment = parseAppointment(await request.json().catch(() => null));
  if (!appointment) return errorResponse("Sprawdź dane wizyty, adres e-mail i numer telefonu.", 400);

  try {
    const status = await saveAppointment(appointment);
    return status === 409 ? errorResponse(unavailable, 409) : new Response(null, { status });
  } catch {
    console.error("Booking could not be saved");
    return errorResponse(serviceError, 503);
  }
}
