import React, { useState } from 'react';
import type { Task, ThemeMode } from '../types';
import { Check, Plus, Trash2, X, ListTodo, Target, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TasksDrawerProps {
  isOpen: boolean;
  tasks: Task[];
  activeTaskId: string | null;
  theme: ThemeMode;
  onClose: () => void;
  onAddTask: (title: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onClearAll: () => void;
  onSelectActiveTask: (taskId: string) => void;
  onReorderTasks: (newTasks: Task[]) => void;
}

export const TasksDrawer: React.FC<TasksDrawerProps> = ({
  isOpen,
  tasks,
  activeTaskId,
  theme,
  onClose,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onClearAll,
  onSelectActiveTask,
  onReorderTasks,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const isDark = theme === 'dark-mesh';

  if (!isOpen) return null;

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
    onAddTask(newTitle.trim());
    setNewTitle('');
  };

  const handleToggle = (task: Task) => {
    if (!task.completed) {
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
    if (dragOverIndex !== index) {
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

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Card with Fixed Height & Solid Opaque Background */}
      <div
        className={`relative w-full max-w-md h-[580px] max-h-[88vh] flex flex-col rounded-3xl p-6 shadow-2xl transition-colors duration-200 ${
          isDark
            ? 'bg-[#161420] border border-pink-500/30 text-white shadow-2xl shadow-black/90'
            : 'bg-white border border-pink-200 text-pink-950 shadow-2xl shadow-pink-200/50'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-pink-500/20 mb-4 select-none shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-2xl flex items-center justify-center ${
                isDark
                  ? 'bg-pink-600/20 text-pink-400 border border-pink-500/35 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                  : 'bg-pink-100 text-pink-600 border border-pink-200'
              }`}
            >
              <ListTodo size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-pink-950'}`}>Tasks</h2>
              <p className={`text-xs font-medium ${isDark ? 'text-pink-300/80' : 'text-pink-900/70'}`}>
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all duration-200 active:scale-95 ${
                  confirmClear
                    ? 'bg-red-600 text-white border border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
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
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'hover:bg-white/10 text-pink-200/70 hover:text-white' : 'hover:bg-pink-100 text-pink-800 hover:text-pink-950'
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
                className={`p-4 rounded-2xl ${
                  isDark
                    ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                    : 'bg-pink-100/80 text-pink-600 border border-pink-200'
                }`}
              >
                <ListTodo size={30} className="stroke-[2]" />
              </div>
              <div>
                <p className={`text-base font-semibold ${isDark ? 'text-pink-100' : 'text-pink-950'}`}>
                  No tasks yet
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-pink-300/70' : 'text-pink-900/60'}`}>
                  Add a task below to stay focused and track progress
                </p>
              </div>
            </div>
          ) : (
            tasks.map((task, idx) => {
              const isCurrentFocus = activeTaskId === task.id && !task.completed;
              const isDragging = draggedIndex === idx;
              const isOver = dragOverIndex === idx && draggedIndex !== idx;

              return (
                <div
                  key={task.id}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={`group relative flex items-center justify-between p-3.5 rounded-2xl transition-all duration-150 select-none ${
                    isDragging ? 'opacity-35 scale-[0.98]' : 'opacity-100'
                  } ${
                    isOver
                      ? 'border-2 border-dashed border-pink-500 bg-pink-500/15'
                      : isCurrentFocus
                        ? isDark
                          ? 'bg-[#282136] border-2 border-pink-500 shadow-[0_0_14px_rgba(244,63,94,0.3)]'
                          : 'bg-pink-100 border-2 border-pink-400 shadow-sm'
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
                      className={`cursor-grab active:cursor-grabbing p-1.5 rounded-lg transition-colors touch-none ${
                        isDark 
                          ? 'text-pink-400/60 hover:text-pink-200 hover:bg-white/10' 
                          : 'text-pink-900/40 hover:text-pink-700 hover:bg-pink-200/50'
                      }`}
                    >
                      <GripVertical size={16} />
                    </div>

                    {/* Square Checkbox */}
                    <button
                      onClick={() => handleToggle(task)}
                      title={task.completed ? "Mark as uncompleted" : "Mark as completed"}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-150 shrink-0 ${
                        task.completed
                          ? 'bg-pink-600 text-white border border-pink-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                          : isDark
                            ? 'border-2 border-pink-400/50 hover:border-pink-400 bg-white/10'
                            : 'border-2 border-pink-300 hover:border-pink-500 bg-white'
                      }`}
                    >
                      {task.completed && <Check size={16} className="stroke-[3]" />}
                    </button>

                    {/* Task Title */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span
                        onClick={() => handleToggle(task)}
                        className={`text-sm sm:text-base truncate cursor-pointer transition-colors ${
                          task.completed
                            ? isDark
                              ? 'line-through text-pink-300/50 font-normal'
                              : 'line-through text-pink-900/50 font-normal'
                            : isDark
                              ? 'text-white font-semibold'
                              : 'text-pink-950 font-semibold'
                        }`}
                      >
                        {task.title}
                      </span>
                      {isCurrentFocus && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                          Current Focus
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Reorder up/down, Select Focus, Delete */}
                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    {/* Move Up */}
                    <button
                      onClick={() => moveTask(idx, idx - 1)}
                      disabled={idx === 0}
                      title="Move Up"
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed ${
                        isDark ? 'hover:bg-white/10 text-pink-300/70 hover:text-pink-100' : 'hover:bg-pink-200/60 text-pink-900/60 hover:text-pink-950'
                      }`}
                    >
                      <ChevronUp size={16} />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => moveTask(idx, idx + 1)}
                      disabled={idx === tasks.length - 1}
                      title="Move Down"
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed ${
                        isDark ? 'hover:bg-white/10 text-pink-300/70 hover:text-pink-100' : 'hover:bg-pink-200/60 text-pink-900/60 hover:text-pink-950'
                      }`}
                    >
                      <ChevronDown size={16} />
                    </button>

                    {/* Focus Target Button */}
                    {!task.completed && (
                      <button
                        onClick={() => onSelectActiveTask(task.id)}
                        title="Set as Current Focus on Timer"
                        className={`p-1.5 rounded-lg text-xs flex items-center transition-colors ${
                          isCurrentFocus
                            ? isDark
                              ? 'bg-pink-600/30 text-pink-300 border border-pink-500/40'
                              : 'bg-pink-200 text-pink-700 font-semibold'
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
                      onClick={() => onDeleteTask(task.id)}
                      title="Delete task"
                      className={`p-1.5 rounded-lg transition-colors ${
                        isDark
                          ? 'hover:bg-red-500/20 text-pink-300/50 hover:text-red-400'
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
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-pink-500/20 flex items-center space-x-2 shrink-0">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a new task... (press Enter)"
            className={`flex-1 px-4 py-2.5 rounded-2xl text-sm font-medium outline-none transition-colors ${
              isDark
                ? 'bg-[#1f1b2b] text-white placeholder-pink-300/40 border border-pink-500/30 focus:border-pink-400 focus:ring-1 focus:ring-pink-500/50'
                : 'bg-pink-50 text-pink-950 placeholder-pink-900/40 border border-pink-200 focus:border-pink-500'
            }`}
          />
          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="p-2.5 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-pink-600 hover:bg-pink-500 active:scale-95 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)] shrink-0"
          >
            <Plus size={20} className="stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
};
