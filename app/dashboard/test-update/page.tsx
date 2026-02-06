"use client";

import { useEffect, useState } from "react";
import { useApplication } from "@/contexts/ApplicationContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TestUpdatePage() {
  const { applications, fetchApplications, updateApplication, userToken } = useApplication();
  
  useEffect(() => {
      fetchApplications();
  }, []);

  const handleForceUpdate = async (id: number, status: string) => {
      try {
          console.log(`Forcing status ${status} for app ${id}`);
          const res = await updateApplication(id, { status: status as any });
          console.log("Result:", res);
          toast.success(`Updated to ${status}`);
          fetchApplications();
      } catch (e: any) {
          console.error(e);
          toast.error(e.message);
      }
  };

  return (
      <div className="p-8 space-y-4">
          <h1 className="text-2xl font-bold">Debug Applications</h1>
          <Button onClick={() => fetchApplications()}>Refresh List</Button>
          
          <div className="grid gap-4">
              {applications.map(app => (
                  <div key={app.id} className="border p-4 rounded shadow bg-white">
                      <p>ID: {app.id}</p>
                      <p>Status: <strong>{app.status}</strong></p>
                      <p>Step: {app.current_step}</p>
                      <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={() => handleForceUpdate(app.id, "pending_payment")}>
                              Set Pending Payment
                          </Button>
                          <Button size="sm" onClick={() => handleForceUpdate(app.id, "submitted")}>
                              Set Submitted
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleForceUpdate(app.id, "draft")}>
                              Reset to Draft
                          </Button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );
}
