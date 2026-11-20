import type { Metadata } from "next";
import { getReceptionInitialDay } from "../../lib/reception-session";
import { ReceptionPanel } from "./reception-panel";
import "./reception.css";

export const metadata: Metadata = {
  title: "Recepcja",
  description: "Panel recepcji Dental Med",
  robots: { index: false, follow: false },
};

export default async function ReceptionPage({ searchParams }: {
  searchParams: Promise<{ aktywacja?: string }>;
}) {
  const activation = (await searchParams).aktywacja === "1";
  return <ReceptionPanel initialDay={activation ? null : await getReceptionInitialDay()} activation={activation} />;
}
