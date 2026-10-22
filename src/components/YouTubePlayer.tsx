import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minimize2, Maximize2, ListVideo, Headphones, MonitorPlay } from 'lucide-react';

import YouTube, { YouTubeProps } from 'react-youtube';

interface YouTubePlayerProps {
  videoId: string | null;
  onClose: () => void;
  isMiniPlayer: boolean;
  setIsMiniPlayer: (isMini: boolean) => void;
  onEnded: () => void;
  queueLength: number;
}

export default function YouTubePlayer({ videoId, onClose, isMiniPlayer, setIsMiniPlayer, onEnded, queueLength }: YouTubePlayerProps) {
  const [isBackground, setIsBackground] = useState(false);

  return (
    <>
      <AnimatePresence>
        {videoId && !isMiniPlayer && !isBackground && (
          <motion.div
            key="youtube-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-2xl pointer-events-auto"
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {videoId && !isMiniPlayer && !isBackground && (
          <motion.div 
            key="youtube-controls"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 flex items-center gap-4 z-[100] pointer-events-auto"
          >
            {queueLength > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white backdrop-blur-md border border-white/10">
                <ListVideo size={16} />
                <span className="text-sm font-bold">{queueLength} in queue</span>
              </div>
            )}
            <button 
              onClick={() => setIsBackground(true)}
              className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer backdrop-blur-md border border-white/10"
              title="Play in background"
            >
              <Headphones size={24} />
            </button>
            <button 
              onClick={() => setIsMiniPlayer(true)}
              className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer backdrop-blur-md border border-white/10"
              title="Mini player"
            >
              <Minimize2 size={24} />
            </button>
            <button 
              onClick={() => {
                onClose();
                setIsBackground(false);
              }}
              className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer backdrop-blur-md border border-white/10"
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {videoId && (
          <motion.div
            key="youtube-player"
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={
              isBackground 
                ? "fixed bottom-6 left-6 z-[100] bg-black/80 rounded-full overflow-hidden shadow-2xl border border-white/20 flex items-center pr-2 group pointer-events-auto backdrop-blur-xl"
                : isMiniPlayer 
                  ? "fixed bottom-6 right-6 z-[100] w-80 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/20 group pointer-events-auto"
                  : "fixed inset-0 m-auto z-[95] w-[95vw] max-w-6xl aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 group pointer-events-auto"
            }
          >
            {/* Background player UI */}
            {isBackground && (
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center animate-pulse">
                  <Headphones size={16} className="text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-xs font-bold">Playing in background</span>
                  {queueLength > 0 && <span className="text-white/70 text-[10px]">{queueLength} in queue</span>}
                </div>
                <div className="flex items-center gap-1 ml-4 border-l border-white/10 pl-4">
                  <button 
                    onClick={() => {
                      setIsBackground(false);
                      setIsMiniPlayer(false);
                    }}
                    className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
                    title="Restore player"
                  >
                    <MonitorPlay size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      onClose();
                      setIsBackground(false);
                    }}
                    className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Mini player internal controls */}
            {isMiniPlayer && !isBackground && (
              <div className="absolute top-2 right-2 z-50 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {queueLength > 0 && (
                  <div className="flex items-center justify-center bg-black/50 text-white backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold">
                    +{queueLength}
                  </div>
                )}
                <button 
                  onClick={() => {
                    setIsBackground(true);
                    setIsMiniPlayer(false);
                  }}
                  className="p-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md"
                  title="Play in background"
                >
                  <Headphones size={14} />
                </button>
                <button 
                  onClick={() => setIsMiniPlayer(false)}
                  className="p-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md"
                  title="Maximize"
                >
                  <Maximize2 size={14} />
                </button>
                <button 
                  onClick={() => {
                    onClose();
                    setIsBackground(false);
                  }}
                  className="p-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md"
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            {!isBackground && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] -z-10">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
            
            <div className={`z-10 pointer-events-auto ${isBackground ? 'fixed -top-[2000px] -left-[2000px] w-[300px] h-[200px] opacity-0' : 'w-full h-full'}`}>
              <YouTube 
                videoId={videoId} 
                opts={{ 
                  width: '100%', 
                  height: '100%', 
                  playerVars: { 
                    autoplay: 1, 
                    rel: 0, 
                    modestbranding: 1 
                  } 
                }} 
                onReady={(event) => event.target.playVideo()}
                onStateChange={(event) => {
                  if (event.data === 0) { // 0 means ended
                    onEnded();
                  }
                }}
                className="w-full h-full"
                iframeClassName="w-full h-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
