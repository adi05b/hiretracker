const API_BASE = "http://localhost:8000/api";

export type Status =
  | "wishlist"
  | "applied"
  | "oa"
  | "interview"
  | "offer"
  | "rejected";

export interface Application {
  id: number;
  company: string;
  role: string;
  location: string;
  job_url: string;
  source: string;
  status: Status;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationCreate {
  company: string;
  role: string;
  location?: string;
  job_url?: string;
  source?: string;
  status?: Status;
  notes?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.detail || `API error: ${resp.status}`);
  }

  if (resp.status === 204) return undefined as T;

  return resp.json();
}

export const api = {
  list(status?: Status, search?: string): Promise<Application[]> {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    const qs = params.toString();
    return request(`/applications${qs ? `?${qs}` : ""}`);
  },

  get(id: number): Promise<Application> {
    return request(`/applications/${id}`);
  },

  create(data: ApplicationCreate): Promise<Application> {
    return request("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: Partial<ApplicationCreate>): Promise<Application> {
    return request(`/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  updateStatus(id: number, status: Status): Promise<Application> {
    return request(`/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  delete(id: number): Promise<void> {
    return request(`/applications/${id}`, { method: "DELETE" });
  },
};