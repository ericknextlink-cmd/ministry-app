import { useState, useEffect, useRef } from "react";
import { Bell, Plus, Download, Check, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { notificationsApi } from "@/lib/api";
import { useApplication } from "@/contexts/ApplicationContext";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Notification {
    id: number;
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

interface AdminHeaderProps {
    onMenuClick?: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { userToken } = useApplication();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
      if (!userToken) return;
      try {
          const data = await notificationsApi.list(userToken, false); // Get unread only for badge? Or all? Let's get all but badge unread
          setNotifications(data);
      } catch (error: any) {
          console.error("Failed to fetch notifications", error);
          if (error.message && error.message.toLowerCase().includes("could not validate credentials")) {
              router.push("/auth");
          }
      }
  };

  useEffect(() => {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
  }, [userToken]);

  // Close dropdown when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setShowNotifications(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id: number) => {
      if (!userToken) return;
      try {
          await notificationsApi.markRead(id, userToken);
          // Optimistic update
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      } catch (error) {
          console.error("Failed to mark read", error);
      }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-white shadow-sm border-b border-gray-100 dark:bg-gray-800 dark:border-gray-700 relative z-20">
      <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">Certificate Management System</h1>
      </div>
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full transition duration-150 dark:text-gray-400 dark:hover:text-white relative"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <Badge className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-[10px]">
                        {unreadCount}
                    </Badge>
                )}
            </button>

            {/* Dropdown */}
            {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[400px] flex flex-col">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 font-semibold text-sm flex justify-between items-center">
                        <span>Notifications</span>
                        <span className="text-xs text-gray-500">{unreadCount} unread</span>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                        ) : (
                            notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    className={cn(
                                        "p-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors relative group",
                                        !notif.is_read && "bg-blue-50/50 dark:bg-blue-900/10"
                                    )}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1">
                                            <p className={cn("text-sm font-medium", !notif.is_read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400")}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                                            {notif.link && (
                                                <Link 
                                                    href={notif.link} 
                                                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                                    onClick={() => setShowNotifications(false)}
                                                >
                                                    View Details
                                                </Link>
                                            )}
                                        </div>
                                        {!notif.is_read && (
                                            <button 
                                                onClick={() => handleMarkRead(notif.id)}
                                                className="text-gray-400 hover:text-blue-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Mark as read"
                                            >
                                                <Check className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
        {/* Removed Plus and Download Buttons */}
      </div>
    </header>
  );
}

