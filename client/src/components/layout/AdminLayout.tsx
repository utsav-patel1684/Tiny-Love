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
  LogOut, // 1. Imported the LogOut icon here
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from "lucide-react";

// 2. Define the TypeScript props interface to receive onLogout from App.tsx
interface AdminLayoutProps {
  onLogout: () => void;
}

export default function AdminLayout({ onLogout }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <div className="flex h-screen bg-background text-foreground font-sans relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 h-screen overflow-hidden transition-all duration-300
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0
        ${isCollapsed ? 'md:w-20 w-64' : 'w-64'} 
        bg-sidebar text-sidebar-foreground flex flex-col shadow-2xl border-r border-sidebar-border 
      `}>
        <div className="flex-1 flex flex-col justify-between"> {/* Changed to justify-between to place logout button at the absolute bottom */}
          <div>
            {/* Brand Header */}
            <div className={`h-20 flex items-center border-b border-border transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}>
              <div className={`flex items-center transition-all duration-300 ${isCollapsed ? '' : 'gap-3'}`}>
                <div className="h-10 w-10 rounded-xl overflow-hidden bg-[#EBA545] shadow-md flex-shrink-0">
                  <img src={TinyLogo} alt="Tiny Love logo" className="h-full w-full object-cover" />
                </div>
                <div className={`flex flex-col transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0 overflow-hidden ml-0' : 'opacity-100 w-auto'}`}>
                  <h1 className="font-semibold text-lg tracking-wider text-white">Tiny Love</h1>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="p-3 space-y-2">
              {navItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center h-12 ${isCollapsed ? 'justify-center px-0' : 'px-4'} rounded-lg text-base font-medium transition-all duration-200 group cursor-pointer ${isActive
                      ? "bg-[#EBA545] text-white shadow-md"
                      : "text-white hover:bg-accent hover:text-white"
                      }`}
                  >
                    <div className={`flex items-center justify-center transition-all duration-200 ${isCollapsed ? 'w-full' : 'w-5'}`}>
                      <item.icon className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 ml-0 overflow-hidden' : 'opacity-100 w-auto ml-5'}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 3. New Bottom Sign Out Button Container */}
          <div className="p-3 border-t border-sidebar-border">
            <button
              onClick={onLogout}
              title={isCollapsed ? "Sign Out" : undefined}
              className={`w-full flex items-center h-12 ${isCollapsed ? 'justify-center px-0' : 'px-4'} text-white/75 text-base font-medium rounded-lg hover:bg-accent hover:text-white`}
            >
              <div className={`flex items-center justify-center transition-all duration-200 ${isCollapsed ? 'w-full' : 'w-5'}`}>
                <LogOut className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
              </div>
              <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 ml-0 overflow-hidden' : 'opacity-100 w-auto ml-4'}`}>
                Sign Out
              </span>
            </button>
          </div>

        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="shrink-0 h-20 bg-transparent border-b border-border px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 md:hidden text-foreground hover:text-primary rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <Menu className="h-7 w-7" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 -ml-2 hidden md:block hover:text-sidebar-foreground rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-7 w-7" />
              ) : (
                <ChevronLeft className="h-7 w-7" />
              )}            
            </button>
            <h2 className="text-xl font-semibold capitalize text-foreground border-l border-border pl-4">
              {getPageTitle()}
            </h2>
          </div>
        </header>

        {/* Page Content Outlet */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6 md:space-y-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}