"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Clock3, LogOut, Plus } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { dentists } from "../../lib/dentists";
import { clinic, clinicHours, formatClockTime } from "../../lib/site";
import { formatBookingDate, getClinicTime } from "../../lib/clinic-time";

type DentistId = keyof typeof dentists;
type CalendarView = "month" | "day";

export type ReceptionAppointment = {
  id: string;
  date: string;
  dentistId: DentistId;
  start: number;
  end: number;
  treatment: string;
  patientName: string;
  phone: string;
  email: string;
};

const dayInMilliseconds = 86_400_000;
const weekdays = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
const monthFormat = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric", timeZone: "UTC" });
const dayFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "full", timeZone: "UTC" });
const portraits: Record<DentistId, string> = {
  alicja: "/zdjecia/zespol/alicja-radecka.webp",
  marek: "/zdjecia/zespol/marek-wysocki.webp",
  natalia: "/zdjecia/zespol/natalia-sowinska.webp",
  tomasz: "/zdjecia/zespol/tomasz-malinowski.webp",
  ewa: "/zdjecia/zespol/ewa-domanska.webp",
};
const dentistIds = Object.keys(portraits) as DentistId[];
const { opensAt, closesAt } = clinicHours;
const openingMinutes = closesAt - opensAt;
const hours = Array.from({ length: openingMinutes / 60 }, (_, index) => opensAt + index * 60);
const dayGridStyle = { "--reception-hours": hours.length } as CSSProperties;

function formatHour(minute: number) {
  return formatClockTime(minute).padStart(5, "0");
}

function firstDayOfMonth(day: number, offset = 0) {
  const date = new Date(day);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1);
}

function MonthCalendar({ month, today, selectedDay, onSelect }: {
  month: number;
  today: number;
  selectedDay: number;
  onSelect: (day: number) => void;
}) {
  const leadingDays = (new Date(month).getUTCDay() + 6) % 7;
  const monthLength = (firstDayOfMonth(month, 1) - month) / dayInMilliseconds;
  const cellCount = Math.ceil((leadingDays + monthLength) / 7) * 7;

  return (
    <div className="reception-month" role="group" aria-labelledby="reception-calendar-date">
      {weekdays.map((weekday) => <div key={weekday} className="reception-weekday">{weekday}</div>)}
      {Array.from({ length: cellCount }, (_, index) => {
        const number = index - leadingDays + 1;
        const day = month + (number - 1) * dayInMilliseconds;
        const outsideMonth = number < 1 || number > monthLength;

        return (
          <button
            key={day}
            type="button"
            className="reception-month-day"
            data-outside={outsideMonth}
            data-weekend={index % 7 >= 5}
            data-selected={day === selectedDay}
            aria-current={day === today ? "date" : undefined}
            aria-label={dayFormat.format(day)}
            onClick={() => onSelect(day)}
          >
            <time dateTime={formatBookingDate(day)}>{new Date(day).getUTCDate()}</time>
          </button>
        );
      })}
    </div>
  );
}

function AppointmentBlock({ appointment }: { appointment: ReceptionAppointment }) {
  const { start, end, treatment, patientName, phone, email } = appointment;
  const tooltipId = useId();
  const [detailsDismissed, setDetailsDismissed] = useState(false);
  const position: CSSProperties = {
    top: `${(start - opensAt) / openingMinutes * 100}%`,
    height: `${(end - start) / openingMinutes * 100}%`,
  };

  return (
    <div
      className="reception-appointment"
      data-details-above={start >= closesAt - 180}
      data-details-dismissed={detailsDismissed}
      style={position}
      onPointerEnter={() => setDetailsDismissed(false)}
    >
      <button
        type="button"
        className="reception-appointment-label"
        aria-describedby={tooltipId}
        onFocus={() => setDetailsDismissed(false)}
        onClick={() => setDetailsDismissed(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setDetailsDismissed(true);
        }}
      >
        <time>{formatHour(start)}</time>
        <span>{treatment}</span>
      </button>
      <div className="reception-appointment-details" id={tooltipId} role="tooltip">
        <strong>{treatment}</strong>
        <p>{formatHour(start)}–{formatHour(end)} · {end - start} min</p>
        <dl>
          <dt>Pacjent</dt>
          <dd>{patientName}</dd>
          <dt>Telefon</dt>
          <dd>{phone}</dd>
          <dt>E-mail</dt>
          <dd>{email}</dd>
        </dl>
      </div>
    </div>
  );
}

function DayCalendar({ appointments }: { appointments: readonly ReceptionAppointment[] }) {
  return (
    <div className="reception-day" role="group" aria-labelledby="reception-calendar-date" style={dayGridStyle}>
      <div className="reception-day-head">
        <div className="reception-time-heading"><Clock3 size={15} aria-hidden="true" /> Godzina</div>
        {dentistIds.map((id) => (
          <div className="reception-dentist" key={id}>
            <Image src={portraits[id]} alt="" width={40} height={40} />
            <div>
              <h3 id={`reception-dentist-${id}`}>{dentists[id].name}</h3>
              <p>{dentists[id].area}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="reception-day-body">
        <div className="reception-time-axis" role="group" aria-label="Godziny pracy">
          {hours.map((hour) => <time key={hour}>{formatHour(hour)}</time>)}
          <time className="reception-closing-time">{formatHour(closesAt)}</time>
        </div>
        {dentistIds.map((id) => (
          <section key={id} className="reception-dentist-column" aria-labelledby={`reception-dentist-${id}`}>
            {appointments.filter((appointment) => appointment.dentistId === id).map((appointment) => (
              <AppointmentBlock key={appointment.id} appointment={appointment} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

export function ReceptionCalendar({ today, appointments, onSignOut }: {
  today: number;
  appointments: readonly ReceptionAppointment[];
  onSignOut: () => void;
}) {
  const [currentDay, setCurrentDay] = useState(today);
  const [selectedDay, setSelectedDay] = useState(today);
  const [view, setView] = useState<CalendarView>("month");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const month = firstDayOfMonth(selectedDay);
  const isMonthView = view === "month";
  const dayAppointments = appointments.filter(({ date }) => date === formatBookingDate(selectedDay));
  const hasAppointments = isMonthView
    ? appointments.some(({ date }) => date.startsWith(formatBookingDate(month).slice(0, 7)))
    : dayAppointments.length > 0;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function shiftPeriod(offset: number) {
    setSelectedDay((day) => isMonthView ? firstDayOfMonth(day, offset) : day + offset * dayInMilliseconds);
  }

  function goToToday() {
    const day = getClinicTime(Date.now()).day;
    setCurrentDay(day);
    setSelectedDay(day);
  }

  function selectDay(day: number) {
    setSelectedDay(day);
    setView("day");
    headingRef.current?.focus();
  }

  return (
    <main id="tresc" className="reception-app">
      <header className="reception-topbar">
        <div className="reception-topbar-brand">
          <div className="reception-brand wordmark">
            <span className="wordmark-icon" aria-hidden="true"><Plus size={21} strokeWidth={2.55} /></span>
            {clinic.name}
          </div>
          <span className="reception-topbar-label">Recepcja</span>
        </div>
        <button className="reception-sign-out" type="button" onClick={onSignOut}>
          <LogOut size={17} aria-hidden="true" />
          Wyloguj
        </button>
      </header>
      <div className="reception-workspace">
        <div className="reception-workspace-heading">
          <div className="reception-title">
            <span aria-hidden="true"><CalendarDays size={23} /></span>
            <h1 ref={headingRef} tabIndex={-1}>Kalendarz wizyt</h1>
          </div>
          <div className="reception-view-switch" role="group" aria-label="Widok kalendarza">
            <button type="button" aria-pressed={isMonthView} onClick={() => setView("month")}>Miesiąc</button>
            <button type="button" aria-pressed={!isMonthView} onClick={() => setView("day")}>Dzień</button>
          </div>
        </div>
        <section className="reception-calendar" aria-label="Kalendarz recepcji">
          <div className="reception-calendar-toolbar">
            <div className="reception-period-controls">
              <button className="reception-today" type="button" onClick={goToToday}>Dzisiaj</button>
              <div className="reception-arrows">
                <button
                  type="button"
                  aria-label={isMonthView ? "Poprzedni miesiąc" : "Poprzedni dzień"}
                  onClick={() => shiftPeriod(-1)}
                >
                  <ChevronLeft size={19} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={isMonthView ? "Następny miesiąc" : "Następny dzień"}
                  onClick={() => shiftPeriod(1)}
                >
                  <ChevronRight size={19} aria-hidden="true" />
                </button>
              </div>
              <h2 id="reception-calendar-date" aria-live="polite">
                {isMonthView ? monthFormat.format(month) : dayFormat.format(selectedDay)}
              </h2>
            </div>
            {hasAppointments ? null : <p className="reception-empty">Brak wizyt</p>}
          </div>
          <div className="reception-calendar-scroll" key={view}>
            {isMonthView ? (
              <MonthCalendar month={month} today={currentDay} selectedDay={selectedDay} onSelect={selectDay} />
            ) : (
              <DayCalendar appointments={dayAppointments} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
