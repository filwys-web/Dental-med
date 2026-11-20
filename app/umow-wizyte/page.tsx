import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { booking } from "../../lib/site";

export const metadata: Metadata = { title: booking.label };

export default function BookingPage() {
  return (
    <main id="tresc" className="section-page shell">
      <div className="section-card">
        <h1>{booking.label}</h1>
        <p>Rezerwacje online są obecnie niedostępne.</p>
        <Link href="/" className="button button-primary">
          <ArrowLeft size={18} aria-hidden="true" /> Wróć na stronę główną
        </Link>
      </div>
    </main>
  );
}
