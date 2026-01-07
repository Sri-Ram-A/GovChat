export const API_URL = "http://localhost:8000/api/"

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
  method: HttpMethod,
  route: string,
  data?: any
) {
  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null
  const url = `${API_URL}${route}`

  // Debug logging for request
  try {
    console.debug("REQUEST ->", { method, url, payload: data, tokenPresent: !!token })
  } catch (e) {
    // ignore logging failures
  }

  let resp: Response
  try {
    resp = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    })
  } catch (networkErr: any) {
    console.error("Network error while calling API", networkErr)
    throw new Error(networkErr?.message || "Network error")
  }

  const text = await resp.text().catch(() => "")
  let responseData: any = {}
  try {
    responseData = text ? JSON.parse(text) : {}
  } catch (err) {
    // Not a JSON response; keep raw text for debugging
    responseData = text
  }

  console.debug("RESPONSE <-", { url, status: resp.status, ok: resp.ok, data: responseData })

  if (!resp.ok) {
    // Try extracting useful message
    const message = extractAllErrors(responseData) || `HTTP ${resp.status}`
    const err = new Error(message)
    ;(err as any).status = resp.status
    ;(err as any).raw = responseData
    throw err
  }

  return responseData
}
