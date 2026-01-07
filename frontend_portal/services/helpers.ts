export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem("auth_token", token)
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("auth_token")
}
