const fs = require('fs');
const code = `import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minimize2, Maximize2, ListVideo } from 'lucide-react';
import ReactPlayer from 'react-player';

interface YouTubePlayerProps {
  videoId: string | null;
  onClose: () => void;
  isMiniPlayer: boolean;
  setIsMiniPlayer: (isMini: boolean) => void;
  onEnded: () => void;
  queueLength: number;
}

export default function YouTubePlayer({ videoId, onClose, isMiniPlayer, setIsMiniPlayer, onEnded, queueLength }: YouTubePlayerProps) {
  return (
    <AnimatePresence>
      {videoId && (
        <motion.div
          key="youtube-player-container"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          className={
            isMiniPlayer 
              ? "fixed bottom-6 right-6 z-[100] w-80 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/20 group"
              : "fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-12 bg-black/90 backdrop-blur-2xl"
          }
          layout
        >
          {/* Fullscreen controls */}
          {!isMiniPlayer && (
            <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
              {queueLength > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white backdrop-blur-md border border-white/10">
                  <ListVideo size={16} />
                  <span className="text-sm font-bold">{queueLength} in queue</span>
                </div>
              )}
              <button 
                onClick={() => setIsMiniPlayer(true)}
                className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer backdrop-blur-md border border-white/10"
              >
                <Minimize2 size={24} />
              </button>
              <button 
                onClick={onClose}
                className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer backdrop-blur-md border border-white/10"
              >
                <X size={24} />
              </button>
            </div>
          )}

          {/* Mini player controls */}
          {isMiniPlayer && (
            <div className="absolute top-2 right-2 z-50 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {queueLength > 0 && (
                <div className="flex items-center justify-center bg-black/50 text-white backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold">
                  +{queueLength}
                </div>
              )}
              <button 
                onClick={() => setIsMiniPlayer(false)}
                className="p-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md"
              >
                <Maximize2 size={14} />
              </button>
              <button 
                onClick={onClose}
                className="p-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md"
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          <motion.div
            layout
            className={
              isMiniPlayer
                ? "w-full h-full pointer-events-auto relative"
                : "w-full max-w-6xl aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 relative group"
            }
          >
            {!isMiniPlayer && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] -z-10">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
            
            <div className="w-full h-full z-10 pointer-events-auto">
              <ReactPlayer
                url={\`https://www.youtube.com/watch?v=\${videoId}\`}
                width="100%"
                height="100%"
                playing={true}
                controls={true}
                onEnded={onEnded}
                config={{
                  youtube: {
                    playerVars: { modestbranding: 1, rel: 0, showinfo: 0 }
                  }
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
`;
fs.writeFileSync('src/components/YouTubePlayer.tsx', code);
