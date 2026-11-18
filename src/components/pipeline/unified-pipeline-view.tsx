'use client';

import { useState, useEffect, useCallback } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  CheckSquare,
  FileText,
  CalendarClock,
  Loader2,
  Filter,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export type PipelineStage =
  | 'onboarding'
  | 'scripting'
  | 'concepts-approval'
  | 'design'
  | 'production'
  | 'post-production'
  | 'final-approval';

export const PIPELINE_STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'onboarding', label: 'Onboarding', color: 'bg-muted-foreground/30' },
  { key: 'scripting', label: 'Scripting', color: 'bg-sky-500/30' },
  { key: 'concepts-approval', label: 'Concepts Approval', color: 'bg-amber-500/30' },
  { key: 'design', label: 'Design', color: 'bg-indigo-500/30' },
  { key: 'production', label: 'Production', color: 'bg-emerald-500/30' },
  { key: 'post-production', label: 'Post Production', color: 'bg-orange-500/30' },
  { key: 'final-approval', label: 'Final Approval', color: 'bg-rose-500/30' },
];

export interface PipelineCard {
  id: string;
  title: string;
  stage: PipelineStage;
  source: 'todo' | 'file_approval' | 'scheduled_post';
  projectId: string;
  projectName?: string;
  assignee?: string;
  dueDate?: string;
  status?: string;
  platform?: string;
  priority?: string;
  createdAt: string;
}

const sourceConfig: Record<
  PipelineCard['source'],
  { icon: typeof CheckSquare; label: string; color: string }
> = {
  todo: { icon: CheckSquare, label: 'Task', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  file_approval: { icon: FileText, label: 'Asset', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  scheduled_post: { icon: CalendarClock, label: 'Post', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
};

interface UnifiedPipelineProps {
  projectId?: string;
  showProjectFilter?: boolean;
}

export function UnifiedPipeline({ projectId, showProjectFilter = true }: UnifiedPipelineProps) {
  const [cards, setCards] = useState<PipelineCard[]>([]);
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [draggedCard, setDraggedCard] = useState<PipelineCard | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
  const [filterProject, setFilterProject] = useState<string>('all');

  // Add Item Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemSource, setNewItemSource] = useState<'todo' | 'file_approval' | 'scheduled_post'>('todo');
  const [newItemStage, setNewItemStage] = useState<PipelineStage>('scripting');
  const [newItemProject, setNewItemProject] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPipeline = useCallback(async () => {
    try {
      const url = projectId ? `/api/pipeline?projectId=${projectId}` : '/api/pipeline';
      const res = await fetch(url);
      const data = await res.json();
      if (data.cards) {
        setCards(data.cards);
        setProjectNames(data.projectNames || {});
        if (!newItemProject && Object.keys(data.projectNames || {}).length > 0) {
          setNewItemProject(Object.keys(data.projectNames)[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId, newItemProject]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const moveCard = async (card: PipelineCard, targetStage: PipelineStage) => {
    // Optimistic update
    setCards((prev) =>
      prev.map((c) =>
        c.id === card.id && c.source === card.source ? { ...c, stage: targetStage } : c
      )
    );

    try {
      await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: card.id, source: card.source, stage: targetStage }),
      });
    } catch {
      fetchPipeline();
    }
  };

  const handleDragStart = (e: React.DragEvent, card: PipelineCard) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ id: card.id, source: card.source }));
    setDraggedCard(card);
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDrop = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const card = cards.find((c) => c.id === data.id && c.source === data.source);
      if (card && card.stage !== stage) {
        moveCard(card, stage);
      }
    } catch {}
    setDraggedCard(null);
    setDragOverStage(null);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    setSubmitting(true);
    const targetProj = projectId || newItemProject || Object.keys(projectNames)[0] || 'proj_1';

    try {
      if (newItemSource === 'todo') {
        await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: targetProj,
            title: newItemTitle,
            pipeline_stage: newItemStage,
          }),
        });
      } else {
        await fetch('/api/pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: 'item_' + Date.now(),
            source: newItemSource,
            stage: newItemStage,
          }),
        });
      }
      setNewItemTitle('');
      setModalOpen(false);
      fetchPipeline();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCards =
    filterProject === 'all' ? cards : cards.filter((c) => c.projectId === filterProject);

  const uniqueProjects = Object.entries(projectNames);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card/60">
        <div className="flex items-center gap-2">
          {showProjectFilter && uniqueProjects.length > 1 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="w-[200px] h-8 text-xs font-mono uppercase">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {uniqueProjects.map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {filteredCards.length} item{filteredCards.length !== 1 ? 's' : ''} in pipeline
          </span>
        </div>

        <Button
          size="sm"
          onClick={() => setModalOpen(true)}
          className="text-xs font-mono uppercase tracking-wider gap-1.5 h-8 bg-primary text-primary-foreground font-semibold"
        >
          <Plus size={13} />
          Add Pipeline Card
        </Button>
      </div>

      {/* Kanban Board Container */}
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-6 min-w-max">
          {PIPELINE_STAGES.map((stage) => {
            const stageCards = filteredCards.filter((c) => c.stage === stage.key);
            const isOver = dragOverStage === stage.key;

            return (
              <div
                key={stage.key}
                className="w-[260px] shrink-0"
                onDragOver={(e) => handleDragOver(e, stage.key)}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => handleDrop(e, stage.key)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('inline-block w-2 h-2 rounded-full', stage.color)} />
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                      {stage.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">
                    {stageCards.length}
                  </span>
                </div>

                {/* Column body */}
                <div
                  className={cn(
                    'min-h-[280px] rounded-xl bg-secondary/20 border border-border/50 p-2.5 space-y-2.5 transition-all duration-200',
                    isOver && 'border-2 border-dashed border-primary/50 bg-primary/10 shadow-inner'
                  )}
                >
                  {stageCards.length === 0 && !isOver && (
                    <div className="text-[11px] text-muted-foreground/40 text-center py-16 font-mono uppercase tracking-wider">
                      Empty
                    </div>
                  )}
                  {stageCards.length === 0 && isOver && (
                    <div className="text-[11px] text-primary text-center py-16 font-mono uppercase tracking-wider animate-pulse">
                      Drop here
                    </div>
                  )}

                  {stageCards.map((card, i) => {
                    const sc = sourceConfig[card.source] || sourceConfig.todo;
                    const Icon = sc.icon;
                    const isDragged = draggedCard?.id === card.id && draggedCard?.source === card.source;

                    return (
                      <div
                        key={`${card.source}-${card.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'rounded-lg bg-card border border-border p-3.5 cursor-grab active:cursor-grabbing transition-all duration-150 hover:border-primary/40 hover:shadow-md animate-fade-in',
                          isDragged && 'opacity-25 scale-95'
                        )}
                        style={{ animationDelay: `${i * 25}ms` }}
                      >
                        {/* Source badge + status */}
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-5 gap-1 border', sc.color)}>
                            <Icon className="h-3 w-3" />
                            {sc.label}
                          </Badge>
                          {card.status && (
                            <span className="text-[9px] font-mono uppercase text-muted-foreground">
                              {card.status}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-medium leading-tight mb-1.5 line-clamp-2 text-foreground">
                          {card.title}
                        </h4>

                        {/* Project name (global view) */}
                        {!projectId && card.projectName && (
                          <div className="text-[10px] font-mono text-muted-foreground mb-1.5 truncate">
                            {card.projectName}
                          </div>
                        )}

                        {/* Platform badge */}
                        {card.platform && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 mb-1.5 font-mono uppercase">
                            {card.platform}
                          </Badge>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                          {card.assignee ? (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                              {card.assignee}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/40 italic">
                              Unassigned
                            </span>
                          )}
                          {card.dueDate && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {new Date(card.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Add Card Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold font-mono uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Add Pipeline Card
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateItem} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">
                Card Title / Asset Name
              </label>
              <Input
                placeholder="e.g. Campaign Hero Video or Logo Draft"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                required
                className="text-sm font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">
                  Category Type
                </label>
                <Select
                  value={newItemSource}
                  onValueChange={(val: any) => setNewItemSource(val)}
                >
                  <SelectTrigger className="text-xs font-mono uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Task / Todo</SelectItem>
                    <SelectItem value="file_approval">Media Asset</SelectItem>
                    <SelectItem value="scheduled_post">Social Post</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">
                  Initial Stage
                </label>
                <Select
                  value={newItemStage}
                  onValueChange={(val: any) => setNewItemStage(val)}
                >
                  <SelectTrigger className="text-xs font-mono uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGES.map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {uniqueProjects.length > 0 && !projectId && (
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">
                  Target Project
                </label>
                <Select
                  value={newItemProject || uniqueProjects[0][0]}
                  onValueChange={setNewItemProject}
                >
                  <SelectTrigger className="text-xs font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueProjects.map(([id, name]) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="text-xs font-mono uppercase"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !newItemTitle.trim()}
                className="text-xs font-mono uppercase font-semibold bg-primary text-primary-foreground"
              >
                {submitting ? 'Creating...' : 'Create Card'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
