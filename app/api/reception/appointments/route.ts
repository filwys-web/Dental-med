import {
  activeAppointment,
  appointmentResponse,
  appointmentsRequest,
  canScheduleAppointment,
  isAppointmentId,
  isJsonRequest,
  parseAppointment,
  saveAppointment,
} from "../../../../lib/appointments-server";
import { parseBookingDate } from "../../../../lib/clinic-time";
import { hasReceptionSession, isSameOrigin } from "../../../../lib/reception-session";
import { treatments, type BusyAppointment } from "../../../umow-wizyte/booking-schedule";

const unavailable = "Termin jest niedostępny. Wybierz inną datę lub godzinę.";
const staleAppointment = "Wizyta została zmieniona. Otwórz ją ponownie w grafiku.";
const invalidDate = "Wybierz poprawną datę i godzinę.";

type AppointmentRow = {
  id: string;
  appointment_date: string;
  dentist_id: BusyAppointment["dentistId"];
  starts_at_minute: number;
  ends_at_minute: number;
  treatment_id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  revision: number;
};

async function withReception(operation: () => Promise<Response>) {
  try {
    if (!await hasReceptionSession()) {
      return appointmentResponse({ message: "Zaloguj się ponownie do panelu recepcji." }, 401);
    }
    return await operation();
  } catch {
    return appointmentResponse({ message: "Nie udało się połączyć z terminarzem. Spróbuj ponownie." }, 503);
  }
}

export function GET(request: Request) {
  return withReception(async () => {
    const date = new URL(request.url).searchParams.get("date");
    if (!date || parseBookingDate(date) === null) return appointmentResponse({ message: invalidDate }, 400);

    const response = await appointmentsRequest({
      ...activeAppointment,
      appointment_date: `eq.${date}`,
      select: "id,appointment_date,dentist_id,starts_at_minute,ends_at_minute,treatment_id,patient_name,patient_email,patient_phone,revision",
      order: "starts_at_minute,id",
    });
    if (!response.ok) throw new Error("Could not load reception schedule");
    const rows: AppointmentRow[] = await response.json();
    return appointmentResponse({
      appointments: rows.map((row) => ({
        id: row.id,
        date: row.appointment_date,
        dentistId: row.dentist_id,
        start: row.starts_at_minute,
        end: row.ends_at_minute,
        treatment: treatments.find(({ id }) => id === row.treatment_id)?.name ?? row.treatment_id,
        patientName: row.patient_name,
        email: row.patient_email,
        phone: row.patient_phone,
        revision: row.revision,
      })),
    });
  });
}

export function POST(request: Request) {
  return withReception(async () => {
    if (!isSameOrigin(request) || !isJsonRequest(request)) {
      return appointmentResponse({ message: "Otwórz formularz w panelu recepcji." }, 403);
    }
    const appointment = parseAppointment(await request.json().catch(() => null));
    if (!appointment) return appointmentResponse({ message: "Sprawdź dane wizyty i pacjenta." }, 400);

    const status = await saveAppointment(appointment);
    return status === 409
      ? appointmentResponse({ message: unavailable }, 409)
      : appointmentResponse({}, status);
  });
}

export function PATCH(request: Request) {
  return withReception(async () => {
    if (!isSameOrigin(request) || !isJsonRequest(request)) {
      return appointmentResponse({ message: "Otwórz formularz w panelu recepcji." }, 403);
    }
    const { id, revision, action, date, start } = (await request.json().catch(() => null)) ?? {};
    if (
      !isAppointmentId(id) || typeof revision !== "number" || !Number.isInteger(revision) ||
      revision < 0 || revision >= 2_147_483_647 || (action !== "move" && action !== "cancel")
    ) {
      return appointmentResponse({ message: "Wybierz poprawną wizytę." }, 400);
    }

    const filter = { ...activeAppointment, id: `eq.${id}`, revision: `eq.${revision}` };
    let changes;
    if (action === "cancel") {
      changes = { cancelled_at: new Date().toISOString() };
    } else {
      const day = typeof date === "string" ? parseBookingDate(date) : null;
      if (day === null || typeof start !== "number" || !Number.isInteger(start)) {
        return appointmentResponse({ message: invalidDate }, 400);
      }

      const current = await appointmentsRequest({ ...filter, select: "starts_at_minute,ends_at_minute" });
      if (!current.ok) throw new Error("Could not read current appointment");
      const [row]: Pick<AppointmentRow, "starts_at_minute" | "ends_at_minute">[] = await current.json();
      if (!row) return appointmentResponse({ message: staleAppointment }, 409);
      const duration = row.ends_at_minute - row.starts_at_minute;
      if (!canScheduleAppointment(day, duration, start)) return appointmentResponse({ message: unavailable }, 409);
      changes = { appointment_date: date, starts_at_minute: start, ends_at_minute: start + duration };
    }

    const update = await appointmentsRequest({ ...filter, select: "id" }, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ ...changes, revision: revision + 1 }),
    });
    if (!update.ok) {
      const { code } = await update.json().catch(() => ({}));
      if (code === "23P01") return appointmentResponse({ message: unavailable }, 409);
      throw new Error("Could not update appointment");
    }
    const rows: Array<{ id: string }> = await update.json();
    return rows.length > 0 ? appointmentResponse({}) : appointmentResponse({ message: staleAppointment }, 409);
  });
}
