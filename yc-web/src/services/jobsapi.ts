import axios, { AxiosError, AxiosInstance } from "axios";

const API_BASE =
  import.meta.env.VITE_BACKEND_API_BASE_URL ||
  "http://127.0.0.1:8001/api";


function getAccessToken() {
  return localStorage.getItem("access");
}
function getRefreshToken() {
  return localStorage.getItem("refresh");
}
function saveTokens(access: string, refresh?: string) {
  localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
}
function clearTokens() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}


export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await axios.post(`${API_BASE}/token/refresh/`, { refresh });
    const { access, refresh: newRefresh } = res.data;

    saveTokens(access, newRefresh);
    return access;
  } catch {
    clearTokens();
    return null;
  }
}


const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});


api.interceptors.request.use((config: any) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError & { config?: any }) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry && getRefreshToken()) {
      original._retry = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }

    return Promise.reject(err);
  }
);


function normalizeArray(field: any): string[] {
  if (!field) return [];
  if (Array.isArray(field)) {
    return field.flatMap((i) =>
      typeof i === "string" ? i.split(",").map((x) => x.trim()) : []
    );
  }
  if (typeof field === "string") {
    return field.split(",").map((x) => x.trim());
  }
  return [];
}


function normalizeCompanyInfo(info: any) {
  if (!info) {
    return {
      about: "No company information available.",
      size: "N/A",
      domain: "N/A",
      website: "",
      name: "Unknown",
    };
  }

  if (typeof info === "string") {
    try {
      const parsed = JSON.parse(info);
      return {
        about: parsed.about || "No company information available.",
        size: parsed.size || "N/A",
        domain: parsed.domain || "N/A",
        website: parsed.website || "",
        name: parsed.name || "Unknown",
      };
    } catch {
      return {
        about: info,
        size: "N/A",
        domain: "N/A",
        website: "",
        name: "Unknown",
      };
    }
  }

  if (typeof info === "object") {
    return {
      about: info.about || "No company information available.",
      size: info.size || "N/A",
      domain: info.domain || "N/A",
      website: info.website || "",
      name: info.name || "Unknown",
    };
  }

  return {
    about: "No company information available.",
    size: "N/A",
    domain: "N/A",
    website: "",
    name: "Unknown",
  };
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  work_type: string;
  job_type: string;
  experience_level: string;
  description: string;
  salary?: number;

  skills: string[];
  responsibilities: string[];
  required_skills: string[];
  preferred_skills: string[];
  benefits: string[];

  company_info: {
    about: string;
    size: string;
    domain: string;
    website: string;
    name?: string;
  };

  logo?: string;
  created_at?: string;
}


export async function fetchJobs(): Promise<Job[]> {
  try {
    const res = await api.get("/jobs/");
    return res.data.map((j: any) => ({
      ...j,
      skills: normalizeArray(j.skills),
      responsibilities: normalizeArray(j.responsibilities),
      required_skills: normalizeArray(j.required_skills),
      preferred_skills: normalizeArray(j.preferred_skills),
      benefits: normalizeArray(j.benefits),
      company_info: normalizeCompanyInfo(j.company_info),
    }));
  } catch (err) {
    console.error("fetchJobs error:", err);
    return [];
  }
}

export async function fetchFilteredJobs(filters: any = {}): Promise<Job[]> {
  try {
    const res = await api.post("/jobs/filter/", filters);

    return res.data.map((j: any) => ({
      ...j,
      skills: normalizeArray(j.skills),
      responsibilities: normalizeArray(j.responsibilities),
      required_skills: normalizeArray(j.required_skills),
      preferred_skills: normalizeArray(j.preferred_skills),
      benefits: normalizeArray(j.benefits),
      company_info: normalizeCompanyInfo(j.company_info),
    }));
  } catch (err: any) {
    console.error("fetchFilteredJobs error:", err.response?.data || err.message);
    return [];
  }
}

export async function createJob(data: any): Promise<Job | null> {
  try {
    const payload = {
      ...data,
      salary: data.salary ? Number(data.salary) : null,
      skills: normalizeArray(data.skills),
      responsibilities: normalizeArray(data.responsibilities),
      required_skills: normalizeArray(data.required_skills),
      preferred_skills: normalizeArray(data.preferred_skills),
      benefits: normalizeArray(data.benefits),
      company_info: normalizeCompanyInfo(data.company_info),
    };

    const res = await api.post("/jobs/", payload);
    return res.data;
  } catch (err) {
    console.error("createJob error:", err);
    return null;
  }
}

export async function updateJob(id: number, data: any): Promise<Job | null> {
  try {
    const payload = {
      ...data,
      salary: data.salary ? Number(data.salary) : null,
      skills: normalizeArray(data.skills),
      responsibilities: normalizeArray(data.responsibilities),
      required_skills: normalizeArray(data.required_skills),
      preferred_skills: normalizeArray(data.preferred_skills),
      benefits: normalizeArray(data.benefits),
      company_info: normalizeCompanyInfo(data.company_info),
    };

    const res = await api.patch(`/jobs/${id}/`, payload);
    return res.data;
  } catch (err) {
    console.error("updateJob error:", err);
    return null;
  }
}

export async function deleteJobById(id: number): Promise<boolean> {
  try {
    const res = await api.delete(`/jobs/${id}/`);
    return res.status === 204;
  } catch (err) {
    console.error("deleteJobById error:", err);
    return false;
  }
}

export async function applyToJob(id: number): Promise<any | null> {
  try {
    const res = await api.post(`/jobs/${id}/apply/`);
    return res.data;
  } catch (err) {
    console.error("applyToJob error:", err);
    return null;
  }
}
