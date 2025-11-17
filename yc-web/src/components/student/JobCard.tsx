// src/components/student/JobCard.tsx
import React from "react";
import { Job } from "@/services/jobsapi";
import { Button } from "@/components/ui/button";

interface Props {
  job: Job;
  isSelected: boolean;
  isSaved: boolean;
  isApplied: boolean;
  onClick: () => void;
  onSave: () => void;
}

export const JobCard: React.FC<Props> = ({ job, isSelected, isSaved, isApplied, onClick, onSave }) => {
  return (
    <div
      className={`p-4 border rounded cursor-pointer ${
        isSelected ? "border-blue-500" : "border-gray-200"
      }`}
      onClick={onClick}
    >
      <h3 className="font-bold">{job.title}</h3>
      <p>{job.company}</p>
      <p>{job.location} - {job.workType}</p>
      <div className="flex gap-2 mt-2">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
        >
          {isSaved ? "Unsave" : "Save"}
        </Button>
        {isApplied && <span className="text-green-600">Applied</span>}
      </div>
    </div>
  );
};
