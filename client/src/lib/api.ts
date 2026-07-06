const API_BASE = "https://tinylove.replit.app/api";
console.log("⚡ [Frontend API]: Target Base URL is:", API_BASE);

export const getServerUrl = () => API_BASE.replace("/api", "");

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  // 1. Grab the stored JWT token dynamically from localStorage
  const token = localStorage.getItem("admin_token") || localStorage.getItem("token");

  // 2. Build out the headers correctly, injecting the Bearer authentication token if it exists
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // 3. If the server drops a 401, wipe out the bad tokens and force a clean redirection back to /login
  if (response.status === 401) {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(`API Error ${response.status}`);
  }

  return response.json();
}