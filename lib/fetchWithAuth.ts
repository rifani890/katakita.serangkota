/**
 * Wrapper around fetch that always includes credentials (cookies)
 * and handles 401 by redirecting to the login page.
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if (res.status === 401) {
    window.location.href = "/";
    throw new Error("Session expired. Redirecting to home.");
  }

  return res;
}
