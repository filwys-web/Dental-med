"use client";

import { CalendarDays, Menu, Plus, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type KeyboardEvent } from "react";
import { booking, clinic, sections } from "../lib/site";

function Header({ pathname }: { pathname: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  function closeOnEscape(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && menuOpen) {
      setMenuOpen(false);
      toggle.current?.focus();
    }
  }

  return (
    <header className="site-header" onKeyDown={closeOnEscape}>
      <div className="site-header-inner shell">
        <Link
          className="wordmark"
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          onClick={() => setMenuOpen(false)}
        >
          <span className="wordmark-icon" aria-hidden="true">
            <Plus size={25} strokeWidth={2.55} />
          </span>
          {clinic.name}
        </Link>

        <button
          className="menu-toggle"
          type="button"
          ref={toggle}
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          aria-label={menuOpen ? "Zamknij menu" : "Otwórz menu"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav
          id="site-navigation"
          className="site-navigation"
          data-open={menuOpen}
          aria-label="Nawigacja główna"
        >
          {sections.map((section) => {
            const href = `/${section.slug}`;
            const isBooking = section === booking;
            return (
              <Link
                key={section.slug}
                href={href}
                className={isBooking ? "button button-outline" : "nav-link"}
                aria-current={pathname === href ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {isBooking && <CalendarDays size={17} aria-hidden="true" />}
                {section.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  return <Header key={pathname} pathname={pathname} />;
}
