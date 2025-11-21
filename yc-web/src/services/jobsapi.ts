const API_BASE =
  import.meta.env.BACKEND_API_BASE_URL || "http://127.0.0.1:8001/api";

const JOBS_URL = `${API_BASE}/jobs/`;


function getAccessToken() {
  return localStorage.getItem("access");
}

function getRefreshToken() {
  return localStorage.getItem("refresh");
}


async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(`${API_BASE}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  localStorage.setItem("access", data.access);
  return data.access;
}


async function fetchWithAuth(url: string, options: any = {}) {
  let token = getAccessToken();

  options.headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };

  let res = await fetch(url, options);

  if (res.status === 401) {
    token = await refreshAccessToken();
    if (!token) throw new Error("Session expired. Please login again.");

    options.headers.Authorization = `Bearer ${token}`;
    res = await fetch(url, options);
  }

  if (res.status === 204) {
    return { ok: true };
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw err;
  }

  return res.json(); 
}



export const fetchJobs = () => {
  return fetchWithAuth(JOBS_URL, { method: "GET" });
};

export const fetchJobById = (id: number) => {
  return fetchWithAuth(`${JOBS_URL}${id}/`, { method: "GET" });
};

export const createJob = (payload: any) => {
  return fetchWithAuth(JOBS_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateJob = (id: number, payload: any) => {
  return fetchWithAuth(`${JOBS_URL}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};


export const deleteJobById = async (id: number) => {
  const response = await fetchWithAuth(`${JOBS_URL}${id}/`, {
    method: "DELETE",
  });

  if (response.ok) return true;

  throw new Error("Failed to delete job");
};
