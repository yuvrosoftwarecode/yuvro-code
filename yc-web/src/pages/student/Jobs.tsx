import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from '../../components/Navigation';

import {
  fetchFilteredJobs,
  createJob,
  Job as JobType,
} from "@/services/jobsapi";

import Header from "@/components/common/Header";
import JobFilters from "@/components/student/jobs/JobFilters";
import JobCard from "@/components/student/jobs/JobCard";
import JobDetail from "@/components/student/jobs/JobDetail";
import ApplicationTracker from "@/components/student/jobs/ApplicationTracker";
import { Button } from "@/components/ui/button";
import { FileText, X } from "lucide-react";

const safeArray = (value: any): string[] => {
  if (Array.isArray(value)) return value;
  try {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        return JSON.parse(trimmed);
      }
      return trimmed.split(",").map((v) => v.trim()).filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
};

const safeCompanyInfo = (value: any) => {
  if (!value) return { about: "No company information available.", size: "N/A", domain: "N/A", website: "", name: "Unknown" };
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return {
        about: parsed.about || "No company information available.",
        size: parsed.size || "N/A",
        domain: parsed.domain || "N/A",
        website: parsed.website || "",
        name: parsed.name || "Unknown",
      };
    } catch {
      return { about: value, size: "N/A", domain: "N/A", website: "", name: "Unknown" };
    }
  }
  if (typeof value === "object") {
    return {
      about: value.about || "No company information available.",
      size: value.size || "N/A",
      domain: value.domain || "N/A",
      website: value.website || "",
      name: value.name || "Unknown",
    };
  }
  return { about: "No company information available.", size: "N/A", domain: "N/A", website: "", name: "Unknown" };
};

const normalizeJob = (job: any): JobType => ({
  ...job,
  skills: safeArray(job.skills),
  responsibilities: safeArray(job.responsibilities),
  required_skills: safeArray(job.required_skills),
  preferred_skills: safeArray(job.preferred_skills),
  requiredSkills: safeArray(job.required_skills),
  preferredSkills: safeArray(job.preferred_skills),
  benefits: safeArray(job.benefits),
  company_info: job.company_info || { about: "", size: "N/A", domain: "", website: "", name: job.company || "Unknown" },
  companyInfo: job.company_info || { about: "", size: "N/A", domain: "", website: "", name: job.company || "Unknown" },
  salary: job.salary ? Number(job.salary) : 0,
  workType: job.work_type || job.workType,
  experienceLevel: job.experience_level || job.experienceLevel,
  jobType: job.job_type || job.jobType,
});

const Jobs = () => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 1, label: "Dashboard", onClick: () => navigate("/dashboard") },
    { id: 2, label: "Jobs", onClick: () => navigate("/jobs") },
    { id: 3, label: "Profile", onClick: () => navigate("/profile") },
    { id: 4, label: "Settings", onClick: () => navigate("/settings") },
  ];

  const [jobs, setJobs] = useState<JobType[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);

  const FILTERS_KEY = "yc_jobs_filters_v1";
  const defaultFilters = {
    search: '',
    location: [],
    experienceLevel: [],
    jobType: [],
    salaryRange: [0, 30],
    skills: [],
    companySize: [],
    postedDate: [],
  };

  const [filters, setFilters] = useState<any>(() => {
    try {
      const raw = localStorage.getItem(FILTERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.postedDate) && parsed.postedDate.length === 1 && parsed.postedDate[0] === 'Last 24 hours') {
          parsed.postedDate = [];
          try { localStorage.setItem(FILTERS_KEY, JSON.stringify(parsed)); } catch {}
        }
        return parsed;
      }
    } catch (err) {}
    return defaultFilters;
  });

  useEffect(() => {
    try {
      const toSave = { ...(filters || defaultFilters) };
      if (Array.isArray(toSave.postedDate) && toSave.postedDate.length === 1 && toSave.postedDate[0] === 'Last 24 hours') {
        toSave.postedDate = [];
      }
      localStorage.setItem(FILTERS_KEY, JSON.stringify(toSave));
      if (JSON.stringify(toSave) !== JSON.stringify(filters || defaultFilters)) {
        setFilters(toSave);
      }
    } catch {}
  }, [filters]);

  const [selectedJob, setSelectedJob] = useState<JobType | null>(null);
  const [showTracker, setShowTracker] = useState(false);
  const [savedJobs, setSavedJobs] = useState<number[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<number[]>([]);

  const INITIAL_FETCH_FLAG = 'yc_jobs_fetched_v1';
  const isInitialRef = useRef(true);
  const lastPayloadRef = useRef<string | null>(null);

  const mapFiltersToPayload = (f: any) => ({
    search: f.search,
    location: f.location,
    experience_level: f.experienceLevel,
    job_type: f.jobType,
    salary_min: f.salaryRange?.[0],
    salary_max: f.salaryRange?.[1],
    skills: f.skills,
    company_size: f.companySize,
    posted_date: Array.isArray(f.postedDate) && f.postedDate.length === 1 && f.postedDate[0] === 'Last 24 hours' ? [] : f.postedDate,
  });

  useEffect(() => {
    let cancelled = false;

    const doFetch = async () => {
      if (jobs.length === 0) setLoading(true);
      try {
        const payload = mapFiltersToPayload(filters || {});
        const payloadStr = JSON.stringify(payload);
        if (lastPayloadRef.current === payloadStr) return;
        lastPayloadRef.current = payloadStr;
        const data = await fetchFilteredJobs(payload);
        const normalized = data.map(normalizeJob);
        if (cancelled) return;
        setJobs(normalized);
        setFilteredJobs(normalized);
        (window as any)[INITIAL_FETCH_FLAG] = true;
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (isInitialRef.current) {
      isInitialRef.current = false;
      if ((window as any)[INITIAL_FETCH_FLAG]) return;
    }

    doFetch();
    return () => { cancelled = true; };
  }, [filters]);

  const handleJobSelect = (job: JobType) => setSelectedJob(job);
  const handleSaveJob = (jobId: number) => {
    setSavedJobs((prev) => prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]);
  };
  const handleApply = (jobId: string | number) => {
    const id = typeof jobId === 'string' ? Number(jobId) : jobId;
    if (Number.isNaN(id)) return;
    setAppliedJobs((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };
  const handleAddJob = async (formData: any) => {
    try {
      formData.skills = safeArray(formData.skills);
      formData.responsibilities = safeArray(formData.responsibilities);
      formData.required_skills = safeArray(formData.required_skills);
      formData.preferred_skills = safeArray(formData.preferred_skills);
      formData.benefits = safeArray(formData.benefits);
      formData.company_info = safeCompanyInfo(formData.company_info);
      formData.salary = Number(formData.salary || 0);

      const newJob = await createJob(formData);
      if (!newJob) return;
      const normalized = normalizeJob(newJob);
      setJobs((prev) => [...prev, normalized]);
      setFilteredJobs((prev) => [...prev, normalized]);
      alert("Job created successfully!");
    } catch (error) {
      console.error("Failed to create job:", error);
      alert("Failed to create job.");
    }
  };

  if (loading) return <p className="p-6">Loading jobs...</p>;

  return (
    <div className="min-h-screen bg-background">
      <Header showMenu={true} menuItems={menuItems} />

      <div className="flex h-[calc(100vh-64px)]">
        <div className="w-80 border-r border-border bg-card overflow-y-auto">
          <JobFilters onFilterChange={setFilters} initialFilters={filters} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Job Opportunities</h1>
                <p className="text-sm text-muted-foreground mt-1">{filteredJobs.length} jobs found</p>
              </div>

              <Button variant="outline" onClick={() => setShowTracker(!showTracker)} className="gap-2">
                <FileText className="h-4 w-4" /> My Applications ({appliedJobs.length})
              </Button>
            </div>

            <div className="space-y-4">
              {filteredJobs.length === 0 ? (
                <p className="text-center text-muted-foreground">No jobs found.</p>
              ) : (
                filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSelected={selectedJob?.id === job.id}
                    isSaved={savedJobs.includes(job.id)}
                    isApplied={appliedJobs.includes(job.id)}
                    onClick={() => handleJobSelect(job)}
                    onSave={() => handleSaveJob(job.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {selectedJob && !showTracker && (
          <div className="w-[600px] border-l border-border bg-card overflow-y-auto">
            <JobDetail
              job={selectedJob}
              onClose={() => setSelectedJob(null)}
              onApply={handleApply}
              isApplied={appliedJobs.includes(selectedJob.id)}
              similarJobs={filteredJobs
                .filter((j) => j.id !== selectedJob.id && safeArray(j.skills).some((skill) => safeArray(selectedJob.skills).includes(skill)))
                .slice(0, 3)}
              onSelectSimilar={handleJobSelect}
            />
          </div>
        )}

        {showTracker && (
          <div className="w-[600px] border-l border-border bg-card overflow-y-auto">
            <div className="sticky top-0 z-10 bg-card border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">My Applications</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowTracker(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ApplicationTracker appliedJobs={jobs.filter((j) => appliedJobs.includes(j.id))} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
