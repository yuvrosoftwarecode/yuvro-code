import { useEffect, useState } from "react";

export default function JobList() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8001/api/jobs/jobs/")
      .then((res) => res.json())
      .then((data) => setJobs(data));
  }, []);

  return (
    <div style={{ maxWidth: "800px", margin: "auto" }}>
      <h2>Available Jobs</h2>

      {jobs.length === 0 && <p>No jobs found.</p>}

      {jobs.map((job) => (
        <div
          key={job.id}
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "10px",
          }}
        >
          <h3>{job.title}</h3>
          <p><b>Company:</b> {job.company}</p>
          <p><b>Location:</b> {job.location}</p>
          <p><b>Work Type:</b> {job.work_type}</p>
          <p><b>Salary:</b> {job.salary}</p>
          <p><b>Skills:</b> {job.skills}</p>

          <small>Posted on: {job.posted_date}</small>
        </div>
      ))}
    </div>
  );
}
