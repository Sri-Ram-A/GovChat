// ==================== AUTH & USER TYPES ====================

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone_number?: string
  created_at: string
}

export interface AuthResponse {
  access: string
  refresh: string
  user: User
}

export interface RegisterForm {
  username: string
  email: string
  password: string
  password2: string
  phone_number: string
  first_name: string
  last_name: string
  gender?: string
  address?: string
  city?: string
  state_province?: string
  postal_code?: string
  date_of_birth?: Date | undefined
  designation?: string
  department?: number
}

export type FormErrors = Partial<Record<keyof RegisterForm | "submit", string>>

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

export interface HandlerProfile {
  id: number
  user: User
  designation: string
  department?: number
  group?: number
}

export interface AdminProfile {
  id: number
  user: User
  designation: string
  department?: number
}


// ==================== DEPARTMENT ====================

export interface Department {
  id: number
  name: string
  description: string
  code?: string
}


// ==================== COMPLAINT TYPES ====================

export type ComplaintStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "DRAFT"

export type MediaType = "image" | "video" | "document" | "audio"

export interface Evidence {
  id: number
  complaint: number
  file: string // URL or relative path
  media_type: MediaType
  caption: string
  suggested_department?: number
}

export interface ComplaintCreatePayload {
  title: string
  description: string
  department: number
  address_line_1?: string
  address_line_2?: string
  landmark?: string
  city?: string
  pincode?: string
  latitude?: number
  longitude?: number
}

export interface EvidenceUploadPayload {
  complaint: number
  file: File
  media_type: MediaType
}

export interface Complaint {
  id: number
  title: string
  description: string
  status: ComplaintStatus
  citizen?: string
  department?: string
  address_line_1?: string
  address_line_2?: string
  landmark?: string
  city?: string
  pincode?: string
  latitude?: number
  longitude?: number
  timestamp: string // ISO
  likes_count: number
  evidences?: Evidence[]
  group?: ComplaintGroup | null
}


// ==================== GROUP & TIMELINE TYPES ====================

export type GroupStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"

export interface TimelineEntry {
  id: number
  title: string
  text: string
  image: string | null
  created_at: string // ISO
  posted_by: "Admin" | "Handler" | "Unknown"
  posted_by_name: string
}

export interface ComplaintGroup {
  id: number
  title: string
  department?: string | null
  centroid_latitude: number
  centroid_longitude: number
  radius_meters?: number
  grouped_status: GroupStatus
  complaints_count?: number
  created_at?: string
  updated_at?: string
  complaints?: Complaint[]
  timeline?: TimelineEntry[]
}

export interface TimelineCreatePayload {
  group?: number // For admin (must specify group)
  title: string
  text: string
  image?: File
}


// ==================== HANDLER TYPES ====================

export interface HandlerListItem {
  id: number
  name: string
  designation: string
  department: string
  group_id?: number | null
  group_title?: string | null
}

export interface AssignGroupPayload {
  group_id: number
}


// ==================== COMMENT TYPES ====================

export interface Comment {
  id: number
  complaint: number
  user: string // Username or display name
  text: string
  created_at: string // ISO
}

export interface CommentCreatePayload {
  complaint: number
  text: string
}


// ==================== API RESPONSE TYPES ====================

export interface ApiSuccessResponse<T = any> {
  message?: string
  data?: T
}

export interface ApiErrorResponse {
  message?: string
  detail?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}


// ==================== FILTER & SORT TYPES ====================

export interface ComplaintFilters {
  status?: ComplaintStatus
  department?: number
  citizen?: number
  group?: number
  date_from?: string
  date_to?: string
  search?: string
}

export interface GroupFilters {
  status?: GroupStatus
  department?: number
  search?: string
}

export type SortOrder = "asc" | "desc"

export interface SortConfig {
  field: string
  order: SortOrder
}


// ==================== MAP TYPES ====================

export interface MapMarkerData {
  id: number
  latitude: number
  longitude: number
  title: string
  status: ComplaintStatus | GroupStatus
  type: "complaint" | "group"
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}


// ==================== STATISTICS TYPES ====================

export interface ComplaintStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  draft: number
}

export interface GroupStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
}

export interface DepartmentStats {
  id: number
  name: string
  complaint_count: number
  group_count: number
}


// ==================== UTILITY TYPES ====================

export type Nullable<T> = T | null

export type Optional<T> = T | undefined

export type ID = number | string

export type DateString = string // ISO 8601 format

export type Timestamp = string // ISO 8601 format


// ==================== FORM TYPES ====================

export interface LoginForm {
  username: string
  password: string
}

export interface ComplaintFormData {
  title: string
  description: string
  department: number
  address_line_1: string
  address_line_2: string
  landmark: string
  city: string
  pincode: string
  latitude?: number
  longitude?: number
}

export interface TimelineFormData {
  title: string
  text: string
  image: File | null
}

export interface GroupStatusUpdatePayload {
  status: GroupStatus
}


// ==================== LEGACY COMPATIBILITY (Deprecated - for migration) ====================

/**
 * @deprecated Use ComplaintGroup instead
 */
export interface Group extends ComplaintGroup {}

/**
 * @deprecated Use TimelineEntry instead
 */
export interface Timeline {
  id: number
  title: string
  text?: string
  created_at: string
  admin?: string
}