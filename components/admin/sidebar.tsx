"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { 
  LogOut, 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  BarChart, 
  RefreshCw, 
  Settings, 
  Users, 
  FileClock,
  FileSignature,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useApplication } from "@/contexts/ApplicationContext";

interface AdminSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose?: () => void;
  onToggleCollapse: () => void;
}

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Applications", href: "/admin/applications", icon: FileText },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Certification Reports", href: "/admin/reports", icon: BarChart },
  { name: "Renewals", href: "/admin/renewals", icon: RefreshCw },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useApplication();

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  const finalNavItems = [...navItems];
  if (user?.role === "super_admin") {
      finalNavItems.push({ name: "User Management", href: "/admin/superadmin", icon: Users });
      finalNavItems.push({ name: "Certificate Templates", href: "/admin/superadmin/templates", icon: FileSignature });
      finalNavItems.push({ name: "Audit Logs", href: "/admin/superadmin/audit", icon: FileClock });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside 
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r bg-white transition-all duration-300 dark:bg-gray-800 flex flex-col",
          isCollapsed ? "w-20" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header / Logo */}
        <div className={cn("flex items-center justify-center transition-all duration-300", isCollapsed ? "h-20 p-2" : "h-24 p-6")}>
            <Link href="/admin" className="block relative">
                <div className={cn("relative transition-all duration-300", isCollapsed ? "h-12 w-12" : "h-20 w-20")}>
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
            className="absolute -right-3 top-24 hidden rounded-full border bg-white p-1 shadow-md hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 lg:block z-50"
        >
            {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
            ) : (
                <ChevronLeft className="h-4 w-4" />
            )}
        </button>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 custom-scrollbar mt-4">
            <nav className="space-y-2 pb-4">
                {finalNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                            "flex items-center rounded-xl text-sm transition duration-150 group relative",
                            isCollapsed ? "justify-center p-3" : "p-3",
                            pathname === item.href
                                ? "bg-blue-600 text-white font-semibold shadow-sm"
                                : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                            )}
                            title={isCollapsed ? item.name : undefined}
                        >
                            <Icon className={cn("h-5 w-5 flex-shrink-0", !isCollapsed && "mr-3")} />
                            {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>
        </div>

        {/* Logout Button at Bottom */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 mt-auto bg-white dark:bg-gray-800 z-10">
            <button
                onClick={handleLogout}
                className={cn(
                    "flex w-full items-center rounded-xl text-sm text-red-600 hover:bg-red-50 transition duration-150 dark:text-red-400 dark:hover:bg-red-900/20",
                    isCollapsed ? "justify-center p-3" : "p-3"
                )}
                title={isCollapsed ? "Logout" : undefined}
            >
                <LogOut className={cn("h-5 w-5 flex-shrink-0", !isCollapsed && "mr-3")} />
                {!isCollapsed && <span>Logout</span>}
            </button>
        </div>
      </aside>
    </>
  );
}