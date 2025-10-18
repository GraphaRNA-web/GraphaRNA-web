// app/results/page.tsx

import { Suspense } from 'react';
import ResultsClient from './ResultsClient'; 
import '../styles/results.css';


export default function ResultsPage() {
  return (

    <Suspense fallback={<div className='whole-page'><p className='loading-info'>Loading results...</p></div>}>
      <ResultsClient />
    </Suspense>
  );
}