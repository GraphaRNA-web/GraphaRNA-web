"use client";
import React from "react";

type JobRow = {
  id: number;
  seed: number;
  status: string;
  conformations: number;
  created: string;
  priority: string;
};

type JobsTableProps = {
  rows: JobRow[];
};
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

export default function JobsTable({ rows }: JobsTableProps) {
  return (
    <table>
      <thead>
        <tr className="table-header-row">
          <th>Job ID</th>
          <th>Created</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.id}</td>
            <td>{row.created}</td>
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
        <span>{row.status}</span>
      </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
