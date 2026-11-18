'use client';

import { CheckCircle2, Video, Send, Pen, Users, Clock, ArrowRight, Plus, Upload, MessageCircle, FolderOpen, CalendarDays, CheckSquare } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";

interface TeamRoleViewProps {
  user: any;
  projects: any[];
  activity: any[];
  onSelectTab?: (tab: string) => void;
}

export function TeamRoleView({ user, projects, activity, onSelectTab }: TeamRoleViewProps) {
  const firstName = user?.full_name?.split(" ")[0] || "Team Member";

  const myTasks = [
    { title: "Render 3D product motion graphics for reels", project: "Luxe Goods", due: "Today" },
    { title: "Draft typography guidelines for Dark Mode", project: "Apex Media", due: "Tomorrow" },
    { title: "Review copy edits from client feedback", project: "Velocity Labs", due: "Oct 28" },
    { title: "Upload final vector export package", project: "Design System", due: "Oct 30" },
  ];

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
            Good morning, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1 text-xs font-mono uppercase tracking-wider">
            Team Workspace — Your Daily Deliverables & Task Queue
          </p>
        </div>
        <div className="px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono uppercase">
          Previewing As Team Member
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Upload, label: "Upload Asset", tab: "pipeline" },
          { icon: CheckSquare, label: "My To-dos", tab: "projects" },
          { icon: MessageCircle, label: "Campfire Chat", tab: "projects" },
          { icon: CalendarDays, label: "Schedule", tab: "pipeline" },
        ].map((qa, i) => (
          <button
            key={qa.label}
            onClick={() => onSelectTab && onSelectTab(qa.tab)}
            className="rf-card p-4 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors"
          >
            <qa.icon className="h-5 w-5 text-primary" />
            <span className="rf-label text-[10px] text-foreground">{qa.label}</span>
          </button>
        ))}
      </div>

      {/* My Tasks & Recent Work */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rf-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="rf-label text-sm text-foreground">Assigned Tasks ({myTasks.length})</h2>
            <button
              onClick={() => onSelectTab && onSelectTab('projects')}
              className="text-xs font-mono uppercase text-primary hover:underline flex items-center gap-1"
            >
              All Projects <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-3">
            {myTasks.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">{t.title}</h4>
                    <span className="text-[10px] font-mono text-muted-foreground">{t.project}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {t.due}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rf-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="rf-label text-sm text-foreground">Project Chat & Mentions</h2>
            <span className="text-[10px] font-mono text-muted-foreground">Live Feed</span>
          </div>

          <div className="space-y-3.5">
            {[
              { author: "Jane", text: "New Figma prototype uploaded for Apex review", time: "25m ago" },
              { author: "Sarah", text: "Client signed off on the revised headline copy", time: "1h ago" },
              { author: "Admin", text: "Reminder: Sprint demo today at 4:00 PM UTC", time: "3h ago" },
            ].map((msg, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-secondary/30 border border-border/40 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-primary font-mono">{msg.author}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{msg.time}</span>
                </div>
                <p className="text-muted-foreground">{msg.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
