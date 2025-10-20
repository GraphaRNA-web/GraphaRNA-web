"use client";
import { useState, useEffect } from "react";
import "../styles/JobsQueue.css";
import JobsTable from "../components/JobsTable";
import { useSearchParams } from 'next/navigation';


export default function JobsQueue() {
  const searchParams = useSearchParams();
  const uidh = searchParams.get('uidh');
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




  const rows = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    seed: Math.floor(Math.random() * 100),
    status: i % 2 === 0 ? "Q" : "P",
    created: `2025-10-${String(i + 1).padStart(2, "0")}`,
  }));

  const pageSize = 3;

  const [activePage, setActivePage] = useState(0);
  const [finishedPage, setFinishedPage] = useState(0);

  const totalPages = Math.ceil(rows.length / pageSize);

  const getPageNumbers = (page: number) => {
    const delta = 2;
    const range: (number | string)[] = [];

    for (let i = Math.max(0, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }
    if (!range.includes(0)) range.unshift(0, "...");
    if (!range.includes(totalPages - 1)) range.push("...", totalPages - 1);

    return range;
  };

  const pagedRows = (page: number) => rows.slice(page * pageSize, (page + 1) * pageSize);

  const renderPagination = (page: number, setPage: (p: number) => void) => (
    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
      <button onClick={() => setPage(Math.max(page - 1, 0))} disabled={page === 0} style={{ marginRight: "1rem" }}>
         &lt;   Previous
      </button>

      {getPageNumbers(page).map((pNum, idx) =>
        pNum === "..." ? (
          <span key={idx}>...</span>
        ) : (
          <button
            key={idx}
            onClick={() => setPage(Number(pNum))}
            style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: page === pNum ? "green" : "transparent",
            color: page === pNum ? "white" : "black",
            cursor: "pointer",
          }}
          >
            {Number(pNum) + 1}
          </button>
        )
      )}

      <button onClick={() => setPage(Math.min(page + 1, totalPages - 1))} disabled={page === totalPages - 1} style={{ marginLeft: "1rem" }}>
        Next &gt;   
      </button>
    </div>
  );

  return (
    <div className="content">
      <div className="cite">
        <div className="cite-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className="cite-title">Active jobs queue</p>
        </div>

        <JobsTable rows={pagedRows(activePage)} />
        {renderPagination(activePage, setActivePage)}
      </div>

      <div className="cite">
        <div className="cite-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className="cite-title">Finished jobs queue</p>
        </div>

        <JobsTable rows={pagedRows(finishedPage)} />
        {renderPagination(finishedPage, setFinishedPage)}
      </div>
    </div>
  );
}
