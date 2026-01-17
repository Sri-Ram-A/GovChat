export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  password2: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  gender?: string;
  address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  date_of_birth?: Date | undefined;
  designation?:string;
  department?:number;
}


export type FormErrors = Partial<Record<keyof RegisterForm | "submit", string>>

export type MediaType = "image" | "video" | "document" | "audio";

export interface Evidence {
  id: number;
  complaint: number;
  file: string; // URL or relative path
  media_type: MediaType;
  caption: string;
}

export type ComplaintStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "DRAFT";

export interface Complaint {
  id: number;
  title: string;
  description: string;
  status: ComplaintStatus;
  city?: string;
  pincode?: string;
  timestamp: string; // ISO
  likes_count: number;
  evidences?: Evidence[];
  citizen?: string;
  address_line_1?: string;
  address_line_2?: string;
  landmark?: string;
  latitude?:string;
  longitude?:string;
}
export interface ComplaintCreatePayload {
  title: string;
  description: string;
  department: number;
  address_line_1?: string;
  address_line_2?: string;
  landmark?: string;
  city?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

export interface EvidenceUploadPayload {
  complaint: number;
  file: File;
  media_type: MediaType;
}

export interface Department {
  id: number
  name: string
  description: string
  code?:string
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


export interface AuthResponse {
  access: string
  refresh: string
  user: User
}
