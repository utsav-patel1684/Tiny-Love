import React, { useState } from "react";
import TinyLogo from "../../../src/public/Tiny.png";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Users,
  Baby,
  Heart,
  MessageSquare,
  BookOpen,
  Mail,
  Activity,
  AlertTriangle,
  PanelLeftClose,
  PanelLeft,
  LogOut // 1. Imported the LogOut icon here
} from "lucide-react";

// 2. Define the TypeScript props interface to receive onLogout from App.tsx
interface AdminLayoutProps {
  onLogout: () => void;
}

export default function AdminLayout({ onLogout }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const getPageTitle = () => {
    if (currentPath.includes("users")) return "Users";
    if (currentPath.includes("babies")) return "Babies";
    if (currentPath.includes("memories")) return "Memories";
    if (currentPath.includes("invites")) return "Invites";
    if (currentPath.includes("dream-tales")) return "AI Dream Tales";
    return "Dashboard";
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: Activity },
    { path: "/users", label: "Users", icon: Users },
    { path: "/babies", label: "Babies", icon: Baby },
    { path: "/memories", label: "Memories", icon: Heart },
    { path: "/invites", label: "Invites", icon: Mail },
    { path: "/dream-tales", label: "Dream Tales", icon: BookOpen },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-20' : 'w-57'} bg-sidebar text-sidebar-foreground flex flex-col shadow-2xl border-r border-sidebar-border/10 h-screen sticky top-0 transition-all duration-300 overflow-hidden`}>
        <div className="flex-1 flex flex-col justify-between"> {/* Changed to justify-between to place logout button at the absolute bottom */}
          <div>
            {/* Brand Header */}
            <div className={`h-20 flex items-center border-b border-border/30 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
              <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-[#E1A53D] flex items-center justify-center shadow-md flex-shrink-0">
                  <img src={TinyLogo} alt="Tiny Love logo" className="h-full w-full object-cover" />
                </div>
                <div className={`flex flex-col transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0 overflow-hidden ml-0' : 'opacity-100 w-auto ml-2'}`}>
                  <h1 className="font-semibold text-lg tracking-wider text-white">Tiny Love</h1>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center h-11 ${isCollapsed ? 'justify-center px-0' : 'px-4'} rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer ${isActive
                      ? "bg-[#E1A53D] text-black shadow-md"
                      : "text-sidebar-foreground/75 hover:bg-accent/10 hover:text-accent-foreground"
                      }`}
                  >
                    <div className={`flex items-center justify-center transition-all duration-200 ${isCollapsed ? 'w-full' : 'w-4'}`}>
                      <item.icon className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 ml-0 overflow-hidden' : 'opacity-100 w-auto ml-3'}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 3. New Bottom Sign Out Button Container */}
          <div className="p-3 border-t border-sidebar-border/10">
            <button
              onClick={onLogout}
              title={isCollapsed ? "Sign Out" : undefined}
              className={`w-full flex items-center h-11 ${isCollapsed ? 'justify-center px-0' : 'px-4'} rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all duration-200 group cursor-pointer`}
            >
              <div className={`flex items-center justify-center transition-all duration-200 ${isCollapsed ? 'w-full' : 'w-4'}`}>
                <LogOut className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
              </div>
              <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 ml-0 overflow-hidden' : 'opacity-100 w-auto ml-3'}`}>
                Sign Out
              </span>
            </button>
          </div>

        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="shrink-0 h-20 bg-card border-b border-border px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 -ml-2 text-sidebar-foreground/80 hover:text-sidebar-foreground rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <h2 className="text-xl font-semibold capitalize text-foreground border-l border-border pl-4">
              {getPageTitle()}
            </h2>
          </div>
        </header>

        {/* Page Content Outlet */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}