"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { clinic } from "../lib/site";
import { SiteHeader } from "./site-header";

export function SiteLayout({ children }: { children: ReactNode }) {
  if (usePathname() === "/recepcja") return children;

  return (
    <>
      <SiteHeader />
      {children}
      <footer className="site-footer shell">
        <span className="footer-name">{clinic.name} <span aria-hidden="true">·</span> {clinic.city}</span>
      </footer>
    </>
  );
}
