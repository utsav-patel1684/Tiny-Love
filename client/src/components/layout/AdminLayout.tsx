import React, { useState } from "react";
import TinyLogo from "../../../src/public/Tiny.png";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import {
  Users,
  Baby,
  Heart,
  Mail,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Smile,
  Star,
  Home,
  X
} from "lucide-react";

interface AdminLayoutProps {
  onLogout: () => void;
}

export default function AdminLayout({ onLogout }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const getPageTitle = () => {
    if (currentPath.includes("users")) return "Users";
    if (currentPath.includes("babies")) return "Babies";
    if (currentPath.includes("memories")) return "Memories";
    if (currentPath.includes("invites")) return "Invites";
    if (currentPath.includes("dream-tales")) return "AI Dream Tales";
    if (currentPath.includes("reactions")) return "Reactions";
    if (currentPath.includes("highlights")) return "Highlights";
    return "Dashboard";
  };

  const handleLogoutClick = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      onLogout();
    }, 800);
  };

  const sidebarNavItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/users", label: "Users", icon: Users },
    { path: "/babies", label: "Babies", icon: Baby },
    { path: "/memories", label: "Memories", icon: Heart },
    { path: "/invites", label: "Invites", icon: Mail },
    { path: "/dream-tales", label: "Dream Tales", icon: BookOpen },
    { path: "/reactions", label: "Reactions", icon: Smile },
    { path: "/highlights", label: "Highlights", icon: Star },
  ];

  // Instagram-style 4 main items for bottom bar
  const bottomNavItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/users", label: "Users", icon: Users },
    { path: "/babies", label: "Babies", icon: Baby },
    { path: "/memories", label: "Memories", icon: Heart },
  ];

  // Other items mapped to the sliding drawer
  const drawerNavItems = [
    { path: "/invites", label: "Invites", icon: Mail },
    { path: "/dream-tales", label: "Dream Tales", icon: BookOpen },
    { path: "/reactions", label: "Reactions", icon: Smile },
    { path: "/highlights", label: "Highlights", icon: Star },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground font-sans relative overflow-hidden">
      
      {/* Sidebar - hidden on mobile, visible on desktop */}
      <aside className={`
        hidden md:flex flex-col h-screen overflow-hidden transition-all duration-300 shrink-0
        ${isCollapsed ? 'w-20' : 'w-64'} 
        bg-sidebar text-sidebar-foreground shadow-2xl border-r border-white/20
      `}>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Brand Header */}
            <div className={`h-16 flex items-center border-b border-white/20 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}>
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
              {sidebarNavItems.map((item) => {
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

          {/* Sign Out Footer */}
          <div className="p-3 border-t border-white/20">
            <button
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              title={isCollapsed ? "Sign Out" : undefined}
              className={`w-full flex items-center h-12 ${isCollapsed ? 'justify-center px-0' : 'px-4'} text-white/75 text-base font-medium rounded-lg hover:bg-accent hover:text-white ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`flex items-center justify-center transition-all duration-200 ${isCollapsed ? 'w-full' : 'w-5'}`}>
                {isLoggingOut ? (
                  <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                )}
              </div>
              <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 ml-0 overflow-hidden' : 'opacity-100 w-auto ml-4'}`}>
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-background pb-28 md:pb-0">
        {/* Top Header */}
        <header className="hidden md:flex shrink-0 h-16 bg-background/70 backdrop-blur-md border-b border-white/20 px-4 md:px-8 items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
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
            <h2 className="text-xl font-semibold capitalize text-foreground">
              {getPageTitle()}
            </h2>
          </div>
        </header>

        {/* Page Content Outlet */}
        <div className="p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6 md:space-y-8 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
      </main>

      {/* Floating Bottom Nav Bar - visible on mobile only */}
      <div className="fixed bottom-4 left-4 right-4 h-16 bg-[#6C7A63]/95 backdrop-blur-md border border-white/15 rounded-full shadow-2xl z-40 flex items-center justify-around px-2 max-w-md mx-auto md:hidden">
        {bottomNavItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 cursor-pointer ${
                isActive ? "bg-[#EBA545] text-white shadow-lg shadow-[#EBA545]/20" : "text-white/60 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          );
        })}

        {/* More/Menu Toggle as Profile Avatar */}
        <button
          onClick={() => setIsMoreMenuOpen(true)}
          className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-200 cursor-pointer overflow-hidden ${
            isMoreMenuOpen ? "border-white" : "border-white/30 hover:border-white"
          }`}
        >
          <div className="w-full h-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
            A
          </div>
        </button>
      </div>

      {/* More Options Drawer Overlay */}
      {isMoreMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center md:hidden" 
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div 
            className="bg-[#1D251A] border-t border-white/10 rounded-t-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Drag Handle indicator */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-2" />
            
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-semibold text-white">More Options</h3>
              <button 
                onClick={() => setIsMoreMenuOpen(false)}
                className="text-white/70 hover:text-white cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {drawerNavItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMoreMenuOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                      isActive ? "bg-[#EBA545] text-white" : "bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  handleLogoutClick();
                }}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 h-12 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}