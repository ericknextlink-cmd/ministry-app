"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api, authApi, companyInfoApi, directorsApi, documentsApi } from "@/lib/api";
import { Application, User } from "@/lib/types";
import { Loader } from "@/components/ui/loader";

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
  user: User | null; // Added user
  login: (email: string, password: string) => Promise<User | null>; // Return User
  register: (data: { email: string; password: string; companyName?: string; phone?: string }) => Promise<void>;
  logout: () => void;
  applications: Application[];
  fetchApplications: () => Promise<void>;
  refreshApplications: () => Promise<void>; // Alias for fetchApplications
  createApplication: (data: { certificate_type: Application["certificate_type"]; description?: string }) => Promise<Application>;
  renewApplication: (id: number) => Promise<Application>;
  cancelApplication: (id: number) => Promise<Application>;
  updateApplication: (id: number, data: Partial<Application>) => Promise<Application>;
  saveCompanyInfo: (applicationId: number, data: any) => Promise<void>;
  getLatestCompanyInfo: () => Promise<any>; // New function
  addDirector: (applicationId: number, data: any) => Promise<void>;
  getDirectors: (applicationId: number) => Promise<any[]>;
  removeDirector: (directorId: number) => Promise<void>;
  uploadDocument: (applicationId: number, documentType: string, file: File) => Promise<void>;
  getDocuments: (applicationId: number) => Promise<any[]>;
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
  }, []);

  const fetchApplications = useCallback(async () => {
    if (!userToken) return; 

    // Don't set global loading here to avoid blocking UI on background refresh
    // setLoading(true); 
    setError(null);
    try {
      const fetchedApps = await api.get<Application[]>("/applications/", userToken);
      setApplications(fetchedApps);
    } catch (err: any) {
      console.error("Error fetching applications:", err);
      if (err.message.includes("403") || err.message.includes("401") || err.message.toLowerCase().includes("could not validate credentials")) {
        logout();
        setError("Session expired. Please login again.");
      }
    } finally {
      // setLoading(false);
    }
  }, [userToken, logout]);

  // Load token from localStorage on initial load
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
        } catch (error) {
          console.error("Failed to restore session:", error);
          logout(); // Invalid token
        }
      }
      setInitialLoading(false);
    };

    initializeAuth();
  }, [logout]);

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
      return userData; // Return the user data
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
      // throw err; // Don't throw, let component handle null return or check error
      // Actually throwing is better for the component to know it failed
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userToken, fetchApplications]);

  const register = useCallback(async (data: { email: string; password: string; companyName?: string; phone?: string }) => {
    setLoading(true);
    setError(null);
    try {
        await authApi.register(data);
        await login(data.email, data.password);
    } catch (err: any) {
        setError(err.message || "Failed to register.");
        throw err;
    } finally {
        setLoading(false);
    }
  }, [login]);

  const createApplication = useCallback(async (data: { certificate_type: Application["certificate_type"]; description?: string }) => {
    if (!userToken) throw new Error("Not authenticated.");

    setLoading(true);
    // setError(null); // Don't reset global error
    try {
      const newApp = await api.post<Application>("/applications/", data, userToken);
      setApplications((prev) => [...prev, newApp]);
      return newApp;
    } catch (err: any) {
      // setError(err.message || "Failed to create application."); // Don't set global error
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  const renewApplication = useCallback(async (id: number) => {
    if (!userToken) throw new Error("Not authenticated.");

    setLoading(true);
    try {
      const newApp = await api.post<Application>(`/applications/${id}/renew`, {}, userToken);
      setApplications((prev) => [...prev, newApp]);
      return newApp;
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  const cancelApplication = useCallback(async (id: number) => {
    if (!userToken) throw new Error("Not authenticated.");

    setLoading(true);
    try {
      const cancelledApp = await api.post<Application>(`/applications/${id}/cancel`, {}, userToken);
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? cancelledApp : app))
      );
      return cancelledApp;
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  const updateApplication = useCallback(async (id: number, data: Partial<Application>) => {
    console.log("Context updateApplication called:", id, data);
    if (!userToken) throw new Error("Not authenticated.");

    setLoading(true);
    try {
      const updatedApp = await api.patch<Application>(`/applications/${id}`, data, userToken);
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? updatedApp : app))
      );
      return updatedApp;
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  const saveCompanyInfo = useCallback(async (applicationId: number, data: any) => {
    if (!userToken) throw new Error("Not authenticated.");
    setLoading(true);
    try {
        try {
            await companyInfoApi.get(applicationId, userToken);
            await companyInfoApi.update(applicationId, data, userToken);
        } catch (err: any) {
            if (err.message.includes("404") || err.message.includes("not found")) {
                 await companyInfoApi.create({ ...data, application_id: applicationId }, userToken);
            } else {
                throw err; 
            }
        }
    } catch (err: any) {
        throw err;
    } finally {
        setLoading(false);
    }
  }, [userToken]);

  const getLatestCompanyInfo = useCallback(async () => {
      if (!userToken) return null;
      try {
          return await companyInfoApi.getLatest(userToken);
      } catch (err) {
          console.log("No latest info found or error fetching it.");
          return null;
      }
  }, [userToken]);

  const addDirector = useCallback(async (applicationId: number, data: any) => {
      if (!userToken) throw new Error("Not authenticated.");
      setLoading(true);
      try {
          await directorsApi.create({ ...data, application_id: applicationId }, userToken);
      } catch (err: any) {
          throw err;
      } finally {
          setLoading(false);
      }
  }, [userToken]);

  const getDirectors = useCallback(async (applicationId: number): Promise<any[]> => {
      if (!userToken) return [];
      try {
          return await directorsApi.list<any[]>(applicationId, userToken);
      } catch (err: any) {
          console.error(err);
          return [];
      }
  }, [userToken]);

  const removeDirector = useCallback(async (directorId: number) => {
      if (!userToken) throw new Error("Not authenticated.");
      try {
          await directorsApi.delete(directorId, userToken);
      } catch (err: any) {
          throw err;
      }
  }, [userToken]);

  const uploadDocument = useCallback(async (applicationId: number, documentType: string, file: File) => {
      if (!userToken) throw new Error("Not authenticated.");
      setLoading(true);
      try {
          await documentsApi.upload(applicationId, documentType, file, userToken);
      } catch (err: any) {
          throw err;
      } finally {
          setLoading(false);
      }
  }, [userToken]);

  const getDocuments = useCallback(async (applicationId: number): Promise<any[]> => {
      if (!userToken) return [];
      try {
          return await documentsApi.list<any[]>(applicationId, userToken);
      } catch (err: any) {
          console.error(err);
          return [];
      }
  }, [userToken]);

  const removeDocument = useCallback(async (documentId: number) => {
      if (!userToken) throw new Error("Not authenticated.");
      try {
          await documentsApi.delete(documentId, userToken);
      } catch (err: any) {
          throw err;
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
        createApplication,
        renewApplication,
        cancelApplication,
        updateApplication,
        saveCompanyInfo,
        getLatestCompanyInfo,
        addDirector, 
        getDirectors, 
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