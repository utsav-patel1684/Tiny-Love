import React, { useState, useEffect } from "react";
import { Users, Baby, Heart, BookOpen, MessageSquare, Mail, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from "recharts";

const API_URL_STORAGE_KEY = "kinstory_admin_api_url";
const DEFAULT_API_URL = "http://localhost:5001/api";

export default function Dashboard() {
  const [apiUrl] = useState(() => localStorage.getItem(API_URL_STORAGE_KEY) || DEFAULT_API_URL);
  const [stats, setStats] = useState<any>(null);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [memoryGrowth, setMemoryGrowth] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/overview`);
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
        const data = await res.json();
        setStats(data.counts);
        setUserGrowth(data.charts.userGrowth);
        setMemoryGrowth(data.charts.memoryGrowth);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Unable to connect to the backend server.");
      }
    };
    fetchOverview();
  }, [apiUrl]);

  if (error) {
    return (
      <div className="bg-rose-50 p-6 rounded-xl border border-rose-200">
        <h3 className="text-rose-800 font-bold mb-2">Connection Error</h3>
        <p className="text-rose-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Stats overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-[#EBE6DA] shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Users</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2 group-hover:text-[#5F7A68] transition-colors">{stats?.users ?? "-"}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg group-hover:bg-[#5F7A68] group-hover:text-white transition-all duration-300">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#EBE6DA] shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Babies Profiles</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2 group-hover:text-[#5F7A68] transition-colors">{stats?.babies ?? "-"}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-800 rounded-lg group-hover:bg-[#5F7A68] group-hover:text-white transition-all duration-300">
              <Baby className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#EBE6DA] shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Memories Shared</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2 group-hover:text-[#5F7A68] transition-colors">{stats?.memories ?? "-"}</h3>
            </div>
            <div className="p-3 bg-[#C9AE7B]/10 text-[#C9AE7B] rounded-lg group-hover:bg-[#5F7A68] group-hover:text-white transition-all duration-300">
              <Heart className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#EBE6DA] shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Dream Tales</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2 group-hover:text-[#5F7A68] transition-colors">{stats?.dreamTales ?? "-"}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-800 rounded-lg group-hover:bg-[#5F7A68] group-hover:text-white transition-all duration-300">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-[#EBE6DA] shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full" />
            User Signups (Last 30 Days)
          </h4>
          <div className="h-80 w-full">
            {userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE9" />
                  <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric" })} tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip labelFormatter={(label) => new Date(label).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })} />
                  <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#userGrad)" name="Signups" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No signup activity recorded.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#EBE6DA] shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-[#C9AE7B] rounded-full" />
            Memories Shared (Last 30 Days)
          </h4>
          <div className="h-80 w-full">
            {memoryGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={memoryGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="memoryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9AE7B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C9AE7B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE9" />
                  <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric" })} tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip labelFormatter={(label) => new Date(label).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })} />
                  <Area type="monotone" dataKey="count" stroke="#C9AE7B" strokeWidth={2} fillOpacity={1} fill="url(#memoryGrad)" name="Memories" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No memory activity recorded.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
