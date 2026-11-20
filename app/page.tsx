import { ArrowRight, ClipboardList, MapPin, ScanLine, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import consultation from "../public/zdjecia/konsultacja.webp";
import { booking, clinic, firstVisit } from "../lib/site";

const highlights = [
  {
    icon: ClipboardList,
    title: "Przejrzysty plan leczenia",
    description: "Omawiamy kolejne etapy i koszty przed rozpoczęciem leczenia.",
  },
  {
    icon: ScanLine,
    title: "Diagnostyka na miejscu",
    description: "Cyfrowe RTG i skan zębów wykonujemy w gabinecie.",
  },
  {
    icon: UsersRound,
    title: "Opieka dla całej rodziny",
    description: "Przyjmujemy dzieci, dorosłych i seniorów.",
  },
];

export default function Home() {
  return (
    <main id="tresc" className="home shell">
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <p className="location">
            <MapPin size={16} aria-hidden="true" />
            Gabinet stomatologiczny <span aria-hidden="true">·</span> {clinic.city}
          </p>
          <h1 id="hero-heading">
            Zdrowy uśmiech.{" "}
            <span>Spokojna wizyta.</span>
          </h1>
          <p className="hero-description">{clinic.description}</p>
          <div className="hero-actions">
            <Link className="button button-primary" href={`/${booking.slug}`}>
              {booking.label} <ArrowRight size={19} aria-hidden="true" />
            </Link>
            <Link className="first-visit-link" href={`/${firstVisit.slug}`}>
              {firstVisit.label}
            </Link>
          </div>
        </div>

        <div className="hero-media">
          <Image
            src={consultation}
            alt="Pacjentka rozmawia ze stomatolożką i ogląda model zębów"
            fill
            preload
            placeholder="blur"
            sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1340px) 51vw, 670px"
          />
          <div className="photo-caption">
            <span className="photo-caption-dot" aria-hidden="true" />
            Zdjęcie poglądowe
          </div>
        </div>
      </section>

      <ul className="highlights" aria-label="Opieka w Dental Med">
        {highlights.map(({ icon: Icon, title, description }) => (
          <li key={title} className="highlight">
            <span className="highlight-icon" aria-hidden="true"><Icon size={23} /></span>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
