'use client';

import { FolderKanban, Clock, CheckCircle2, AlertCircle, ThumbsUp, ThumbsDown, MessageCircle, ArrowRight, Download, FileText } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";

interface ClientRoleViewProps {
  user: any;
  projects: any[];
  onSelectTab?: (tab: string) => void;
}

export function ClientRoleView({ user, projects, onSelectTab }: ClientRoleViewProps) {
  const firstName = user?.full_name?.split(" ")[0] || "Client Partner";

  const approvalItems = [
    { id: "1", title: "Apex Brand Style Guide v2.0", type: "Brand Identity", file: "Apex_Identity_v2.pdf", size: "14.2 MB" },
    { id: "2", title: "Q4 Launch Reel Motion Graphic Cut", type: "Social Media", file: "Launch_Reel_Cut3.mp4", size: "48.1 MB" },
    { id: "3", title: "Print Packaging Die-cut Mockups", type: "Deliverable", file: "Packaging_Die_v1.zip", size: "86.5 MB" },
  ];

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
            Welcome, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1 text-xs font-mono uppercase tracking-wider">
            Client Portal — Review Deliverables, Approve Concepts & Track Progress
          </p>
        </div>
        <div className="px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-mono uppercase">
          Previewing As Client
        </div>
      </div>

      {/* Deliverables For Approval Banner */}
      <div className="rounded-xl border border-primary/40 bg-gradient-to-r from-primary/10 via-card to-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <ThumbsUp size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground font-sans">Deliverables Awaiting Your Approval</h3>
              <p className="text-xs text-muted-foreground">Review the assets prepared by your agency team and approve or request revisions.</p>
            </div>
          </div>
          <span className="text-xs font-mono bg-primary/20 text-primary border border-primary/30 px-2.5 py-1 rounded-full">
            {approvalItems.length} Pending
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {approvalItems.map((item) => (
            <div key={item.id} className="p-4 rounded-lg bg-secondary/40 border border-border flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-primary uppercase">{item.type}</span>
                <h4 className="text-sm font-semibold text-foreground mt-1">{item.title}</h4>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono mt-2">
                  <FileText size={12} />
                  <span>{item.file} ({item.size})</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                <Button size="sm" className="w-full text-xs font-mono uppercase bg-emerald-600 hover:bg-emerald-500 text-white gap-1 h-7">
                  <ThumbsUp size={12} /> Approve
                </Button>
                <Button size="sm" variant="outline" className="w-full text-xs font-mono uppercase gap-1 h-7">
                  <MessageCircle size={12} /> Feedback
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Projects Status */}
      <div className="rf-card p-6">
        <h2 className="rf-label text-sm text-foreground mb-4">Your Active Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.slice(0, 4).map((p, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-secondary/30 border border-border/40 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">{p.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description || "Active agency collaboration"}</p>
                <span className="text-[10px] font-mono text-muted-foreground mt-2 block">
                  Status: <span className="text-emerald-400 capitalize">{p.status}</span>
                </span>
              </div>
              <button
                onClick={() => onSelectTab && onSelectTab('projects')}
                className="p-2 rounded-lg bg-accent text-primary hover:bg-accent/80 transition-colors"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
