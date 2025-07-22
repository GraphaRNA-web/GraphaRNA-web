'use client';

import React from 'react';
import '../styles/footer.css'; // dopasuj ścieżkę, jeśli masz inną

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer__left">
        <p>Copyright © {new Date().getFullYear()} Poznan University of Technology</p>
      </div>
      <div className="footer__right">
        <img src="/put_logo.png" alt="Logo" className="footer__logo" />
        <img src="/raa_logo.png" alt="Logo" className="footer__logo" />
        <img src="/ibch_logo.png" alt="Logo" className="footer__logo" />
      </div>
    </footer>
  );
};

export default Footer;
