"use client";
import { useState, useEffect } from "react";
import "../styles/JobsQueue.css";
import JobsTable from "../components/JobsTable";
import { useSearchParams } from "next/navigation";
import { getActiveJobs, getFinishedJobs } from "@/lib/api";
import Button from "../components/Button";
import { useRouter } from "next/navigation";


interface JobResult {
  uid: string;
  hashed_uid?: string | null;
  input_structure?: string;
  seed?: number;
  job_name: string;
  email?: string;
  created_at?: string;
  expires_at?: string;
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
  const pageSize = Number(process.env.NEXT_PUBLIC_PAGE_SIZE ?? 10);
  
  // ACTIVE JOBS
  useEffect(() => {
    const fetchActiveJobs = async () => {
      setError(null);
      setIsLoadingActive(true);
      try {
        const activeResp = await getActiveJobs({ page: String(activePage) });
        if (activeResp && Array.isArray(activeResp.results)) {
          setJobDataActive(activeResp as PaginatedJobs);
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
        const finishedResp = await getFinishedJobs({ page: String(finishedPage) });
        if (finishedResp && Array.isArray(finishedResp.results)) {
          setJobDataFinished(finishedResp as PaginatedJobs);
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
  const totalPagesActive = totalCountActive > 0 ? Math.ceil(totalCountActive / pageSize) : 1;
  const totalPagesFinished = totalCountFinished > 0 ? Math.ceil(totalCountFinished / pageSize) : 1;

  const activeRows =
    jobDataActive?.results.map((job, idx) => ({
      id: idx + 1 + (activePage - 1) * pageSize,
      status: job.status ?? "Q",
      created: job.created_at ?? "-",
      job_name: job.job_name ?? "-",
      uidh: job.hashed_uid ?? "-",
    })) ?? [];

  const finishedRows =
    jobDataFinished?.results.map((job, idx) => ({
      id: idx + 1 + (finishedPage - 1) * pageSize,
      status: job.status ?? "F",
      created: job.created_at ?? "-",
      job_name: job.job_name ?? "-",
      processing_time: job.sum_processing_time ?? "-",
      uidh: job.hashed_uid ?? "-",
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
        <div
          className="jobsPage-header">
          <p className="jobsPage-title">Active jobs queue</p>
          <div className="router-buttons">
            <Button label="Start a job" variant="filled" width="220px" height="36px" action={() => router.push("/submitJob")}/>
            <Button label="Guide" variant="outlined" width="150px" height="36px" action={() => router.push("/guide")} />
          </div>
        </div>

        {isLoadingActive ? spinner : <JobsTable rows={activeRows} />}

        <div className="pagination">
          <button onClick={() => setActivePage((p) => Math.max(1, p - 1))} disabled={activePage <= 1}>
            &lt; Previous
          </button>
          {getPageRange(activePage, totalPagesActive).map((p, idx) =>
            p === "..." ? (
              <span key={idx}>...</span>
            ) : (
              <button className={`Pagination-Button ${activePage === p ? "active" : ""}`}
                key={idx}
                onClick={() => setActivePage(Number(p))}
              >
                {p}
              </button>
            )
          )}
          <button onClick={() => setActivePage((p) => Math.min(totalPagesActive, p + 1))} disabled={activePage >= totalPagesActive}>
            Next &gt;
          </button>
        </div>
      </div>

      <div className="jobsPage-main">
        <div
          className="jobsPage-header"
        >
          <p className="jobsPage-title">Finished jobs queue</p>
        </div>

        {isLoadingFinished ? spinner : <JobsTable rows={finishedRows} isFinishedTable />}

        <div className="pagination">
          <button onClick={() => setFinishedPage((p) => Math.max(1, p - 1))} disabled={finishedPage <= 1}>
            &lt; Previous
          </button>
          {getPageRange(finishedPage, totalPagesFinished).map((p, idx) =>
            p === "..." ? (
              <span key={idx}>...</span>
            ) : (
              <button className="Pagination-Button"
                key={idx}
                onClick={() => setFinishedPage(Number(p))}
                style={{
                  backgroundColor: finishedPage === p ? "green" : "transparent",
                  color: finishedPage === p ? "white" : "black",
                }}>
                {p}
              </button>
            )
          )}
          <button onClick={() => setFinishedPage((p) => Math.min(totalPagesFinished, p + 1))} disabled={finishedPage >= totalPagesFinished}>
            Next &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
