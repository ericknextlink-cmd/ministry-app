"use client";

import { Bell, Menu, Moon, Sun, LogOut, Check, X } from "lucide-react"; // Import LogOut icon
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Import Button
import { useApplication } from "@/contexts/ApplicationContext"; // Import useApplication
import { useRouter } from "next/navigation"; // Import useRouter
import { notificationsApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { userToken, logout } = useApplication(); // Use the logout function
  const router = useRouter(); // Initialize useRouter
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
      if (!userToken) return;
      try {
          const data = await notificationsApi.list(userToken, false);
          setNotifications(data);
      } catch (err) {
          console.error("Failed to fetch notifications", err);
      }
  };

  useEffect(() => {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // Poll every 60s
      return () => clearInterval(interval);
  }, [userToken]);

  const markAsRead = async (id: number) => {
      if (!userToken) return;
      try {
          await notificationsApi.markRead(id, userToken);
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      } catch (err) {
          console.error(err);
      }
  };

  const handleNotificationClick = async (notification: Notification) => {
      if (!notification.is_read) {
          await markAsRead(notification.id);
      }
      if (notification.link) {
          router.push(notification.link);
          setIsOpen(false);
      }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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

  const handleLogout = () => {
    logout(); // Call the logout function from context
    router.push("/auth"); // Redirect to the authentication page after logout
  };

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
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <button className="relative text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 outline-none">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                      <Badge className="absolute -right-2 -top-2 h-5 w-5 p-0 text-[10px] flex items-center justify-center bg-red-500 text-white border-white dark:border-gray-950 border-2 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                  )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[80vh] overflow-y-auto">
                <DropdownMenuLabel className="flex justify-between items-center">
                    Notifications
                    {unreadCount > 0 && <span className="text-xs text-muted-foreground font-normal">{unreadCount} unread</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div 
                            key={notification.id} 
                            className={`p-3 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b last:border-0 relative transition-colors ${!notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`font-medium ${!notification.is_read ? 'text-blue-700 dark:text-blue-300' : ''}`}>{notification.title}</span>
                                {!notification.is_read && (
                                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                                )}
                            </div>
                            <div className="text-muted-foreground text-xs mb-2 line-clamp-2">
                                {notification.message}
                            </div>
                            <div className="text-[10px] text-muted-foreground text-right">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </div>
                        </div>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>

        {/* Logout Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleLogout}
          className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

