import "@fontsource-variable/manrope";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "../components/site-header";
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
        <SiteHeader />
        {children}
        <footer className="site-footer shell">
          <span className="footer-name">{clinic.name} <span aria-hidden="true">·</span> {clinic.city}</span>
        </footer>
      </body>
    </html>
  );
}
