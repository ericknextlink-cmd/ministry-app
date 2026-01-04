export type { Application, User, UserRole, AuditLog } from "@/lib/types";
import { Application, User, UserRole, AuditLog } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
  token?: string;
  body?: any;
}

// Generic helper for API requests
async function request<T>(
  url: string,
  method: string,
  options?: RequestOptions
): Promise<T> {
  const headers: Record<string, string> = { 
    ...(options?.headers as Record<string, string>), 
  };

  if (!(options?.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
  }

  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    ...options,
  };

  if (options?.body) {
    config.body = options.body instanceof FormData ? options.body : JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${url}`, config);

  if (!response.ok) {
    let errorData: any;
    try {
        errorData = await response.json();
    } catch {
        errorData = { detail: response.statusText || "Unknown error" };
    }
    throw new Error(errorData.detail || errorData.message || `API Error: ${response.status} - ${errorData.detail}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {} as T; 
}

// Base API methods
export const api = {
  get: <T>(url: string, token?: string, options?: RequestOptions) =>
    request<T>(url, "GET", { ...options, token }),
  post: <T>(url: string, body: any, token?: string, options?: RequestOptions) =>
    request<T>(url, "POST", { ...options, body, token }),
  put: <T>(url: string, body: any, token?: string, options?: RequestOptions) =>
    request<T>(url, "PUT", { ...options, body, token }),
  patch: <T>(url: string, body: any, token?: string, options?: RequestOptions) =>
    request<T>(url, "PATCH", { ...options, body, token }),
  delete: <T>(url: string, token?: string, options?: RequestOptions) =>
    request<T>(url, "DELETE", { ...options, token }),
  
  download: async (url: string, filename: string, token?: string) => {
    const headers: HeadersInit = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        method: "GET",
        headers: headers,
    });

    if (!response.ok) {
        let errorData: any;
        try {
            errorData = await response.json();
        } catch {
            errorData = { detail: response.statusText || "Unknown error" };
        }
        throw new Error(errorData.detail || `Download failed: ${response.status} - ${errorData.detail}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
};

// Authentication specific functions
export const authApi = {
  login: async (email: string, password: string): Promise<{ access_token: string }> => {
    const details = new URLSearchParams();
    details.append("username", email);
    details.append("password", password);

    const response = await fetch(`${API_BASE_URL}/login/access-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: details,
    });

    if (!response.ok) {
        let errorData: any;
        try {
            errorData = await response.json();
        } catch {
            errorData = { detail: response.statusText || "Login failed" };
        }
      throw new Error(errorData.detail || `Login failed: ${response.status} - ${errorData.detail}`);
    }

    return response.json();
  },

  register: async (data: { email: string; password: string; companyName?: string; phone?: string; companyRegistrationNumber?: string; companyType?: string }) => {
    const response = await fetch(`${API_BASE_URL}/users/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: data.email,
            password: data.password,
            full_name: data.companyName, // Mapping company name to full_name as per usual convention
            phone_number: data.phone,
            company_registration_number: data.companyRegistrationNumber,
            company_type: data.companyType,
            is_active: true,
            is_superuser: false
        }),
    });

    if (!response.ok) {
        let errorData: any;
        try {
            errorData = await response.json();
        } catch {
            errorData = { detail: response.statusText || "Registration failed" };
        }
        throw new Error(errorData.detail || errorData.message || `Registration failed: ${response.status}`);
    }

    return response.json();
  },

  getMe: async (token: string) => {
      return api.get<User>("/users/me", token);
  },

  updateProfile: async (data: { full_name?: string; phone_number?: string }, token: string) => {
      return api.patch<User>("/users/me", data, token);
  },
  
  updatePassword: async (currentPassword: string, newPassword: string, token: string) => {
      return api.put("/users/me/password", { current_password: currentPassword, new_password: newPassword }, token);
  },

  forgotPassword: async (email: string) => {
      // Note: Endpoint expects email in URL path
      return api.post(`/login/password-recovery/${email}`, {});
  },

  resetPassword: async (token: string, newPassword: string) => {
      return api.post(`/login/reset-password`, { token, new_password: newPassword });
  }
};

// Company Info specific functions
export const companyInfoApi = {
  get: async <T>(applicationId: number, token: string) => {
    return api.get<T>(`/company-info/${applicationId}`, token);
  },
  getLatest: async <T>(token: string) => {
    return api.get<T>(`/company-info/latest/data`, token);
  },
  create: async <T>(data: any, token: string) => {
    return api.post<T>(`/company-info/`, data, token);
  },
  update: async <T>(applicationId: number, data: any, token: string) => {
    return api.patch<T>(`/company-info/${applicationId}`, data, token);
  }
};

// Directors specific functions
export const directorsApi = {
  list: async <T>(applicationId: number, token: string) => {
    return api.get<T>(`/directors/${applicationId}`, token);
  },
  getLatest: async <T>(token: string) => {
    return api.get<T>(`/directors/latest/data`, token);
  },
  create: async <T>(data: any, token: string) => {
    return api.post<T>(`/directors/`, data, token);
  },
  delete: async <T>(directorId: number, token: string) => {
    return api.delete<T>(`/directors/${directorId}`, token);
  }
};

// Documents specific functions
export const documentsApi = {
  list: async <T>(applicationId: number, token: string) => {
    return api.get<T>(`/documents/${applicationId}`, token);
  },
  upload: async <T>(applicationId: number, documentType: string, file: File, token: string) => {
    const formData = new FormData();
    formData.append("application_id", applicationId.toString());
    formData.append("document_type", documentType);
    formData.append("file", file);
    return api.post<T>(`/documents/upload/`, formData, token);
  },
  delete: async <T>(documentId: number, token: string) => {
    return api.delete<T>(`/documents/${documentId}`, token);
  }
};

// Applications specific functions
export const applicationsApi = {
  list: async (token: string) => {
    return api.get<Application[]>("/applications/", token);
  },
  bulkPay: async (applicationIds: number[], token: string) => {
    return api.post<Application[]>("/applications/pay", { application_ids: applicationIds }, token);
  }
};

// Admin specific functions
export const adminApi = {
  getStats: async <T>(token: string) => {
    return api.get<T>("/admin/stats", token);
  },
  getApplications: async (
      token: string, 
      status?: string, 
      startDate?: string, 
      endDate?: string,
      certificateType?: string,
      search?: string
  ): Promise<Application[]> => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("status", status);
    if (certificateType && certificateType !== "all") params.append("certificate_type", certificateType);
    if (search) params.append("search", search);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    
    const query = params.toString() ? `?${params.toString()}` : "";
    return api.get<Application[]>(`/admin/applications${query}`, token);
  },
  getAdminApplicationDetails: async <T>(applicationId: number, token: string) => {
    return api.get<T>(`/admin/applications/${applicationId}/details`, token);
  },
  updateStatus: async <T>(applicationId: number, status: string, token: string) => {
    return api.patch<T>(`/admin/applications/${applicationId}/status?status=${status}`, {}, token);
  },
  getExpiringCertificates: async (token: string, days: number = 30): Promise<Application[]> => {
    return api.get<Application[]>(`/admin/renewals/expiring?days=${days}`, token);
  },
  assignApplication: async (applicationId: number, token: string): Promise<Application> => {
    return api.post<Application>(`/admin/applications/${applicationId}/assign`, {}, token);
  },
  unassignApplication: async (applicationId: number, token: string): Promise<Application> => {
    return api.post<Application>(`/admin/applications/${applicationId}/unassign`, {}, token);
  },
  listTemplates: async (token: string) => {
    return api.get<any[]>("/admin/templates", token);
  },
  uploadTemplate: async (file: File, token: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<any>("/admin/templates", formData, token);
  }
};

// Super Admin specific functions
export const superAdminApi = {
  getUsers: async (token: string): Promise<User[]> => {
    return api.get<User[]>("/superadmin/users", token);
  },
  getAuditLogs: async (token: string, action?: string, startDate?: string, endDate?: string): Promise<AuditLog[]> => {
    const params = new URLSearchParams();
    if (action && action !== "all") params.append("action", action);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    const query = params.toString() ? `?${params.toString()}` : "";
    return api.get<AuditLog[]>(`/superadmin/audit-logs${query}`, token);
  },
  updateUserRole: async (userId: number, role: UserRole, token: string): Promise<User> => {
    return api.patch<User>(`/superadmin/users/${userId}/role?new_role=${role}`, {}, token);
  },
  toggleUserActiveStatus: async (userId: number, activate: boolean, token: string): Promise<User> => {
    return api.patch<User>(`/superadmin/users/${userId}/activate?activate=${activate}`, {}, token);
  },
  createUser: async (data: any, role: UserRole, token: string): Promise<User> => {
    return api.post<User>(`/superadmin/users?role=${role}`, data, token);
  }
};

export const notificationsApi = {
  list: async (token: string, unreadOnly: boolean = false) => {
    return api.get<any[]>(`/notifications/?unread_only=${unreadOnly}`, token);
  },
  markRead: async (id: number, token: string) => {
    return api.patch(`/notifications/${id}/read`, {}, token);
  }
};