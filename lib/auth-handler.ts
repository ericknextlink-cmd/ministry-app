// Global authentication handler to prevent infinite refresh loops
// This module provides a centralized way to handle token expiration

let isLoggingOut = false;
let logoutCallbacks: Array<() => void> = [];

export function registerLogoutCallback(callback: () => void) {
  logoutCallbacks.push(callback);
  // Return unregister function
  return () => {
    logoutCallbacks = logoutCallbacks.filter(cb => cb !== callback);
  };
}

export function handleTokenExpiration() {
  // Prevent multiple simultaneous logout attempts
  if (isLoggingOut) {
    return;
  }
  
  isLoggingOut = true;
  
  // Clear token from localStorage
  localStorage.removeItem("access_token");
  
  // Call all registered logout callbacks
  logoutCallbacks.forEach(callback => {
    try {
      callback();
    } catch (error) {
      console.error('Error in logout callback:', error);
    }
  });
  
  // Reset flag after a short delay to allow redirect
  setTimeout(() => {
    isLoggingOut = false;
  }, 1000);
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/auth?expired=true';
  }
}

export function isUnauthorizedError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message || '';
  const lowerMessage = errorMessage.toLowerCase();
  
  return (
    errorMessage.includes('401') ||
    errorMessage.includes('403') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('could not validate credentials') ||
    lowerMessage.includes('token expired') ||
    lowerMessage.includes('invalid token') ||
    lowerMessage.includes('authentication required')
  );
}
