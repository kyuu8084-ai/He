import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Map, BookOpen, Users, BarChart2, Video as VideoIcon, ChevronRight } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onOpenRoom: () => void;
  language: 'en' | 'vi';
}

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  shortcut?: string;
  category: string;
}

export default function CommandPalette({ isOpen, onClose, onNavigate, onOpenRoom, language }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      label: language === 'en' ? 'Dashboard & Analytics' : 'Bảng điều khiển & Phân tích',
      icon: BarChart2,
      action: () => onNavigate('dashboard'),
      category: language === 'en' ? 'Navigation' : 'Điều hướng'
    },
    {
      id: 'career',
      label: language === 'en' ? 'Career Guidance' : 'Định hướng Nghề nghiệp',
      icon: Map,
      action: () => onNavigate('career'),
      category: language === 'en' ? 'Navigation' : 'Điều hướng'
    },
    {
      id: 'resources',
      label: language === 'en' ? 'Study Resources' : 'Tài liệu Học tập',
      icon: BookOpen,
      action: () => onNavigate('resources'),
      category: language === 'en' ? 'Navigation' : 'Điều hướng'
    },
    {
      id: 'community',
      label: language === 'en' ? 'Community' : 'Cộng đồng',
      icon: Users,
      action: () => onNavigate('community'),
      category: language === 'en' ? 'Navigation' : 'Điều hướng'
    },
    {
      id: 'study-room',
      label: language === 'en' ? 'Enter Study Room' : 'Vào phòng học Focus',
      icon: VideoIcon,
      action: onOpenRoom,
      category: language === 'en' ? 'Actions' : 'Hành động'
    }
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) || 
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter' && filteredCommands.length > 0) {
      e.preventDefault();
      filteredCommands[selectedIndex].action();
      onClose();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-xl mx-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col"
          >
            <div className="flex items-center px-4 py-3 border-b border-black/5">
              <Search size={20} className="text-black/40 mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={language === 'en' ? 'Type a command or search...' : 'Nhập lệnh hoặc tìm kiếm...'}
                className="flex-1 bg-transparent border-none outline-none text-base text-black placeholder-black/40 font-medium"
                spellCheck={false}
              />
              <div className="flex items-center gap-1 text-[10px] font-bold text-black/30 uppercase tracking-widest ml-3">
                <kbd className="px-1.5 py-0.5 rounded bg-black/5 border border-black/10">ESC</kbd>
                <span>to close</span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
              {filteredCommands.length === 0 ? (
                <div className="py-12 text-center text-sm text-black/40 font-medium">
                  {language === 'en' ? 'No results found.' : 'Không tìm thấy kết quả.'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCommands.map((cmd, idx) => {
                    const isSelected = idx === selectedIndex;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors ${
                          isSelected ? 'bg-black text-white' : 'text-black/80 hover:bg-black/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={18} className={isSelected ? 'opacity-100' : 'opacity-50'} />
                          <span className="text-sm font-medium">{cmd.label}</span>
                        </div>
                        {isSelected && <ChevronRight size={16} className="opacity-50" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="px-4 py-2 bg-black/5 border-t border-black/5 flex items-center justify-between text-xs text-black/50 font-medium">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 rounded bg-black/10 shadow-sm border border-black/5">↑</kbd>
                  <kbd className="px-1 rounded bg-black/10 shadow-sm border border-black/5">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 rounded bg-black/10 shadow-sm border border-black/5">Enter</kbd>
                  to select
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
