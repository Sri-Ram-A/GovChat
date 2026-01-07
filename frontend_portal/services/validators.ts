
// Validation utilities
export const validators = {
  username: (val: string) => /^[a-zA-Z0-9_]{3,30}$/.test(val),
  email: (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
  password: (val: string) => val.length >= 8,
  phone: (val: string) => /^\+?[\d\s-]{10,}$/.test(val),
}

export const getErrorMessage = (field: string, type: string): string => {
  const messages: Record<string, Record<string, string>> = {
    email: { invalid: "Invalid email address" },
    phone: { invalid: "Invalid phone number" },
    password: { weak: "Password must be at least 8 characters" },
    username: { invalid: "Username must be 3+ alphanumeric characters" },
    pincode: { invalid: "Invalid pincode" },
  }
  return messages[field]?.[type] || "Invalid input"
}
