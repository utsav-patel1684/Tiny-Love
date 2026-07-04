import React, { useState } from "react";
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
  PanelLeft
} from "lucide-react";

export default function AdminLayout() {
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
    <div className="flex h-screen bg-[#FDFBF7] text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[#1E2E24] text-white flex flex-col shadow-2xl border-r border-[#EBE6DA]/10 h-screen sticky top-0 transition-all duration-300 overflow-hidden`}>
        <div className="flex-1 flex flex-col">
          {/* Brand Header */}
          <div className={`h-20 flex items-center border-b border-[#EBE6DA]/10 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
            <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="h-9 w-9 bg-[#C9AE7B] rounded-lg flex items-center justify-center font-bold text-white shadow-md flex-shrink-0">
                T
              </div>
              <div className={`flex flex-col transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0 overflow-hidden ml-0' : 'opacity-100 w-auto ml-3'}`}>
                <h1 className="font-semibold text-lg tracking-wider">Tiny Love</h1>
                <span className="text-[#C9AE7B] text-xs font-semibold uppercase tracking-widest">Admin Control</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 flex-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center h-11 ${isCollapsed ? 'justify-center px-0' : 'px-4'} rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer ${
                    isActive
                      ? "bg-[#C9AE7B] text-white shadow-md"
                      : "text-[#EBE6DA]/75 hover:bg-[#C9AE7B]/10 hover:text-white"
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
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="shrink-0 h-20 bg-white border-b border-[#EBE6DA] px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <h2 className="text-xl font-semibold capitalize text-gray-800 border-l border-gray-200 pl-4">
              {getPageTitle()}
            </h2>
          </div>
        </header>

        {/* Page Content Outlet */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
