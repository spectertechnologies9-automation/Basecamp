'use client';

import { Users, FolderKanban, AlertCircle, Clock, TrendingUp, BarChart3, ArrowRight, Megaphone, Upload, ThumbsUp, MessageCircle, CheckSquare } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";

interface AdminRoleViewProps {
  user: any;
  projects: any[];
  activity: any[];
  onSelectTab?: (tab: string) => void;
}

const weeklyOutput = [
  { week: "W1", delivered: 18, target: 20 },
  { week: "W2", delivered: 22, target: 20 },
  { week: "W3", delivered: 15, target: 20 },
  { week: "W4", delivered: 24, target: 20 },
];

const teamUtilization = [
  { name: "Alex", hours: 36, capacity: 40, projects: 3 },
  { name: "Sarah", hours: 38, capacity: 40, projects: 4 },
  { name: "Mike", hours: 32, capacity: 40, projects: 2 },
  { name: "Lisa", hours: 28, capacity: 40, projects: 3 },
  { name: "Jane", hours: 40, capacity: 40, projects: 5 },
];

export function AdminRoleView({ user, projects, activity, onSelectTab }: AdminRoleViewProps) {
  const firstName = user?.full_name?.split(" ")[0] || "Admin";
  const activeProjectsCount = projects.filter((p) => p.status === "active").length;

  const stats = [
    { label: "Active Clients", value: "8", icon: Users, change: "+2 this month", tab: "team" },
    { label: "Active Projects", value: activeProjectsCount || "6", icon: FolderKanban, change: "3 milestones due", tab: "projects" },
    { label: "Pipeline Velocity", value: "94%", icon: TrendingUp, change: "12 delivered", tab: "pipeline" },
    { label: "Pending Approvals", value: "4", icon: AlertCircle, change: "1 overdue", tab: "pipeline" },
  ];

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1 text-xs font-mono uppercase tracking-wider">
            Admin Overview — Executive Control & Live Agency Health
          </p>
        </div>
        <div className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono uppercase">
          Previewing As Administrator
        </div>
      </div>

      {/* Business Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            onClick={() => onSelectTab && onSelectTab(stat.tab)}
            className="stat-card cursor-pointer hover:border-primary/40 hover:bg-card/80 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="rf-label">{stat.label}</span>
              <stat.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">{stat.value}</div>
            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1 font-mono">
              <span className="text-emerald-400 font-semibold">{stat.change}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Pipeline Health & Team Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Health */}
        <div className="rf-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="rf-label text-sm text-foreground">Pipeline Distribution</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Asset stages across active campaigns</p>
            </div>
            <button
              onClick={() => onSelectTab && onSelectTab('pipeline')}
              className="text-xs font-mono uppercase text-primary hover:underline flex items-center gap-1"
            >
              Open Pipeline <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-4">
            {[
              { label: "Scripting & Concepts", count: 4, pct: 25, color: "bg-sky-500" },
              { label: "In Production", count: 6, pct: 40, color: "bg-emerald-500" },
              { label: "Review & Approval", count: 3, pct: 20, color: "bg-amber-500" },
              { label: "Delivered / Scheduled", count: 5, pct: 30, color: "bg-orange-500" },
            ].map((stage, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">{stage.label}</span>
                  <span className="font-semibold text-foreground">{stage.count} items</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary/50 overflow-hidden">
                  <div className={`h-full ${stage.color} rounded-full`} style={{ width: `${stage.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Utilization */}
        <div className="rf-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="rf-label text-sm text-foreground">Team Bandwidth</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Capacity & logged hours this week</p>
            </div>
            <button
              onClick={() => onSelectTab && onSelectTab('team')}
              className="text-xs font-mono uppercase text-primary hover:underline flex items-center gap-1"
            >
              Team Directory <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-3.5">
            {teamUtilization.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-mono py-1 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center font-bold text-[10px] text-primary">
                    {member.name[0]}
                  </div>
                  <div>
                    <span className="text-foreground font-medium">{member.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">({member.projects} active projects)</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 bg-secondary/60 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${(member.hours / member.capacity) * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground text-[11px] w-12 text-right">
                    {member.hours}/{member.capacity}h
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Output & Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Output */}
        <div className="rf-card p-6">
          <h2 className="rf-label text-sm text-foreground mb-4">Weekly Delivery Target</h2>
          <div className="grid grid-cols-4 gap-3 text-center">
            {weeklyOutput.map((w, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-secondary/30 border border-border/40">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{w.week}</span>
                <div className="text-xl font-bold font-mono text-foreground mt-1">{w.delivered}</div>
                <span className="text-[10px] text-emerald-400 font-mono">Target: {w.target}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live System Activity */}
        <div className="rf-card p-6">
          <h2 className="rf-label text-sm text-foreground mb-4">Recent Audit Activity</h2>
          <div className="space-y-3">
            {activity.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs">
                <div className="p-1.5 rounded-md bg-accent text-primary mt-0.5">
                  <CheckSquare size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium truncate">{item.action}</p>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {item.entity_type} • {formatTimeAgo(item.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
