"use client";
import React from "react";
import { useRouter } from "next/navigation";



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
const getStatusColor = (status: string) => {
switch (status) {
case "Q": return "var(--waiting)";
case "S": return "var(--submitted)";
case "R": return "var(--running)";
case "C": return "var(--completed)";
case "E": return "var(--error)";
default: return "var(--brown-lighten-10)";
}
};
const getStatusLabel = (status: string) => {
  switch (status) {
    case "Q": return "Queued";
    case "S": return "Submitted";
    case "R": return "Running";
    case "C": return "Completed";
    case "E": return "Error";
    case "F": return "Finished";
    default: return status;
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
            <td style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                className="dot"
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: getStatusColor(row.status),
                  display: "inline-block",
                }}
              ></span>
              <span>{getStatusLabel(row.status)}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}