import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  GripHorizontal,
  Volume2,
  VolumeX,
  FileText,
  Sparkles,
  Zap,
  Coffee,
  Check,
  X
} from 'lucide-react';
import { motion } from 'motion/react';

export default function DraggableClockWidget({ language, onClose }: { language: 'en' | 'vi', onClose?: () => void }) {
  const isVi = language === 'vi';
  const [time, setTime] = useState(new Date());
  
  // Custom Timer State
          const [activeTab, setActiveTab] = useState<'clock' | 'scratchpad'>('clock');

  // Scratchpad state
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem('study_scratchpad_notes') || '';
    } catch {
      return '';
    }
  });
  const [savedNoteStatus, setSavedNoteStatus] = useState(false);

  // Ambient sound state (Web Audio API Synthesizer)
  const [isPlayingRain, setIsPlayingRain] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  
  // Handle Web Audio Rain/White Noise
  const toggleAmbientSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingRain) {
      stopAmbientSound();
    } else {
      startAmbientSound();
    }
  };

  const startAmbientSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // Pink-ish noise
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Filter for rain sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;

      const gain = ctx.createGain();
      gain.gain.value = 0.12;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noiseNodeRef.current = noise;
      gainNodeRef.current = gain;
      setIsPlayingRain(true);
    } catch (e) {
      console.warn('AudioContext not supported', e);
    }
  };

  const stopAmbientSound = () => {
    if (noiseNodeRef.current) {
      try {
        (noiseNodeRef.current as AudioBufferSourceNode).stop();
      } catch {}
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
    }
    setIsPlayingRain(false);
  };

  useEffect(() => {
    return () => stopAmbientSound();
  }, []);

  // Format Clock
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Timer Actions
        const saveNotes = (val: string) => {
    setNotes(val);
    try {
      localStorage.setItem('study_scratchpad_notes', val);
      setSavedNoteStatus(true);
      setTimeout(() => setSavedNoteStatus(false), 1500);
    } catch {}
  };

    
  return (
    <motion.div 
      drag 
      dragMomentum={false}
      className="p-5 md:p-6 bg-black/40 border border-white/20 shadow-2xl rounded-3xl flex flex-col items-center justify-center min-w-[290px] max-w-[340px] backdrop-blur-xl cursor-move relative z-50 hover:border-white/30 transition-all select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Drag Handle & Tab Switcher */}
      <div className="flex items-center justify-between w-full mb-3 pb-2 border-b border-white/10 text-white/50">
        <div className="flex items-center gap-1.5 cursor-grab">
          <GripHorizontal size={16} />
          <span className="text-[10px] uppercase font-mono tracking-wider text-white/40">
            {isVi ? 'Đồng hồ & Ghi chú' : 'Clock & Notes'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            <button
              onClick={() => setActiveTab('clock')}
              onPointerDown={(e) => e.stopPropagation()}
              className={`p-1 rounded-full text-[10px] font-semibold transition-colors cursor-pointer ${
                activeTab === 'clock' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              }`}
              title={isVi ? "Đồng hồ" : "Clock"}
            >
              <Clock size={12} />
            </button>
            <button
              onClick={() => setActiveTab('scratchpad')}
              onPointerDown={(e) => e.stopPropagation()}
              className={`p-1 rounded-full text-[10px] font-semibold transition-colors cursor-pointer ${
                activeTab === 'scratchpad' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              }`}
              title={isVi ? "Sổ tay ghi chú nhanh" : "Quick Scratchpad"}
            >
              <FileText size={12} />
            </button>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isVi ? "Đóng" : "Close"}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      
      {activeTab === 'clock' ? (
        <>
          {/* Real Clock */}
          <div className="flex flex-col items-center mb-4 w-full border-b border-white/10 pb-4">
            <div className="flex items-center gap-1.5 mb-1 text-white/70">
              <Clock size={14} />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider">{isVi ? 'Thời gian thực' : 'Current Time'}</h3>
            </div>
            
            <div className="text-3xl font-light tabular-nums tracking-tight drop-shadow-md text-white font-mono">
              {formatTime(time)}
            </div>
            <div className="mt-1 text-white/60 text-xs font-medium tracking-wide">
              {formatDate(time)}
            </div>
          </div>

          {/* Ambient Sound Synthesizer Toggle */}
          <div className="w-full mb-4 flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isPlayingRain ? 'bg-emerald-400 animate-ping' : 'bg-white/30'}`} />
              <span className="text-[11px] font-medium text-white/80">
                {isVi ? 'Tiếng mưa tập trung' : 'Focus Rain Sound'}
              </span>
            </div>
            <button
              onClick={toggleAmbientSound}
              onPointerDown={(e) => e.stopPropagation()}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                isPlayingRain ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/10 hover:bg-white/20 text-white/70'
              }`}
            >
              {isPlayingRain ? <Volume2 size={13} /> : <VolumeX size={13} />}
              <span className="text-[10px]">{isPlayingRain ? (isVi ? 'Tắt' : 'Stop') : (isVi ? 'Bật' : 'Play')}</span>
            </button>
          </div>


        </>
      ) : (
        /* Quick Scratchpad Tab */
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
              {isVi ? 'Ghi chú & Công thức' : 'Quick Scratchpad'}
            </span>
            {savedNoteStatus && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <Check size={11} /> {isVi ? 'Đã lưu' : 'Saved'}
              </span>
            )}
          </div>
          <textarea
            value={notes}
            onChange={(e) => saveNotes(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder={isVi ? "Nhập công thức, từ vựng hoặc công việc cần nhớ khi học..." : "Jot down formulas, vocabulary, or tasks..."}
            className="w-full h-36 bg-black/40 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-white/40 focus:border-white/40 outline-none resize-none custom-scrollbar font-mono"
          />
          <p className="text-[9px] text-white/40 mt-1.5 self-start">
            {isVi ? 'Tự động lưu vào bộ nhớ trình duyệt' : 'Auto-saved to browser cache'}
          </p>
        </div>
      )}
    </motion.div>
  );
}
