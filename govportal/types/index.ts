export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  password2: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  address: string;
  gender: string;
  city: string;
  state_province: string;
  postal_code: string;
  date_of_birth: Date | undefined;
}


export type FormErrors = Partial<Record<keyof RegisterForm | "submit", string>>

export interface Complaint {
  id: number
  title: string
  description: string
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
  city: string
  pincode: string
  timestamp: string
  likes_count: number

  // Optional extras (serializer dependent)
  citizen_username?: string
  evidences?: {
    id: number
    file: string
    media_type: string
  }[]
}


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
