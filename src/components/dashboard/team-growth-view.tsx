'use client';

import { useState, useEffect } from 'react';
import {
  Trophy,
  Target,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  Award,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  UserCheck,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ImprovementTask {
  id: string;
  organization_id: string;
  assigned_to: string;
  assigned_by: string;
  title: string;
  description: string;
  category: string;
  points_reward: number;
  points_awarded?: number;
  status: 'assigned' | 'submitted' | 'awarded' | 'needs_revision';
  submission_notes?: string;
  submission_url?: string;
  admin_feedback?: string;
  submitted_at?: string;
  awarded_at?: string;
  created_at: string;
  member_name?: string;
  member_email?: string;
  member_avatar?: string;
  member_role?: string;
  assigner_name?: string;
}

interface LeaderboardUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
  total_points: number;
  completed_tasks: number;
  total_assigned: number;
}

interface TeamGrowthViewProps {
  user: any;
  effectiveRole: string;
  mode?: 'cockpit' | 'full';
  onNavigateToStudio?: () => void;
}

export function TeamGrowthView({
  user,
  effectiveRole,
  mode = 'full',
  onNavigateToStudio,
}: TeamGrowthViewProps) {
  // STRICT REQUIREMENT: Clients NEVER see Craft & Merit Accelerator
  if (effectiveRole === 'client' || user?.role === 'client') {
    return null;
  }

  const isAdmin = effectiveRole === 'admin' || effectiveRole === 'owner';
  const [tasks, setTasks] = useState<ImprovementTask[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userStats, setUserStats] = useState<{ total_points: number; completed_count: number; pending_count: number }>({
    total_points: 0,
    completed_count: 0,
    pending_count: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal states
  const [assignOpen, setAssignOpen] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('skill');
  const [taskDescription, setTaskDescription] = useState('');
  const [pointsReward, setPointsReward] = useState(50);
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Member submission modal
  const [activeSubmitTask, setActiveSubmitTask] = useState<ImprovementTask | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Admin award points modal
  const [activeAwardTask, setActiveAwardTask] = useState<ImprovementTask | null>(null);
  const [awardPoints, setAwardPoints] = useState(50);
  const [adminFeedback, setAdminFeedback] = useState('');
  const [submittingAward, setSubmittingAward] = useState(false);

  // Admin revision modal
  const [activeRevisionTask, setActiveRevisionTask] = useState<ImprovementTask | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/improvement-tasks');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setTasks(json.data.tasks || []);
          if (json.data.leaderboard) {
            setLeaderboard(json.data.leaderboard);
          }
          if (json.data.stats) {
            setUserStats(json.data.stats);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load improvement tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/team/members');
      if (res.ok) {
        const json = await res.json();
        const valid = (json.data || []).filter((m: any) => m.role !== 'client' && m.role !== 'owner');
        setAvailableMembers(valid);
        if (valid.length > 0 && !selectedRecipient) {
          setSelectedRecipient(valid[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load team members:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (isAdmin) {
      fetchMembers();
    }
  }, [isAdmin]);

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient || !taskTitle.trim()) return;

    setSubmittingAssign(true);
    try {
      const res = await fetch('/api/improvement-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: selectedRecipient,
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          category: taskCategory,
          points_reward: Number(pointsReward) || 50,
        }),
      });

      if (res.ok) {
        setAssignOpen(false);
        setTaskTitle('');
        setTaskDescription('');
        setPointsReward(50);
        fetchTasks();
      }
    } catch (err) {
      console.error('Error assigning task:', err);
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmitTask) return;

    setSubmittingAction(true);
    try {
      const res = await fetch('/api/improvement-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeSubmitTask.id,
          action: 'submit',
          submission_notes: submissionNotes.trim() || 'Task completed and submitted.',
          submission_url: submissionUrl.trim() || undefined,
        }),
      });

      if (res.ok) {
        setActiveSubmitTask(null);
        setSubmissionNotes('');
        setSubmissionUrl('');
        fetchTasks();
      }
    } catch (err) {
      console.error('Error submitting task:', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAwardTask) return;

    setSubmittingAward(true);
    try {
      const res = await fetch('/api/improvement-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeAwardTask.id,
          action: 'award',
          points_awarded: Number(awardPoints),
          admin_feedback: adminFeedback.trim() || 'Great job! Points awarded.',
        }),
      });

      if (res.ok) {
        setActiveAwardTask(null);
        setAdminFeedback('');
        fetchTasks();
      }
    } catch (err) {
      console.error('Error awarding points:', err);
    } finally {
      setSubmittingAward(false);
    }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRevisionTask) return;

    setSubmittingRevision(true);
    try {
      const res = await fetch('/api/improvement-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeRevisionTask.id,
          action: 'revision',
          admin_feedback: revisionFeedback.trim() || 'Please revise and provide more information.',
        }),
      });

      if (res.ok) {
        setActiveRevisionTask(null);
        setRevisionFeedback('');
        fetchTasks();
      }
    } catch (err) {
      console.error('Error requesting revision:', err);
    } finally {
      setSubmittingRevision(false);
    }
  };

  // STRICT REQUIREMENT:
  // "when member , team lead doesnt have any tasks this sectio shouldnt show"
  if (!isAdmin && !loading && tasks.length === 0) {
    return null;
  }

  const categoryLabels: Record<string, { label: string; color: string }> = {
    skill: { label: 'Technical Mastery', color: 'text-violet-400 border-violet-500/30 bg-violet-500/10' },
    architecture: { label: 'Systems & Architecture', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
    craft: { label: 'UI/UX & Product Polish', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
    speed: { label: 'Velocity & Execution', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    leadership: { label: 'Mentorship & Ownership', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  };

  const pendingReviewTasks = tasks.filter((t) => t.status === 'submitted');
  const activeAssignedTasks = tasks.filter((t) => t.status === 'assigned' || t.status === 'needs_revision');
  const completedTasks = tasks.filter((t) => t.status === 'awarded');

  // Shared Modal Dialogs (used in both Cockpit and Full Studio view)
  const renderDialogs = () => (
    <>
      {/* ── Dialog: Admin Assigns Task ── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-[480px] bg-zinc-950 border-zinc-800 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-serif font-bold flex items-center gap-2">
              <Target size={18} className="text-orange-400" />
              Assign Craft Mastery Milestone
            </DialogTitle>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Choose a team member or lead and set actionable growth milestones.
            </p>
          </DialogHeader>

          <form onSubmit={handleAssignTask} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                Assignee (Member or Team Lead)
              </label>
              <select
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-sans"
                required
              >
                {availableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email} ({m.role?.replace('_', ' ').toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                Task Title & Objective
              </label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g., Master Next.js App Router Caching & RSC"
                className="rounded-xl bg-zinc-900 border-zinc-700 text-white font-sans text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                  Growth Category
                </label>
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-sans"
                >
                  <option value="skill">Technical Mastery</option>
                  <option value="architecture">Systems & Architecture</option>
                  <option value="craft">UI/UX & Product Polish</option>
                  <option value="speed">Velocity & Execution</option>
                  <option value="leadership">Mentorship & Ownership</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                  Points Reward
                </label>
                <Input
                  type="number"
                  min="10"
                  max="500"
                  step="10"
                  value={pointsReward}
                  onChange={(e) => setPointsReward(Number(e.target.value))}
                  className="rounded-xl bg-zinc-900 border-zinc-700 text-white font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                Description & Definition of Done
              </label>
              <textarea
                value={taskDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTaskDescription(e.target.value)}
                placeholder="Detail the expectations, study materials, or codebase areas to refine..."
                className="w-full rounded-xl bg-zinc-900 border border-zinc-700 p-3 text-white font-sans text-sm min-h-[90px] outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAssignOpen(false)}
                className="rounded-xl text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAssign}
                className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold font-sans px-5"
              >
                {submittingAssign ? 'Assigning...' : 'Assign Task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Member Submits Results ── */}
      <Dialog open={Boolean(activeSubmitTask)} onOpenChange={(open) => !open && setActiveSubmitTask(null)}>
        <DialogContent className="sm:max-w-[460px] bg-zinc-950 border-zinc-800 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-serif font-bold flex items-center gap-2">
              <Send size={18} className="text-orange-400" />
              Submit Milestone Completion & Proof
            </DialogTitle>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Task: <strong className="text-white">{activeSubmitTask?.title}</strong>
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmitTask} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                What did you achieve / learn?
              </label>
              <textarea
                value={submissionNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSubmissionNotes(e.target.value)}
                placeholder="Describe your solution, key takeaways, and what you improved..."
                className="w-full rounded-xl bg-zinc-900 border border-zinc-700 p-3 text-white font-sans text-sm min-h-[100px] outline-none focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                Proof / Link URL (Optional)
              </label>
              <Input
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
                placeholder="https://github.com/..., https://figma.com/..., or demo URL"
                className="rounded-xl bg-zinc-900 border-zinc-700 text-white font-sans text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setActiveSubmitTask(null)}
                className="rounded-xl text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold font-sans px-5"
              >
                {submittingAction ? 'Submitting...' : 'Submit to Admin'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Admin Awards Points ── */}
      <Dialog open={Boolean(activeAwardTask)} onOpenChange={(open) => !open && setActiveAwardTask(null)}>
        <DialogContent className="sm:max-w-[460px] bg-zinc-950 border-zinc-800 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-serif font-bold flex items-center gap-2">
              <Award size={18} className="text-emerald-400" />
              Verify & Award Merit Points
            </DialogTitle>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Member: <strong className="text-white">{activeAwardTask?.member_name}</strong> • Task: {activeAwardTask?.title}
            </p>
          </DialogHeader>

          <form onSubmit={handleAwardPoints} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                Points to Award
              </label>
              <Input
                type="number"
                min="5"
                max="1000"
                step="5"
                value={awardPoints}
                onChange={(e) => setAwardPoints(Number(e.target.value))}
                className="rounded-xl bg-zinc-900 border-zinc-700 text-white font-mono text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                Feedback & Recognition (Optional)
              </label>
              <textarea
                value={adminFeedback}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdminFeedback(e.target.value)}
                placeholder="Excellent craft! Great initiative on the modular component system..."
                className="w-full rounded-xl bg-zinc-900 border border-zinc-700 p-3 text-white font-sans text-sm min-h-[90px] outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setActiveAwardTask(null)}
                className="rounded-xl text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAward}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold font-sans px-5"
              >
                {submittingAward ? 'Awarding...' : 'Confirm Points Award'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Admin Requests Revision ── */}
      <Dialog open={Boolean(activeRevisionTask)} onOpenChange={(open) => !open && setActiveRevisionTask(null)}>
        <DialogContent className="sm:max-w-[460px] bg-zinc-950 border-zinc-800 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-serif font-bold flex items-center gap-2">
              <RotateCcw size={18} className="text-amber-400" />
              Request Milestone Revision
            </DialogTitle>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Notify <strong className="text-white">{activeRevisionTask?.member_name}</strong> to improve or expand their submission.
            </p>
          </DialogHeader>

          <form onSubmit={handleRequestRevision} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                Revision Guidance
              </label>
              <textarea
                value={revisionFeedback}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRevisionFeedback(e.target.value)}
                placeholder="Explain what needs more work or what tests/docs are missing..."
                className="w-full rounded-xl bg-zinc-900 border border-zinc-700 p-3 text-white font-sans text-sm min-h-[100px] outline-none focus:border-orange-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setActiveRevisionTask(null)}
                className="rounded-xl text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingRevision}
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold font-sans px-5"
              >
                {submittingRevision ? 'Sending...' : 'Request Revision'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );

  // ── COCKPIT MODE: Ultra-Compact Bento Deck Widget ──
  if (mode === 'cockpit') {
    if (!isAdmin && tasks.length === 0) {
      return null;
    }

    const topPerformer = leaderboard.length > 0 ? leaderboard[0] : null;
    const latestActiveTask =
      tasks.find((t) => t.status === 'assigned' || t.status === 'needs_revision') || tasks[0];

    return (
      <>
        <div className="rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border border-white/[0.08] p-6 shadow-xl shadow-black/40 hover:border-white/[0.12] transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-amber-400 shrink-0" />
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                {isAdmin ? 'CRAFT & MERIT ACCELERATOR' : 'CRAFT MASTERY MILESTONE'}
              </h3>
            </div>
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssignOpen(true)}
                  className="text-xs font-mono text-zinc-200 hover:text-white uppercase flex items-center gap-1 transition-colors px-2.5 py-1 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 border border-white/[0.06] font-bold"
                >
                  <Plus size={11} className="text-orange-400 stroke-[2.5]" />
                  Assign
                </button>
                {onNavigateToStudio && (
                  <button
                    type="button"
                    onClick={onNavigateToStudio}
                    className="text-xs font-mono text-amber-400 hover:text-amber-300 uppercase flex items-center gap-0.5 transition-colors group font-bold"
                  >
                    STUDIO <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            ) : (
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {userStats.total_points} PTS
              </span>
            )}
          </div>

          {/* Content */}
          {isAdmin ? (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-zinc-400 text-xs font-mono">Leaderboard #1:</span>
                {topPerformer ? (
                  <span className="font-semibold text-white flex items-center gap-1.5 text-xs">
                    <span className="text-amber-400">🥇</span> {topPerformer.full_name}
                    <span className="text-[11px] font-mono text-amber-400 font-bold">({topPerformer.total_points} Pts)</span>
                  </span>
                ) : (
                  <span className="text-zinc-500 text-xs font-mono">No points awarded yet</span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs font-mono">
                <span className="text-zinc-400">
                  <strong className={pendingReviewTasks.length > 0 ? 'text-amber-400 font-bold' : 'text-zinc-300'}>
                    {pendingReviewTasks.length}
                  </strong> review awaiting
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">
                  <strong className="text-zinc-300">{activeAssignedTasks.length}</strong> active
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">
                  <strong className="text-emerald-400">{completedTasks.length}</strong> awarded
                </span>
              </div>

              {pendingReviewTasks.length > 0 && onNavigateToStudio && (
                <button
                  type="button"
                  onClick={onNavigateToStudio}
                  className="w-full py-2 px-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center justify-center gap-2 transition-all font-semibold"
                >
                  <AlertCircle size={14} className="text-amber-400" />
                  Review {pendingReviewTasks.length} pending submission{pendingReviewTasks.length > 1 ? 's' : ''} →
                </button>
              )}

              {/* Mini Leaderboard preview */}
              {leaderboard.length > 0 && (
                <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
                    Top Ranked Engineers
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {leaderboard.slice(0, 3).map((u, i) => (
                      <div key={u.id} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-zinc-950/60 border border-white/[0.04]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                          <span className="font-semibold text-white truncate max-w-[140px] font-sans">{u.full_name}</span>
                          <span className="text-[9px] font-mono text-zinc-400 uppercase">({u.role?.replace('_', ' ')})</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-amber-400 shrink-0">{u.total_points} PTS</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            latestActiveTask && (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white font-sans truncate">
                      {latestActiveTask.title}
                    </h4>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1 font-sans">
                      {latestActiveTask.description || 'Complete this task to earn merit points.'}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 shrink-0">
                    +{latestActiveTask.points_reward} Pts
                  </span>
                </div>

                {latestActiveTask.admin_feedback && (
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-sans">
                    <strong className="text-orange-400">Admin Feedback:</strong> {latestActiveTask.admin_feedback}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs font-mono">
                  <span className={`px-2.5 py-1 rounded-full border uppercase text-[10px] ${
                    latestActiveTask.status === 'awarded'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : latestActiveTask.status === 'submitted'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : latestActiveTask.status === 'needs_revision'
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : 'bg-zinc-800 text-zinc-300 border-white/[0.06]'
                  }`}>
                    {latestActiveTask.status === 'needs_revision' ? 'Needs Revision' : latestActiveTask.status}
                  </span>

                  {(latestActiveTask.status === 'assigned' || latestActiveTask.status === 'needs_revision') && (
                    <Button
                      size="sm"
                      onClick={() => setActiveSubmitTask(latestActiveTask)}
                      className="h-8 px-4 text-xs font-mono rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
                    >
                      Submit Results
                    </Button>
                  )}

                  {latestActiveTask.status === 'submitted' && (
                    <span className="text-zinc-400 flex items-center gap-1.5 text-xs font-mono">
                      <Clock size={13} className="text-amber-400" /> Awaiting Review
                    </span>
                  )}

                  {latestActiveTask.status === 'awarded' && (
                    <span className="text-emerald-400 flex items-center gap-1.5 text-xs font-mono font-bold">
                      <CheckCircle2 size={13} /> Milestone Completed
                    </span>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Dialogs rendered so triggers work */}
        {renderDialogs()}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── FOR ADMINISTRATOR: Full Hub, Assignment & Persistent Score Tracker ── */}
      {isAdmin ? (
        <div className="space-y-6">
          <div className="rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border border-white/[0.08] p-6 shadow-xl shadow-black/40 hover:border-white/[0.12] transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <Trophy size={18} className="text-amber-400" />
                  <h2 className="text-base sm:text-lg font-bold text-white font-serif tracking-tight">
                    Craft & Merit Accelerator Studio
                  </h2>
                </div>
                <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 mt-1">
                  Strategic technical mastery, verified code craft, and merit recognition.
                </p>
              </div>

              {/* Assign Task Button */}
              <Button
                onClick={() => setAssignOpen(true)}
                className="rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-sans font-semibold text-xs px-4 py-2 flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
              >
                <Plus size={14} className="stroke-[2.5]" />
                Assign Growth Milestone
              </Button>
            </div>

            {/* Persistent Score Tracker / Leaderboard */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-amber-400" />
                  <span className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-300">
                    Team Score Leaderboard (Points Persistent Tracker)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  {leaderboard.length} Ranked Members
                </span>
              </div>

              {leaderboard.length === 0 ? (
                <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/[0.05] text-center text-xs font-mono text-zinc-500">
                  No points awarded yet. Assign tasks and reward points to populate the scoreboard.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {leaderboard.slice(0, 6).map((member, idx) => (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-2xl bg-zinc-950/70 border border-white/[0.06] hover:border-amber-500/30 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/[0.1] flex items-center justify-center text-xs font-bold font-mono text-white overflow-hidden">
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              member.full_name?.slice(0, 2).toUpperCase() || 'TM'
                            )}
                          </div>
                          {idx === 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center text-[9px] font-bold shadow">
                              1
                            </span>
                          )}
                          {idx === 1 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-300 text-black flex items-center justify-center text-[9px] font-bold shadow">
                              2
                            </span>
                          )}
                          {idx === 2 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-700 text-white flex items-center justify-center text-[9px] font-bold shadow">
                              3
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate font-sans">
                            {member.full_name || member.email}
                          </h4>
                          <span className="text-[10px] font-mono text-zinc-400 capitalize block">
                            {member.role?.replace('_', ' ')} • {member.completed_tasks} completed
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                          <Trophy size={11} className="text-amber-400" />
                          {member.total_points} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Reviews Queue (For Admin to Award Points) */}
            {pendingReviewTasks.length > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Award size={15} className="text-amber-400" />
                  <span className="text-xs font-mono uppercase tracking-wider font-bold text-amber-300">
                    Submissions Awaiting Admin Review ({pendingReviewTasks.length})
                  </span>
                </div>

                <div className="space-y-3">
                  {pendingReviewTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-2xl bg-zinc-950/90 border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-sans">{task.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Reward: {task.points_reward} pts
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-sans">
                          Submitted by <strong className="text-white">{task.member_name}</strong>
                          {task.submission_notes ? ` — "${task.submission_notes}"` : ''}
                        </p>
                        {task.submission_url && (
                          <a
                            href={task.submission_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 font-mono"
                          >
                            <ExternalLink size={11} /> Proof / Link
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => {
                            setActiveAwardTask(task);
                            setAwardPoints(task.points_reward);
                          }}
                          className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-xs px-3 py-1.5 h-8 flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={13} />
                          Award Points
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveRevisionTask(task)}
                          className="rounded-xl border-zinc-700 text-zinc-300 hover:text-white font-mono text-xs px-3 py-1.5 h-8 flex items-center gap-1.5"
                        >
                          <RotateCcw size={13} />
                          Revision
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active & Completed Improvement Tasks Stream */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-400">
                  All Assigned Growth Tasks ({tasks.length})
                </span>
              </div>

              {tasks.length === 0 ? (
                <div className="p-6 rounded-2xl bg-zinc-950/60 border border-white/[0.05] text-center text-xs font-mono text-zinc-500">
                  No improvement tasks assigned yet. Click "Assign Growth Task" above.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {tasks.map((task) => {
                    const catInfo = categoryLabels[task.category] || categoryLabels.skill;
                    return (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-2xl bg-zinc-950/70 border border-white/[0.06] hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white font-sans">{task.title}</span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${catInfo.color}`}>
                              {catInfo.label}
                            </span>
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              {task.points_reward} pts
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-sans truncate">
                            Assigned to: <strong className="text-zinc-200">{task.member_name}</strong>
                            {task.description ? ` • ${task.description}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {task.status === 'awarded' && (
                            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 size={11} /> +{task.points_awarded || task.points_reward} pts awarded
                            </span>
                          )}
                          {task.status === 'submitted' && (
                            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <Clock size={11} /> Awaiting Review
                            </span>
                          )}
                          {task.status === 'assigned' && (
                            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-white/[0.08]">
                              In Progress
                            </span>
                          )}
                          {task.status === 'needs_revision' && (
                            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                              <AlertCircle size={11} /> Revision Needed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── FOR MEMBERS & TEAM LEADS: Personal Growth Tasks (Hidden if 0 tasks) ── */
        <div className="rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border border-white/[0.08] p-6 shadow-xl shadow-black/40 hover:border-white/[0.12] transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <Target size={18} className="text-orange-400" />
                <h2 className="text-base sm:text-lg font-bold text-white font-serif tracking-tight">
                  Your Growth & Skill Mastery Tasks
                </h2>
              </div>
              <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 mt-1">
                Tasks assigned by administrators to elevate your craft. Complete them to earn points!
              </p>
            </div>

            {/* Personal Score Badge */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                <Trophy size={13} className="text-amber-400" />
                Earned: {userStats.total_points} Points
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => {
              const catInfo = categoryLabels[task.category] || categoryLabels.skill;
              return (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-zinc-950/80 border border-white/[0.08] hover:border-orange-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white font-sans">{task.title}</h4>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${catInfo.color}`}>
                        {catInfo.label}
                      </span>
                      <span className="text-[10px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                        +{task.points_reward} PTS
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {task.admin_feedback && (
                      <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-sans">
                        <strong className="text-orange-400">Admin Feedback:</strong> {task.admin_feedback}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {task.status === 'assigned' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setActiveSubmitTask(task);
                          setSubmissionNotes('');
                          setSubmissionUrl('');
                        }}
                        className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-sans font-semibold text-xs px-4 py-2 flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                      >
                        <Send size={12} />
                        Submit Results
                      </Button>
                    )}

                    {task.status === 'needs_revision' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setActiveSubmitTask(task);
                          setSubmissionNotes(task.submission_notes || '');
                          setSubmissionUrl(task.submission_url || '');
                        }}
                        className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-sans font-semibold text-xs px-4 py-2 flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <RotateCcw size={12} />
                        Resubmit Results
                      </Button>
                    )}

                    {task.status === 'submitted' && (
                      <span className="text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                        <Clock size={13} className="text-amber-400 animate-spin" /> Under Admin Review
                      </span>
                    )}

                    {task.status === 'awarded' && (
                      <span className="text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-400" /> +{task.points_awarded || task.points_reward} Points Awarded!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shared Dialogs for full studio view */}
      {renderDialogs()}
    </div>
  );
}
