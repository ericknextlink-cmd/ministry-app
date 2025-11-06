"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navItems = [
  { name: "Dashboard", href: "/admin" },
  { name: "Applications", href: "/admin/applications" },
  { name: "Payments", href: "/admin/payments" },
  { name: "Certification Reports", href: "/admin/reports" },
  { name: "Renewals", href: "/admin/renewals" },
  { name: "Settings", href: "/admin/settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-white p-6 dark:bg-gray-800">
      <div className="text-xl font-bold text-gray-800 dark:text-white mb-8 border-b pb-4">
        <Link href="/admin" className="flex items-center justify-center">
          <div className="relative h-20 w-20">
            <Image
              src="/ministry-1.png"
              alt="Ministry Logo"
              fill
              className="object-contain"
            />
          </div>
        </Link>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center p-3 rounded-xl text-sm transition duration-150",
              pathname === item.href
                ? "bg-blue-600 text-white font-semibold"
                : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
