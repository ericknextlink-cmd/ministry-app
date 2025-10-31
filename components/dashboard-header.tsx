"use client";

import { Bell, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 dark:bg-gray-950 md:px-6">
        <button className="lg:hidden">
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold md:text-xl">
          Classification Certificate Application Portal
        </h1>
      </header>
    );
  }

  const isDark = theme === "dark";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 dark:bg-gray-950 md:px-6">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Title */}
      <h1 className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-100 md:text-xl">
        Classification Certificate Application Portal
      </h1>

      {/* Right Side Controls */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <Switch
            checked={isDark}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
          <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </div>

        {/* Notification Bell */}
        <button className="relative text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -right-1 -top-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center bg-red-500 text-white border-0">
            3
          </Badge>
        </button>
      </div>
    </header>
  );
}

