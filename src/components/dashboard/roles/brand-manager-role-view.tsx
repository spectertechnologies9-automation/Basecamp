'use client';

import { FolderKanban, AlertCircle, Calendar as CalendarIcon, CheckCircle2, Video, Send, Pen, Users, Clock, ArrowRight, Plus, CheckSquare, Columns3 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";

interface BrandManagerRoleViewProps {
  user: any;
  projects: any[];
  activity: any[];
  onSelectTab?: (tab: string) => void;
}

export function BrandManagerRoleView({ user, projects, activity, onSelectTab }: BrandManagerRoleViewProps) {
  const firstName = user?.full_name?.split(" ")[0] || "Manager";

  const scheduleItems = [
    { time: "10:00 AM", title: "Brand Identity Review with Apex", type: "meeting", client: "Apex Media" },
    { time: "01:30 PM", title: "Review Summer Reel Final Cut", type: "review", client: "Luxe Goods" },
    { time: "03:45 PM", title: "Schedule Next Week's Instagram Drop", type: "post", client: "Velocity Labs" },
  ];

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
            Hey, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1 text-xs font-mono uppercase tracking-wider">
            Brand Manager Dashboard — Campaigns, Approvals & Content Cadence
          </p>
        </div>
        <div className="px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-mono uppercase">
          Previewing As Brand Manager
        </div>
      </div>

      {/* Campaign Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onSelectTab && onSelectTab('pipeline')}
          className="stat-card cursor-pointer hover:border-sky-500/40"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="rf-label text-sky-400">Content Pipeline</span>
            <Columns3 className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">14 Active</div>
          <p className="text-[11px] font-mono text-muted-foreground mt-1">4 awaiting client feedback</p>
        </div>

        <div
          onClick={() => onSelectTab && onSelectTab('projects')}
          className="stat-card cursor-pointer hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="rf-label text-emerald-400">Managed Projects</span>
            <FolderKanban className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">{projects.length} Total</div>
          <p className="text-[11px] font-mono text-muted-foreground mt-1">All timelines on track</p>
        </div>

        <div
          onClick={() => onSelectTab && onSelectTab('whatsapp')}
          className="stat-card cursor-pointer hover:border-amber-500/40"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="rf-label text-amber-400">Client WhatsApp Hub</span>
            <Send className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">Active</div>
          <p className="text-[11px] font-mono text-muted-foreground mt-1">Instant updates enabled</p>
        </div>
      </div>

      {/* Schedule & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day Schedule */}
        <div className="rf-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="rf-label text-sm text-foreground">Today's Schedule & Milestones</h2>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Today</span>
          </div>

          <div className="space-y-3">
            {scheduleItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-accent text-primary">
                    <Clock size={13} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">{item.title}</h4>
                    <span className="text-[10px] font-mono text-muted-foreground">{item.client}</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-primary font-semibold">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Attention / Approvals */}
        <div className="rf-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="rf-label text-sm text-foreground">Pending Approvals Queue</h2>
            <button
              onClick={() => onSelectTab && onSelectTab('pipeline')}
              className="text-xs font-mono uppercase text-primary hover:underline flex items-center gap-1"
            >
              View Pipeline <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-3">
            {[
              { title: "Brand Style Guide v2.0", client: "Apex Media", stage: "concepts-approval" },
              { title: "Q2 Promotional Video Storyboard", client: "Luxe Goods", stage: "concepts-approval" },
              { title: "Product Launch Carousel Deck", client: "Velocity Labs", stage: "final-approval" },
            ].map((appr, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">{appr.title}</h4>
                  <span className="text-[10px] font-mono text-muted-foreground">{appr.client}</span>
                </div>
                <StatusBadge status="high" className="text-[10px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
