import { triggerHaptic } from '../lib/haptics';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, Music, X, Volume2 } from 'lucide-react';

const TRACKS = [
  { id: 'china', title: 'China', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785588629/YTSave_YouTube_Media_r2WhUCu_CAA_008_128k_se276z.mp4' },

  { id: 'g1', title: 'Mondstadt', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785564625/YTSave_YouTube_Genshin-Impact-Mondstadt-Calm-Relaxing-O_Media_mhE17UIzJf8_006_128k_fwvr3p.mp4' },
  { id: 'g2', title: 'Liyue', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785564802/YTSave_YouTube_Genshin-Impact-Liyue-OST-Relaxing-Calm-M_Media_Lp1CskkRjD4_008_128k_q67naz.mp4' },
  { id: 'g3', title: 'Inazuma', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785564921/YTSave_YouTube_Media_SHZN2oXeW8s_008_128k_x8jzot.mp4' },
  { id: 'g4', title: 'Sumeru', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785565281/YTSave_YouTube_Media_htc1RmhSLjU_008_128k_xm8m7h.mp4' },
  { id: 'g5', title: 'Fontaine', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785565361/YTSave_YouTube_Fountain-of-Belleau-Disc-1-Chanson-of-Ju_Media_znHhRYBmfck_008_128k_w6vqsk.mp4' },
  { id: 'g6', title: 'Natlan', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785565487/YTSave_YouTube_Radiance-Aflame-Disc-1-Where-the-Sacred-_Media_PPwHEYmAzvo_008_128k_yupfqo.mp4' },
  { id: 'g7', title: 'Nod Krai', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785565544/YTSave_YouTube_Outside-It-Is-Growing-Dark-Disc-1-Peace-_Media_gt-qLR8v96Q_008_128k_bhikog.mp4' },
  { id: '1', title: 'Deep Focus (Lofi)', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785396290/YTSave_YouTube_Calming-Music-for-the-Nervous-System-Rel_Media_ZYEQiFxnYFg_008_128k_a4k9zz.mp4' },
  { id: '2', title: 'Ambient Piano', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785395993/YTSave_YouTube_Media_hfavqkBrwXI_008_128k_jus7jb.mp4' },
  { id: '3', title: 'Chill Waves', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785396405/YTSave_YouTube_Relaxing-Music-for-Stress-Relief-Calm-St_Media_fFtHZQi00u0_008_128k_vpoapl.mp4' },
  { id: '4', title: 'Study Beats', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785396148/YTSave_YouTube_1-A-M-Study-Session-lofi-hip-hop_Media_lTRiuFIWV54_008_128k_x9qhtu.mp4' },
  { id: '5', title: 'Morning Coffee', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785396498/YTSave_YouTube_Focus-Music-for-Work-_-Study-Calm-Cafe-B_Media_fxl5wHEd0xA_006_128k_twg321.mp4' },
  { id: '6', title: 'Soft Rain', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785396627/YTSave_YouTube_study-with-me-in-rain-thunderstorm-sound_Media_69QdAw3ApNk_008_128k_cvsttd.mp4' },
  { id: '7', title: 'Night Owl', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785396792/YTSave_YouTube_Grow-a-Garden-Roblox-Night-Theme-1-Music_Media_Wu-bFqI4u4k_008_128k_yvgksb.mp4' },
  { id: '8', title: 'Quiet Mind', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785396881/YTSave_YouTube_calm-your-mind_Media_sTlzjFABmoA_008_128k_pxwu4g.mp4' },
  { id: '9', title: 'Calm River', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785396987/YTSave_YouTube_Relaxing-Music-for-Stress-Relief-Calm-St_Media_xRcWlA1I9z0_008_128k_k6jk6i.mp4' },
  { id: '10', title: 'Sunset Vibes', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785398228/YTSave_YouTube_Summer-sunset-Vibes-lofi-ambient-music-b_Media_BnjWrOTdKZo_008_128k_aml8rl.mp4' },
  { id: '11', title: 'Autumn Leaves', url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785398346/YTSave_YouTube_Media_mKMfIMz16aU_008_128k_esdh2v.mp4' },
  { id: '12', title: 'Winter Walk', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' },
  { id: '13', title: 'Spring Morning', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3' },
  { id: '14', title: 'Summer Breeze', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3' }
];

export const MusicPlayer = ({ showUI = true }: { showUI?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Store the playback position of each track
  const [trackPositions, setTrackPositions] = useState<Record<string, number>>({});
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const currentTrack = TRACKS[currentTrackIndex];

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };


  // Save current time when changing track or unmounting
  const saveCurrentPosition = () => {
    if (audioRef.current) {
      setTrackPositions(prev => ({
        ...prev,
        [currentTrack.id]: audioRef.current!.currentTime
      }));
    }
  };

  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleNext = () => {
    saveCurrentPosition();
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    saveCurrentPosition();
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        saveCurrentPosition();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      const savedTime = trackPositions[currentTrack.id] || 0;
      audioRef.current.currentTime = savedTime;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  };

  const onEnded = () => {
    // Reset position for this track
    setTrackPositions(prev => ({
      ...prev,
      [currentTrack.id]: 0
    }));
    handleNext();
  };

  // Sync state if audio pauses externally
  const onPause = () => {
    setIsPlaying(false);
    saveCurrentPosition();
  };

  const onPlay = () => setIsPlaying(true);

  return (
    <>
      <audio 
        ref={audioRef}
        src={currentTrack.url}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        onPause={onPause}
        onPlay={onPlay}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
      />

      <AnimatePresence>
        {!isOpen && showUI && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => { triggerHaptic('light'); setIsOpen(true); }}
            className="fixed bottom-6 left-6 z-50 liquid-glass bg-white/10 hover:bg-white/20 p-4 rounded-full text-white backdrop-blur-md border border-white/20 shadow-xl transition-colors group cursor-pointer"
          >
            <Music className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && showUI && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-50 w-72 liquid-glass bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif italic font-semibold text-lg flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> Music
              </h3>
              <button onClick={() => { triggerHaptic('light'); setIsOpen(false); }} className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                <X className="w-4 h-4 opacity-70" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-full bg-white/5 rounded-xl p-3 mb-4 border border-white/10 text-center truncate">
                <span className="text-sm font-medium">{currentTrack.title}</span>
              </div>

              
              {/* Progress Bar */}
              <div className="w-full flex items-center gap-2 mb-4 text-[10px] text-white/70 font-mono">
                <span>{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white hover:h-1.5 transition-all"
                  style={{
                    background: `linear-gradient(to right, white ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255, 255, 255, 0.2) ${duration ? (currentTime / duration) * 100 : 0}%)`
                  }}
                />
                <span>{formatTime(duration)}</span>
              </div>

              <div className="flex items-center gap-6 mb-2">

                <button 
                  onClick={() => { triggerHaptic('light'); handlePrev(); }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                >
                  <SkipBack className="w-5 h-5 fill-white" />
                </button>
                
                <button 
                  onClick={() => { triggerHaptic('medium'); togglePlay(); }}
                  className="p-4 bg-white text-black hover:bg-white/90 rounded-full transition-colors cursor-pointer shadow-lg"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-1" />}
                </button>

                <button 
                  onClick={() => { triggerHaptic('light'); handleNext(); }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                >
                  <SkipForward className="w-5 h-5 fill-white" />
                </button>
              </div>

              <div className="w-full flex items-center gap-3 mt-4 px-2">
                <Volume2 className="w-4 h-4 text-white/70 shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>
            
            <div className="mt-4 max-h-32 overflow-y-auto space-y-1">
              {TRACKS.map((track, idx) => (
                <button
                  key={track.id}
                  onClick={() => {
                    triggerHaptic('light');
                    saveCurrentPosition();
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer truncate ${currentTrackIndex === idx ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                >
                  {track.title}
                </button>
              ))}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
