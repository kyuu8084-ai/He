import { triggerHaptic } from '../lib/haptics';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Settings, X, Timer } from 'lucide-react';

export const PomodoroTimer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [focusTime, setFocusTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  
  const [timeLeft, setTimeLeft] = useState(focusTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Switch modes
      if (mode === 'focus') {
        setMode('break');
        setTimeLeft(breakTime * 60);
      } else {
        setMode('focus');
        setTimeLeft(focusTime * 60);
      }
      // Play a sound (optional, could just use browser alert or notification)
      // alert(`${mode === 'focus' ? 'Focus session' : 'Break'} complete!`);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode, focusTime, breakTime]);

  // Update timer if settings change and timer is reset
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(mode === 'focus' ? focusTime * 60 : breakTime * 60);
    }
  }, [focusTime, breakTime, mode, isActive]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? focusTime * 60 : breakTime * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => { triggerHaptic('light'); setIsOpen(true); }}
            className="fixed bottom-6 right-6 z-50 liquid-glass bg-white/10 hover:bg-white/20 p-4 rounded-full text-white backdrop-blur-md border border-white/20 shadow-xl transition-colors group cursor-pointer"
          >
            <Timer className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-72 liquid-glass bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif italic font-semibold text-lg">Pomodoro</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => { triggerHaptic('light'); setIsSettingsOpen(!isSettingsOpen); }} className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                  <Settings className="w-4 h-4 opacity-70" />
                </button>
                <button onClick={() => { triggerHaptic('light'); setIsOpen(false); }} className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                  <X className="w-4 h-4 opacity-70" />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isSettingsOpen ? (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 mb-4 overflow-hidden"
                >
                  <div className="space-y-1">
                    <label className="text-xs opacity-70">Focus Time (minutes)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="120"
                      value={focusTime}
                      onChange={(e) => setFocusTime(Number(e.target.value) || 25)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs opacity-70">Break Time (minutes)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="60"
                      value={breakTime}
                      onChange={(e) => setBreakTime(Number(e.target.value) || 5)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      triggerHaptic('medium');
                      setIsSettingsOpen(false);
                      resetTimer();
                    }}
                    className="w-full bg-white text-black rounded-lg py-2 text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="timer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-full border border-white/10 w-full">
                    <button 
                      onClick={() => { triggerHaptic('light'); setMode('focus'); setIsActive(false); }}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${mode === 'focus' ? 'bg-white text-black shadow-md' : 'text-white/70 hover:text-white'}`}
                    >
                      Focus
                    </button>
                    <button 
                      onClick={() => { triggerHaptic('light'); setMode('break'); setIsActive(false); }}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${mode === 'break' ? 'bg-white text-black shadow-md' : 'text-white/70 hover:text-white'}`}
                    >
                      Break
                    </button>
                  </div>

                  <div className="text-6xl font-serif tracking-tighter mb-6 font-light">
                    {formatTime(timeLeft)}
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => { triggerHaptic('light'); resetTimer(); }}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => { triggerHaptic('medium'); toggleTimer(); }}
                      className="p-4 bg-white text-black hover:bg-white/90 rounded-full transition-colors cursor-pointer shadow-lg"
                    >
                      {isActive ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-1" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
