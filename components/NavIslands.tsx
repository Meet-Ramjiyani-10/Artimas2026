'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MEDIA } from '@/lib/media';

export default function NavIslands({ showMobile = false }: { showMobile?: boolean }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.classList.toggle('mobile-nav-open', isOpen);
    return () => document.body.classList.remove('mobile-nav-open');
  }, [isOpen]);

  const desktopLinks = [
    { href: '/', label: 'ARTIMAS' },
    { href: '/events', label: 'EVENTS' },
    { href: '/sponsors', label: 'SPONSORS' },
    { href: '/team', label: 'TEAM' },
    { href: '/calendar', label: 'CALENDAR' },
  ];

  const mobileLinks = [
    { href: '/events', label: 'EVENTS' },
    { href: '/sponsors', label: 'SPONSORS' },
    { href: '/team', label: 'TEAM' },
    { href: '/calendar', label: 'CALENDAR' },
  ];

  return (
    <>
      {/* ── Desktop Navbar (> 768px) ──────────────────────────────────── */}
      <nav className="ancient-navbar desktop-nav-only" aria-label="Main Navigation">
        {desktopLinks.map(({ href, label }, idx) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <span key={href} className="ancient-nav-item">
              <Link
                href={href}
                prefetch={true}
                className={`ancient-nav-link${isActive ? ' active-nav' : ''}`}
              >
                {label}
              </Link>
              {idx < desktopLinks.length - 1 && (
                <span className="ancient-nav-divider" aria-hidden="true">|</span>
              )}
            </span>
          );
        })}
      </nav>

      {/* ── Mobile Capsule Pill (≤ 768px, subpages + yugas mode) ────── */}
      {(pathname !== '/' || showMobile) && (
        <div className="mobile-nav-wrapper mobile-nav-only">
          <div className={`mobile-nav-pill${isOpen ? ' drawer-active' : ''}`}>
            {/* Brand logo → home */}
            <Link href="/" className="mobile-nav-brand" onClick={() => setIsOpen(false)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={MEDIA.images.logo}
                alt="Artimas"
                className="mobile-nav-logo-img"
                draggable={false}
              />
            </Link>

            {/* Hamburger / close toggle */}
            <button
              type="button"
              className="mobile-nav-toggle-btn"
              onClick={() => setIsOpen(prev => !prev)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <svg viewBox="0 0 24 24" className="mobile-toggle-icon" fill="none"
                  stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="4" x2="20" y2="20" />
                  <line x1="20" y1="4" x2="4" y2="20" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="mobile-toggle-icon" fill="none"
                  stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>

          {/* ── Drawer dropdown ──────────────────────────────────────────── */}
          {isOpen && (
            <>
              <div
                className="mobile-nav-backdrop"
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
              />
              <div className="mobile-nav-drawer-card">
                <div className="mobile-drawer-content">
                  {/* Nav links */}
                  <nav className="mobile-drawer-links" aria-label="Mobile Navigation">
                    {mobileLinks.map(({ href, label }) => {
                      const isActive = pathname === href || pathname.startsWith(`${href}/`);
                      return (
                        <Link
                          key={href}
                          href={href}
                          prefetch={true}
                          onClick={() => setIsOpen(false)}
                          className={`mobile-drawer-link${isActive ? ' active-link' : ''}`}
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
