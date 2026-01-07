
// API utilities
export const API_URL = "http://localhost:8000/api/"

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

function extractAllErrors(error: any, messages: string[] = []): string {
  const data = error?.message || error
  Object.values(data || {}).forEach((value: any) => {
    if (Array.isArray(value)) {
      messages.push(value[0])
    } else if (typeof value === "object") {
      extractAllErrors(value, messages)
    }
  })
  return messages.join("\n")
}

export async function REQUEST(
  method: HttpMethod,
  route: string,
  data?: any
) {
  const token = localStorage.getItem("auth_token")
  const url = `${API_URL}${route}`
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: data ? JSON.stringify(data) : undefined,
  })
  const responseData = await response.json().catch(() => ({}))
  if (!response.ok) { throw new Error(extractAllErrors(responseData)) }
  return responseData
}
