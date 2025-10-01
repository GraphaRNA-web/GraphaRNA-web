'use client';

import React from 'react';
import '../styles/results.css';
import PdbViewer from "../components/PdbViewer";
import DotsIndicator from '../components/DotsIndicator';
import ImageViewer from '../components/ImageViewer';
import ArcViewer from '../components/ArcViewer';

export default function Results() {

  const [isFound, setIsFound] = React.useState(true);
  const status = "queued";
  const proc_time = "2h 24min";
  const reported_date = "15-06-2025";
  const reported_time = "22:36";
  const job_name = "job-150625";
  const seed = 25318;
  const jobsCount = 3;
  const [jobFinished, setJobFinished] = React.useState(true);
  const [is2DExpanded, setIs2DExpanded] = React.useState(false);


  return (
    <div className='content'>
      {!isFound && (
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

      {isFound && (
        <div className='found'>
          <div className='content'>
            <p className='title'>Job details</p>
            <div className='top-section'>
              <div className='top-left'>
                <div className='status'>
                  <p className='field-name'>Status</p>
                  <div className='dot-and-text'>
                    <div className='dot'
                    style={{ 
                      backgroundColor: 
                        status === "queued" ? "var(--waiting)" : 
                        status === "submitted"   ? "var(--submitted)" : 
                        status === "running"   ? "var(--running)" : 
                        status === "completed"   ? "var(--completed)" : 
                        status === "error"  ? "var(--error)"   : "var(--brown-lighten-10)" 
                    }}></div>
                    <p className='field-value'>{status}</p>
                  </div>
                </div>
                <div className='proc-time'>
                  <p className='field-name'>Processing time</p>
                  <p className='field-value'>{proc_time}</p>
                </div>
                <div className='rep-date'>
                  <p className='field-name'>Reported date</p>
                  <p className='field-value'>{reported_date}</p>
                </div>
                <div className='rep-time'>
                  <p className='field-name'>Reported time</p>
                  <p className='field-value'>{reported_time}</p>
                </div>
              </div>
              <div className='top-right'>
                <div className='download-zip'>
                  <img src='\icons\download.svg'></img>
                  <p className='download-text'>Download ZIP</p>
                </div>
                <div className='name-and-seed'>
                  <div className='job-name'>
                    <p className='field-name'>Job name</p>
                    <p className='field-value'>{job_name}</p>
                  </div>
                  <div className='seed'>
                    <p className='field-name'>Seed</p>
                    <p className='field-value'>{seed}</p>
                  </div>
                </div>
              </div>
            </div>
            {jobFinished && (
            <div className='finished'>
              <div className='pagination'>
                <DotsIndicator count={jobsCount} />
              </div>
              <div className='rna-data'>
                <div className='input-data'>
                  <div className='input-structure'>
                    <p className='input-field-name1'>Input secondary structure</p>
                    <p className='input-value'>GCUCCUAGAAAGGCGCGGGCCGAGGUACCAAGGCAGCGUGUGGAGC
                    (((((.......((((..(((..........))).))))..)))))</p>
                  </div>
                  <div className='result-structure'>
                    <p className='input-field-name2'>Result secondary structure</p>
                    <p className='input-value'>GCUCCUAGAAAGGCGCGGGCCGAGGUACCAAGGCAGCGUGUGGAGC
                    (((((.......((((..(((..........))).))))..)))))</p>
                  </div>
                  <div className='inf-val'>
                    <p className='input-field-name3'>INF</p>
                    <p className='input-value2'>0...1</p>
                  </div>
                  <div className='f1-val'>
                    <p className='input-field-name3'>F1</p>
                    <p className='input-value2'>0...1</p>
                  </div>
                </div>
                <div className='images-2d3d'>
                  <div className='2d-image'>
                    <ImageViewer 
                      src="/photos/notfound.png" 
                      width={550} 
                      height={612} 
                      onExpandChange={setIs2DExpanded}
                    />
                  </div>
                  {!is2DExpanded && (
                    <div className='3d-image'>
                      <PdbViewer 
                        filePath="1CRN.pdb" 
                        width={550} 
                        height={612} 
                      />
                    </div>
                  )}
                </div>
                <div className='arc-diagram'>
                  <ArcViewer 
                      src="/photos/notfound.png" 
                      width={1120} 
                      height={612} 
                    />
                </div>
              </div>
            </div>
            )}
            {!jobFinished && (
              <div className='not-finished'>
                <p className='info'>The task is still processing. Come back later to see job results.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}