export interface Application {
  /** Application public ID (UUID, internal_uid). Use this in URLs and API calls. */
  id: string;
  certificate_type: "electrical" | "building" | "plumbing" | "civil";
  certificate_class?: string;
  description?: string;
  status: "draft" | "submitted" | "pending_payment" | "in_review" | "approved" | "rejected" | "suspended" | "cancelled";
  current_step: number;
  user_id: string;
  expiry_date?: string;
  company_name?: string;
  user_email?: string;
  certificate_number?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number | string;
  email: string;
  full_name?: string;
  phone_number?: string;
  /** From registration: company/organization name (stored as full_name). */
  company_registration_number?: string;
  company_type?: string;
  is_active: boolean;
  is_superuser: boolean;
  role: "user" | "admin" | "super_admin";
  tutorials_completed?: boolean;
}

/** Response from GET /users/me when backend includes applications. */
export interface MeResponse extends User {
  applications?: Application[];
}

export type UserRole = "user" | "admin" | "super_admin";

export interface AuditLog {
  id: number;
  action: string;
  target_type: string;
  target_id: number;
  target_label?: string;
  details: string;
  timestamp: string;
  user_id: number;
  user_email: string;
}

export interface CompanyInfo {
  id: number;
  company_name: string;
  registration_number: string;
  address: string;
  city: string;
  country: string;
  phone_number: string;
  email: string;
  application_id: number;
}

export interface CompanyInfoCreate {
  company_name: string;
  registration_number: string;
  address: string;
  city: string;
  country: string;
  phone_number: string;
  email: string;
  application_id: string; // UUID of the application
}

export interface CompanyInfoUpdate {
  company_name?: string;
  registration_number?: string;
  address?: string;
  city?: string;
  country?: string;
  phone_number?: string;
  email?: string;
}

export interface Director {
  id: number;
  name: string;
  position: string;
  nationality: string;
  phone_number: string;
  email: string;
  application_id: number;
}

export interface DirectorCreate {
  name: string;
  position: string;
  nationality: string;
  phone_number: string;
  email: string;
  application_id: string; // UUID of the application
}

export interface Document {
  id: number;
  document_type: string;
  filename: string;
  file_url: string;
  previous_file_url?: string | null;
  uploaded_at: string;
  application_id: number;
}
