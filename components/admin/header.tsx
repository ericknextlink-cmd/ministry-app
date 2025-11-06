"use client";

import { Bell, Plus, Download } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function AdminHeader() {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white shadow-sm border-b border-gray-100 dark:bg-gray-800 dark:border-gray-700">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Certificate Management System</h1>
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <button className="text-gray-500 hover:text-gray-700 p-2 rounded-full transition duration-150 dark:text-gray-400 dark:hover:text-white">
          <Bell className="w-6 h-6" />
        </button>
        <button className="text-gray-500 hover:text-gray-700 p-2 rounded-full transition duration-150 dark:text-gray-400 dark:hover:text-white">
          <Plus className="w-6 h-6" />
        </button>
        <button className="flex items-center bg-gray-800 text-white text-sm font-medium py-2 px-4 rounded-full hover:bg-gray-700 transition duration-150 dark:bg-blue-600 dark:hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Download
        </button>
      </div>
    </header>
  );
}
