"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Box,
  Puzzle,
  Activity,
  Settings,
  Package,
  Network,
  HardDrive,
  BookOpen,
  Database,
  Bell,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Containers", href: "/dashboard/containers", icon: Box },
  { name: "Extensions", href: "/dashboard/extensions", icon: Puzzle },
  { name: "Images", href: "/dashboard/images", icon: Package },
  { name: "Networks", href: "/dashboard/networks", icon: Network },
  { name: "Volumes", href: "/dashboard/volumes", icon: HardDrive },
  { name: "Health", href: "/dashboard/health", icon: Activity },
  { name: "Backups", href: "/dashboard/backups", icon: Database },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Orbitr</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          <div>Orbitr v0.1.0</div>
          <div className="mt-1">MIT License</div>
        </div>
      </div>
    </div>
  );
}
