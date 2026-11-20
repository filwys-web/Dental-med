"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { dentists } from "../../lib/dentists";
import { clinic, formatClockTime } from "../../lib/site";
import {
  getAvailableTreatments,
  getClinicTime,
  getTimeSlots,
  hasAvailableTime,
  isClinicWorkday,
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
            disabled={month === earliestMonth}
            onClick={() => setVisibleMonth(shiftMonth(month, -1))}
          >
            <ChevronLeft size={21} aria-hidden="true" />
          </button>
          <p aria-live="polite">{monthFormat.format(month)}</p>
          <button type="button" aria-label="Następny miesiąc" onClick={() => setVisibleMonth(shiftMonth(month, 1))}>
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
                disabled={!available}
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
        {selectedDay !== null && <BookingDetails key={selectedDay} day={selectedDay} now={now} />}
      </section>
    </div>
  );
}

type ContactDetails = { name: string; email: string; phone: string };

function BookingDetails({ day, now }: { day: number; now: ClinicTime }) {
  const [treatmentId, setTreatmentId] = useState("");
  const [dentistId, setDentistId] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [preview, setPreview] = useState<ContactDetails | null>(null);

  const availableTreatments = getAvailableTreatments(day, now);
  const treatment = availableTreatments.find(({ id }) => id === treatmentId);
  const dentist = treatment?.dentistIds.find((id) => id === dentistId);
  const slots = treatment && dentist ? getTimeSlots(day, treatment.duration, now) : [];
  const selectedStart = startTime !== null && slots.includes(startTime) ? startTime : null;

  function showPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const currentTime = getClinicTime(getMinuteSnapshot());
    if (!treatment || selectedStart === null || !getTimeSlots(day, treatment.duration, currentTime).includes(selectedStart)) {
      setPreview(null);
      return;
    }

    const fields = new FormData(event.currentTarget);
    setPreview({
      name: String(fields.get("name")).trim(),
      email: String(fields.get("email")).trim(),
      phone: String(fields.get("phone")).trim(),
    });
  }

  if (availableTreatments.length === 0) {
    return <p className="booking-message" role="status">Wybierz inny dzień, aby zobaczyć dostępne godziny.</p>;
  }

  return (
    <form className="booking-form" onSubmit={showPreview}>
      <div>
        <label className="booking-field">
          Zabieg
          <select
            value={treatment?.id ?? ""}
            aria-describedby={treatment ? "booking-treatment-duration" : undefined}
            onChange={(event) => {
              setTreatmentId(event.target.value);
              setDentistId("");
              setStartTime(null);
              setPreview(null);
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
          <select value={dentist ?? ""} onChange={(event) => {
            setDentistId(event.target.value);
            setStartTime(null);
            setPreview(null);
          }}>
            <option value="">Wybierz lekarza</option>
            {treatment.dentistIds.map((id) => <option key={id} value={id}>{dentists[id].name}</option>)}
          </select>
        </label>
      )}

      {dentist && (
        <fieldset>
          <legend>Godzina rozpoczęcia</legend>
          {startTime !== null && selectedStart === null && (
            <p className="booking-message" role="status">Wybrana godzina już minęła. Wybierz kolejną.</p>
          )}
          <div className="booking-slots">
            {slots.map((slot) => (
              <label className="booking-slot" key={slot}>
                <input type="radio" name="startTime" value={slot} checked={slot === selectedStart} onChange={() => {
                  setStartTime(slot);
                  setPreview(null);
                }} />
                <span>{formatClockTime(slot)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {treatment && dentist && selectedStart !== null && (
        <>
          <fieldset className="booking-contacts" onInput={() => setPreview(null)}>
            <legend>Dane kontaktowe</legend>
            <label className="booking-field">
              Imię i nazwisko
              <input name="name" autoComplete="name" required minLength={2} maxLength={120} pattern={String.raw`.*\S.*`} />
            </label>
            <label className="booking-field">
              Adres e-mail
              <input name="email" type="email" autoComplete="email" required maxLength={254} />
            </label>
            <label className="booking-field">
              Numer telefonu
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                maxLength={30}
                pattern={String.raw`\+?(?:[\s\(\)\-]*[0-9]){7,15}[\s\(\)\-]*`}
                title="Wpisz od 7 do 15 cyfr. Możesz użyć znaku +, spacji, nawiasów i myślników."
              />
            </label>
          </fieldset>
          <button className="button button-primary booking-preview-button" type="submit">Sprawdź podsumowanie</button>
          <div aria-live="polite">
            {preview && (
              <div className="booking-summary">
                <h3>Podgląd wizyty</h3>
                <p>{dayFormat.format(day)}, {formatClockTime(selectedStart)}–{formatClockTime(selectedStart + treatment.duration)}</p>
                <p>{treatment.name} · {dentists[dentist].name}</p>
                <p>{preview.name} · {preview.email} · {preview.phone}</p>
                <p className="booking-summary-note">Dane służą wyłącznie do podglądu w tej przeglądarce.</p>
              </div>
            )}
          </div>
        </>
      )}
    </form>
  );
}
