"use client";
import { useState } from 'react';
import '../styles/JobsQueue.css';
import Button from "../components/Button"

export default function JobsQueue() {
  const rows = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    seed: Math.floor(Math.random() * 100),
    status: i % 2 === 0 ? 'Q' : 'P',
    conformations: Math.floor(Math.random() * 5) + 1,
    created: `2025-10-${i + 1}`,
    priority: ['Low','Medium','High'][i % 3]
  }));

  const pageSize = 10;
  const [page, setPage] = useState(0);

  const pagedRows = rows.slice(page * pageSize, (page + 1) * pageSize);

return (
    <div className='content'>
      <div className='cite'>
        <div className="cite-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className='cite-title'>Active jobs queue</p>
          <div className = "ActiveJob-Buttons" style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center' }}>
            <Button>Start a job</Button>
            <Button>Guide</Button>
          </div>
        </div>

        <div>
          <table>
            <thead>
              <tr className="table-header-row" >
                <th>Job ID</th>
                <th>Seed</th>
                <th>Status</th>
                <th>Conformations</th>
                <th>Created</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map(row => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.seed}</td>
                  <td>{row.status}</td>
                  <td>{row.conformations}</td>
                  <td>{row.created}</td>
                  <td>{row.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
