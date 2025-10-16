'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getResultDetails, downloadZip } from "@/lib/api";
import '../styles/results.css';
import PdbViewer from "../components/PdbViewer";
import DotsIndicator from '../components/DotsIndicator';
import ImageViewer from '../components/ImageViewer';

interface JobResult {
  completed_at: string;
  result_tetriary_structure: string;
  result_secondary_structure_dotseq: string | null;
  result_secondary_structure_svg: string | null;
  result_arc_diagram: string | null;
  f1: number | null;
  inf: number | null;
  seed: number;
  processing_time: string;
}

interface JobData {
  success: boolean;
  status: 'Q' | 'P' | 'F'; // Queued, Processing, Finished
  job_name: string;
  input_structure: string;
  created_at: string;
  sum_processing_time: string;
  result_list: JobResult[];
}

export default function Results() {
  const searchParams = useSearchParams();
  const uidh = searchParams.get('uidh');
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [is2DExpanded, setIs2DExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!uidh) {
        setError("No task identifier (uidh) in URL parameters!");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getResultDetails({ uidh });
        if (data.success) {
          setJobData(data);
        } else {
          setError(data.error || "Unable to download task data.");
        }
      } catch (err: any) {
        setError(err.message || "Unexpected error.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [uidh]);

  useEffect(() => {
    setWindowWidth(window.innerWidth); // ustawienie początkowe
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  const mapStatusToFrontend = (backendStatus: JobData['status'] | undefined) => {
    const statusMap = {
      'Q': "queued",
      'P': "processing",
      'F': "completed",
    };
    return backendStatus ? statusMap[backendStatus] : "unknown";
  };

  const getStatusColor = (status: string) => {
  switch (status) {
    case "queued": return "var(--waiting)";
      case "processing": return "var(--running)";
      case "completed": return "var(--completed)";
      case "error": return "var(--error)";
      default: return "var(--brown-lighten-10)";
  }
};


const handleDownload = async () => {
    if (!uidh || isDownloading || !jobFinished) return; 

    setIsDownloading(true);
    try {
      await downloadZip({ uidh });
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download ZIP file. Please try again."); 
    } finally {
      setIsDownloading(false);
    }
  };


const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString('pl-PL'), // format DD-MM-YYYY
        time: date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) // format HH:MM
    };
  };
  
  const arcWidth = windowWidth < 1120 ? 550 : 1120;
  
  const isFound = !isLoading && jobData && !error;
  const jobStatus = mapStatusToFrontend(jobData?.status);
  const jobFinished = jobStatus === 'completed';
  const currentResult = jobData?.result_list?.[currentResultIndex];

  if (isLoading) {
    return <div className='whole-page'><p className='loading-info'>Loading results...</p></div>;
  }

  if (!isFound) {
    return (
      <div className='whole-page'>
        <div className='not-found'>
          <div className='left-side'>
            <div className='headers'>
              <p className='error-code'>404</p>
              <p className='add-info'>Oops! Results page not found.</p>
            </div>
            <p>{error || "The result page you are looking for is probably deleted due to the timeout. Start a new job to find out the calculation results."}</p>
          </div>
          <div className='right-side'>
            <img src='/photos/notfound.png' width={414} height={414} alt="Not Found" />
          </div>
        </div>
      </div>
    );
  }

  const { date: reported_date, time: reported_time } = formatDate(jobData.created_at);

  return (
    <div className='whole-page'>
      <div className='found'>
        <div className='content'>
          <p className='title'>Job details</p>
          <div className='top-section'>
            <div className='top-left'>
              <div className='status'>
                <p className='field-name'>Status</p>
                <div className='dot-and-text'>
                  <div className="dot" style={{ backgroundColor: getStatusColor(jobStatus) }}></div>
                  <p className='field-value'>{jobStatus}</p>
                </div>
              </div>
              <div className='proc-time'>
                <p className='field-name'>Total processing time</p>
                <p className='field-value'>{jobData.sum_processing_time || "N/A"}</p>
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
              <div 
              className={`download-zip ${isDownloading || !jobFinished ? 'downloading' : ''}`}
              onClick={handleDownload}
            >
              <img className='download-icon' src='/icons/download.svg' alt="Download icon" />
              <p className='download-text'>
                {isDownloading ? 'Downloading...' : 'Download ZIP'}
              </p>
            </div>
              <div className='name-and-seed'>
                <div className='job-name'>
                  <p className='field-name'>Job name</p>
                  <p className='field-value'>{jobData.job_name}</p>
                </div>
                <div className='seed'>
                  <p className='field-name'>Seed</p>
                  <p className='field-value'>{currentResult?.seed ?? 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {jobFinished && currentResult && (
            <div className='finished'>
              <div className='pagination'>
                <DotsIndicator
                  count={jobData.result_list.length}
                  activeIndex={currentResultIndex}
                  onIndexChange={setCurrentResultIndex}
                />
              </div>
              <div className='rna-data'>
                <div className='input-data'>
                  <div className='input-structure'>
                    <p className='input-field-name1'>Input secondary structure</p>
                    <p className='input-value' style={{ whiteSpace: 'pre-wrap' }}>{jobData.input_structure}</p>
                  </div>
                  {currentResult.result_secondary_structure_dotseq && (
                    <div className='result-structure'>
                      <p className='input-field-name2'>Result secondary structure</p>
                      <p className='input-value' style={{ whiteSpace: 'pre-wrap' }}>{currentResult.result_secondary_structure_dotseq}</p>
                    </div>
                  )}
                  {currentResult.inf !== null && (
                    <div className='inf-val'>
                      <p className='input-field-name3'>INF</p>
                      <p className='input-value2'>{currentResult.inf.toFixed(3)}</p>
                    </div>
                  )}
                  {currentResult.f1 !== null && (
                    <div className='f1-val'>
                      <p className='input-field-name3'>F1</p>
                      <p className='input-value2'>{currentResult.f1.toFixed(3)}</p>
                    </div>
                  )}
                </div>
                <div className='images-2d3d'>
                  <div className='2d-image'>
                    <ImageViewer
                      title="2D structure"
                      src={
                          currentResult.result_secondary_structure_svg
                            ? `data:image/svg+xml;base64,${btoa(currentResult.result_secondary_structure_svg)}`
                            : "/photos/notfound.png"
                        }
                      width={550}
                      height={612}
                      onExpandChange={setIs2DExpanded}
                    />
                  </div>
                  {!is2DExpanded && (
                    <div className='3d-image'>
                      <PdbViewer
                        pdbData={currentResult.result_tetriary_structure}
                        width={550}
                        height={612}
                      />
                    </div>
                  )}
                </div>
                <div className='arc-diagram'>
                  <ImageViewer
                    title="Arc diagram"
                    src={
                        currentResult.result_arc_diagram
                          ? `data:image/svg+xml;base64,${btoa(currentResult.result_arc_diagram)}`
                          : "/photos/notfound.png"
                      }
                    width={arcWidth}
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
    </div>
  );
}