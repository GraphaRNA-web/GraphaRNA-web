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
        <a href="https://put.poznan.pl/" target="_blank" rel="noopener noreferrer">
          <img src="/put_logo.png" alt="Logo" className="footer__logo" />
        </a>
        <a href="https://rnapolis.pl/" target="_blank" rel="noopener noreferrer">
          <img src="/raa_logo.png" alt="Logo" className="footer__logo" />
        </a>
        <a href="https://portal.ichb.pl/psnc-ibch-pas/" target="_blank" rel="noopener noreferrer">
          <img src="/ibch_logo.png" alt="Logo" className="footer__logo" />
        </a>
        {/* <img src="/sneaky_golem.png" alt="Logo" className="footer__logo" /> */}
      </div>
    </footer>
  );
};

export default Footer;
