'use client';

import { useState } from 'react';
import { CalendarDays, Plus, Clock, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface CalendarItem {
  id: string;
  title: string;
  description?: string;
  start_at: string;
  end_at?: string;
  is_all_day?: boolean;
  type: 'event' | 'todo';
  color?: string;
}

interface CalendarViewProps {
  initialEvents: CalendarItem[];
  currentUserId: string;
  projects?: { id: string; name: string }[];
}

export function CalendarView({ initialEvents, projects = [] }: CalendarViewProps) {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarItem[]>(initialEvents);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('10:00');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [createAsTask, setCreateAsTask] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDateFilter, setActiveDateFilter] = useState<string | null>(null);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthYearLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Days in current month grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Group events by date string
  const grouped: Record<string, CalendarItem[]> = {};
  events.forEach((ev) => {
    const dStr = ev.start_at ? ev.start_at.slice(0, 10) : 'Undated';
    if (!grouped[dStr]) grouped[dStr] = [];
    grouped[dStr].push(ev);
  });

  const sortedDates = Object.keys(grouped)
    .filter((dStr) => (activeDateFilter ? dStr === activeDateFilter : true))
    .sort();

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const startAt = `${date}T${time}:00.000Z`;
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          start_at: startAt,
          end_at: startAt,
          project_id: selectedProjectId || null,
          create_task: createAsTask,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const selectedProj = projects.find((p) => p.id === selectedProjectId);
        const newEvents: CalendarItem[] = [
          {
            id: json.data?.id || `ev_${Date.now()}`,
            title: title.trim(),
            description: selectedProj ? `${selectedProj.name} • ${description.trim()}` : description.trim(),
            start_at: startAt,
            type: 'event',
            color: '#39C6AE',
          },
        ];

        if (createAsTask && selectedProj) {
          newEvents.push({
            id: `todo_${Date.now()}`,
            title: `[Task] ${title.trim()}`,
            description: `${selectedProj.name} (open)`,
            start_at: startAt,
            end_at: startAt,
            is_all_day: true,
            type: 'todo',
            color: '#E9AC57',
          });
        }

        setEvents((prev) => [...prev, ...newEvents]);
        setTitle('');
        setDescription('');
        setSelectedProjectId('');
        setCreateAsTask(false);
        setIsModalOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(57,198,174,0.15)', color: 'var(--nf-accent, #39C6AE)' }}>
            <CalendarDays size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              Calendar &amp; Schedules
            </h1>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Milestones, scheduled events, and project task due dates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Navigation */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border" style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}>
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-mono font-semibold px-2 min-w-[120px] text-center" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              {monthYearLabel}
            </span>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 shadow-sm"
            style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
          >
            <Plus size={16} />
            Schedule Event / Task
          </button>
        </div>
      </div>

      {/* Month Days Overview Ribbon */}
      <div className="mb-6 p-4 rounded-2xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            {monthYearLabel} Days
          </span>
          {activeDateFilter && (
            <button
              onClick={() => setActiveDateFilter(null)}
              className="text-xs font-mono text-teal-400 hover:underline"
            >
              Show All Dates
            </button>
          )}
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono text-zinc-400 mb-2">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2 rounded-lg opacity-20 text-xs font-mono text-center">·</div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const count = grouped[dateStr]?.length || 0;
            const isSelected = activeDateFilter === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setActiveDateFilter(isSelected ? null : dateStr)}
                className={`p-2 rounded-xl text-xs font-mono transition-all flex flex-col items-center justify-center relative ${
                  isSelected
                    ? 'border-2 border-teal-400 bg-teal-400/20 text-white font-bold'
                    : count > 0
                    ? 'border border-teal-500/40 bg-teal-500/10 text-white hover:bg-teal-500/20'
                    : 'border border-zinc-800/60 hover:bg-zinc-800/40 text-zinc-400'
                }`}
              >
                <span>{dayNum}</span>
                {count > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events timeline */}
      {sortedDates.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
          <CalendarDays size={48} className="mx-auto mb-3 opacity-40" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }} />
          <p className="text-base font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
            {activeDateFilter ? `No events scheduled for ${activeDateFilter}` : 'No scheduled events yet'}
          </p>
          <p className="text-sm mt-1 max-w-sm mx-auto mb-5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            {activeDateFilter
              ? 'Click below to schedule an event on this date or select another day.'
              : 'Add deadlines to your project to-dos or schedule team meetings to populate your calendar.'}
          </p>
          <button
            onClick={() => {
              if (activeDateFilter) setDate(activeDateFilter);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
          >
            <Plus size={16} /> Schedule First Event
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => {
            const dateObj = new Date(dateStr);
            const dateHeader = isNaN(dateObj.getTime())
              ? dateStr
              : dateObj.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

            return (
              <div key={dateStr} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md" style={{ background: 'var(--nf-panel, #131E24)', color: 'var(--nf-accent, #39C6AE)' }}>
                    {dateHeader}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'var(--nf-border, #35464E)' }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {grouped[dateStr].map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border flex flex-col justify-between transition-all hover:border-opacity-100"
                      style={{
                        background: 'var(--nf-card, #1C2A31)',
                        borderColor: 'var(--nf-border, #35464E)',
                        borderLeftWidth: '4px',
                        borderLeftColor: item.color || 'var(--nf-accent, #39C6AE)',
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                            style={{
                              background: item.type === 'todo' ? 'rgba(233,172,87,0.15)' : 'rgba(57,198,174,0.15)',
                              color: item.type === 'todo' ? '#E9AC57' : 'var(--nf-accent, #39C6AE)',
                            }}
                          >
                            {item.type}
                          </span>
                          {item.start_at && (
                            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                              <Clock size={12} />
                              {item.is_all_day ? 'All day' : new Date(item.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-xs mt-1" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md p-6 rounded-2xl border shadow-2xl relative"
            style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                Schedule New Event / Task
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10"
                style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                  Event or Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Client Deliverable Review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    background: 'var(--nf-card, #1C2A31)',
                    border: '1px solid var(--nf-border, #35464E)',
                    color: 'var(--nf-text, #F2F6F8)',
                  }}
                />
              </div>

              {projects.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                    Associate with Project (Optional)
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      background: 'var(--nf-card, #1C2A31)',
                      border: '1px solid var(--nf-border, #35464E)',
                      color: 'var(--nf-text, #F2F6F8)',
                    }}
                  >
                    <option value="">No Project (General Calendar Event)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedProjectId && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60">
                  <input
                    type="checkbox"
                    id="createAsTaskCheck"
                    checked={createAsTask}
                    onChange={(e) => setCreateAsTask(e.target.checked)}
                    className="rounded border-zinc-700 text-teal-400 focus:ring-teal-400"
                  />
                  <label htmlFor="createAsTaskCheck" className="text-xs text-zinc-300 cursor-pointer select-none">
                    Also create as an open task / milestone in this project
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Agenda, video call links, or notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                  style={{
                    background: 'var(--nf-card, #1C2A31)',
                    border: '1px solid var(--nf-border, #35464E)',
                    color: 'var(--nf-text, #F2F6F8)',
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      background: 'var(--nf-card, #1C2A31)',
                      border: '1px solid var(--nf-border, #35464E)',
                      color: 'var(--nf-text, #F2F6F8)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      background: 'var(--nf-card, #1C2A31)',
                      border: '1px solid var(--nf-border, #35464E)',
                      color: 'var(--nf-text, #F2F6F8)',
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--nf-card, #1C2A31)', color: 'var(--nf-text-muted, #AAB8C0)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
                  style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
                >
                  <Check size={16} /> Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
