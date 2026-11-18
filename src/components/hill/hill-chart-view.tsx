'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mountain, CheckCircle2 } from 'lucide-react';

interface HillItem {
  id: string;
  title: string;
  progress: number; // 0 - 100
  status: string;
  color: string;
}

const COLORS = ['#39C6AE', '#E9AC57', '#E56B70', '#6C8EBF', '#9B7EC8', '#52B788'];

export function HillChartView({ project, todos }: any) {
  // Initialize hill points from todos
  const [items, setItems] = useState<HillItem[]>(() => {
    return (todos || []).map((t: any, index: number) => {
      let initialProgress = 20;
      if (t.status === 'completed') initialProgress = 100;
      else if (t.status === 'in_progress') initialProgress = 50;
      else if (t.status === 'review') initialProgress = 80;
      else initialProgress = ((index * 25) % 40) + 10;

      return {
        id: t.id,
        title: t.title,
        progress: initialProgress,
        status: t.status,
        color: COLORS[index % COLORS.length],
      };
    });
  });

  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id || null);

  const updateProgress = async (id: string, newProgress: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, progress: newProgress } : item))
    );

    // If moved to 100%, mark as completed
    const status = newProgress >= 95 ? 'completed' : newProgress >= 50 ? 'in_progress' : 'open';
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // SVG hill curve math (bell curve / smooth sine hill)
  const width = 800;
  const height = 280;
  const getCoordinates = (p: number) => {
    const x = 50 + (p / 100) * (width - 100);
    // Gaussian-like bell curve: peak at p=50
    const normalized = (p - 50) / 28;
    const yFactor = Math.exp(-0.5 * normalized * normalized);
    const y = height - 40 - yFactor * (height - 80);
    return { x, y };
  };

  const selectedItem = items.find((i) => i.id === selectedId);

  return (
    <div className="min-h-full p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-3">
          <Link href={`/projects/${project.id}`} className="hover:opacity-70" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            <ArrowLeft size={16} />
          </Link>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(57,198,174,0.15)', color: 'var(--nf-accent, #39C6AE)' }}>
            <Mountain size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              Hill Chart · {project.name}
            </h1>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Track scope certainty: figuring things out (uphill) vs. execution (downhill)
            </p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
          <Mountain size={48} className="mx-auto mb-3 opacity-40" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }} />
          <p className="font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>No scopes on the hill yet</p>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            Create tasks in your project to track them visually along the hill.
          </p>
          <Link
            href={`/projects/${project.id}/todos`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
          >
            Create Tasks
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SVG Hill Chart */}
          <div
            className="p-6 rounded-2xl border relative overflow-hidden"
            style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}
          >
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider mb-2 px-6" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              <span>← Figuring things out (Unknowns)</span>
              <span>Top of the Hill (Known)</span>
              <span>Making it happen (Execution) →</span>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
              <defs>
                <linearGradient id="hillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#39C6AE" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#39C6AE" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Hill Curve Path */}
              <path
                d="M 50 240 Q 200 240 300 130 T 400 40 T 500 130 Q 600 240 750 240"
                fill="none"
                stroke="var(--nf-border, #35464E)"
                strokeWidth="4"
              />

              {/* Center peak dotted line */}
              <line
                x1={width / 2}
                y1="30"
                x2={width / 2}
                y2="250"
                stroke="var(--nf-border, #35464E)"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />

              {/* Hill Item Points */}
              {items.map((item) => {
                const { x, y } = getCoordinates(item.progress);
                const isSelected = item.id === selectedId;

                return (
                  <g
                    key={item.id}
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => setSelectedId(item.id)}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 10 : 7}
                      fill={item.color}
                      stroke="#0B1419"
                      strokeWidth={isSelected ? 3 : 2}
                    />
                    <text
                      x={x}
                      y={y - 14}
                      textAnchor="middle"
                      fill="var(--nf-text, #F2F6F8)"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {item.title.slice(0, 15)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive Progress Slider */}
          {selectedItem && (
            <div
              className="p-5 rounded-2xl border"
              style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: selectedItem.color }} />
                  <h3 className="text-sm font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                    {selectedItem.title}
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'var(--nf-panel, #131E24)', color: 'var(--nf-accent, #39C6AE)' }}>
                  {selectedItem.progress}% {selectedItem.progress < 50 ? '(Figuring out)' : selectedItem.progress === 50 ? '(At the top)' : '(Shipping)'}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={selectedItem.progress}
                onChange={(e) => updateProgress(selectedItem.id, parseInt(e.target.value, 10))}
                className="w-full accent-emerald-400 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] mt-2" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                <span>0% Starting</span>
                <span>50% Clear roadmap &amp; solution</span>
                <span>100% Fully built &amp; tested</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
