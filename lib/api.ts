export type { Application, User, UserRole, AuditLog, CompanyInfoUpdate } from "@/lib/types";
import { Application, User, UserRole, AuditLog, CompanyInfoUpdate } from "@/lib/types";
import { handleTokenExpiration, isUnauthorizedError } from "./auth-handler";

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
    let errorData: unknown;
    let errorMessage = `API Error: ${response.status}`;
    try {
        errorData = await response.json();
        if (errorData && typeof errorData === 'object' && 'detail' in errorData) {
          errorMessage = String(errorData.detail) || errorMessage;
        } else if (errorData && typeof errorData === 'object' && 'message' in errorData) {
          errorMessage = String(errorData.message) || errorMessage;
        }
    } catch {
        errorData = { detail: response.statusText || "Unknown error" };
        errorMessage = response.statusText || "Unknown error";
    }
    
    // Handle 401/403 unauthorized errors globally
    if (response.status === 401 || response.status === 403) {
      // Only handle token expiration if we have a token (not for login/register endpoints)
      if (options?.token && !url.includes('/login') && !url.includes('/register')) {
        handleTokenExpiration();
        throw new Error('Session expired. Please login again.');
      }
    }
    
    // Business logic errors (4xx) are expected - use warn
    // Technical errors (5xx) are unexpected - use error
    const isBusinessLogicError = response.status >= 400 && response.status < 500;
    const logMethod = isBusinessLogicError ? console.warn : console.error;
    
    logMethod(`API Request Failed [${method} ${url}]:`, {
      status: response.status,
      statusText: response.statusText,
      errorData,
      errorMessage
    });
    
    throw new Error(errorMessage);
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
        // Handle 401/403 unauthorized errors globally
        if (response.status === 401 || response.status === 403) {
          if (token && !url.includes('/login') && !url.includes('/register')) {
            handleTokenExpiration();
            throw new Error('Session expired. Please login again.');
          }
        }
        
        let errorData: unknown;
        let errorMessage = `Download failed: ${response.status}`;
        try {
            errorData = await response.json();
            if (errorData && typeof errorData === 'object' && 'detail' in errorData) {
              errorMessage = String(errorData.detail) || errorMessage;
            }
        } catch {
            errorData = { detail: response.statusText || "Unknown error" };
            errorMessage = response.statusText || "Unknown error";
        }
        
        console.error('Download API Request Failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorMessage
        });
        
        throw new Error(errorMessage);
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
        let errorData: unknown;
        let errorMessage = `Login failed: ${response.status}`;
        try {
            errorData = await response.json();
            if (errorData && typeof errorData === 'object' && 'detail' in errorData) {
              errorMessage = String(errorData.detail) || errorMessage;
            }
        } catch {
            errorData = { detail: response.statusText || "Login failed" };
            errorMessage = response.statusText || "Login failed";
        }
        
        // Business logic errors (4xx) are expected - use warn
        // Technical errors (5xx) are unexpected - use error
        const isBusinessLogicError = response.status >= 400 && response.status < 500;
        const logMethod = isBusinessLogicError ? console.warn : console.error;
        
        logMethod('Login API Request Failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorMessage
        });
        
        throw new Error(errorMessage);
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
        let errorData: unknown;
        let errorMessage = `Registration failed: ${response.status}`;
        try {
            errorData = await response.json();
            if (errorData && typeof errorData === 'object') {
              if ('detail' in errorData) {
                errorMessage = String(errorData.detail) || errorMessage;
              } else if ('message' in errorData) {
                errorMessage = String(errorData.message) || errorMessage;
              }
            }
        } catch {
            errorData = { detail: response.statusText || "Registration failed" };
            errorMessage = response.statusText || "Registration failed";
        }
        
        // Business logic errors (4xx) are expected - use warn
        // Technical errors (5xx) are unexpected - use error
        const isBusinessLogicError = response.status >= 400 && response.status < 500;
        const logMethod = isBusinessLogicError ? console.warn : console.error;
        
        logMethod('Registration API Request Failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorMessage
        });
        
        throw new Error(errorMessage);
    }

    return response.json();
  },

  getMe: async (token: string) => {
      return api.get<User>("/users/me", token);
  },

  updateProfile: async (data: { full_name?: string; phone_number?: string; tutorials_completed?: boolean }, token: string) => {
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
  create: async <T>(data: CompanyInfoUpdate & { application_id: number }, token: string) => {
    return api.post<T>(`/company-info/`, data, token);
  },
  update: async <T>(applicationId: number, data: CompanyInfoUpdate, token: string) => {
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
  },
  getDetails: async <T>(applicationId: number, token: string) => {
    return api.get<T>(`/applications/${applicationId}/details`, token);
  },
  submit: async (applicationId: number, token: string) => {
    return api.post<Application>(`/applications/${applicationId}/submit`, {}, token);
  },
  getReusable: async (token: string): Promise<Application[]> => {
    return api.get<Application[]>("/applications/reusable", token);
  },
  cloneData: async (applicationId: number, sourceApplicationId: number, token: string): Promise<Application> => {
    return api.post<Application>(
      `/applications/${applicationId}/clone`,
      { source_application_id: sourceApplicationId },
      token
    );
  },
  /** Get a short-lived renewal token for the certificate renewal callback (public, no auth). */
  getRenewalToken: async (applicationId: number): Promise<{ token: string }> => {
    return api.get<{ token: string }>(`/applications/renewal-token?application_id=${applicationId}`);
  },
  /** Start renewal using token from PDF link (requires auth). */
  renewFromToken: async (renewalToken: string, userToken: string): Promise<Application> => {
    return api.post<Application>("/applications/renew-from-token", { token: renewalToken }, userToken);
  },
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
  saveApplicationAnalysis: async (applicationId: number, analysis: object, token: string): Promise<{ ok: boolean }> => {
    return api.patch<{ ok: boolean }>(`/admin/applications/${applicationId}/analysis`, { analysis }, token);
  },
  listTemplates: async (token: string) => {
    return api.get<any[]>("/admin/templates", token);
  },
  uploadTemplate: async (file: File, token: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<any>("/admin/templates", formData, token);
  },
  analyzeApplication: async (applicationId: number, token: string) => {
    try {
      const response = await fetch('/api/analyze-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationId, token }),
      });
      
      if (!response.ok) {
        // Handle 405 Method Not Allowed specifically
        if (response.status === 405) {
          const error: any = new Error('Analysis endpoint is not available. Please ensure the API route is properly configured.');
          error.userMessage = 'Analysis service is not available. Please contact support.';
          error.code = 'ENDPOINT_NOT_AVAILABLE';
          error.retryable = false;
          throw error;
        }
        
        let errorData: { error?: string; details?: string; code?: string; retryable?: boolean } = { error: 'Unknown error' };
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `Server error: ${response.status} ${response.statusText}` };
        }
        
        // Preserve error structure from API
        const error: any = new Error(errorData.error || errorData.details || 'Failed to analyze application');
        error.userMessage = errorData.error || 'Failed to analyze application. Please try again.';
        error.code = errorData.code || 'ANALYSIS_ERROR';
        error.retryable = errorData.retryable !== false; // Default to retryable unless explicitly false
        throw error;
      }
      
      return response.json();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // If error already has userMessage, preserve it
      if ('userMessage' in err) {
        throw err;
      }
      
      // Re-throw with more context for network errors
      if (err.message.includes('fetch')) {
        const networkError: any = new Error('Network error: Unable to reach the analysis service. Please check your connection and try again.');
        networkError.userMessage = 'Unable to connect to the analysis service. Please check your connection and try again.';
        networkError.code = 'NETWORK_ERROR';
        networkError.retryable = true;
        throw networkError;
      }
      
      throw err;
    }
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