'use client';

import React from 'react';
import '../styles/results.css';
import PdbViewer from "../components/PdbViewer";


export default function Home() {

  const [isFound, setIsFound] = React.useState(true);

  return (
    <div className='content'>
      {isFound === false && (
          <div className='not-found'>
          <div className='left-side'>
              <div className='headers'>
                <p className='error-code'>404</p>
                <p className='add-info'>Oops! Results page not found.</p>
              </div>
              <p>The result page you are looking for is probably deleted due to the timeout. 
                Start a new job to find out the calculation results.</p>
          </div>
          <div className='right-side'>
              <img src='photos/notfound.png' width={414} height={414}></img>
          </div>
        </div>
      )}

      {isFound === true && (
        <div className='found'>
            <PdbViewer 
              filePath="1CRN.pdb" 
              width={400} 
              height={350} 
            />
        </div>
      )}
    </div>
  );
}
