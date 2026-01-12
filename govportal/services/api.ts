// export const API_URL = "https://192.168.1.6:8000/" //Sree
// export const API_URL = "https://192.168.1.3:8000/" //Ram
export const API_URL = "https://127.0.0.1:8000/" //Ram

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

function extractAllErrors(error: any, messages: string[] = []): string {
  if (!error) return "Unknown error"
  // If it's already a string
  if (typeof error === "string") return error
  // If it's an array, join entries
  if (Array.isArray(error)) return error.map((e) => (typeof e === "string" ? e : JSON.stringify(e))).join("\n")

  // If it's an object, try common shapes
  // 1. { message: ... }
  if (error.message) return extractAllErrors(error.message, messages)

  // 2. field -> ["error msg"] or field -> { ... }
  Object.values(error).forEach((value: any) => {
    if (Array.isArray(value)) {
      messages.push(value[0])
    } else if (typeof value === "object") {
      const nested = extractAllErrors(value, messages)
      if (nested) messages.push(nested)
    } else if (typeof value === "string") {
      messages.push(value)
    }
  })
  return messages.join("\n")
}

export async function REQUEST(
  method: string,
  url: string,
  body?: any,
  options?: { isMultipart?: boolean }
) {
  const headers: Record<string, string> = {};
  if (!options?.isMultipart) { headers["Content-Type"] = "application/json"; }
  const token = localStorage.getItem("access");
  if (token) { headers["Authorization"] = `Bearer ${token}`; }
  const res = await fetch(
    `${API_URL}api/${url}`,
    {
      method,
      headers,
      body: options?.isMultipart ? body : body ? JSON.stringify(body) : null,
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw err;
  }

  return res.json();
}
