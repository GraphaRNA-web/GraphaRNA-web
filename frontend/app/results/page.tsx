'use client';

import React from 'react';
import '../styles/results.css';

export default function Home() {
  return (
    <div className='content'>
        <div className='left-side'>
            <div className='headers'>
              <p className='error-code'>404</p>
              <p className='add-info'>Oops! Results page not found.</p>
            </div>
            <p>The result page you are looking for is probably deleted due to the timeout. 
              Start a new job to find out the calculation results.</p>
        </div>
        <div className='right-side'>
            <img src='notfound.png' width={414} height={414}></img>
        </div>
    </div>
  );
}
