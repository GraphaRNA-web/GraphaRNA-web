"use client";
import React from "react";
import { useRouter } from "next/navigation";
import JobStatus from "../components/JobStatus";



type JobRowActive = {
  id: number;
  status: string;
  created: string;
  job_name: string;
  uidh: string;
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



  const handleRowClick = (uidh: string) => {
  router.push(`/results?uidh=${uidh}`);
};

  return (
    <table>
      <thead>
        <tr className="table-header-row">
          <th>ID</th>
          <th>Job Name</th>
          <th>Created</th>
          {isFinishedTable && <th>Processing Time</th>}
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}
              onClick={() => handleRowClick((row as any).uidh)}
              style={{ cursor: "pointer" }}>
            <td>{row.id}</td>
            <td>{row.job_name}</td>
            <td>
              {new Date(row.created).toLocaleString('pl-PL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }).replace(',', '')}
            </td>
            {isFinishedTable && <td>{(row as JobRowFinished).processing_time}</td>}
              <td>
                <JobStatus status={FullStatus(row.status)} />
              </td>


          </tr>
        ))}
      </tbody>
    </table>
  );
}