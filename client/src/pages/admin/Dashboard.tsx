import React, { useState, useEffect } from "react";
import { Users, Baby, Heart, BookOpen, MessageSquare, Mail, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from "recharts";

import { apiFetch } from "../../lib/api";

export default function Dashboard() {

  const [stats, setStats] = useState<any>(null);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [memoryGrowth, setMemoryGrowth] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await apiFetch<any>("/overview");
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
  }, []);

  if (error) {
    return (
      <div className="bg-destructive/10 p-6 rounded-xl border border-destructive/20">
        <h3 className="text-destructive font-bold mb-2">Connection Error</h3>
        <p className="text-destructive-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Stats overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total Users</p>
              <h3 className="text-3xl font-bold text-foreground mt-2 group-hover:text-primary transition-colors">{stats?.users ?? "-"}</h3>
            </div>
            <div className="p-3 bg-primary/15 text-primary rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Babies Profiles</p>
              <h3 className="text-3xl font-bold text-foreground mt-2 group-hover:text-primary transition-colors">{stats?.babies ?? "-"}</h3>
            </div>
            <div className="p-3 bg-accent/15 text-accent rounded-lg group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300">
              <Baby className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Memories Shared</p>
              <h3 className="text-3xl font-bold text-foreground mt-2 group-hover:text-primary transition-colors">{stats?.memories ?? "-"}</h3>
            </div>
            <div className="p-3 bg-accent/15 text-accent rounded-lg group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300">
              <Heart className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Dream Tales</p>
              <h3 className="text-3xl font-bold text-foreground mt-2 group-hover:text-primary transition-colors">{stats?.dreamTales ?? "-"}</h3>
            </div>
            <div className="p-3 bg-primary/15 text-primary rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-primary rounded-full" />
            User Signups (Last 30 Days)
          </h4>
          <div className="h-80 w-full">
            {userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-green)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--brand-green)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.18)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(str) => new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.85)" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.3)" }}
                    tickLine={{ stroke: "rgba(255,255,255,0.3)" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.85)" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.3)" }}
                    tickLine={{ stroke: "rgba(255,255,255,0.3)" }}
                  />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.94)",
                      borderColor: "rgba(255,255,255,0.18)",
                      color: "#fff",
                    }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                    cursor={{ stroke: "#E1A53D", strokeOpacity: 0.35 }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  />
                  <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#userGrad)" name="Signups" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/70 text-sm">No signup activity recorded.</div>
            )}
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-accent rounded-full" />
            Memories Shared (Last 30 Days)
          </h4>
          <div className="h-80 w-full">
            {memoryGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={memoryGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="memoryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-gold)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--brand-gold)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.18)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(str) => new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.85)" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.3)" }}
                    tickLine={{ stroke: "rgba(255,255,255,0.3)" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.85)" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.3)" }}
                    tickLine={{ stroke: "rgba(255,255,255,0.3)" }}
                  />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.94)",
                      borderColor: "rgba(255,255,255,0.18)",
                      color: "#fff",
                    }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                    cursor={{ stroke: "#E1A53D", strokeOpacity: 0.35 }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  />
                  <Area type="monotone" dataKey="count" stroke="#C9AE7B" strokeWidth={2} fillOpacity={1} fill="url(#memoryGrad)" name="Memories" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/70 text-sm">No memory activity recorded.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
