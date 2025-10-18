import React from 'react';
import '../styles/jobStatus.css';

const getStatusColor = (status: string) => {
  switch (status) {
    case "submitted": return "var(--submitted)";
    case "queued": return "var(--waiting)";
    case "running": return "var(--running)";
    case "completed": return "var(--completed)";
    case "error": return "var(--error)";
    default: return "var(--brown-lighten-10)";
  }
};

interface JobStatusProps {
  status: string;
}

const JobStatus: React.FC<JobStatusProps> = ({ status }) => {
  return (
    <div className='dot-and-text'>
      <div className="dot" style={{ backgroundColor: getStatusColor(status) }}></div>
      <p className='field-value'>{status}</p>
    </div>
  );
};

export default JobStatus;