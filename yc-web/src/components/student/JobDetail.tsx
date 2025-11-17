import React from "react";
import { Job } from "@/services/jobsapi";
import { Button } from "@/components/ui/button";

interface Props {
  job: Job;
  onClose: () => void;
  onApply: (id: string) => void;
  isApplied: boolean;
  similarJobs: Job[];
  onSelectSimilar: (job: Job) => void;
}

const JobDetail: React.FC<Props> = ({ job, onClose, onApply, isApplied, similarJobs, onSelectSimilar }) => {
  return (
    <div className="p-4">
      <Button onClick={onClose}>Close</Button>
      <h2 className="font-bold text-xl mt-2">{job.title}</h2>
      <p>{job.company}</p>
      <p>{job.location} - {job.workType}</p>
      <p>{job.description}</p>
      <Button onClick={() => onApply(job.id)} disabled={isApplied}>
        {isApplied ? "Applied" : "Apply Now"}
      </Button>
      <h3 className="mt-4 font-semibold">Similar Jobs</h3>
      {similarJobs.map(j => (
        <div key={j.id} onClick={() => onSelectSimilar(j)} className="cursor-pointer hover:underline">
          {j.title} at {j.company}
        </div>
      ))}
    </div>
  );
};

export default JobDetail;
