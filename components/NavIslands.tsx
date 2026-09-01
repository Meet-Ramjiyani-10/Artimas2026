'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavIslands() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'ARTIMAS' },
    { href: '/events', label: 'EVENTS' },
    { href: '/sponsors', label: 'SPONSORS' },
    { href: '/team', label: 'TEAM' },
    { href: '/calendar', label: 'CALENDAR' },
  ];

  return (
    <nav className="ancient-navbar" aria-label="Main Navigation">
      {links.map(({ href, label }, idx) => {
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
            {idx < links.length - 1 && (
              <span className="ancient-nav-divider" aria-hidden="true">
                |
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
