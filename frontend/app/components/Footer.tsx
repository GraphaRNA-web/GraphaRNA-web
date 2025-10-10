'use client';

import React from 'react';
import '../styles/footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer_left">
        <p>Copyright © {new Date().getFullYear()} Poznan University of Technology</p>
      </div>
      <div className="footer_right">
        <a href="https://put.poznan.pl/" target="_blank" rel="noopener noreferrer">
          <img src="/photos/put_logo.png" alt="Logo" className="footer_logo" />
        </a>
        <a href="https://rnapolis.pl/" target="_blank" rel="noopener noreferrer">
          <img src="/photos/raa_logo.png" alt="Logo" className="footer_logo" />
        </a>
        <a href="https://portal.ichb.pl/psnc-ibch-pas/" target="_blank" rel="noopener noreferrer">
          <img src="/photos/ibch_logo.png" alt="Logo" className="footer_logo" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
