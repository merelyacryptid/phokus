import React, { useState, useMemo, useEffect } from 'react';
import type { Task, ThemeMode } from '../types';
import {
  Check,
  Plus,
  Trash2,
  X,
  ListTodo,
  Target,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Clock,
  CalendarClock,
  CalendarPlus,
  AlertCircle,
} from 'lucide-react';
import { soundEngine } from '../utils/audio';
import {
  formatDeadlineLabel,
  getDeadlineBadgeClasses,
  isDeadlineReached,
  splitDeadlineTo12h,
  combine12hToDeadline,
  type Deadline12hParts,
} from '../utils/deadline';
import { DeadlineFields } from './DeadlineFields';
import confetti from 'canvas-confetti';

interface TasksDrawerProps {
  isOpen: boolean;
  tasks: Task[];
  activeTaskId: string | null;
  theme: ThemeMode;
  defaultFocusMinutes?: number;
  onClose: () => void;
  onAddTask: (title: string, estimatedMinutes?: number, deadline?: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onClearAll: () => void;
  onSelectActiveTask: (taskId: string) => void;
  onReorderTasks: (newTasks: Task[]) => void;
  onUpdateTaskDeadline: (taskId: string, deadline?: string) => void;
}

const TasksDrawerInner: React.FC<Omit<TasksDrawerProps, 'isOpen'>> = ({
  tasks,
  activeTaskId,
  theme,
  defaultFocusMinutes = 40,
  onClose,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onClearAll,
  onSelectActiveTask,
  onReorderTasks,
  onUpdateTaskDeadline,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [newDeadlineParts, setNewDeadlineParts] = useState<Deadline12hParts>(() =>
    splitDeadlineTo12h(undefined, { emptyTime: true })
  );
  const [editingDeadlineTaskId, setEditingDeadlineTaskId] = useState<string | null>(null);
  const [editingDeadlineParts, setEditingDeadlineParts] = useState<Deadline12hParts>(() =>
    splitDeadlineTo12h(undefined, { emptyTime: false })
  );
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const isMatteBlack = theme === 'matte-black';
  const isDark = theme === 'dark-mesh' || isMatteBlack;
  const completedCount = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);

  // Periodically refresh current wall-clock time so deadlines flip green -> red automatically
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const handleClearClick = () => {
    if (confirmClear) {
      onClearAll();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const parsedEst = estimatedMinutes.trim() ? parseInt(estimatedMinutes, 10) : undefined;
    const validEst = (parsedEst && parsedEst > 0 && !isNaN(parsedEst)) ? parsedEst : undefined;
    const validDeadline = combine12hToDeadline(newDeadlineParts, Date.now());
    onAddTask(newTitle.trim(), validEst, validDeadline);
    setNewTitle('');
    setEstimatedMinutes('');
    setNewDeadlineParts(splitDeadlineTo12h(undefined, { emptyTime: true, nowMs: Date.now() }));
    setNowMs(Date.now());
  };

  const handleStartEditDeadline = (task: Task) => {
    setEditingDeadlineTaskId(task.id);
    setEditingDeadlineParts(
      splitDeadlineTo12h(task.deadline, { emptyTime: false, nowMs: Date.now() })
    );
  };

  const handleSaveDeadline = (taskId: string) => {
    const nextDeadline = combine12hToDeadline(editingDeadlineParts, Date.now());
    onUpdateTaskDeadline(taskId, nextDeadline);
    setEditingDeadlineTaskId(null);
    setNowMs(Date.now());
  };

  const handleClearDeadline = (taskId: string) => {
    onUpdateTaskDeadline(taskId, undefined);
    setEditingDeadlineTaskId(null);
  };

  const handleToggle = (task: Task) => {
    if (!task.completed) {
      soundEngine.unlockAudio();
      soundEngine.playTaskComplete();
      // Clean celebratory confetti
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
        colors: isDark ? ['#f43f5e', '#ec4899', '#fb7185', '#fda4af'] : ['#f43f5e', '#fb7185', '#fda4af']
      });
    }
    onToggleTask(task.id);
  };

  const moveTask = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= tasks.length || fromIndex === toIndex) return;
    const reordered = [...tasks];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    onReorderTasks(reordered);
  };

  // Drag and drop handlers - isolated to Grip Handle to prevent scroll hijacking
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveTask(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const inputBaseClass = isMatteBlack
    ? 'bg-[#151518] text-white placeholder-neutral-500 border border-neutral-700 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white/50'
    : isDark
      ? 'bg-[#1f1b2b] text-white placeholder-pink-300/40 border border-pink-500/30 focus-visible:border-pink-400 focus-visible:ring-1 focus-visible:ring-pink-500/50'
      : 'bg-pink-50 text-pink-950 placeholder-pink-900/40 border border-pink-200 focus-visible:border-pink-500 focus-visible:ring-1 focus-visible:ring-pink-400/50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Card with Fixed Height & Solid Opaque Background */}
      <div
        data-tour="tasks-drawer-card"
        className={`relative w-full max-w-md h-[600px] max-h-[90vh] flex flex-col rounded-3xl p-6 shadow-2xl transition-colors duration-200 ${isMatteBlack
          ? 'bg-[#0f0f12] border border-neutral-700/80 text-white shadow-2xl shadow-black/95'
          : isDark
            ? 'bg-[#161420] border border-pink-500/30 text-white shadow-2xl shadow-black/90'
            : 'bg-white border border-pink-200 text-pink-950 shadow-2xl shadow-pink-200/50'
          }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b ${isMatteBlack ? 'border-neutral-800' : 'border-pink-500/20'} mb-4 select-none shrink-0`}>
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-2xl flex items-center justify-center ${isMatteBlack
                ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                : isDark
                  ? 'bg-pink-600/20 text-pink-400 border border-pink-500/35 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                  : 'bg-pink-100 text-pink-600 border border-pink-200'
                }`}
            >
              <ListTodo size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-pink-950'}`}>Tasks</h2>
              <p className={`text-xs font-medium ${isMatteBlack ? 'text-neutral-400' : isDark ? 'text-pink-300/80' : 'text-pink-900/70'}`}>
                {completedCount} of {tasks.length} completed
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Clear All Button */}
            {tasks.length > 0 && (
              <button
                type="button"
                onClick={handleClearClick}
                title={confirmClear ? "Click again to confirm clearing all tasks" : "Clear all tasks"}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all duration-200 active:scale-95 ${confirmClear
                  ? 'bg-red-600 text-white border border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
                  : isMatteBlack
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
                    : isDark
                      ? 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 hover:border-red-500/50'
                      : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300'
                  }`}
              >
                <Trash2 size={13} className="stroke-[2.2]" />
                <span>{confirmClear ? 'Clear all?' : 'Clear'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close tasks drawer"
              className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-neutral-400 hover:text-white' : 'hover:bg-pink-100 text-pink-800 hover:text-pink-950'
                }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Task List (Fixed container with smooth scrolling) */}
        <div className="smooth-scroll-container flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1.5">
          {tasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 select-none">
              <div
                className={`p-4 rounded-2xl ${isMatteBlack
                  ? 'bg-neutral-800/80 text-white border border-neutral-700'
                  : isDark
                    ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                    : 'bg-pink-100/80 text-pink-600 border border-pink-200'
                  }`}
              >
                <ListTodo size={30} className="stroke-[2]" />
              </div>
              <div>
                <p className={`text-base font-semibold ${isDark ? 'text-white' : 'text-pink-950'}`}>
                  No tasks yet
                </p>
                <p className={`text-xs mt-1 ${isMatteBlack ? 'text-neutral-400' : isDark ? 'text-pink-300/70' : 'text-pink-900/60'}`}>
                  Add a task below to stay focused and track progress
                </p>
              </div>
            </div>
          ) : (
            tasks.map((task, idx) => {
              const isCurrentFocus = activeTaskId === task.id && !task.completed;
              const isDragging = draggedIndex === idx;
              const isOver = dragOverIndex === idx && draggedIndex !== idx;
              const isEditingThisDeadline = editingDeadlineTaskId === task.id;
              const overdue = task.deadline ? isDeadlineReached(task.deadline, nowMs) : false;

              return (
                <div
                  key={task.id}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={`group relative flex items-center justify-between p-3.5 rounded-2xl transition-all duration-150 select-none ${isDragging ? 'opacity-35 scale-[0.98]' : 'opacity-100'
                    } ${isOver
                      ? isMatteBlack
                        ? 'border-2 border-dashed border-white bg-white/10'
                        : 'border-2 border-dashed border-pink-500 bg-pink-500/15'
                      : isCurrentFocus
                        ? isMatteBlack
                          ? 'bg-[#1b1b1e] border-2 border-white shadow-[0_0_14px_rgba(255,255,255,0.2)]'
                          : isDark
                            ? 'bg-[#282136] border-2 border-pink-500 shadow-[0_0_14px_rgba(244,63,94,0.3)]'
                            : 'bg-pink-100 border-2 border-pink-400 shadow-sm'
                        : isMatteBlack
                          ? 'bg-[#151518] hover:bg-[#1c1c20] border border-neutral-800 hover:border-neutral-700'
                          : isDark
                            ? 'bg-[#1f1b2b] hover:bg-[#272236] border border-pink-500/20 hover:border-pink-500/40'
                            : 'bg-pink-50/90 hover:bg-pink-100/80 border border-pink-200/80 hover:border-pink-300'
                    }`}
                >
                  <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                    {/* Dedicated Drag Handle */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragEnd={handleDragEnd}
                      title="Drag to reorder"
                      className={`cursor-grab active:cursor-grabbing p-1.5 rounded-lg transition-colors touch-none ${isMatteBlack
                        ? 'text-neutral-500 hover:text-white hover:bg-white/10'
                        : isDark
                          ? 'text-pink-400/60 hover:text-pink-200 hover:bg-white/10'
                          : 'text-pink-900/40 hover:text-pink-700 hover:bg-pink-200/50'
                        }`}
                    >
                      <GripVertical size={16} />
                    </div>

                    {/* Square Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggle(task)}
                      title={task.completed ? "Mark as uncompleted" : "Mark as completed"}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-150 shrink-0 ${task.completed
                        ? isMatteBlack
                          ? 'bg-white text-black border border-white shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                          : 'bg-pink-600 text-white border border-pink-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                        : isMatteBlack
                          ? 'border-2 border-neutral-500 hover:border-white bg-white/5'
                          : isDark
                            ? 'border-2 border-pink-400/50 hover:border-pink-400 bg-white/10'
                            : 'border-2 border-pink-300 hover:border-pink-500 bg-white'
                        }`}
                    >
                      {task.completed && <Check size={16} className="stroke-[3]" />}
                    </button>

                    {/* Task Title, Estimate, and Optional Editable Deadline */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-1.5 min-w-0">
                        <span
                          onClick={() => handleToggle(task)}
                          className={`text-sm sm:text-base truncate max-w-full cursor-pointer transition-colors ${task.completed
                            ? isMatteBlack
                              ? 'line-through text-neutral-500 font-normal'
                              : isDark
                                ? 'line-through text-pink-300/50 font-normal'
                                : 'line-through text-pink-900/50 font-normal'
                            : isDark
                              ? 'text-white font-semibold'
                              : 'text-pink-950 font-semibold'
                            }`}
                        >
                          {task.title}
                        </span>
                        {task.estimatedMinutes && (
                          <span
                            title={`Estimated focus time: ${task.estimatedMinutes} minutes`}
                            className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${
                              isMatteBlack
                                ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                                : isDark
                                  ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                                  : 'bg-pink-100 text-pink-700 border border-pink-200'
                            }`}
                          >
                            <Clock size={10} className="stroke-[2.2]" />
                            <span>{task.estimatedMinutes}m</span>
                          </span>
                        )}
                        {task.deadline && !isEditingThisDeadline && (
                          <button
                            type="button"
                            onClick={() => handleStartEditDeadline(task)}
                            title={`${overdue ? 'Past deadline' : 'Before deadline'}: ${formatDeadlineLabel(task.deadline, nowMs)} (click to edit)`}
                            className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold shrink-0 transition-opacity cursor-pointer hover:opacity-85 ${getDeadlineBadgeClasses(overdue, theme)} ${task.completed ? 'opacity-65' : ''}`}
                          >
                            {overdue ? (
                              <AlertCircle size={10} className="stroke-[2.3] shrink-0" />
                            ) : (
                              <CalendarClock size={10} className="stroke-[2.2] shrink-0" />
                            )}
                            <span>{formatDeadlineLabel(task.deadline, nowMs)}</span>
                          </button>
                        )}
                      </div>

                      {/* Inline Deadline Editor (12h AM/PM Time first, Date second defaulting to today) */}
                      {isEditingThisDeadline && (
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <DeadlineFields
                            value={editingDeadlineParts}
                            onChange={setEditingDeadlineParts}
                            theme={theme}
                            allowEmptyHour={false}
                            onEnter={() => handleSaveDeadline(task.id)}
                            onEscape={() => setEditingDeadlineTaskId(null)}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveDeadline(task.id)}
                            title="Save deadline"
                            aria-label="Save deadline"
                            className={`p-1 rounded-lg transition-colors ${
                              isMatteBlack
                                ? 'bg-white text-black hover:bg-neutral-200'
                                : 'bg-pink-600 text-white hover:bg-pink-500'
                            }`}
                          >
                            <Check size={12} className="stroke-[2.5]" />
                          </button>
                          {task.deadline && (
                            <button
                              type="button"
                              onClick={() => handleClearDeadline(task.id)}
                              title="Remove deadline"
                              aria-label="Remove deadline"
                              className={`p-1 rounded-lg transition-colors ${
                                isDark
                                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                  : 'bg-red-100 text-red-600 hover:bg-red-200'
                              }`}
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingDeadlineTaskId(null)}
                            title="Cancel editing"
                            aria-label="Cancel editing deadline"
                            className={`p-1 rounded-lg transition-colors ${
                              isDark ? 'hover:bg-white/10 text-neutral-400' : 'hover:bg-pink-200/70 text-pink-800'
                            }`}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}

                      {isCurrentFocus && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isMatteBlack ? 'text-neutral-300' : 'text-pink-400'}`}>
                          Current Focus
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Add/Edit Deadline, Reorder up/down, Select Focus, Delete */}
                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    {/* Add/Edit Deadline Button */}
                    <button
                      type="button"
                      onClick={() => handleStartEditDeadline(task)}
                      title={task.deadline ? 'Edit deadline' : 'Add deadline'}
                      aria-label={task.deadline ? 'Edit deadline' : 'Add deadline'}
                      className={`p-1.5 rounded-lg transition-colors ${isMatteBlack
                        ? 'hover:bg-white/10 text-neutral-400 hover:text-white'
                        : isDark ? 'hover:bg-white/10 text-pink-300/70 hover:text-pink-100' : 'hover:bg-pink-200/60 text-pink-900/60 hover:text-pink-950'
                        }`}
                    >
                      <CalendarPlus size={15} />
                    </button>

                    {/* Move Up */}
                    <button
                      type="button"
                      onClick={() => moveTask(idx, idx - 1)}
                      disabled={idx === 0}
                      title="Move Up"
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed ${isMatteBlack
                        ? 'hover:bg-white/10 text-neutral-400 hover:text-white'
                        : isDark ? 'hover:bg-white/10 text-pink-300/70 hover:text-pink-100' : 'hover:bg-pink-200/60 text-pink-900/60 hover:text-pink-950'
                        }`}
                    >
                      <ChevronUp size={16} />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      onClick={() => moveTask(idx, idx + 1)}
                      disabled={idx === tasks.length - 1}
                      title="Move Down"
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed ${isMatteBlack
                        ? 'hover:bg-white/10 text-neutral-400 hover:text-white'
                        : isDark ? 'hover:bg-white/10 text-pink-300/70 hover:text-pink-100' : 'hover:bg-pink-200/60 text-pink-900/60 hover:text-pink-950'
                        }`}
                    >
                      <ChevronDown size={16} />
                    </button>

                    {/* Focus Target Button */}
                    {!task.completed && (
                      <button
                        type="button"
                        onClick={() => onSelectActiveTask(task.id)}
                        title="Set as Current Focus on Timer"
                        className={`p-1.5 rounded-lg text-xs flex items-center transition-colors ${isCurrentFocus
                          ? isMatteBlack
                            ? 'bg-white/20 text-white border border-white/40'
                            : isDark
                              ? 'bg-pink-600/30 text-pink-300 border border-pink-500/40'
                              : 'bg-pink-200 text-pink-700 font-semibold'
                          : isMatteBlack
                            ? 'hover:bg-white/10 text-neutral-400 hover:text-white'
                            : isDark
                              ? 'hover:bg-pink-950/50 text-pink-200/60 hover:text-pink-200'
                              : 'hover:bg-pink-200/60 text-pink-700/60 hover:text-pink-900'
                          }`}
                      >
                        <Target size={15} />
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      title="Delete task"
                      className={`p-1.5 rounded-lg transition-colors ${isDark
                        ? 'hover:bg-red-500/20 text-neutral-400 hover:text-red-400'
                        : 'hover:bg-red-100 text-pink-800/50 hover:text-red-600'
                        }`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Task Form (Appends below previously added task) */}
        <form onSubmit={handleSubmit} className={`mt-4 pt-4 border-t ${isMatteBlack ? 'border-neutral-800' : 'border-pink-500/20'} space-y-2 shrink-0`}>
          <div className="flex items-center space-x-2">
            <label htmlFor="new-task-title" className="sr-only">Task title</label>
            <input
              id="new-task-title"
              name="title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a new task... (press Enter)"
              className={`flex-1 min-w-0 px-4 py-2.5 rounded-2xl text-sm font-medium outline-none transition-colors ${inputBaseClass}`}
            />
            <button
              type="submit"
              disabled={!newTitle.trim()}
              aria-label="Add task"
              className={`p-2.5 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-md shrink-0 ${isMatteBlack
                ? 'bg-white hover:bg-neutral-200 text-black shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                : 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                }`}
            >
              <Plus size={20} className="stroke-[2.5]" />
            </button>
          </div>

          <div className="flex items-center flex-wrap justify-between gap-2 text-xs">
            {/* Optional Time Estimate */}
            <div className="relative flex items-center shrink-0">
              <label htmlFor="new-task-est" className="sr-only">Estimated minutes (optional)</label>
              <Clock size={13} className={`absolute left-2.5 pointer-events-none ${
                isMatteBlack ? 'text-neutral-400' : isDark ? 'text-pink-300/60' : 'text-pink-900/50'
              }`} />
              <input
                id="new-task-est"
                name="estimatedMinutes"
                type="text"
                inputMode="numeric"
                value={estimatedMinutes}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (val.length <= 3) {
                    setEstimatedMinutes(val);
                  }
                }}
                placeholder={`Est: ${defaultFocusMinutes}m`}
                title={`Estimated time in minutes (optional, default: ${defaultFocusMinutes}m)`}
                className={`w-22 pl-7 pr-2 py-1 rounded-xl text-[11px] font-medium outline-none transition-colors ${inputBaseClass}`}
              />
            </div>

            {/* Optional Deadline (12h AM/PM Time first, Date second defaulting to today) */}
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <span
                className={`text-[11px] font-medium shrink-0 flex items-center gap-1 ${
                  isMatteBlack ? 'text-neutral-400' : isDark ? 'text-pink-300/70' : 'text-pink-900/70'
                }`}
              >
                <CalendarClock size={12} />
              </span>
              <DeadlineFields
                value={newDeadlineParts}
                onChange={setNewDeadlineParts}
                theme={theme}
                allowEmptyHour
              />
              {newDeadlineParts.hour12 && (
                <button
                  type="button"
                  onClick={() =>
                    setNewDeadlineParts(splitDeadlineTo12h(undefined, { emptyTime: true, nowMs: Date.now() }))
                  }
                  title="Clear deadline"
                  aria-label="Clear selected deadline"
                  className={`p-1 rounded-lg transition-colors shrink-0 ${
                    isDark ? 'hover:bg-white/10 text-neutral-400' : 'hover:bg-pink-100 text-pink-800'
                  }`}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const TasksDrawer: React.FC<TasksDrawerProps> = React.memo(({ isOpen, ...props }) => {
  if (!isOpen) return null;
  return <TasksDrawerInner {...props} />;
});
