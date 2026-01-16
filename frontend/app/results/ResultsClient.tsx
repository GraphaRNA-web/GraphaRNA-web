'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getResultDetails, downloadZip } from "@/lib/api";
import '../styles/results.css';
import PdbViewer from "../components/PdbViewer";
import ImageViewer from '../components/ImageViewer';
import JobStatus from '../components/JobStatus';
import AltConfSlider from '../components/AltConfSlider';
import ServerErrorModal from '../components/ServerErrorModal';

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
  status: 'S' | 'Q' | 'R' | 'C' | 'E'; // Submitted, Queued, Running, Completed, Error
  job_name: string;
  input_structure: string;
  created_at: string;
  sum_processing_time: string;
  result_list: JobResult[];
  job_seed: string;
}

const formatProcessingTime = (timeInSeconds: string | null | undefined): string => {
  if (!timeInSeconds) {
    return "-";
  }
  
  const totalSeconds = parseInt(timeInSeconds, 10);
  
  if (isNaN(totalSeconds) || totalSeconds <= 0) {
    return "-";
  }

  const totalMinutes = Math.round(totalSeconds / 60);

  if (totalMinutes === 0) {
    return "< 1min";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}min`);
  }

  return parts.join(' ');
};


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
  const [server500, setServer500] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!uidh) {
        setError("No task identifier (uidh) in URL parameters!");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const {data, status} = await getResultDetails({ uidh });

        if(status >= 500){
          setServer500(true);
          return "error";
        }

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
      'S': "submitted",
      'Q': "queued",
      'R': "running",
      'C': "completed",
      'E': "error",
    };
    return backendStatus ? statusMap[backendStatus] : "unknown";
  };

  const arcWidth = windowWidth < 1120 ? windowWidth - 60 : 1120;
  const viewerWidth = windowWidth < 1120 ? windowWidth - 60 : 550;
  
  const isFound = !isLoading && jobData && !error;
  const jobStatus = mapStatusToFrontend(jobData?.status);
  const jobFinished = jobStatus === 'completed';
  const isJobFailed = jobStatus === 'error';
  const currentResult = jobData?.result_list?.[currentResultIndex];


const handleDownload = async () => {
    if (!uidh || isDownloading || !jobFinished) return; 

    setIsDownloading(true);
    try {
      const {status} = await downloadZip({ uidh });
      if(status >= 500){
        setServer500(true);
        return "error";
      }
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
        date: date.toLocaleDateString('en-GB'), // format DD-MM-YYYY
        time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) // format HH:MM
    };
  };
  


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
            <p>{"The result page you are looking for is probably deleted due to the timeout. Start a new job to find out the calculation results."}</p>
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
        <div className='results-content'>
          <ServerErrorModal
            isOpen={server500}
            onClose={() => setServer500(false)}
          />
          <p className='title'>Job details</p>
          <div className='top-section'>
            <div className='top-left'>
              <div className='status'>
                <p className='field-name'>Status</p>
                <JobStatus status={jobStatus} />
              </div>
              <div className='proc-time'>
                <p className='field-name'>Total processing time</p>
                <p className='field-value'>{jobData.sum_processing_time ? formatProcessingTime(jobData.sum_processing_time) : '-'}</p>
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
                  <p className='field-value'>{jobData.job_seed}</p>
                </div>
              </div>
            </div>
          </div>

          {jobFinished && currentResult && (
            <div className='finished'>
              <div className='pagination'>
              <div className='pagination-divider'></div>

              <p className='conf-label'>Results</p>
                <AltConfSlider
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
                      <p className='input-field-name3'>INF (result vs input):</p>
                      <p className='input-value2'>{currentResult.inf.toFixed(3)}</p>
                    </div>
                  )}
                  {currentResult.f1 !== null && (
                    <div className='f1-val'>
                      <p className='input-field-name3'>F1 (result vs input):</p>
                      <p className='input-value2'>{currentResult.f1.toFixed(3)}</p>
                    </div>
                  )}
                  {currentResult.seed !== null && (
                    <div className='seed-val'>
                      <p className='input-field-name3'>Current conformation seed</p>
                      <p className='input-value2'>{currentResult.seed}</p>
                    </div>
                  )}
                </div>
                <div className='images-2d3d'>
                  {!is2DExpanded && (
                    <div className='3d-image'>
                      <PdbViewer
                        pdbData={currentResult.result_tetriary_structure}
                        width={viewerWidth}
                        height={612}
                      />
                    </div>
                  )}
                  <div className='2d-image'>
                    <ImageViewer
                      title="3D-annotated 2D structure"
                      src={
                          currentResult.result_secondary_structure_svg
                            ? `data:image/svg+xml;base64,${btoa(currentResult.result_secondary_structure_svg)}`
                            : "/photos/notfound.png"
                        }
                      width={viewerWidth}
                      height={612}
                    />
                  </div>
                </div>
                <div className='arc-diagram'>
                  <ImageViewer
                    title="Arc diagram: input vs 3D-annotated 2D structure"
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

          {!jobFinished && !isJobFailed && (
            <div className='not-finished'>
              <p className='info'>The task is still processing. Come back later to see job results.</p>
            </div>
          )}
          {isJobFailed && (
             <div className='job-failed'>
                <p className='info error-info'><img src="icons/error.svg" alt="" width={24} height={24} />The job you started run into some errors. Please try requesting the task again.</p>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}