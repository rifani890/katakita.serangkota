/**
 * Wrapper around fetch that always includes credentials (cookies)
 * and handles 401 by redirecting to the login page.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  // Custom header for CSRF protection — browsers block cross-origin custom headers without preflight
  headers.set("X-Requested-With", "XMLHttpRequest");

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    window.location.href = "/";
    throw new Error("Session expired. Redirecting to home.");
  }

  return res;
}
