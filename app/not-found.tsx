import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main id="tresc" className="section-page shell">
      <div className="section-card">
        <h1>Nie znaleźliśmy tej strony</h1>
        <Link href="/" className="button button-primary">
          <ArrowLeft size={18} aria-hidden="true" /> Wróć na stronę główną
        </Link>
      </div>
    </main>
  );
}
