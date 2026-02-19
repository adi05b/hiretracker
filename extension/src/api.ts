const API_BASE = "http://localhost:8000/api";

export type Status = "wishlist" | "applied" | "oa" | "interview" | "offer" | "rejected";

export interface Application {
  id: number;
  company: string;
  role: string;
  location: string;
  job_url: string;
  source: string;
  status: Status;
  notes: string;
  tags: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_text: string;
  job_description: string;
  applied_date: string | null;
  response_date: string | null;
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
  tags?: string;
  salary_text?: string;
  job_description?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ─── Token Management ───────────────────────────────────────────────────────

let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
  if (t) {
    localStorage.setItem("hiretrack_token", t);
  } else {
    localStorage.removeItem("hiretrack_token");
  }
}

export function getToken(): string | null {
  if (!token) {
    token = localStorage.getItem("hiretrack_token");
  }
  return token;
}

export function clearAuth() {
  token = null;
  localStorage.removeItem("hiretrack_token");
  localStorage.removeItem("hiretrack_user");
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem("hiretrack_user");
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user: User) {
  localStorage.setItem("hiretrack_user", JSON.stringify(user));
}

// ─── Sync token with service worker ─────────────────────────────────────────

export function syncTokenToExtension(tkn: string) {
  if (chrome?.runtime?.sendMessage) {
    chrome.runtime.sendMessage({ type: "SET_TOKEN", token: tkn });
  }
}

export function clearTokenFromExtension() {
  if (chrome?.runtime?.sendMessage) {
    chrome.runtime.sendMessage({ type: "CLEAR_TOKEN" });
  }
}

// ─── Request Helper ─────────────────────────────────────────────────────────

interface RequestOptions extends RequestInit {
  skipAuthRedirect?: boolean; // Don't treat 401 as "session expired"
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuthRedirect, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const t = getToken();
  if (t) {
    headers["Authorization"] = `Bearer ${t}`;
  }

  const resp = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers: { ...headers, ...fetchOptions.headers },
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    const message = err.detail || `API error: ${resp.status}`;

    // Only clear auth + show "session expired" for non-auth endpoints
    if (resp.status === 401 && !skipAuthRedirect) {
      clearAuth();
      clearTokenFromExtension();
      throw new Error("Session expired. Please log in again.");
    }

    throw new Error(message);
  }

  if (resp.status === 204) return undefined as T;
  return resp.json();
}

// ─── Auth API ───────────────────────────────────────────────────────────────

export const auth = {
  register(email: string, password: string, name: string): Promise<AuthResponse> {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password, name: name.trim() }),
      skipAuthRedirect: true,
    });
  },

  login(email: string, password: string): Promise<AuthResponse> {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      skipAuthRedirect: true,
    });
  },

  me(): Promise<User> {
    return request("/auth/me");
  },
};

// ─── Application API ────────────────────────────────────────────────────────

export const api = {
  list(status?: Status, search?: string, tag?: string): Promise<Application[]> {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    if (tag) params.set("tag", tag);
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

// ─── Analytics API ──────────────────────────────────────────────────────────

export const analytics = {
  summary(): Promise<{
    total: number;
    response_rate: number;
    by_status: Record<string, number>;
    by_source: Record<string, number>;
  }> {
    return request("/analytics/summary");
  },

  funnel(): Promise<{ stage: string; count: number }[]> {
    return request("/analytics/funnel");
  },
};