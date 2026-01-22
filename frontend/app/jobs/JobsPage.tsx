"use client";
import { useState, useEffect } from "react";
import "../styles/JobsQueue.css";
import JobsTable from "../components/JobsTable";
import { useSearchParams } from "next/navigation";
import { getActiveJobs, getFinishedJobs } from "@/lib/api";
import Button from "../components/Button";
import { useRouter } from "next/navigation";
import ServerErrorModal from '../components/ServerErrorModal';

interface JobResult {
  uid: string;
  hashed_uid?: string | null;
  input_structure?: string;
  seed?: number;
  job_name: string;
  email?: string;
  created_at?: string;
  expires_at?: string;
  finished_at?: string;
  sum_processing_time?: string;
  status?: string;
  alternative_conformations?: number;
}
interface PaginatedJobs {
  count: number;
  next: string | null;
  previous: string | null;
  results: JobResult[];
}


export default function JobsQueue() {
  const router = useRouter();
  // const searchParams = useSearchParams();
  // const uidh = searchParams.get("uidh");

  const [jobDataActive, setJobDataActive] = useState<PaginatedJobs | null>(null);
  const [jobDataFinished, setJobDataFinished] = useState<PaginatedJobs | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState<boolean>(false);
  const [isLoadingFinished, setIsLoadingFinished] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activePage, setActivePage] = useState<number>(1);
  const [finishedPage, setFinishedPage] = useState<number>(1);
  const [pageSizeActive, setPageSizeActive] = useState<number>(10);
  const [pageSizeFinished, setPageSizeFinished] = useState<number>(10);
  const [server500, setServer500] = useState(false);
  // const pageSize = Number(process.env.NEXT_PUBLIC_PAGE_SIZE ?? 10);
  
  // ACTIVE JOBS
  useEffect(() => {
    const fetchActiveJobs = async () => {
      setError(null);
      setIsLoadingActive(true);
      try {
        const {data: activeResp, status} = await getActiveJobs({ page: String(activePage) });

        if(status >= 500){
          setServer500(true);
          return "error";
        }

        if (activeResp && Array.isArray(activeResp.results)) {
          setJobDataActive(activeResp as PaginatedJobs);
          setPageSizeActive(activeResp.page_size ?? 10);
        } else {
          setJobDataActive(null);
          if (activeResp && (activeResp as any).error) setError((activeResp as any).error);
        }
      } catch (err: any) {
        setError(err?.message || "Error in fetching active jobs");
      } finally {
        setIsLoadingActive(false);
      }
    };
    fetchActiveJobs();
  }, [activePage]);

  // FINISHED JOBS
  useEffect(() => {
    const fetchFinishedJobs = async () => {
      setError(null);
      setIsLoadingFinished(true);
      try {
        const {data: finishedResp, status} = await getFinishedJobs({ page: String(finishedPage) });

        if(status >= 500){
          setServer500(true);
          return "error";
        }
        
        if (finishedResp && Array.isArray(finishedResp.results)) {
          setJobDataFinished(finishedResp as PaginatedJobs);
          setPageSizeFinished(finishedResp.page_size ?? 10);
        } else {
          setJobDataFinished(null);
          if (finishedResp && (finishedResp as any).error) setError((finishedResp as any).error);
        }
      } catch (err: any) {
        setError(err?.message || "Error in fetching finished jobs");
      } finally {
        setIsLoadingFinished(false);
      }
    };
    fetchFinishedJobs();
  }, [finishedPage]);

  const totalCountActive = Number(jobDataActive?.count ?? 0);
  const totalCountFinished = Number(jobDataFinished?.count ?? 0);
  const totalPagesActive = totalCountActive > 0 ? Math.ceil(totalCountActive / pageSizeActive) : 1;
  const totalPagesFinished = totalCountFinished > 0 ? Math.ceil(totalCountFinished / pageSizeFinished) : 1;

  const activeRows =
    jobDataActive?.results.map((job, idx) => ({
      id: idx + 1 + (activePage - 1) * pageSizeActive,
      status: job.status ?? "Q",
      created: job.created_at ?? "-",
      job_name: job.job_name ?? "-",
    })) ?? [];

  const finishedRows =
    jobDataFinished?.results.map((job, idx) => ({
      id: idx + 1 + (finishedPage - 1) * pageSizeFinished,
      status: job.status ?? "F",
      created: job.created_at ?? "-",
      job_name: job.job_name ?? "-",
      finished_at: job.finished_at ?? "-",
      processing_time: job.sum_processing_time ?? "-",
      
    })) ?? [];

const getPageRange = (current: number, total: number, delta = 2): (number | string)[] => {
  const pages: number[] = [];
  for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
    pages.push(i);
  }

  const result: (number | string)[] = [...pages];

  if (pages[0] > 1) result.unshift(1, "...");
  if (pages[pages.length - 1] < total) result.push("...", total);

  return result;
};


  const spinner = (
    <div className="spinner" />);

  if (error)
    return (
      <div className="jobsPageContent">
        <p className="error">Error: {error}</p>
      </div>
    );


  return (
    <div className="jobsPageContent">
      <div className="jobsPage-main">
        <div className="jobsPage-header">
          <p className="jobsPage-title">Active jobs queue</p>
          <div className="router-buttons">
            <Button label="Start a job" variant="filled" width="220px" height="30px" fontWeight="600" action={() => router.push("/submitJob")}/>
            <Button label="Guide" variant="outlined" width="150px" height="30px" fontWeight="600" action={() => router.push("/guide")} />
          </div>
        </div>

        <ServerErrorModal
          isOpen={server500}
          onClose={() => setServer500(false)}
        />

        {isLoadingActive ? spinner : <JobsTable rows={activeRows} />}

        <div className="Jobs-Pagination">
          <button className="Jobs-Pagination-Prev-Next" onClick={() => setActivePage((p) => Math.max(1, p - 1))} disabled={activePage <= 1}>
            <img src="/icons/arrow_left.svg" alt="prev" className="arrow"/> Previous
          </button>
          {getPageRange(activePage, totalPagesActive).map((p, idx) =>
            p === "..." ? (
              <span key={idx}>...</span>
            ) : (
              <button className={`Jobs-Pagination-Button ${activePage === p ? "active" : ""}`}
                key={idx}
                onClick={() => setActivePage(Number(p))}>
                {p}
              </button>
            )
          )}
          <button className="Jobs-Pagination-Prev-Next" onClick={() => setActivePage((p) => Math.min(totalPagesActive, p + 1))} disabled={activePage >= totalPagesActive}>
            Next <img src="/icons/arrow_right.svg" alt="next" className="arrow"/>
          </button>
        </div>
      </div>

      {/* <div className="jobsPage-main">
        <div
          className="jobsPage-header"
        >
          <p className="jobsPage-title">Finished jobs queue</p>
        </div>

        {isLoadingFinished ? spinner : <JobsTable rows={finishedRows} isFinishedTable />}

        <div className="Jobs-Pagination">
          <button className="Jobs-Pagination-Prev-Next" onClick={() => setFinishedPage((p) => Math.max(1, p - 1))} disabled={finishedPage <= 1}>
            <img src="/icons/arrow_left.svg" alt="prev" className="arrow" /> Previous
          </button>
          {getPageRange(finishedPage, totalPagesFinished).map((p, idx) =>
            p === "..." ? (
              <span key={idx}>...</span>
            ) : (
              <button className={`Jobs-Pagination-Button ${finishedPage === p ? "active" : ""}`}
                key={idx}
                onClick={() => setFinishedPage(Number(p))}>
                {p}
              </button>
            )
          )}
          <button className="Jobs-Pagination-Prev-Next" onClick={() => setFinishedPage((p) => Math.min(totalPagesFinished, p + 1))} disabled={finishedPage >= totalPagesFinished}>
            Next <img src="/icons/arrow_right.svg" alt="next" className="arrow"/>
          </button>
        </div>
      </div> */}
    </div>
  );
}
