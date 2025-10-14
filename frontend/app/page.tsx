'use client';

import React from 'react';
import './styles/home.css';
import Button from './components/Button';
import Link from 'next/link'

export default function Home() {
  return (
    <div className="home-background">
      <div className='home-container'>
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
          <div className="home-description-text">
            <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.</p>
          </div>
        </div>
        <div className='home-buttons'>
            <Link href="/submitJob">
              <Button
                id="home-start-button"
                color="primary"
                variant="filled"
                label="Start a job"
                fontSize='20px'
                width="392px"
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
                fontSize='20px'
                width="214px"
                height="48px"
                disabled={false}
              />
            </Link>
        </div>
      </div>
    </div>
  );
}
