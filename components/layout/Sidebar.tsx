"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Upload,
  History,
  LogOut,
  BookOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/cocuklar", label: "Çocuklarım", icon: Users },
  { href: "/odev-yukle", label: "Ödev Yükle", icon: Upload },
  { href: "/gecmis", label: "Geçmiş", icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/giris");
    router.refresh();
  };

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col py-6 px-3 shrink-0">
      <div className="flex items-center gap-2 px-3 mb-8">
        <BookOpen className="w-7 h-7 text-indigo-600" />
        <span className="text-lg font-bold text-indigo-700">Ödev Kontrolü</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Çıkış Yap
      </button>
    </aside>
  );
}
