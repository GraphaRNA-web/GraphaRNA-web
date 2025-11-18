'use client';

import React, { useState, useEffect } from 'react';
import './styles/home.css';
import Button from './components/Button';
import Link from 'next/link';

export default function Home() {
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isSmall = windowWidth <= 500;

  return (
    <div className="home-background">
      <div className="home-container">
        <div className="home-header">
          <div className="home-intro-text">
            <span className="intro-explore" style={{ display: 'block' }}>Explore</span>
            <span className="intro-world" style={{ display: 'block' }}>the world of RNA</span>
            <span style={{ display: 'block' }}>
              <span className="intro-with">with </span>
              <span className="intro-grapha">Grapha</span>
              <span className="intro-rna-web">RNA-web</span>
            </span>
          </div>
          <div className="home-description-header">Define interaction graphs, predict RNA structure, and visualize the results for structural analysis easily.</div>
          <div className="home-description-text">
            <p>GraphaRNA-web is the web implementation of <span style={{ fontWeight: 500 }}>'Graph neural network and diffusion model for modeling RNA interatomic interactions'</span> .</p>
          </div>
        </div>

        <div className="home-buttons" style={isSmall ? { flexDirection: 'column', gap: '15px' } : {}}>
          <Link href="/submitJob">
            <Button
              id="home-start-button"
              color="primary"
              variant="filled"
              label="Start a job"
              fontSize="20px"
              width={isSmall ? '260px' : '392px'}
              height="48px"
              disabled={false}
            />
          </Link>
          <Link href="/guide">
            <Button
              id="home-guide-button"
              color="primary"
              variant="outlined"
              label="Guide"
              fontSize="20px"
              width={isSmall ? '260px' : '214px'}
              height="48px"
              disabled={false}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
