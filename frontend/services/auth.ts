export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access")
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem("access", token)
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("access")
}
