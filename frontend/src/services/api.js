import axios from "axios";

// The browser never stores the access JWT. FastAPI sets it as an HttpOnly
// cookie, while this client holds only the non-sensitive CSRF value in memory.
// During local development, keep the API hostname identical to the page
// hostname. `localhost` and `127.0.0.1` are different browser sites, so a
// SameSite session cookie set by one is not reliably sent to the other.
const localApiUrl =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || localApiUrl,
  withCredentials: true,
});

const VISITOR_STORAGE_KEY = "nexusVisitorId";
let csrfToken = null;

function getVisitorId() {
  let visitorId = localStorage.getItem(VISITOR_STORAGE_KEY);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
  }
  return visitorId;
}

export function setCsrfToken(token) {
  csrfToken = token || null;
}

export function clearCsrfToken() {
  csrfToken = null;
}

async function ensureCsrfToken() {
  if (csrfToken) return csrfToken;
  const response = await axios.get(`${api.defaults.baseURL}/auth/csrf`, {
    withCredentials: true,
  });
  csrfToken = response.data.csrf_token;
  return csrfToken;
}

api.interceptors.request.use(async (config) => {
  config.headers["X-Nexus-Visitor"] = getVisitorId();
  const method = (config.method || "get").toLowerCase();
  const isUnsafe = !["get", "head", "options"].includes(method);
  const isCsrfBootstrap = config.url?.includes("/auth/csrf");

  if (isUnsafe && !isCsrfBootstrap) {
    const token = await ensureCsrfToken();
    config.headers["X-CSRF-Token"] = token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data?.csrf_token) setCsrfToken(response.data.csrf_token);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAuthCall =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/forgot-password") ||
      url.includes("/auth/reset-password");

    if (status === 401 && !isAuthCall) {
      sessionStorage.removeItem("userEmail");
      sessionStorage.removeItem("userName");
      sessionStorage.removeItem("userRole");
      clearCsrfToken();
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
