// app/jobs/page.tsx

import { Suspense } from 'react';
import JobsQueue from './JobsPage'; 
import '../styles/results.css';


export default function JobsPage() {
  return (

    <Suspense fallback={<div className='whole-page'><p className='loading-info'>Loading results...</p></div>}>
      <JobsQueue />
    </Suspense>
  );
}