'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../styles/navbar.css';
import Button from './Button';
const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar__left">
        <Link href="/">
          <span className="name--grapha">Grapha</span>
          <span className="name--rna">RNA</span>
          <span className="name--web">-web</span>
        </Link>
      </div>

      {/* Hamburger / X icon */}
      <div className="navbar__hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? '✕' : '☰'}
      </div>

      <div className={`navbar__right ${isMenuOpen ? 'open' : ''}`}>
        <Link href="/submitJob" onClick={() => setIsMenuOpen(false)}>
          <Button
            color="primary"
            variant="filled"
            label="Start a job"
            width="190px"
            height="32px"
            fontSize="14px"
          />
        </Link>
        <Link href="/jobs" className={`navbar__link ${pathname === '/jobs' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Jobs</Link>
        <Link href="/guide" className={`navbar__link ${pathname === '/guide' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Guide</Link>
        <Link href="/about" className={`navbar__link ${pathname === '/about' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>About</Link>
        <Link href="/cite" className={`navbar__link ${pathname === '/cite' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Cite Us</Link>
      </div>
    </nav>
  );
};

export default Navbar;
