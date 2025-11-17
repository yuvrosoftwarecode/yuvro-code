// src/services/jobsapi.ts

const API_BASE = import.meta.env.BACKEND_API_BASE_URL || "http://127.0.0.1:8001/api";

// Helper to get Authorization header
function getAuthHeader() {
  const accessToken = localStorage.getItem("access"); // must use 'access'
  if (!accessToken) return {};
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

// Job interface
export interface Job {
  id: string;
  title: string;
  company: string;
  logo?: string;
  location: string;
  workType: "Remote" | "Hybrid" | "Onsite";
  postedDate: string;
  skills: string[];
  salaryRange?: string;
  matchPercentage?: number;
  experienceLevel: string;
  jobType: string;
  description: string;
}

// Fetch all jobs
export const fetchJobs = async (): Promise<Job[]> => {
  const token = localStorage.getItem("access");
  if (!token) throw new Error("Unauthorized: Please login to fetch jobs");

  const response = await fetch(`${API_BASE}/jobs/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching jobs: ${response.statusText}`);
  }

  return response.json();
};

// Fetch job by ID
export const fetchJobById = async (jobId: string): Promise<Job> => {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/`, {
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized: Please log in to access this job");
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || data.message || "Failed to fetch job");
  }

  return res.json();
};

// Create a new job
export const createJob = async (payload: Partial<Job>) => {
  const res = await fetch(`${API_BASE}/jobs/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized: Cannot create job");
    throw new Error("Failed to create job");
  }

  return res.json();
};

// Update a job
export const updateJob = async (jobId: string, payload: Partial<Job>) => {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized: Cannot update job");
    throw new Error("Failed to update job");
  }

  return res.json();
};

// Delete a job
export const deleteJob = async (jobId: string) => {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized: Cannot delete job");
    throw new Error("Failed to delete job");
  }

  return true;
};

// Default export
const jobsapi = { fetchJobs, fetchJobById, createJob, updateJob, deleteJob };
export default jobsapi;
