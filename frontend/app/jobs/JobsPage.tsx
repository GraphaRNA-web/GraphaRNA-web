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
type JobRowForTableActive = {
  id: number;
  status: string;
  created: string;
  job_name: string;
};
type JobRowForTableFinished = {
  id: number;
  status: string;
  created: string;
  job_name: string;
  processing_time: string;
};

export default function JobsQueue() {
  const searchParams = useSearchParams();
  const uidh = searchParams.get("uidh");

  const [jobDataActive, setJobDataActive] = useState<PaginatedJobs | null>(null);
  const [jobDataFinished, setJobDataFinished] = useState<PaginatedJobs | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  useEffect(() => {
    const fetchActiveJobs = async () => {
      setError(null);
      setIsLoading(true);
      try {
        console.log("[JobsQueue] fetchActiveJobs page=", activePage);
        const activeResp = await getActiveJobs({ page: String(activePage) });
        console.log("[JobsQueue] activeResp raw:", activeResp);
        if (activeResp && Array.isArray(activeResp.results)) {
          setJobDataActive(activeResp as PaginatedJobs);
        } else {
          console.warn("Unexpected activeResp shape:", activeResp);
          setJobDataActive(null);
          if (activeResp && (activeResp as any).error) setError((activeResp as any).error);
        }
      } catch (err: any) {
        console.error("Fetch active error:", err);
        setError(err?.message || "Błąd pobierania aktywnych zadań");
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveJobs();
  }, [activePage, uidh]);

  useEffect(() => {
    const fetchFinishedJobs = async () => {
      setError(null);
      setIsLoading(true);
      try {
        console.log("[JobsQueue] fetchFinishedJobs page=", finishedPage);
        const finishedResp = await getFinishedJobs({ page: String(finishedPage) });
        console.log("[JobsQueue] finishedResp raw:", finishedResp);
        if (finishedResp && Array.isArray(finishedResp.results)) {
          setJobDataFinished(finishedResp as PaginatedJobs);
        } else {
          console.warn("Unexpected finishedResp shape:", finishedResp);
          setJobDataFinished(null);
          if (finishedResp && (finishedResp as any).error) setError((finishedResp as any).error);
        }
      } catch (err: any) {
        console.error("Fetch finished error:", err);
        setError(err?.message || "Błąd pobierania zakończonych zadań");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinishedJobs();
  }, [finishedPage, uidh]);

  const totalCountActive = Number(jobDataActive?.count ?? 0);
  const totalCountFinished = Number(jobDataFinished?.count ?? 0);
  const totalPagesActive = totalCountActive > 0 ? Math.ceil(totalCountActive / pageSize) : 1;
  const totalPagesFinished = totalCountFinished > 0 ? Math.ceil(totalCountFinished / pageSize) : 1;

  useEffect(() => { if (activePage > totalPagesActive) setActivePage(totalPagesActive); }, [totalPagesActive]); 
  useEffect(() => { if (finishedPage > totalPagesFinished) setFinishedPage(totalPagesFinished); }, [totalPagesFinished]);

  const activeRows: JobRowForTableActive[] = jobDataActive?.results.map((job, idx) => ({
    id: idx + 1 + (activePage - 1) * pageSize,
    status: job.status ?? "Q",
    created: job.created_at ?? "-",
    job_name: job.job_name ?? "-",
  })) ?? [];

  const finishedRows: JobRowForTableFinished[] = jobDataFinished?.results.map((job, idx) => ({
    id: idx + 1 + (finishedPage - 1) * pageSize,
    status: job.status ?? "F",
    created: job.created_at ?? "-",
    job_name: job.job_name ?? "-",
    processing_time: job.sum_processing_time ?? "-",
  })) ?? [];

  const getPageRange = (current: number, total: number, delta = 2) => {
    const range: (number | string)[] = [];
    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) range.push(i);
    if (range[0] > 1) range.unshift(1, "...");
    if (range[range.length - 1] < total) range.push("...", total);
    return range;
  };

  const handleActivePrev = () => {
    console.log("click active prev. jobDataActive.previous:", jobDataActive?.previous);
    const pageFromPrev = parsePageFromUrl(jobDataActive?.previous ?? null);
    if (pageFromPrev) setActivePage(pageFromPrev);
    else setActivePage((p) => Math.max(1, p - 1));
  };
  const handleActiveNext = () => {
    console.log("click active next. jobDataActive.next:", jobDataActive?.next);
    const pageFromNext = parsePageFromUrl(jobDataActive?.next ?? null);
    if (pageFromNext) setActivePage(pageFromNext);
    else setActivePage((p) => Math.min(totalPagesActive, p + 1));
  };

  const handleFinishedPrev = () => {
    console.log("click finished prev. jobDataFinished.previous:", jobDataFinished?.previous);
    const pageFromPrev = parsePageFromUrl(jobDataFinished?.previous ?? null);
    if (pageFromPrev) setFinishedPage(pageFromPrev);
    else setFinishedPage((p) => Math.max(1, p - 1));
  };
  const handleFinishedNext = () => {
    console.log("click finished next. jobDataFinished.next:", jobDataFinished?.next);
    const pageFromNext = parsePageFromUrl(jobDataFinished?.next ?? null);
    if (pageFromNext) setFinishedPage(pageFromNext);
    else setFinishedPage((p) => Math.min(totalPagesFinished, p + 1));
  };

  if (isLoading) return <div className="content"><p>Ładowanie danych…</p></div>;
  if (error) return <div className="content"><p style={{ color: "red" }}>Błąd: {error}</p></div>;

  return (
    <div className="content">




      
      <div className="cite" style={{ marginTop: 100 }}>
        <div className="cite-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className="cite-title">Active jobs queue</p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
      <Button 
        label="Start a job" 
        variant="filled" 
        width="220px" 
        height="36px"
        action={() => {window.location.href = "/submitJob";}}
      />
      <Button 
        label="Guide" 
        variant="outlined" 
        width="150px" 
        height="36px"
        action={() => {window.location.href = "/guide";}}
      />
    </div>
        </div>
        <JobsTable rows={activeRows} />
         <div className="pagination">
          <button onClick={handleActivePrev} disabled={!jobDataActive?.previous && activePage <= 1}>&lt; Previous</button>

          {getPageRange(activePage, totalPagesActive).map((p, idx) =>
            p === "..." ? (<span key={idx}>...</span>) : (
              <button key={idx} onClick={() => { console.log("click page", p); setActivePage(Number(p)); }}
                style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: activePage === p ? "green" : "transparent", color: activePage === p ? "white" : "black" }}>
                {p}
              </button>
            )
          )}

          <button onClick={handleActiveNext} disabled={!jobDataActive?.next && activePage >= totalPagesActive}>Next &gt;</button>
        </div>
      </div>
      

      <div className="cite" style={{ marginTop: 100 }}>
        <div className="cite-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className="cite-title">Finished jobs queue</p>
        </div>
        <JobsTable rows={finishedRows} isFinishedTable />
       <div className="pagination">
          <button onClick={handleFinishedPrev} disabled={!jobDataFinished?.previous && finishedPage <= 1}>&lt; Previous</button>

          {getPageRange(finishedPage, totalPagesFinished).map((p, idx) =>
            p === "..." ? (<span key={idx}>...</span>) : (
              <button key={idx} onClick={() => { console.log("click finished page", p); setFinishedPage(Number(p)); }}
                style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: finishedPage === p ? "green" : "transparent", color: finishedPage === p ? "white" : "black" }}>
                {p}
              </button>
            )
          )}

          <button onClick={handleFinishedNext} disabled={!jobDataFinished?.next && finishedPage >= totalPagesFinished}>Next &gt;</button>
        </div>
      </div>
    </div>
  );
}
