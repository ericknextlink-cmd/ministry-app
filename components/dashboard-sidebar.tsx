"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  CreditCard, 
  Building2, 
  Users, 
  FileText, 
  RotateCcw, 
  Info,
  LogOut
} from "lucide-react";
import { useApplication } from "@/contexts/ApplicationContext";

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose?: () => void;
  onToggleCollapse: () => void;
}

export function DashboardSidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useApplication();

  const handleLogout = () => {
      logout();
      router.push("/auth");
  };

  const navItems = [
    { name: "Dashboard", Icon: LayoutDashboard, href: "/dashboard" },
    { name: "Payments", Icon: CreditCard, href: "/dashboard/bulk-payment" },
    { name: "Company Information", Icon: Building2, href: "/dashboard/company" },
    { name: "Directors Details", Icon: Users, href: "/dashboard/directors" },
    { name: "Upload Documents", Icon: FileText, href: "/dashboard/documents" },
    { name: "Renewals", Icon: RotateCcw, href: "/dashboard/renewals" },
    { name: "References", Icon: Info, href: "/dashboard/references" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r bg-white transition-all duration-300 dark:bg-gray-950",
          isCollapsed ? "w-20" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-center px-4">
            <Link href="/dashboard" className="block">
              <div className={cn("relative transition-all", isCollapsed ? "h-16 w-16" : "h-24 w-24")}>
                <Image
                  src="/ministry-1.png"
                  alt="Ministry Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Toggle Button - Desktop Only */}
          <button
            onClick={onToggleCollapse}
            className="absolute -right-3 top-24 hidden rounded-full border bg-white p-1 shadow-md hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 lg:block"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-2 overflow-y-auto p-4" data-tutorial="tutorial-sidebar">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                    isCollapsed && "justify-center"
                  )}
                >
                  <item.Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400")} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 mt-auto border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleLogout}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                isCollapsed && "justify-center"
              )}
            >
              <LogOut className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>

          {/* User Profile */}
          <div className="border-t bg-gray-50 p-4 dark:bg-gray-900">
            <Link href="/dashboard/profile" className={cn("flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors", isCollapsed && "justify-center")} data-tutorial="tutorial-profile">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || "U")}
              </div>
              {!isCollapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user?.full_name || "User"}
                  </p>
                  <div className="scale-[0.8] lg:scale-[0.9] md:scale-[0.8] -ml-1 relative">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email || "No email"}
                    </p>
                  </div>
                </div>
              )}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

