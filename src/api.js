/**
 * TalentAI — API Client
 */

const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

// ── JWT token helpers ─────────────────────────────────────────────────────────
export const token = {
  get: () => localStorage.getItem("tai_token"),
  set: (t) => { if(t) localStorage.setItem("tai_token", t); },
  clear: () => localStorage.removeItem("tai_token"),
};

// ── Base fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const t = token.get();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (t) {
    headers["Authorization"] = `Bearer ${t}`;
  } else {
    console.warn("⚠️ No token found for request:", path);
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || `Request failed: ${res.status}`);
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: async (name, email, password) => {
    // No token needed for register
    const res = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Registration failed");
    if (data.token) token.set(data.token);
    return data;
  },

  login: async (email, password) => {
    // No token needed for login
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Login failed");
    if (data.token) token.set(data.token);
    return data;
  },

  me: () => apiFetch("/auth/me"),

  onboard: (recommendedRole, dailyGoal) =>
    apiFetch("/auth/onboard", {
      method: "PATCH",
      body: JSON.stringify({ recommendedRole, dailyGoal }),
    }),
};

// ── Resume ────────────────────────────────────────────────────────────────────
export const resumeAPI = {
  analyze: (text, apiKey) =>
    apiFetch("/resume/analyze", {
      method: "POST",
      body: JSON.stringify({ text, apiKey: apiKey || null }),
    }),

  get: () => apiFetch("/resume/"),

  jdMatch: (jobDescription, apiKey) =>
    apiFetch("/resume/jd-match", {
      method: "POST",
      body: JSON.stringify({ jobDescription, apiKey: apiKey || null }),
    }),

  coverLetter: (jobDescription, company, tone, apiKey) =>
    apiFetch("/resume/cover-letter", {
      method: "POST",
      body: JSON.stringify({ jobDescription, company, tone, apiKey: apiKey || null }),
    }),
};

// ── Interview ─────────────────────────────────────────────────────────────────
export const interviewAPI = {
  evaluate: (question, userAnswer, referenceAnswer, apiKey) =>
    apiFetch("/interview/evaluate", {
      method: "POST",
      body: JSON.stringify({ question, userAnswer, referenceAnswer, apiKey: apiKey || null }),
    }),

  coach: (messages, skills, level, targetRole, apiKey) =>
    apiFetch("/interview/coach", {
      method: "POST",
      body: JSON.stringify({ messages, skills, level, targetRole, apiKey: apiKey || null }),
    }),

  gaps: (role, missingSkills, apiKey) =>
    apiFetch("/interview/gaps", {
      method: "POST",
      body: JSON.stringify({ role, missingSkills, apiKey: apiKey || null }),
    }),
};

// ── Sessions ──────────────────────────────────────────────────────────────────
export const sessionsAPI = {
  save: (role, avgScore, questions, scores) =>
    apiFetch("/sessions/", {
      method: "POST",
      body: JSON.stringify({ role, avgScore, questions, scores }),
    }),

  getAll: () => apiFetch("/sessions/"),

  getOne: (id) => apiFetch(`/sessions/${id}`),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  get: () => apiFetch("/analytics/"),
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsAPI = {
  update: (dailyGoal, plan) =>
    apiFetch("/settings/", {
      method: "PATCH",
      body: JSON.stringify({ dailyGoal, plan }),
    }),
};

// ── Cover Letter ──────────────────────────────────────────────────────────────
export const coverAPI = {
  generate: (jobDescription, company, tone, apiKey) =>
    apiFetch("/resume/cover-letter", {
      method: "POST",
      body: JSON.stringify({ jobDescription, company, tone, apiKey: apiKey || null }),
    }),
};

// ── Gaps ──────────────────────────────────────────────────────────────────────
export const gapsAPI = {
  getLearningPlan: (role, missingSkills, apiKey) =>
    apiFetch("/interview/gaps", {
      method: "POST",
      body: JSON.stringify({ role, missingSkills, apiKey: apiKey || null }),
    }),
};
