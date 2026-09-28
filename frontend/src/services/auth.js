import api, { clearCsrfToken } from "./api";

export function storeSessionMetadata({ email, fullName, role }) {
  sessionStorage.setItem("userEmail", email || "");
  sessionStorage.setItem("userName", fullName || "");
  sessionStorage.setItem("userRole", role || "");
}

export async function signOut(navigate) {
  try {
    await api.post("/auth/logout");
  } catch {
    // The local session must still be cleared if a stale cookie has expired.
  } finally {
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userRole");
    clearCsrfToken();
    navigate("/login");
  }
}
