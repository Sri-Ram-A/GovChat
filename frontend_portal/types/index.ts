export interface RegisterForm {
  username: string
  email: string
  password: string
  phone_number: string
  address: string
  gender: string
  city: string
  state_province: string
  postal_code: string
  date_of_birth?: Date
}

export type FormErrors = Partial<Record<keyof RegisterForm | "submit", string>>


export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone_number?: string
  created_at: string
}

export interface CitizenProfile {
  id: number
  user: User
  address: string
  gender: "M" | "F"
  city: string
  state_province: string
  postal_code: string
  date_of_birth: string
  is_verified: boolean
}

export interface Department {
  id: number
  name: string
  description: string
}

export interface Complaint {
  id: number
  citizen: CitizenProfile
  title: string
  description: string
  department: Department
  address_line_1: string
  address_line_2?: string
  landmark?: string
  city: string
  pincode: string
  latitude?: number
  longitude?: number
  status: "open" | "in_progress" | "resolved" | "closed"
  created_at: string
  updated_at: string
}

export interface Evidence {
  id: number
  complaint: number
  file: string
  media_type: "image" | "video" | "document"
}

export interface AuthResponse {
  access: string
  refresh: string
  user: User
}
