import React, { useEffect, useRef, useState } from 'react';
import { Pencil, Eraser, Trash2, X, Download, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import { Stage, Layer, Line } from 'react-konva';

interface WhiteboardProps {
  socket: any;
  roomId: string;
  onClose: () => void;
}

interface RemoteCursor {
  socketId: string;
  x: number;
  y: number;
  userName: string;
}

type DrawTool = 'pencil' | 'eraser';

interface DrawLine {
  id: string;
  tool: DrawTool;
  color: string;
  size: number;
  points: number[];
}

const Whiteboard: React.FC<WhiteboardProps> = ({ socket, roomId, onClose }) => {
  const [lines, setLines] = useState<DrawLine[]>([]);
  const isDrawing = useRef(false);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState<DrawTool>('pencil');
  
  const [remoteCursors, setRemoteCursors] = useState<Record<string, RemoteCursor>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit('request-whiteboard', roomId);

    const handleDrawData = (data: { line: DrawLine }) => {
      setLines((prev) => [...prev, data.line]);
    };

    const handleCursorUpdate = (data: RemoteCursor) => {
      setRemoteCursors(prev => ({
        ...prev,
        [data.socketId]: data
      }));
    };

    const handleClear = () => {
      setLines([]);
    };

    const handleUserLeft = (data: { socketId: string }) => {
      setRemoteCursors(prev => {
        const next = { ...prev };
        delete next[data.socketId];
        return next;
      });
    };

    socket.on('draw-data', handleDrawData);
    socket.on('cursor-update', handleCursorUpdate);
    socket.on('clear-canvas', handleClear);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('draw-data', handleDrawData);
      socket.off('cursor-update', handleCursorUpdate);
      socket.off('clear-canvas', handleClear);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, roomId]);

  const handleMouseDown = (e: any) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    const newLine: DrawLine = {
      id: Math.random().toString(36).substring(7),
      tool,
      color,
      size: brushSize,
      points: [pos.x, pos.y]
    };
    setLines((prev) => [...prev, newLine]);
  };

  const handleMouseMove = (e: any) => {
    // Send cursor position occasionally
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    
    if (Math.random() > 0.5) { // Throttle cursor events
      socket.emit('cursor-move', {
        roomId,
        x: pos.x,
        y: pos.y,
        userName: auth.currentUser?.displayName || "Student"
      });
    }

    if (!isDrawing.current) return;

    setLines((prev) => {
      const lastLine = { ...prev[prev.length - 1] };
      // add point
      lastLine.points = lastLine.points.concat([pos.x, pos.y]);
      
      // replace last
      const newLines = [...prev];
      newLines.splice(prev.length - 1, 1, lastLine);
      return newLines;
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    const lastLine = lines[lines.length - 1];
    if (lastLine) {
       socket.emit('draw-data', { roomId, data: { line: lastLine } });
    }
  };

  const clearCanvas = () => {
    setLines([]);
    socket.emit('clear-canvas', roomId);
  };

  const download = () => {
    // Basic download
    const uri = document.querySelector('canvas')?.toDataURL();
    if (!uri) return;
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = uri;
    link.click();
  };

  return (
    <div className="flex flex-col h-full w-full bg-black/40 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
      <div className="flex-1 relative bg-zinc-950 cursor-crosshair overflow-hidden" ref={containerRef}>
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          <Layer>
            {lines.map((line, i) => (
              <Line
                key={line.id || i}
                points={line.points}
                stroke={line.tool === 'eraser' ? '#09090b' : line.color}
                strokeWidth={line.size}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === 'eraser' ? 'destination-out' : 'source-over'
                }
              />
            ))}
          </Layer>
        </Stage>

        {/* Floating Tool Palette */}
        <motion.div 
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.05}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] flex flex-wrap md:flex-nowrap items-center justify-center gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-4 w-[90%] md:w-auto bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto"
        >
          {/* Tool Selection */}
          <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
            <button 
              onClick={() => setTool('pencil')}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${tool === 'pencil' ? 'bg-[#e8702a] text-white shadow-lg shadow-[#e8702a]/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              title="Pencil"
            >
              <Pencil size={18} />
            </button>
            <button 
              onClick={() => setTool('eraser')}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${tool === 'eraser' ? 'bg-[#e8702a] text-white shadow-lg shadow-[#e8702a]/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              title="Eraser"
            >
              <Eraser size={18} />
            </button>
          </div>

          <div className="h-8 w-px bg-white/10 mx-1" />

          {/* Color Palette */}
          <div className="flex items-center gap-2.5">
            {['#ffffff', '#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff'].map(c => (
              <button 
                key={c}
                onClick={() => { setColor(c); setTool('pencil'); }}
                className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-125 hover:rotate-12 ${color === c && tool === 'pencil' ? 'border-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-white/10'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="h-8 w-px bg-white/10 mx-1" />

          {/* Brush Size */}
          <div className="flex items-center gap-3 min-w-[140px]">
            <div 
              className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center"
              style={{ padding: `${(20 - brushSize) / 2}px` }}
            >
              <div className="w-full h-full rounded-full bg-white" />
            </div>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="flex-1 accent-[#e8702a] h-1.5 rounded-lg appearance-none bg-white/10 cursor-pointer"
            />
          </div>

          <div className="h-8 w-px bg-white/10 mx-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button 
              onClick={download} 
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all" 
              title="Download"
            >
              <Download size={18} />
            </button>
            <button 
              onClick={clearCanvas} 
              className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-all border border-red-500/20" 
              title="Clear All"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </motion.div>

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 z-[70] w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all shadow-2xl"
        >
          <X size={24} />
        </button>

        {/* Remote Cursors */}
        <AnimatePresence>
          {(Object.values(remoteCursors) as RemoteCursor[]).map((cursor) => (
            <motion.div
              key={cursor.socketId}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                x: cursor.x,
                y: cursor.y 
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                x: { type: "spring", damping: 30, stiffness: 200 },
                y: { type: "spring", damping: 30, stiffness: 200 },
                opacity: { duration: 0.2 }
              }}
              className="absolute top-0 left-0 pointer-events-none z-50 flex flex-col items-start"
            >
              <MousePointer2 
                size={18} 
                className="text-[#e8702a] fill-[#e8702a]" 
                style={{ transform: 'rotate(-90deg)' }}
              />
              <div className="bg-[#e8702a] text-white text-[10px] px-1.5 py-0.5 rounded-sm font-bold whitespace-nowrap ml-2 mt-1 shadow-lg">
                {cursor.userName}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Whiteboard;
