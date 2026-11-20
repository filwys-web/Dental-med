import "@fontsource-variable/manrope";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteLayout } from "../components/site-layout";
import { clinic } from "../lib/site";
import "./globals.css";
import "./subpages.css";

export const metadata: Metadata = {
  title: {
    default: `${clinic.name} | Gabinet stomatologiczny we Wrocławiu`,
    template: `%s | ${clinic.name}`,
  },
  description: clinic.description,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <a href="#tresc" className="skip-link">Przejdź do treści</a>
        <SiteLayout>{children}</SiteLayout>
      </body>
    </html>
  );
}
