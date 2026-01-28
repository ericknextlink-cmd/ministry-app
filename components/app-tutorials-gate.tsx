"use client";

import { useApplication } from "@/contexts/ApplicationContext";
import { AppTutorials } from "@/components/app-tutorials";

/**
 * Renders AppTutorials only when the user has not completed or skipped tutorials.
 * Control rendering here so tutorials are shown exactly when intended.
 */
export function AppTutorialsGate() {
  const { user, userToken, refreshUser } = useApplication();

  if (!userToken || !user) return null;
  if (user.tutorials_completed) return null;

  return (
    <AppTutorials
      userToken={userToken}
      onComplete={refreshUser}
    />
  );
}
