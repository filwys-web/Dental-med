import type { Metadata } from "next";
import { PageIntro } from "../../components/page-intro";
import { booking } from "../../lib/site";
import { BookingCalendar } from "./booking-calendar";
import "./booking.css";

export const metadata: Metadata = {
  title: booking.label,
  description: "Wybierz dzień, zabieg, lekarza i godzinę w kalendarzu Dental Med.",
};

export default function BookingPage() {
  return (
    <main id="tresc" className="content-page shell">
      <PageIntro
        title={booking.label}
        description="Wybierz termin w kalendarzu, sprawdź podsumowanie i umów wizytę."
      />
      <BookingCalendar />
    </main>
  );
}
