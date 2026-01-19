
export const API_URL = "http://127.0.0.1:8000/" // No cert
// export const API_URL = "https://127.0.0.1:8000/" // Use cert

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"
type BackendError = {
  message?: string;
  error?: string;
  detail?: string;
};

async function handleErrorResponse(res: Response): Promise<never> {
  let data: BackendError = {};
  try { data = await res.json(); } 
  catch { }
  throw {
    status: res.status,
    message:
      data.message ||
      data.error ||
      data.detail ||
      "Request failed",
  };
}


async function refreshAccessToken(): Promise<string> {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) throw new Error("No refresh token");
  const res = await fetch(`${API_URL}api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    localStorage.clear();
    throw new Error("Session expired");
  }

  const data = await res.json();
  localStorage.setItem("access", data.access);
  return data.access;
}

export async function REQUEST(
  method: HttpMethod,
  url: string,
  body?: any,
  options?: { isMultipart?: boolean }
) {
  const request = async (): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (!options?.isMultipart) { headers["Content-Type"] = "application/json"; }
    const access = localStorage.getItem("access");
    if (access) { headers["Authorization"] = `Bearer ${access}`; }
    return fetch(`${API_URL}api/${url}`, {
      method,
      headers,
      body: options?.isMultipart
        ? body
        : body
          ? JSON.stringify(body)
          : null,
    });
  };
  let res = await request();
  if (res.status === 401) {
    try {
      await refreshAccessToken();
      res = await request(); // retry exactly once
    } catch {
      throw { message: "Session expired. Please login again." };
    }
  }
  if (!res.ok) { await handleErrorResponse(res); }
  return res.json();
}