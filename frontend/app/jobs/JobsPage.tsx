"use client";
import { useState, useEffect } from "react";
import "../styles/JobsQueue.css";
import JobsTable from "../components/JobsTable";
import { useSearchParams } from "next/navigation";
import { getActiveJobs, getFinishedJobs } from "@/lib/api";
import Button from "../components/Button";



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
  const searchParams = useSearchParams();
  const uidh = searchParams.get("uidh");

  const [jobDataActive, setJobDataActive] = useState<PaginatedJobs | null>(null);
  const [jobDataFinished, setJobDataFinished] = useState<PaginatedJobs | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState<boolean>(false);
  const [isLoadingFinished, setIsLoadingFinished] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activePage, setActivePage] = useState<number>(1);
  const [finishedPage, setFinishedPage] = useState<number>(1);
  const pageSize = 10;

  const parsePageFromUrl = (url: string | null) => {
    if (!url) return null;
    try {
      const u = new URL(url, window.location.origin);
      const p = u.searchParams.get("page");
      return p ? Number(p) : null;
    } catch {
      const m = url.match(/[?&]page=(\d+)/);
      return m ? Number(m[1]) : null;
    }
  };

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
        setError(err?.message || "Błąd pobierania aktywnych zadań");
      } finally {
        setIsLoadingActive(false);
      }
    };
    fetchActiveJobs();
  }, [activePage, uidh]);

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
        setError(err?.message || "Błąd pobierania zakończonych zadań");
      } finally {
        setIsLoadingFinished(false);
      }
    };
    fetchFinishedJobs();
  }, [finishedPage, uidh]);

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
      uidh: job.uid,
    })) ?? [];

  const finishedRows =
    jobDataFinished?.results.map((job, idx) => ({
      id: idx + 1 + (finishedPage - 1) * pageSize,
      status: job.status ?? "F",
      created: job.created_at ?? "-",
      job_name: job.job_name ?? "-",
      processing_time: job.sum_processing_time ?? "-",
      uidh: job.uid,
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
    <div
      style={{
        width: 24,
        height: 24,
        border: "3px solid #ccc",
        borderTop: "3px solid green",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        margin: "1rem auto",
      }}
    />
  );

  if (error)
    return (
      <div className="jobsPageContent">
        <p style={{ color: "red", textAlign: "center" }}>Błąd: {error}</p>
      </div>
    );

  return (
    <div className="jobsPageContent">
      <div className="jobsPage-main" style={{ marginTop: 100 }}>
        <div
          className="jobsPage-header"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <p className="jobsPage-title">Active jobs queue</p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button label="Start a job" variant="filled" width="220px" height="36px" action={() => (window.location.href = "/submitJob")} />
            <Button label="Guide" variant="outlined" width="150px" height="36px" action={() => (window.location.href = "/guide")} />
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
              <button
                key={idx}
                onClick={() => setActivePage(Number(p))}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: activePage === p ? "green" : "transparent",
                  color: activePage === p ? "white" : "black",
                }}
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

      <div className="jobsPage-main" style={{ marginTop: 100 }}>
        <div
          className="jobsPage-header"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
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
              <button
                key={idx}
                onClick={() => setFinishedPage(Number(p))}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: finishedPage === p ? "green" : "transparent",
                  color: finishedPage === p ? "white" : "black",
                }}
              >
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
