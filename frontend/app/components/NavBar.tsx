'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../styles/navbar.css';

const Navbar: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="navbar__left">
        <span className="name--grapha">Grapha</span>
        <span className="name--rna">RNA</span>
        <span className="name--web">-web</span>
      </div>
      <div className="navbar__right">
        <Link
          href="/"
          className={`navbar__link ${pathname === '/' ? 'active' : ''}`}
          >
            Home
        </Link>
        <Link
          href="/jobs"
          className={`navbar__link ${pathname === '/jobs' ? 'active' : ''}`}
        >
          Jobs
        </Link>
        <Link
          href="/guide"
          className={`navbar__link ${pathname === '/guide' ? 'active' : ''}`}
        >
          Guide
        </Link>
        <Link
          href="/about"
          className={`navbar__link ${pathname === '/about' ? 'active' : ''}`}
        >
          About
        </Link>
        <Link
          href="/cite"
          className={`navbar__link ${pathname === '/cite' ? 'active' : ''}`}
        >
          Cite Us
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
