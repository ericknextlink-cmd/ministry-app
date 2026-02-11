"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, authApi, companyInfoApi, directorsApi, documentsApi } from "@/lib/api";
import { Application, User, CompanyInfo, CompanyInfoUpdate, Director, DirectorCreate, Document } from "@/lib/types";
import { Loader } from "@/components/ui/loader";
import { registerLogoutCallback } from "@/lib/auth-handler";

type ApplicationStep = 
  | "apply" 
  | "select-class" 
  | "payment" 
  | "company-info" 
  | "directors-info" 
  | "upload-docs" 
  | "review";

interface ApplicationContextType {
  isAuthenticated: boolean;
  userToken: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  register: (data: { email: string; password: string; companyName?: string; phone?: string; companyRegistrationNumber?: string; companyType?: string }) => Promise<void>;
  logout: () => void;
  applications: Application[];
  fetchApplications: (tokenOverride?: string) => Promise<void>;
  refreshApplications: () => Promise<void>;
  refreshUser: () => Promise<void>;
  createApplication: (data: { certificate_type: Application["certificate_type"]; description?: string }) => Promise<Application>;
  renewApplication: (id: number) => Promise<Application>;
  cancelApplication: (id: number) => Promise<Application>;
  updateApplication: (id: number, data: Partial<Application>) => Promise<Application>;
  saveCompanyInfo: (applicationId: number, data: CompanyInfoUpdate) => Promise<void>;
  getLatestCompanyInfo: () => Promise<CompanyInfo | null>;
  addDirector: (applicationId: number, data: Omit<DirectorCreate, 'application_id'>) => Promise<void>;
  getDirectors: (applicationId: number) => Promise<Director[]>;
  getLatestDirectors: () => Promise<Director[]>;
  removeDirector: (directorId: number) => Promise<void>;
  uploadDocument: (applicationId: number, documentType: string, file: File) => Promise<void>;
  getDocuments: (applicationId: number) => Promise<Document[]>;
  removeDocument: (documentId: number) => Promise<void>;
  loading: boolean;
  error: string | null;
  getProgressForApp: (applicationId: number) => ApplicationProgress | null;
  getCompletionPercentage: (applicationId: number) => number;
}

interface ApplicationProgress {
  applicationId: number;
  steps: {
    apply: boolean;
    "select-class": boolean;
    payment: boolean;
    "company-info": boolean;
    "directors-info": boolean;
    "upload-docs": boolean;
    review: boolean;
  };
  lastCompletedStep: ApplicationStep | null;
}


const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export function ApplicationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null); // Added user state
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    setUserToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setApplications([]); 
    setError(null);
    // Redirect to login page
    router.push('/auth?expired=true');
  }, [router]);

  const fetchApplications = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride ?? userToken;
    if (!token) return;

    setError(null);
    setLoading(true);
    try {
      const fetchedApps = await api.get<Application[]>("/applications/", token);
      setApplications(fetchedApps);
    } catch (err) {
      const error = err as Error;
      if (!error.message?.includes("Session expired") && !error.message?.includes("401") && !error.message?.includes("403")) {
        console.error("Error fetching applications:", error);
        setError(error.message || "Failed to fetch applications");
      }
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  const refreshUser = useCallback(async () => {
    if (!userToken) return;
    try {
      const userData = await authApi.getMe(userToken);
      setUser(userData);
    } catch (err) {
      console.warn("refreshUser failed:", err);
    }
  }, [userToken]);

  // Register logout callback for global auth handler
  useEffect(() => {
    const unregister = registerLogoutCallback(() => {
      setUserToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setApplications([]);
      setError(null);
    });
    
    return unregister;
  }, []);

  // Load token from localStorage on initial load and fetch applications so dashboard has data right away
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          // Verify token validity by fetching user
          const userData = await authApi.getMe(token);
          setUserToken(token);
          setUser(userData);
          setIsAuthenticated(true);
          // Fetch applications immediately so dashboard shows them without waiting for mount
          await fetchApplications(token);
        } catch (error) {
          // Token is invalid - clear it but don't redirect here (let global handler do it)
          localStorage.removeItem("access_token");
          setUserToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setInitialLoading(false);
    };

    initializeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; fetchApplications(token) uses passed token
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(email, password);
      localStorage.setItem("access_token", response.access_token);
      setUserToken(response.access_token);
      setIsAuthenticated(true);
      
      // Fetch user details immediately after login
      const userData = await authApi.getMe(response.access_token);
      setUser(userData);

      await fetchApplications(); 
      return userData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      // Business logic errors (validation, unverified email, etc.) are expected
      // Only log unexpected errors or use warn for expected ones
      const isExpectedError = error.message.toLowerCase().includes('not verified') || 
                               error.message.toLowerCase().includes('invalid') ||
                               error.message.toLowerCase().includes('credentials') ||
                               error.message.toLowerCase().includes('password');
      
      if (isExpectedError) {
        console.warn("login: Expected authentication failure", {
          error: error.message,
          email
        });
      } else {
        console.error("login: Unexpected login error", {
          message: error.message,
          email,
          error: error,
          stack: error.stack
        });
      }
      
      setError(error.message || "Failed to log in.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchApplications]);

  const register = useCallback(async (data: { email: string; password: string; companyName?: string; phone?: string; companyRegistrationNumber?: string; companyType?: string }): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
        // Register the user (backend will send verification email)
        await authApi.register(data);
        
        // No auto-login since email verification is required
        // User will need to verify email and then log in manually
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        // Business logic errors (validation, email exists, etc.) are expected
        // Only log unexpected errors or use warn for expected ones
        const isExpectedError = error.message.toLowerCase().includes('already exists') || 
                                 error.message.toLowerCase().includes('not verified') ||
                                 error.message.toLowerCase().includes('invalid') ||
                                 error.message.toLowerCase().includes('validation');
        
        if (isExpectedError) {
          console.warn("register: Expected registration failure", {
            error: error.message,
            email: data.email
          });
        } else {
          console.error("register: Unexpected registration error", {
            error: error.message,
            email: data.email,
            stack: error.stack
          });
        }
        
        setError(error.message || "Failed to register.");
        throw error;
    } finally {
        setLoading(false);
    }
  }, []);

  const createApplication = useCallback(async (data: { certificate_type: Application["certificate_type"]; description?: string }) => {
    if (!userToken) {
      const error = new Error("Not authenticated.");
      console.error("createApplication: Authentication error", error);
      throw error;
    }

    setLoading(true);
    try {
      const newApp = await api.post<Application>("/applications/", data, userToken);
      setApplications((prev) => [...prev, newApp]);
      return newApp;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("createApplication: Failed to create application", {
        error: error.message,
        data,
        stack: error.stack
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  const renewApplication = useCallback(async (id: number) => {
    if (!userToken) {
      const error = new Error("Not authenticated.");
      console.error("renewApplication: Authentication error", error);
      throw error;
    }

    setLoading(true);
    try {
      const newApp = await api.post<Application>(`/applications/${id}/renew`, {}, userToken);
      setApplications((prev) => [...prev, newApp]);
      return newApp;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("renewApplication: Failed to renew application", {
        error: error.message,
        applicationId: id,
        stack: error.stack
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  const cancelApplication = useCallback(async (id: number) => {
    if (!userToken) {
      const error = new Error("Not authenticated.");
      console.error("cancelApplication: Authentication error", error);
      throw error;
    }

    setLoading(true);
    try {
      const cancelledApp = await api.post<Application>(`/applications/${id}/cancel`, {}, userToken);
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? cancelledApp : app))
      );
      return cancelledApp;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("cancelApplication: Failed to cancel application", {
        error: error.message,
        applicationId: id,
        stack: error.stack
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  const updateApplication = useCallback(async (id: number, data: Partial<Application>) => {
    if (!userToken) {
      const error = new Error("Not authenticated.");
      console.error("updateApplication: Authentication error", error);
      throw error;
    }

    setLoading(true);
    try {
      const updatedApp = await api.patch<Application>(`/applications/${id}`, data, userToken);
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? updatedApp : app))
      );
      return updatedApp;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("updateApplication: Failed to update application", {
        error: error.message,
        applicationId: id,
        data,
        stack: error.stack
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  const saveCompanyInfo = useCallback(async (applicationId: number, data: CompanyInfoUpdate) => {
    if (!userToken) {
      const error = new Error("Not authenticated.");
      console.error("saveCompanyInfo: Authentication error", error);
      throw error;
    }
    
    setLoading(true);
    try {
        try {
            await companyInfoApi.get<CompanyInfo>(applicationId, userToken);
            await companyInfoApi.update<CompanyInfo>(applicationId, data, userToken);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            if (error.message?.includes("404") || error.message?.includes("not found")) {
                 await companyInfoApi.create<CompanyInfo>({ ...data, application_id: applicationId } as CompanyInfoUpdate & { application_id: number }, userToken);
            } else {
                console.error("saveCompanyInfo: Failed to get/update company info", {
                  error: error.message,
                  applicationId,
                  stack: error.stack
                });
                throw err; 
            }
        }
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("saveCompanyInfo: Failed to save company info", {
          error: error.message,
          applicationId,
          data,
          stack: error.stack
        });
        throw error;
    } finally {
        setLoading(false);
    }
  }, [userToken]);

  const getLatestCompanyInfo = useCallback(async (): Promise<CompanyInfo | null> => {
      if (!userToken) return null;
      try {
          return await companyInfoApi.getLatest<CompanyInfo>(userToken);
      } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          console.warn("getLatestCompanyInfo: No latest info found or error fetching it", {
            error: error.message,
            stack: error.stack
          });
          return null;
      }
  }, [userToken]);

  const getLatestDirectors = useCallback(async (): Promise<Director[]> => {
      if (!userToken) return [];
      try {
          return await directorsApi.getLatest<Director[]>(userToken);
      } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          console.warn("getLatestDirectors: No latest directors found", {
            error: error.message,
            stack: error.stack
          });
          return [];
      }
  }, [userToken]);

  const addDirector = useCallback(async (applicationId: number, data: Omit<DirectorCreate, 'application_id'>) => {
      if (!userToken) {
        const error = new Error("Not authenticated.");
        console.error("addDirector: Authentication error", error);
        throw error;
      }
      setLoading(true);
      try {
          await directorsApi.create<Director>({ ...data, application_id: applicationId }, userToken);
      } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error("addDirector: Failed to add director", {
            error: error.message,
            applicationId,
            data,
            stack: error.stack
          });
          throw error;
      } finally {
          setLoading(false);
      }
  }, [userToken]);

  const getDirectors = useCallback(async (applicationId: number): Promise<Director[]> => {
      if (!userToken) return [];
      try {
          return await directorsApi.list<Director[]>(applicationId, userToken);
      } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error("getDirectors: Failed to fetch directors", {
            error: error.message,
            applicationId,
            stack: error.stack
          });
          return [];
      }
  }, [userToken]);

  const removeDirector = useCallback(async (directorId: number) => {
      if (!userToken) {
        const error = new Error("Not authenticated.");
        console.error("removeDirector: Authentication error", error);
        throw error;
      }
      try {
          await directorsApi.delete<void>(directorId, userToken);
      } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error("removeDirector: Failed to remove director", {
            error: error.message,
            directorId,
            stack: error.stack
          });
          throw error;
      }
  }, [userToken]);

  const uploadDocument = useCallback(async (applicationId: number, documentType: string, file: File) => {
      if (!userToken) {
        const error = new Error("Not authenticated.");
        console.error("uploadDocument: Authentication error", error);
        throw error;
      }
      setLoading(true);
      try {
          await documentsApi.upload<Document>(applicationId, documentType, file, userToken);
      } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error("uploadDocument: Failed to upload document", {
            error: error.message,
            applicationId,
            documentType,
            fileName: file.name,
            fileSize: file.size,
            stack: error.stack
          });
          throw error;
      } finally {
          setLoading(false);
      }
  }, [userToken]);

  const getDocuments = useCallback(async (applicationId: number): Promise<Document[]> => {
      if (!userToken) return [];
      try {
          return await documentsApi.list<Document[]>(applicationId, userToken);
      } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error("getDocuments: Failed to fetch documents", {
            error: error.message,
            applicationId,
            stack: error.stack
          });
          return [];
      }
  }, [userToken]);

  const removeDocument = useCallback(async (documentId: number) => {
      if (!userToken) {
        const error = new Error("Not authenticated.");
        console.error("removeDocument: Authentication error", error);
        throw error;
      }
      try {
          await documentsApi.delete<void>(documentId, userToken);
      } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error("removeDocument: Failed to remove document", {
            error: error.message,
            documentId,
            stack: error.stack
          });
          throw error;
      }
  }, [userToken]);


  // Placeholder for progress tracking - will need to be adapted to backend
  const getProgressForApp = useCallback((applicationId: number): ApplicationProgress | null => {
    // This logic currently depends on `progress` state which is no longer in this context
    // You would typically derive this from `applications` fetched from backend
    // For now, returning a dummy or incomplete progress
    const app = applications.find(a => a.id === applicationId);
    if (!app) return null;

    const steps = {
      apply: true, // Assuming creation means 'apply' is done
      "select-class": app.current_step >= 2,
      payment: app.current_step >= 3,
      "company-info": app.current_step >= 4,
      "directors-info": app.current_step >= 5,
      "upload-docs": app.current_step >= 6,
      review: app.current_step >= 7,
    };
    
    const stepOrder: ApplicationStep[] = [
      "apply", "select-class", "payment", "company-info", 
      "directors-info", "upload-docs", "review"
    ];
    let lastCompletedStep: ApplicationStep | null = null;
    for (let i = stepOrder.length - 1; i >= 0; i--) {
        if (steps[stepOrder[i]]) {
            lastCompletedStep = stepOrder[i];
            break;
        }
    }


    return {
      applicationId,
      steps,
      lastCompletedStep
    };
  }, [applications]);

  const getCompletionPercentage = useCallback((applicationId: number): number => {
    const appProgress = getProgressForApp(applicationId);
    if (!appProgress) return 0;

    const totalSteps = Object.keys(appProgress.steps).length;
    const completedSteps = Object.values(appProgress.steps).filter(Boolean).length;
    
    return Math.round((completedSteps / totalSteps) * 100);
  }, [getProgressForApp]);


  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated, fetchApplications]);

  if (initialLoading) {
    return <Loader text="Initializing Secure Session..." />;
  }

  return (
    <ApplicationContext.Provider
      value={{
        isAuthenticated,
        userToken,
        user,
        login,
        register,
        logout,
        applications,
        fetchApplications,
        refreshApplications: fetchApplications,
        refreshUser,
        createApplication,
        renewApplication,
        cancelApplication,
        updateApplication,
        saveCompanyInfo,
        getLatestCompanyInfo,
        addDirector, 
        getDirectors, 
        getLatestDirectors,
        removeDirector,
        uploadDocument,
        getDocuments,
        removeDocument,
        loading,
        error,
        getProgressForApp,
        getCompletionPercentage,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplication() {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error("useApplication must be used within an ApplicationProvider");
  }
  return context;
}