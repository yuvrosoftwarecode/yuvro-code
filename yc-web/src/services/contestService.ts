const API_BASE =
  import.meta.env.BACKEND_API_BASE_URL || "http://127.0.0.1:8001/api";

export const fetchContests = async () => {
  const res = await fetch(`${API_BASE}/contests/`);
  return res.json();
}; 