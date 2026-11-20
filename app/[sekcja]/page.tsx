import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { booking, sections } from "../../lib/site";

type SectionPageProps = { params: Promise<{ sekcja: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return sections.map(({ slug }) => ({ sekcja: slug }));
}

async function getSection(params: SectionPageProps["params"]) {
  const { sekcja } = await params;
  const section = sections.find(({ slug }) => slug === sekcja);
  if (!section) notFound();
  return section;
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const { label } = await getSection(params);
  return { title: label };
}

export default async function SectionPage({ params }: SectionPageProps) {
  const section = await getSection(params);

  return (
    <main id="tresc" className="section-page shell">
      <div className="section-card">
        <h1>{section.label}</h1>
        <p>
          {section === booking
            ? "Rezerwacje będą dostępne w kolejnej wersji projektu."
            : "Ta podstrona pojawi się w kolejnej wersji projektu."}
        </p>
        <Link href="/" className="button button-primary">
          <ArrowLeft size={18} aria-hidden="true" /> Wróć na stronę główną
        </Link>
      </div>
    </main>
  );
}
