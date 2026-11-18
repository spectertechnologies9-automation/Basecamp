'use client';

import { useState } from 'react';
import {
  Plus,
  Check,
  ChevronDown,
  ChevronRight,
  Calendar,
  Flag,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime, getInitials, getAvatarColor } from '@/lib/utils';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';
import type { TodoList, Todo, User, UserRole } from '@/types';

interface TodosViewProps {
  project: { id: string; name: string; color: string };
  todoLists: (TodoList & { todos: Todo[] })[];
  members: User[];
  currentUserId: string;
  userRole: UserRole;
}

export function TodosView({ project, todoLists: initialLists, members, currentUserId, userRole }: TodosViewProps) {
  const [lists, setLists] = useState(initialLists);
  const [newListName, setNewListName] = useState('');
  const [addingList, setAddingList] = useState(false);
  const [isSubmittingList, setIsSubmittingList] = useState(false);
  const [collapsedLists, setCollapsedLists] = useState<Set<string>>(new Set());

  const createList = async () => {
    if (!newListName.trim() || isSubmittingList) return;
    setIsSubmittingList(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName.trim(), position: lists.length }),
      });
      const json = await res.json();
      if (json.data) {
        setLists((prev) => [...prev, { ...json.data, todos: [] }]);
        setNewListName('');
        setAddingList(false);
      }
    } catch (err) {
      console.error('Failed to create list:', err);
    } finally {
      setIsSubmittingList(false);
    }
  };

  const toggleList = (listId: string) => {
    setCollapsedLists((prev) => {
      const next = new Set(prev);
      if (next.has(listId)) next.delete(listId);
      else next.add(listId);
      return next;
    });
  };

  const updateTodoStatus = async (todoId: string, listId: string, completed: boolean) => {
    const status = completed ? 'completed' : 'open';
    // Optimistic update
    setLists((prev) =>
      prev.map((l) =>
        l.id !== listId
          ? l
          : {
              ...l,
              todos: l.todos.map((t) => (t.id !== todoId ? t : { ...t, status })),
            }
      )
    );

    try {
      await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="min-h-full p-6 max-w-4xl mx-auto">
      {/* Back to Project */}
      <Link
        href={`/projects/${project.id}`}
        className="inline-flex items-center gap-1.5 text-xs mb-4 hover:opacity-80 transition-opacity"
        style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
      >
        <ArrowLeft size={14} />
        {project.name}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
            To-do Lists
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            Track and complete deliverables for {project.name}
          </p>
        </div>
        <button
          onClick={() => setAddingList(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
        >
          <Plus size={14} />
          New list
        </button>
      </div>

      {/* Add new list form */}
      {addingList && (
        <div
          className="rounded-xl border p-4 mb-5"
          style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-accent, #39C6AE)' }}
        >
          <input
            autoFocus
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') createList();
              if (e.key === 'Escape') setAddingList(false);
            }}
            placeholder="Name this list (e.g. Design, Sprint 1, Launch Day)..."
            className="w-full text-sm outline-none mb-3 bg-transparent"
            style={{ color: 'var(--nf-text, #F2F6F8)' }}
          />
          <div className="flex gap-2">
            <button
              onClick={createList}
              disabled={isSubmittingList}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
              style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
            >
              {isSubmittingList ? <Loader2 size={12} className="animate-spin" /> : null}
              Add list
            </button>
            <button
              onClick={() => setAddingList(false)}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {lists.length === 0 && !addingList && (
        <div
          className="text-center py-20 rounded-2xl border"
          style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
            style={{ background: 'var(--nf-card, #1C2A31)' }}
          >
            <Check size={24} style={{ color: 'var(--nf-accent, #39C6AE)' }} />
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
            No to-do lists yet
          </p>
          <p className="text-xs mb-5 max-w-sm mx-auto" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            Organize tasks into categorized lists for your team to check off.
          </p>
          <button
            onClick={() => setAddingList(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
          >
            <Plus size={15} />
            Create first list
          </button>
        </div>
      )}

      {/* Todo lists */}
      <div className="space-y-4">
        {lists.map((list) => (
          <TodoListCard
            key={list.id}
            list={list}
            projectId={project.id}
            members={members}
            currentUserId={currentUserId}
            isCollapsed={collapsedLists.has(list.id)}
            onToggle={() => toggleList(list.id)}
            onTodoStatusChange={updateTodoStatus}
            onTodoAdded={(todo) => {
              setLists((prev) =>
                prev.map((l) =>
                  l.id !== list.id ? l : { ...l, todos: [...l.todos, todo] }
                )
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}

function TodoListCard({
  list,
  projectId,
  members,
  currentUserId,
  isCollapsed,
  onToggle,
  onTodoStatusChange,
  onTodoAdded,
}: {
  list: TodoList & { todos: Todo[] };
  projectId: string;
  members: User[];
  currentUserId: string;
  isCollapsed: boolean;
  onToggle: () => void;
  onTodoStatusChange: (todoId: string, listId: string, completed: boolean) => void;
  onTodoAdded: (todo: Todo) => void;
}) {
  const [addingTodo, setAddingTodo] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [submittingTodo, setSubmittingTodo] = useState(false);

  const openTodos = list.todos.filter((t) => t.status !== 'completed');
  const completedTodos = list.todos.filter((t) => t.status === 'completed');

  const createTodo = async () => {
    if (!newTodoTitle.trim() || submittingTodo) return;
    setSubmittingTodo(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          todo_list_id: list.id,
          title: newTodoTitle.trim(),
          priority: 'medium',
        }),
      });

      const json = await res.json();
      if (json.data) {
        onTodoAdded(json.data as Todo);
        setNewTodoTitle('');
        setAddingTodo(false);
      }
    } catch (err) {
      console.error('Failed to create todo:', err);
    } finally {
      setSubmittingTodo(false);
    }
  };

  return (
    <div
      className="rounded-xl border overflow-hidden shadow-sm"
      style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}
    >
      {/* List header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={onToggle}
        style={{ borderBottom: `1px solid var(--nf-border, #35464E)` }}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight size={14} style={{ color: 'var(--nf-text-muted)' }} />
          ) : (
            <ChevronDown size={14} style={{ color: 'var(--nf-text-muted)' }} />
          )}
          <h3 className="text-sm font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
            {list.name}
          </h3>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'var(--nf-card, #1C2A31)', color: 'var(--nf-text-muted, #AAB8C0)' }}
          >
            {openTodos.length} open
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setAddingTodo(true);
          }}
          className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity"
          style={{ color: 'var(--nf-accent, #39C6AE)' }}
        >
          <Plus size={13} />
          Add a to-do
        </button>
      </div>

      {!isCollapsed && (
        <div>
          {/* Add todo input */}
          {addingTodo && (
            <div
              className="px-4 py-3 border-b"
              style={{ borderColor: 'var(--nf-border, #35464E)', background: 'var(--nf-card, #1C2A31)' }}
            >
              <input
                autoFocus
                type="text"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createTodo();
                  if (e.key === 'Escape') setAddingTodo(false);
                }}
                placeholder="What needs to be done?"
                className="w-full text-sm outline-none py-1 bg-transparent"
                style={{ color: 'var(--nf-text, #F2F6F8)' }}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={createTodo}
                  disabled={submittingTodo}
                  className="px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 disabled:opacity-60"
                  style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
                >
                  {submittingTodo ? <Loader2 size={12} className="animate-spin" /> : null}
                  Add this to-do
                </button>
                <button
                  onClick={() => setAddingTodo(false)}
                  className="px-3 py-1 rounded-md text-xs"
                  style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Open todos */}
          {openTodos.length === 0 && !addingTodo && (
            <div className="px-4 py-4 text-center">
              <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                No open to-dos in this list
              </p>
            </div>
          )}
          {openTodos.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              listId={list.id}
              projectId={projectId}
              members={members}
              onStatusChange={onTodoStatusChange}
            />
          ))}

          {/* Completed todos */}
          {completedTodos.length > 0 && (
            <CompletedSection
              todos={completedTodos}
              listId={list.id}
              onStatusChange={onTodoStatusChange}
            />
          )}
        </div>
      )}
    </div>
  );
}

function TodoRow({
  todo,
  listId,
  projectId,
  members,
  onStatusChange,
}: {
  todo: Todo;
  listId: string;
  projectId: string;
  members: User[];
  onStatusChange: (todoId: string, listId: string, completed: boolean) => void;
}) {
  const isCompleted = todo.status === 'completed';
  const isOverdue =
    todo.due_date && new Date(todo.due_date) < new Date() && !isCompleted;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 group hover:bg-white/[0.02] transition-colors border-b last:border-0"
      style={{ borderColor: 'var(--nf-border, #35464E)' }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onStatusChange(todo.id, listId, !isCompleted)}
        className="flex-shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors"
        style={{
          borderColor: isCompleted
            ? 'var(--nf-accent, #39C6AE)'
            : 'var(--nf-border, #35464E)',
          background: isCompleted ? 'var(--nf-accent, #39C6AE)' : 'transparent',
        }}
      >
        {isCompleted && <Check size={11} style={{ color: '#0B1419' }} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/projects/${projectId}/todos/${todo.id}`}
          className={`text-sm transition-colors hover:underline ${
            isCompleted ? 'line-through' : ''
          }`}
          style={{
            color: isCompleted
              ? 'var(--nf-text-muted, #AAB8C0)'
              : 'var(--nf-text, #F2F6F8)',
          }}
        >
          {todo.title}
        </Link>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {todo.priority && todo.priority !== 'medium' && (
            <span
              className="flex items-center gap-1 text-[10px] font-medium"
              style={{ color: PRIORITY_COLORS[todo.priority] }}
            >
              <Flag size={10} />
              {PRIORITY_LABELS[todo.priority]}
            </span>
          )}

          {todo.due_date && (
            <span
              className="flex items-center gap-1 text-[10px]"
              style={{
                color: isOverdue
                  ? 'var(--nf-danger, #E56B70)'
                  : 'var(--nf-text-muted, #AAB8C0)',
              }}
            >
              <Calendar size={10} />
              {formatRelativeTime(todo.due_date)}
            </span>
          )}

          {todo.assignee_ids && todo.assignee_ids.length > 0 && (
            <div className="flex -space-x-1">
              {todo.assignee_ids.slice(0, 3).map((uid) => {
                const u = members.find((m) => m.id === uid);
                const name = u?.full_name ?? '?';
                const bg = getAvatarColor(uid);
                return (
                  <div
                    key={uid}
                    className="w-4 h-4 rounded-full border text-[7px] font-bold flex items-center justify-center"
                    style={{
                      background: bg + '33',
                      color: bg,
                      borderColor: 'var(--nf-panel, #131E24)',
                    }}
                    title={name}
                  >
                    {getInitials(name)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompletedSection({
  todos,
  listId,
  onStatusChange,
}: {
  todos: Todo[];
  listId: string;
  onStatusChange: (todoId: string, listId: string, completed: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-t" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-4 py-2 text-xs hover:bg-white/[0.02] transition-colors"
        style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {todos.length} completed
      </button>
      {expanded &&
        todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-3 px-4 py-2 border-t opacity-60"
            style={{ borderColor: 'var(--nf-border, #35464E)' }}
          >
            <button
              onClick={() => onStatusChange(todo.id, listId, false)}
              className="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center"
              style={{
                borderColor: 'var(--nf-accent, #39C6AE)',
                background: 'var(--nf-accent, #39C6AE)',
              }}
            >
              <Check size={10} style={{ color: '#0B1419' }} />
            </button>
            <span
              className="text-sm line-through flex-1"
              style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
            >
              {todo.title}
            </span>
          </div>
        ))}
    </div>
  );
}
