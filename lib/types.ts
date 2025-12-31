export interface Application {
  id: number;
  certificate_type: "electrical" | "building" | "plumbing" | "civil";
  certificate_class?: string;
  description?: string;
  status: "draft" | "submitted" | "pending_payment" | "in_review" | "approved" | "rejected" | "suspended" | "cancelled";
  current_step: number;
  user_id: number;
  expiry_date?: string;
  company_name?: string;
  user_email?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  full_name?: string;
  phone_number?: string;
  is_active: boolean;
  is_superuser: boolean;
  role: "user" | "admin" | "super_admin";
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
