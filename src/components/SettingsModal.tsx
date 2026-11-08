import React, { useState } from 'react';
import type { TimerSettings, ThemeMode } from '../types';
import { Settings, Volume2, Clock, Palette, Sparkles, X, RotateCcw, VolumeX, Play } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  settings: TimerSettings;
  theme: ThemeMode;
  onClose: () => void;
  onSaveSettings: (newSettings: TimerSettings) => void;
  onThemeChange: (newTheme: ThemeMode) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = React.memo(({
  isOpen,
  settings,
  theme,
  onClose,
  onSaveSettings,
  onThemeChange,
}) => {
  const [formData, setFormData] = useState<TimerSettings>({ ...settings });
  const [focusInput, setFocusInput] = useState<string>(String(settings.focusMinutes));
  const [shortBreakInput, setShortBreakInput] = useState<string>(String(settings.shortBreakMinutes));
  const [longBreakInput, setLongBreakInput] = useState<string>(String(settings.longBreakMinutes));
  const isMatteBlack = theme === 'matte-black';
  const isDark = theme === 'dark-mesh' || isMatteBlack;

  if (!isOpen) return null;

  const handleTestChime = () => {
    soundEngine.playAlert(formData.soundType, formData.soundVolume);
  };

  const handleTestSmallBell = () => {
    soundEngine.unlockAudio();
    soundEngine.playSmallBell(formData.soundVolume);
  };

  const handleTestTaskSound = () => {
    soundEngine.unlockAudio();
    soundEngine.playTaskComplete(formData.soundVolume);
  };

  const handleResetDefaults = () => {
    setFormData({
      focusMinutes: 40,
      shortBreakMinutes: 10,
      longBreakMinutes: 20,
      longBreakInterval: 4,
      autoStartBreaks: true,
      autoStartFocus: false,
      soundAlerts: true,
      soundVolume: 0.7,
      soundType: 'crystal',
      tickSound: false,
      warningBell: true,
      taskSound: true,
      showBunnyMascot: true,
    });
    setFocusInput('40');
    setShortBreakInput('10');
    setLongBreakInput('20');
  };

  const handleSave = () => {
    const focusVal = Math.max(1, Math.min(180, parseInt(focusInput, 10) || settings.focusMinutes || 40));
    const shortBreakVal = Math.max(1, Math.min(60, parseInt(shortBreakInput, 10) || settings.shortBreakMinutes || 10));
    const longBreakVal = Math.max(1, Math.min(90, parseInt(longBreakInput, 10) || settings.longBreakMinutes || 20));

    onSaveSettings({
      ...formData,
      focusMinutes: focusVal,
      shortBreakMinutes: shortBreakVal,
      longBreakMinutes: longBreakVal,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative w-full max-w-md max-h-[88vh] flex flex-col rounded-3xl p-6 shadow-2xl transition-all duration-300 ${
          isDark
            ? 'bg-[#140a12]/95 border border-pink-500/25 text-white shadow-2xl shadow-pink-950/60'
            : 'bg-white/95 border border-pink-200 text-pink-950 shadow-pink-200/50'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-500/20 mb-4">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-xl ${
                isDark ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-pink-100 text-pink-600'
              }`}
            >
              <Settings size={20} />
            </div>
            <h3 className="text-lg font-bold">Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10 text-pink-200/70 hover:text-pink-100' : 'hover:bg-pink-100 text-pink-800'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Section: Timer Durations (Defaults: 40, 10, 20) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock size={16} className={isDark ? 'text-pink-400' : 'text-pink-600'} />
                <h4 className="text-xs font-bold uppercase tracking-wider">Timer Durations (Minutes)</h4>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                title="Reset to default 40 / 10 / 20"
                className={`text-[11px] flex items-center space-x-1 ${
                  isDark ? 'text-pink-300/60 hover:text-pink-200' : 'text-pink-900/50 hover:text-pink-900'
                }`}
              >
                <RotateCcw size={12} />
                <span>Defaults</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/[0.04] border border-pink-500/15' : 'bg-pink-50 border border-pink-100'}`}>
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-pink-300/70' : 'text-pink-900/60'}`}>
                  Focus
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={focusInput}
                  onChange={(e) => setFocusInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="40"
                  className={`w-full text-center text-lg font-bold bg-transparent outline-none ${
                    isDark ? 'text-pink-100' : 'text-pink-950'
                  }`}
                />
              </div>

              <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/[0.04] border border-pink-500/15' : 'bg-pink-50 border border-pink-100'}`}>
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-pink-300/70' : 'text-pink-900/60'}`}>
                  Short Break
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={shortBreakInput}
                  onChange={(e) => setShortBreakInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="10"
                  className={`w-full text-center text-lg font-bold bg-transparent outline-none ${
                    isDark ? 'text-pink-100' : 'text-pink-950'
                  }`}
                />
              </div>

              <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/[0.04] border border-pink-500/15' : 'bg-pink-50 border border-pink-100'}`}>
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-pink-300/70' : 'text-pink-900/60'}`}>
                  Long Break
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={longBreakInput}
                  onChange={(e) => setLongBreakInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="20"
                  className={`w-full text-center text-lg font-bold bg-transparent outline-none ${
                    isDark ? 'text-pink-100' : 'text-pink-950'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className={isDark ? 'text-pink-200/80' : 'text-pink-900/80'}>Long break interval (sessions):</span>
              <select
                value={formData.longBreakInterval}
                onChange={(e) => setFormData({ ...formData, longBreakInterval: parseInt(e.target.value) })}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold outline-none ${
                  isDark ? 'bg-white/10 text-pink-100 border border-pink-500/25' : 'bg-pink-50 text-pink-950 border border-pink-200'
                }`}
              >
                <option value={2} className="bg-slate-900 text-white">Every 2 sessions</option>
                <option value={3} className="bg-slate-900 text-white">Every 3 sessions</option>
                <option value={4} className="bg-slate-900 text-white">Every 4 sessions (Standard)</option>
                <option value={5} className="bg-slate-900 text-white">Every 5 sessions</option>
                <option value={6} className="bg-slate-900 text-white">Every 6 sessions</option>
              </select>
            </div>
          </div>

          {/* Section: Themes */}
          <div className="space-y-2 pt-2 border-t border-pink-500/20">
            <div className="flex items-center space-x-2">
              <Palette size={16} className={isDark ? 'text-pink-400' : 'text-pink-600'} />
              <h4 className="text-xs font-bold uppercase tracking-wider">Appearance Theme</h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {/* 1. Strawberry Silk Warm Pink (Default) */}
              <button
                type="button"
                onClick={() => onThemeChange('bunny-pink')}
                className={`p-2.5 rounded-2xl flex flex-col items-center justify-center space-y-1.5 transition-all ${
                  theme === 'bunny-pink'
                    ? 'ring-2 ring-pink-500 bg-pink-100/90 text-pink-950 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                    : isDark ? 'bg-white/[0.04] hover:bg-white/10 text-pink-200/70' : 'bg-pink-50/50 hover:bg-pink-50 text-pink-900/70'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-100 via-pink-200 to-pink-400 border border-pink-300 shadow-sm" />
                <span className="text-[11px] font-bold text-center leading-tight">Strawberry Silk</span>
                <span className="text-[9px] opacity-70 text-center leading-none">Cream & Pink</span>
              </button>

              {/* 2. Very Light White & Pink Aura */}
              <button
                type="button"
                onClick={() => onThemeChange('light-aura')}
                className={`p-2.5 rounded-2xl flex flex-col items-center justify-center space-y-1.5 transition-all ${
                  theme === 'light-aura'
                    ? 'ring-2 ring-pink-500 bg-pink-100/90 text-pink-950 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                    : isDark ? 'bg-white/[0.04] hover:bg-white/10 text-pink-200/70' : 'bg-pink-50/50 hover:bg-pink-50 text-pink-900/70'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-white via-pink-100 to-pink-300 border border-pink-300 shadow-sm" />
                <span className="text-[11px] font-bold text-center leading-tight">Light Aura</span>
                <span className="text-[9px] opacity-70 text-center leading-none">White & Pink</span>
              </button>

              {/* 3. Pink & Dark Style */}
              <button
                type="button"
                onClick={() => onThemeChange('dark-mesh')}
                className={`p-2.5 rounded-2xl flex flex-col items-center justify-center space-y-1.5 transition-all ${
                  theme === 'dark-mesh'
                    ? 'ring-2 ring-pink-500 bg-pink-950/70 text-pink-100 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                    : isDark ? 'bg-white/[0.04] hover:bg-white/10 text-pink-200/70' : 'bg-pink-50/50 hover:bg-pink-50 text-pink-900/70'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-pink-500 via-purple-900 to-[#10050e] border border-pink-400 shadow-sm" />
                <span className="text-[11px] font-bold text-center leading-tight">Dark Aura</span>
                <span className="text-[9px] opacity-70 text-center leading-none">Midnight & Pink</span>
              </button>

              {/* 4. Matte Black & White */}
              <button
                type="button"
                onClick={() => onThemeChange('matte-black')}
                className={`p-2.5 rounded-2xl flex flex-col items-center justify-center space-y-1.5 transition-all ${
                  theme === 'matte-black'
                    ? 'ring-2 ring-white bg-neutral-900 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                    : isDark ? 'bg-white/[0.04] hover:bg-white/10 text-neutral-300' : 'bg-pink-50/50 hover:bg-pink-50 text-pink-900/70'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-black via-neutral-900 to-white border border-neutral-500 shadow-sm" />
                <span className="text-[11px] font-bold text-center leading-tight">Matte Black</span>
                <span className="text-[9px] opacity-70 text-center leading-none">Black & White</span>
              </button>
            </div>
          </div>

          {/* Section: Sound & Notifications */}
          <div className="space-y-3 pt-2 border-t border-pink-500/20">
            <div className="flex items-center space-x-2">
              <Volume2 size={16} className={isDark ? 'text-pink-400' : 'text-pink-600'} />
              <h4 className="text-xs font-bold uppercase tracking-wider">Sound & Chimes</h4>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-pink-200/80' : 'text-pink-900/80'}>Session completion alert</span>
                <input
                  type="checkbox"
                  checked={formData.soundAlerts}
                  onChange={(e) => setFormData({ ...formData, soundAlerts: e.target.checked })}
                  className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                />
              </div>

              {formData.soundAlerts && (
                <>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-pink-200/70' : 'text-pink-900/70'}>Chime tone</span>
                    <div className="flex items-center space-x-2">
                      <select
                        value={formData.soundType}
                        onChange={(e) => setFormData({ ...formData, soundType: e.target.value as TimerSettings['soundType'] })}
                        className={`px-2 py-1 rounded-xl text-xs font-medium outline-none ${
                          isDark ? 'bg-white/10 text-pink-100 border border-pink-500/25' : 'bg-pink-50 text-pink-950 border border-pink-200'
                        }`}
                      >
                        <option value="crystal" className="bg-slate-900 text-white">Crystal Tone</option>
                        <option value="bell" className="bg-slate-900 text-white">Zen Singing Bowl</option>
                        <option value="marimba" className="bg-slate-900 text-white">Warm Marimba</option>
                        <option value="softBeep" className="bg-slate-900 text-white">Gentle Digital Ding</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleTestChime}
                        title="Test chime sound"
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDark ? 'bg-pink-600/20 hover:bg-pink-600/30 text-pink-300' : 'bg-pink-100 hover:bg-pink-200'
                        }`}
                      >
                        <Play size={12} className="ml-0.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-pink-200/70' : 'text-pink-900/70'}>Alert volume</span>
                    <div className="flex items-center space-x-2 w-36">
                      {formData.soundVolume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={formData.soundVolume}
                        onChange={(e) => setFormData({ ...formData, soundVolume: parseFloat(e.target.value) })}
                        className="w-full accent-pink-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-pink-200/80' : 'text-pink-900/80'}>Subtle clock tick sound</span>
                <input
                  type="checkbox"
                  checked={formData.tickSound}
                  onChange={(e) => setFormData({ ...formData, tickSound: e.target.checked })}
                  className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col pr-2">
                  <span className={isDark ? 'text-pink-200/80' : 'text-pink-900/80'}>5m & 2m warning bell</span>
                  <span className={`text-[10px] ${isDark ? 'text-pink-300/60' : 'text-pink-900/60'}`}>
                    Gentle bell when 5m left in focus, 2m in break
                  </span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleTestSmallBell}
                    title="Test warning bell sound"
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDark ? 'bg-pink-600/20 hover:bg-pink-600/30 text-pink-300' : 'bg-pink-100 hover:bg-pink-200 text-pink-700'
                    }`}
                  >
                    <Play size={12} className="ml-0.5" />
                  </button>
                  <input
                    type="checkbox"
                    checked={formData.warningBell !== false}
                    onChange={(e) => setFormData({ ...formData, warningBell: e.target.checked })}
                    className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col pr-2">
                  <span className={isDark ? 'text-pink-200/80' : 'text-pink-900/80'}>Task completion chime</span>
                  <span className={`text-[10px] ${isDark ? 'text-pink-300/60' : 'text-pink-900/60'}`}>
                    Satisfying chime when checking off a task
                  </span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleTestTaskSound}
                    title="Test task completed sound"
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDark ? 'bg-pink-600/20 hover:bg-pink-600/30 text-pink-300' : 'bg-pink-100 hover:bg-pink-200 text-pink-700'
                    }`}
                  >
                    <Play size={12} className="ml-0.5" />
                  </button>
                  <input
                    type="checkbox"
                    checked={formData.taskSound !== false}
                    onChange={(e) => setFormData({ ...formData, taskSound: e.target.checked })}
                    className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Mascot & Automation */}
          <div className="space-y-3 pt-2 border-t border-pink-500/20">
            <div className="flex items-center space-x-2">
              <Sparkles size={16} className={isDark ? 'text-pink-400' : 'text-pink-600'} />
              <h4 className="text-xs font-bold uppercase tracking-wider">Mascot & Flow</h4>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-pink-200/80' : 'text-pink-900/80'}>Display Bunny Mascot</span>
                <input
                  type="checkbox"
                  checked={formData.showBunnyMascot}
                  onChange={(e) => setFormData({ ...formData, showBunnyMascot: e.target.checked })}
                  className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-pink-200/80' : 'text-pink-900/80'}>Auto-start breaks</span>
                <input
                  type="checkbox"
                  checked={formData.autoStartBreaks}
                  onChange={(e) => setFormData({ ...formData, autoStartBreaks: e.target.checked })}
                  className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-pink-200/80' : 'text-pink-900/80'}>Auto-start focus after break</span>
                <input
                  type="checkbox"
                  checked={formData.autoStartFocus}
                  onChange={(e) => setFormData({ ...formData, autoStartFocus: e.target.checked })}
                  className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-pink-500/20 flex items-center justify-end space-x-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-colors ${
              isDark ? 'hover:bg-white/10 text-pink-200/70 hover:text-pink-100' : 'hover:bg-pink-100 text-pink-900/70'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-2xl text-xs font-bold transition-all bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
});
