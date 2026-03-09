"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import {
  DashboardIcon,
  ApplicationsIcon,
  PipelineIcon,
  RankingsIcon,
  ProfileIcon,
  SignOutIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  MenuIcon,
  XMarkIcon,
} from "@/components/Icons";
import OfferlyLogo from "@/components/OfferlyLogo";
import { ReactNode, useState, useEffect, useCallback } from "react";

const navItems: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/applications", label: "Applications", icon: <ApplicationsIcon /> },
  { href: "/pipeline", label: "Pipeline", icon: <PipelineIcon /> },
  { href: "/rankings", label: "Rankings", icon: <RankingsIcon /> },
  { href: "/profile", label: "Profile", icon: <ProfileIcon /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const themeOptions = [
    { value: "light" as const, icon: <SunIcon className="w-4 h-4" />, label: "Light" },
    { value: "dark" as const, icon: <MoonIcon className="w-4 h-4" />, label: "Dark" },
    { value: "system" as const, icon: <MonitorIcon className="w-4 h-4" />, label: "System" },
  ];

  const sidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <OfferlyLogo size={28} />
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Offerly</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Career CRM</p>
          </div>
        </div>
        <button
          onClick={closeMobile}
          className="lg:hidden text-slate-400 hover:text-white p-1"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-sidebar-hover hover:text-white"
                }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-1 bg-sidebar-hover rounded-lg p-1">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-colors ${theme === opt.value
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
                }`}
              title={opt.label}
            >
              {opt.icon}
            </button>
          ))}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-sidebar-hover rounded-lg transition-colors"
        >
          <SignOutIcon />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-sidebar-bg border-b border-sidebar-border flex items-center px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white p-1.5 -ml-1"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <OfferlyLogo size={22} />
          <span className="text-sm font-bold text-white">Offerly</span>
        </div>
      </div>

      {/* Mobile backdrop - always in DOM, animated via opacity */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={closeMobile}
      />

      {/* Sidebar - desktop: fixed, mobile: slide-out drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-sidebar-bg flex flex-col border-r border-sidebar-border
          transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          lg:translate-x-0 lg:z-30 lg:shadow-none
          ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full shadow-none"}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
