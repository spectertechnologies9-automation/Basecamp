'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, MessageSquare, Plus, Send, X, Clock } from 'lucide-react';
import { formatTimeAgo, getInitials, getAvatarColor } from '@/lib/utils';

export function CheckInsView({ project, initialCheckIns, currentUserId }: any) {
  const [checkIns, setCheckIns] = useState<any[]>(initialCheckIns || []);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [activeCheckInId, setActiveCheckInId] = useState<string | null>(null);
  const [newQuestionModal, setNewQuestionModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newSchedule, setNewSchedule] = useState('Every workday at 5:00 PM');
  const [submitting, setSubmitting] = useState(false);

  const postReply = async (checkInId: string) => {
    const text = replyText[checkInId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(`/api/projects/${project.id}/check-ins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_in_id: checkInId,
          response: text,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setCheckIns((prev) =>
            prev.map((ci) =>
              ci.id === checkInId
                ? { ...ci, responses: [json.data, ...(ci.responses || [])] }
                : ci
            )
          );
          setReplyText((prev) => ({ ...prev, [checkInId]: '' }));
          setActiveCheckInId(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/check-ins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion.trim(),
          schedule: newSchedule,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setCheckIns((prev) => [...prev, json.data]);
          setNewQuestion('');
          setNewQuestionModal(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-3">
          <Link href={`/projects/${project.id}`} className="hover:opacity-70" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            <ArrowLeft size={16} />
          </Link>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(57,198,174,0.15)', color: 'var(--nf-accent, #39C6AE)' }}>
            <CheckCircle2 size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              Automatic Check-ins · {project.name}
            </h1>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Asynchronous team standup questions and automated check-ins
            </p>
          </div>
        </div>

        <button
          onClick={() => setNewQuestionModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
        >
          <Plus size={14} /> New Question
        </button>
      </div>

      <div className="space-y-6">
        {checkIns.map((ci) => (
          <div
            key={ci.id}
            className="p-6 rounded-2xl border"
            style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                  {ci.question}
                </h2>
                <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                  <Clock size={12} />
                  {ci.schedule || 'Daily standup'}
                </p>
              </div>
              <button
                onClick={() => setActiveCheckInId(activeCheckInId === ci.id ? null : ci.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'var(--nf-card, #1C2A31)', color: 'var(--nf-accent, #39C6AE)', border: '1px solid var(--nf-border, #35464E)' }}
              >
                {activeCheckInId === ci.id ? 'Close' : 'Answer'}
              </button>
            </div>

            {/* Answer Box */}
            {activeCheckInId === ci.id && (
              <div className="mt-4 p-4 rounded-xl border mb-5" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-accent, #39C6AE)' }}>
                <textarea
                  rows={3}
                  placeholder="Share what you accomplished or what you're tackling next..."
                  value={replyText[ci.id] || ''}
                  onChange={(e) => setReplyText({ ...replyText, [ci.id]: e.target.value })}
                  className="w-full text-xs outline-none resize-none bg-transparent"
                  style={{ color: 'var(--nf-text, #F2F6F8)' }}
                />
                <div className="flex justify-end gap-2 mt-3 pt-2 border-t" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
                  <button
                    onClick={() => setActiveCheckInId(null)}
                    className="px-3 py-1 text-xs"
                    style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => postReply(ci.id)}
                    disabled={!replyText[ci.id]?.trim()}
                    className="px-3.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                    style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
                  >
                    <Send size={12} /> Submit
                  </button>
                </div>
              </div>
            )}

            {/* Responses List */}
            <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
              {(!ci.responses || ci.responses.length === 0) ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                  No one has answered yet today. Be the first to check in!
                </p>
              ) : (
                ci.responses.map((r: any) => {
                  const author = r.author_name || 'Team Member';
                  const color = getAvatarColor(r.user_id || author);
                  return (
                    <div key={r.id} className="p-3.5 rounded-xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{ background: color + '33', color }}
                        >
                          {getInitials(author)}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                          {author}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                          {formatTimeAgo(r.created_at)}
                        </span>
                      </div>
                      <p className="text-xs whitespace-pre-wrap leading-relaxed pl-8" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                        {r.response}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Question Modal */}
      {newQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md p-6 rounded-2xl border shadow-2xl relative"
            style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                New Check-in Question
              </h2>
              <button onClick={() => setNewQuestionModal(false)} className="p-1 rounded-lg hover:bg-white/10" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={createQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Question</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. What are your blockers this week?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Schedule</label>
                <input
                  type="text"
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewQuestionModal(false)}
                  className="px-4 py-2 rounded-lg text-xs"
                  style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
                >
                  Create Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
