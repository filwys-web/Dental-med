import type { Metadata } from "next";
import { ReceptionPanel } from "./reception-panel";
import "./reception.css";

export const metadata: Metadata = {
  title: "Recepcja",
  description: "Panel recepcji Dental Med",
  robots: { index: false, follow: false },
};

export default function ReceptionPage() {
  return <ReceptionPanel />;
}
