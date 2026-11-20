"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { dentists } from "../../lib/dentists";
import { clinic, formatClockTime } from "../../lib/site";
import {
  formatBookingDate,
  getAvailableTreatments,
  getClinicTime,
  getDentistSlots,
  hasAvailableTime,
  isClinicWorkday,
  type BusyAppointment,
  type ClinicTime,
} from "./booking-schedule";

const weekdays = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];
const monthFormat = new Intl.DateTimeFormat("pl-PL", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const dayFormat = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "full",
  timeZone: "UTC",
});

function shiftMonth(timestamp: number, offset: number) {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1);
}

function subscribeToClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 1_000);
  return () => window.clearInterval(timer);
}

function getMinuteSnapshot() {
  return Math.floor(Date.now() / 60_000) * 60_000;
}

function getServerSnapshot() {
  return null;
}

export function BookingCalendar() {
  const currentMinute = useSyncExternalStore(subscribeToClock, getMinuteSnapshot, getServerSnapshot);
  const [visibleMonth, setVisibleMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  if (currentMinute === null) {
    return <p className="booking-loading" role="status">Wczytywanie kalendarza…</p>;
  }

  const now = getClinicTime(currentMinute);
  const earliestMonth = shiftMonth(now.day, 0);
  const month = Math.max(earliestMonth, visibleMonth ?? earliestMonth);
  const firstDay = new Date(month);
  const leadingDays = (firstDay.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(shiftMonth(month, 1) - 1).getUTCDate();

  return (
    <div className="booking-layout">
      <section className="booking-card" aria-labelledby="booking-calendar-heading">
        <h2 id="booking-calendar-heading">Wybierz dzień</h2>
        <div className="booking-month-nav">
          <button
            type="button"
            aria-label="Poprzedni miesiąc"
            disabled={isBooking || month === earliestMonth}
            onClick={() => setVisibleMonth(shiftMonth(month, -1))}
          >
            <ChevronLeft size={21} aria-hidden="true" />
          </button>
          <p aria-live="polite">{monthFormat.format(month)}</p>
          <button type="button" aria-label="Następny miesiąc" disabled={isBooking} onClick={() => setVisibleMonth(shiftMonth(month, 1))}>
            <ChevronRight size={21} aria-hidden="true" />
          </button>
        </div>
        <div className="booking-weekdays" aria-hidden="true">
          {weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}
        </div>
        <div className="booking-days">
          {Array.from({ length: leadingDays }, (_, index) => <span key={index} aria-hidden="true" />)}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = Date.UTC(firstDay.getUTCFullYear(), firstDay.getUTCMonth(), index + 1);
            const available = hasAvailableTime(day, now);
            const dateLabel = dayFormat.format(day);
            const label = available
              ? dateLabel
              : `${dateLabel} – ${isClinicWorkday(day) ? "brak dostępnych godzin" : "gabinet zamknięty"}`;

            return (
              <button
                key={day}
                type="button"
                aria-label={label}
                aria-current={day === now.day ? "date" : undefined}
                aria-pressed={day === selectedDay}
                aria-controls="booking-details"
                disabled={isBooking || !available}
                onClick={() => setSelectedDay(day)}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <p className="booking-hours"><Clock size={17} aria-hidden="true" /> {clinic.contact.hours}</p>
      </section>

      <section id="booking-details" className="booking-card booking-details" aria-labelledby="booking-details-heading">
        <h2 id="booking-details-heading">Szczegóły wizyty</h2>
        <p className="booking-selected-date" aria-live="polite">
          <CalendarDays size={18} aria-hidden="true" />
          {selectedDay === null ? "Wybierz dzień w kalendarzu." : dayFormat.format(selectedDay)}
        </p>
        {selectedDay !== null && <BookingDetails key={selectedDay} day={selectedDay} now={now} onBookingChange={setIsBooking} />}
      </section>
    </div>
  );
}

type ContactDetails = { name: string; email: string; phone: string };
type Confirmation = { start: number; end: number; treatment: string; dentist: string };
type BookingPreview = {
  requestId: string;
  contact: ContactDetails;
  treatmentId: string;
  dentistId: BusyAppointment["dentistId"];
  details: Confirmation;
};

function BookingDetails({ day, now, onBookingChange }: { day: number; now: ClinicTime; onBookingChange: (pending: boolean) => void }) {
  const [treatmentId, setTreatmentId] = useState("");
  const [dentistId, setDentistId] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [contact, setContact] = useState<ContactDetails>({ name: "", email: "", phone: "" });
  const [preview, setPreview] = useState<BookingPreview | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [appointments, setAppointments] = useState<BusyAppointment[] | null>(null);
  const [availabilityError, setAvailabilityError] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const date = formatBookingDate(day);

  useEffect(() => {
    let request: AbortController | undefined;

    async function loadAvailability() {
      request?.abort();
      const controller = new AbortController();
      request = controller;

      try {
        const response = await fetch(`/api/appointments?date=${date}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Availability request failed");
        const result: { appointments: BusyAppointment[] } = await response.json();
        if (controller.signal.aborted) return;
        setAppointments(result.appointments);
        setAvailabilityError(false);
      } catch {
        if (!controller.signal.aborted) setAvailabilityError(true);
      }
    }

    void loadAvailability();
    window.addEventListener("focus", loadAvailability);
    const timer = window.setInterval(loadAvailability, 30_000);

    return () => {
      request?.abort();
      window.removeEventListener("focus", loadAvailability);
      window.clearInterval(timer);
    };
  }, [date, refresh]);

  const availableTreatments = appointments ? getAvailableTreatments(day, now, appointments) : [];
  const treatment = availableTreatments.find(({ id }) => id === treatmentId);
  const availableDentists = treatment && appointments ? treatment.dentistIds.map((id) => ({
    id,
    slots: getDentistSlots(day, treatment.duration, now, id, appointments),
  })).filter(({ slots }) => slots.length > 0) : [];
  const dentist = availableDentists.find(({ id }) => id === dentistId);
  const slots = dentist?.slots ?? [];
  const selectedStart = startTime !== null && slots.includes(startTime) ? startTime : null;

  function updateContact(field: keyof ContactDetails, value: string) {
    setContact((current) => ({ ...current, [field]: value }));
    setPreview(null);
  }

  function showPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!treatment || !dentist || selectedStart === null || isBooking) return;

    const requestId = preview?.requestId ?? crypto.randomUUID();
    setPreview({
      requestId,
      contact: { name: contact.name.trim(), email: contact.email.trim(), phone: contact.phone.trim() },
      treatmentId: treatment.id,
      dentistId: dentist.id,
      details: {
        start: selectedStart,
        end: selectedStart + treatment.duration,
        treatment: treatment.name,
        dentist: dentists[dentist.id].name,
      },
    });
  }

  async function confirmBooking() {
    if (!preview || isBooking) return;

    setIsBooking(true);
    onBookingChange(true);
    setBookingError("");

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...preview.contact,
          requestId: preview.requestId,
          date,
          treatmentId: preview.treatmentId,
          dentistId: preview.dentistId,
          start: preview.details.start,
        }),
      });

      if (response.ok) {
        setConfirmation(preview.details);
        setContact({ name: "", email: "", phone: "" });
        setPreview(null);
        return;
      }

      const result = await response.json().catch(() => null);
      setBookingError(result?.message ?? "Nie udało się umówić wizyty. Spróbuj ponownie.");
      if (response.status === 409) {
        setStartTime(null);
        setPreview(null);
        setRefresh((current) => current + 1);
      }
    } catch {
      setBookingError("Nie udało się sprawdzić wyniku rezerwacji. Ponów próbę.");
    } finally {
      setIsBooking(false);
      onBookingChange(false);
    }
  }

  if (confirmation) {
    return (
      <div className="booking-summary booking-confirmation" role="status">
        <h3>Wizyta umówiona</h3>
        <p>{dayFormat.format(day)}, {formatClockTime(confirmation.start)}–{formatClockTime(confirmation.end)}</p>
        <p>{confirmation.treatment} · {confirmation.dentist}</p>
      </div>
    );
  }

  if (availabilityError && !appointments) {
    return (
      <div className="booking-message">
        <p role="status">Nie udało się pobrać dostępnych godzin.</p>
        <button type="button" className="button button-outline" onClick={() => setRefresh((current) => current + 1)}>Spróbuj ponownie</button>
      </div>
    );
  }

  if (!appointments) return <p className="booking-message" role="status">Pobieranie dostępnych godzin…</p>;

  if (availableTreatments.length === 0 && !preview) {
    return <p className="booking-message" role="status">{bookingError || "Brak wolnych godzin. Wybierz inny dzień."}</p>;
  }

  return (
    <form className="booking-form" onSubmit={showPreview}>
      <div>
        <label className="booking-field">
          Zabieg
          <select
            value={treatment?.id ?? ""}
            disabled={isBooking}
            aria-describedby={treatment ? "booking-treatment-duration" : undefined}
            onChange={(event) => {
              setTreatmentId(event.target.value);
              setDentistId("");
              setStartTime(null);
              setPreview(null);
              setBookingError("");
            }}
          >
            <option value="">Wybierz zabieg</option>
            {availableTreatments.map(({ id, name, duration }) => (
              <option key={id} value={id}>{name} ({duration} min)</option>
            ))}
          </select>
        </label>
        {treatment && <p id="booking-treatment-duration">Czas zabiegu · {treatment.duration} min</p>}
      </div>

      {treatment && (
        <label className="booking-field">
          Lekarz
          <select value={dentist?.id ?? ""} disabled={isBooking} onChange={(event) => {
            setDentistId(event.target.value);
            setStartTime(null);
            setPreview(null);
            setBookingError("");
          }}>
            <option value="">Wybierz lekarza</option>
            {availableDentists.map(({ id }) => <option key={id} value={id}>{dentists[id].name}</option>)}
          </select>
        </label>
      )}

      {startTime !== null && selectedStart === null && !preview && (
        <p role="status">Wybrana godzina jest już niedostępna. Wybierz inny termin.</p>
      )}

      {dentist && (
        <fieldset disabled={isBooking}>
          <legend>Godzina rozpoczęcia</legend>
          <div className="booking-slots">
            {slots.map((slot) => (
              <label className="booking-slot" key={slot}>
                <input type="radio" name="startTime" value={slot} checked={slot === selectedStart} onChange={() => {
                  setStartTime(slot);
                  setPreview(null);
                  setBookingError("");
                }} />
                <span>{formatClockTime(slot)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {treatment && dentist && selectedStart !== null && (
        <>
          <fieldset className="booking-contacts" disabled={isBooking}>
            <legend>Dane kontaktowe</legend>
            <label className="booking-field">
              Imię i nazwisko
              <input name="name" value={contact.name} onChange={(event) => updateContact("name", event.target.value)}
                autoComplete="name" required minLength={2} maxLength={120} pattern={String.raw`.*\S.*`} />
            </label>
            <label className="booking-field">
              Adres e-mail
              <input name="email" type="email" value={contact.email} onChange={(event) => updateContact("email", event.target.value)}
                autoComplete="email" required maxLength={254} />
            </label>
            <label className="booking-field">
              Numer telefonu
              <input
                name="phone"
                type="tel"
                value={contact.phone}
                onChange={(event) => updateContact("phone", event.target.value)}
                autoComplete="tel"
                required
                maxLength={30}
                pattern={String.raw`\+?(?:[\s\(\)\-]*[0-9]){7,15}[\s\(\)\-]*`}
                title="Wpisz od 7 do 15 cyfr. Możesz użyć znaku +, spacji, nawiasów i myślników."
              />
            </label>
          </fieldset>
          <button className="button button-outline booking-preview-button" type="submit" disabled={isBooking}>Sprawdź podsumowanie</button>
        </>
      )}
      <div aria-live="polite">
        {preview && (
          <>
            <div className="booking-summary">
              <h3>Podsumowanie wizyty</h3>
              <p>{dayFormat.format(day)}, {formatClockTime(preview.details.start)}–{formatClockTime(preview.details.end)}</p>
              <p>{preview.details.treatment} · {preview.details.dentist}</p>
              <p>{preview.contact.name} · {preview.contact.email} · {preview.contact.phone}</p>
            </div>
            <button className="button button-primary booking-confirm-button" type="button" disabled={isBooking} onClick={confirmBooking}>
              {isBooking ? "Zapisywanie wizyty…" : "Umów wizytę"}
            </button>
          </>
        )}
      </div>
      {bookingError && <p className="booking-error" role="alert">{bookingError}</p>}
    </form>
  );
}
