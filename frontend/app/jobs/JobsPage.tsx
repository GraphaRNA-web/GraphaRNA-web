"use client";
import { useState, useEffect } from "react";
import "../styles/JobsQueue.css";
import JobsTable from "../components/JobsTable";
import { useSearchParams } from "next/navigation";
import { getActiveJobs, getFinishedJobs } from "@/lib/api";

interface JobResult {
  uid?: string;
  id?: number;
  created_at?: string;
  completed_at?: string;
  seed?: number;
  status?: string;

  result_tetriary_structure?: string;
  result_secondary_structure_dotseq?: string | null;
  result_secondary_structure_svg?: string | null;
  result_arc_diagram?: string | null;
  f1?: number | null;
  inf?: number | null;
  processing_time?: string;
}

interface PaginatedJobs {
  count: number;
  next: string | null;
  previous: string | null;
  results: JobResult[];
}

type JobRowForTable = {
  id: number;
  seed: number;
  status: string;
  conformations: number;
  created: string;
  priority: string;
};

export default function JobsQueue() {
  const searchParams = useSearchParams();
  const uidh = searchParams.get("uidh");

  const [jobDataActive, setJobDataActive] = useState<PaginatedJobs | null>(null);
  const [jobDataFinished, setJobDataFinished] = useState<PaginatedJobs | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      setIsLoading(true);

      try {
        const [activeResp, finishedResp] = await Promise.all([
          getActiveJobs({ page: "1" }),
          getFinishedJobs({ page: "1" }),
        ]);
        
        console.log("[JobsQueue] activeResp:", activeResp);
        console.log("[JobsQueue] finishedResp:", finishedResp);

        
        if (activeResp && Array.isArray(activeResp.results)) {
          setJobDataActive(activeResp as PaginatedJobs);
        } else {
          console.warn("Unexpected activeResp shape:", activeResp);
          setJobDataActive(null);
        }

        if (finishedResp && Array.isArray(finishedResp.results)) {
          setJobDataFinished(finishedResp as PaginatedJobs);
        } else {
          console.warn("Unexpected finishedResp shape:", finishedResp);
          setJobDataFinished(null);
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err?.message || "Błąd pobierania danych z API");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [uidh]);

  const activeRows: JobRowForTable[] =
    jobDataActive?.results.map((job, idx) => ({
      id: idx + 1,
      seed: job.seed ?? 0,
      status: job.status ?? "Q",
      conformations: 1,
      created: job.created_at ?? job.completed_at ?? "-",
      priority: "",
    })) ?? [];

  const finishedRows: JobRowForTable[] =
    jobDataFinished?.results.map((job, idx) => ({
      id: idx + 1,
      seed: job.seed ?? 0,
      status: job.status ?? "F",
      conformations: 1,
      created: job.created_at ?? job.completed_at ?? "-",
      priority: "",
    })) ?? [];
  if (isLoading) {
    return <div className="content"><p>Ładowanie danych…</p></div>;
  }
  if (error) {
    return <div className="content"><p style={{ color: "red" }}>Błąd: {error}</p></div>;
  }

  return (
    <div className="content">
      <div style={{ marginBottom: 12 }}>
        <strong>Debug:</strong>
        <div>active count: {jobDataActive?.count ?? "—"}</div>
        <div>finished count: {jobDataFinished?.count ?? "—"}</div>
      </div>

      <div className="cite">
        <div className="cite-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className="cite-title">Active jobs queue</p>
        </div>
        <JobsTable rows={activeRows} />
      </div>

      <div className="cite">
        <div className="cite-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className="cite-title">Finished jobs queue</p>
        </div>
        <JobsTable rows={finishedRows} />
      </div>
    </div>
  );
}
