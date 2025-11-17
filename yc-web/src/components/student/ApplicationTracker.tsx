// src/components/student/ApplicationTracker.tsx
import React from "react";
import { Job } from "@/services/jobsapi";

interface Props {
  appliedJobs: Job[];
}

const ApplicationTracker: React.FC<Props> = ({ appliedJobs }) => {
  return (
    <div className="p-4">
      <h3 className="font-bold mb-2">My Applications</h3>
      {appliedJobs.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <ul>
          {appliedJobs.map(job => (
            <li key={job.id}>
              {job.title} at {job.company}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ApplicationTracker;
