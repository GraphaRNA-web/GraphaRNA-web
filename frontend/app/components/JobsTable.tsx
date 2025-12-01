"use client";
import React from "react";
import { useRouter } from "next/navigation";
import JobStatus from "../components/JobStatus";



type JobRowActive = {
  id: number;
  status: string;
  created: string;
  job_name: string;
};
export interface JobRowFinished extends JobRowActive {
  processing_time: string;
}
type JobRow = JobRowActive | JobRowFinished;
interface JobsTableProps {
  rows: JobRow[];
  isFinishedTable?: boolean;
}

const FullStatus = (code: string): string => {
  switch (code) {
    case "Q": return "queued";
    case "S": return "submitted";
    case "R": return "running";
    case "C": return "completed";
    case "E": return "error";
    case "F": return "finished";
    default: return code.toLowerCase();
  }
};


export default function JobsTable({ rows, isFinishedTable = false }: JobsTableProps) {
  const router = useRouter();




  return (
    <table>
      <thead>
        <tr className="table-header-row">
          {!isFinishedTable && <th>Ordinal</th>}
          <th>Job Name</th>
          {!isFinishedTable && <th>Submission date and time</th>}
          {isFinishedTable && <th>End date and time</th>}
          {isFinishedTable && <th>Processing Time</th>}
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}
              style={{ cursor: "pointer" }}>
            {!isFinishedTable && <td>{row.id}</td>}
            <td>{row.job_name}</td>
            <td>
              {(() => {
                const formattedDate = new Date(row.created)
                  .toLocaleString("pl-PL", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  .replace(/\./g, "-")
                  .replace(",", "");

                const [datePart, timePart] = formattedDate.split(" ");

                if (isFinishedTable) {
                  return (
                    <>
                      {datePart}{" "}
                      <span style={{ color: "var(--brown-lighten-20)" }}>{timePart}</span></>
                  );
                } else {
                  return (
                    <>
                      <span style={{ color: "var(--brown-lighten-20)" }}>
                        {datePart}</span>{" "}{timePart}</>
                  );
                }
              })()}
            </td >
            {isFinishedTable && <td style={{color: "var(--brown-lighten-20)"}}>{(row as JobRowFinished).processing_time}</td>}
            <td>
              <JobStatus status={FullStatus(row.status)} />
            </td>


          </tr>
        ))}
      </tbody>
    </table>
  );
}