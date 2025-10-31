"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose?: () => void;
  onToggleCollapse: () => void;
}

export function DashboardSidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {

  const navItems = [
    { name: "Dashboard", icon: "/dashboard.svg", iconActive: "/dashboard.svg", href: "/dashboard", active: true },
    { name: "Company Information", icon: "/company-gray.png", iconActive: "/company-blue.png", href: "/dashboard/company", active: false },
    { name: "Directors Details", icon: "/directors-gray.png", iconActive: "/directors-blue.png", href: "/dashboard/directors", active: false },
    { name: "Upload Documents", icon: "/upload-gray.png", iconActive: "/upload-blue.png", href: "/dashboard/documents", active: false },
    { name: "References", icon: "/asterics.png", iconActive: "/asterics-blue.png", href: "/dashboard/references", active: false },
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
          <nav className="flex-1 space-y-2 overflow-y-auto p-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  item.active
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                  isCollapsed && "justify-center"
                )}
              >
                <div className="relative h-5 w-5 shrink-0">
                  <Image
                    src={item.active ? item.iconActive : item.icon}
                    alt={item.name}
                    fill
                    className="object-contain"
                  />
                </div>
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 relative bottom-18">
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                isCollapsed && "justify-center"
              )}
            >
              <Image src="/logout.png" alt="Logout" width={20} height={20} className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>

          {/* User Profile */}
          <div className="border-t bg-gray-50 p-4 dark:bg-gray-900">
            <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-indigo-600">
                <Image
                  src="/user.png"
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              {!isCollapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    Sam Wheeler
                  </p>
                  <div className="scale-[0.8] lg:scale-[0.9] md:scale-[0.8] right-2 relative">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      info@nexlinktechnologies.com
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

