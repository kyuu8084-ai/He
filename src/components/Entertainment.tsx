import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, Play, X, Youtube, Film, Plus, ListVideo, Trash2, Minimize2, Save, Folder } from 'lucide-react';

interface YoutubeVideo {
  id: string;
  queueId?: string;
  title: string;
  thumbnail?: string;
  author?: string;
  timestamp?: string;
}

interface SavedPlaylist {
  id: string;
  name: string;
  videos: YoutubeVideo[];
}

interface EntertainmentProps {
  onBack: () => void;
  language: 'en' | 'vi';
  onPlayVideo: (id: string, playInBackground?: boolean) => void;
  youtubeQueue: YoutubeVideo[];
  setYoutubeQueue: React.Dispatch<React.SetStateAction<YoutubeVideo[]>>;
}

const DEFAULT_VIDEOS: {id: string, title: string, thumbnail?: string, author?: string, timestamp?: string}[] = [
  { id: '8f1KDQtteNs', title: 'Cyrene Honkai Star Rail 4K Live Wallpaper', author: 'Shxwnn Live Wallpaper' },
  { id: 'L03sCIy3TBg', title: 'Firefly Sunset City Honkai Star Rail 4K Live Wallpaper', author: 'Shxwnn Live Wallpaper' },
  { id: 'DSEgT1etldQ', title: 'Honkai Star Rail - Robin [ Live Wallpaper ]', author: 'Live Wallpaper Centre' },
  { id: 'jG6tYnifQ9A', title: 'Silver Wolf & Evanescia Honkai Star Rail 4K Wallpaper', author: 'Shxwnn Live Wallpaper' }
];

export default function Entertainment({ onBack, language, onPlayVideo, youtubeQueue, setYoutubeQueue }: EntertainmentProps) {
  const isVi = language === 'vi';
  // videoId state moved to App.tsx
  const [inputUrl, setInputUrl] = useState('');
  const [searchResults, setSearchResults] = useState<{id: string, title: string, thumbnail?: string, author?: string, timestamp?: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Playlists state
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [showSavePlaylistModal, setShowSavePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const POPULAR_SEARCHES = isVi ? ['lofi hip hop', 'nhạc piano thư giãn', 'nhạc không lời', 'tiếng mưa rơi', 'pomodoro 50/10'] : ['lofi hip hop', 'relaxing piano', 'ambient study', 'rain sounds', 'pomodoro 50/10'];

  useEffect(() => {
    const saved = localStorage.getItem('youtubePlaylists');
    if (saved) {
      try {
        setSavedPlaylists(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleSavePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || youtubeQueue.length === 0) return;

    const newPlaylist: SavedPlaylist = {
      id: Date.now().toString(),
      name: newPlaylistName.trim(),
      videos: [...youtubeQueue]
    };

    const updated = [...savedPlaylists, newPlaylist];
    setSavedPlaylists(updated);
    localStorage.setItem('youtubePlaylists', JSON.stringify(updated));
    setNewPlaylistName('');
    setShowSavePlaylistModal(false);
  };

  const handleLoadPlaylist = (playlist: SavedPlaylist) => {
    if (playlist.videos.length > 0) {
      onPlayVideo(playlist.videos[0].id);
      setYoutubeQueue(playlist.videos.slice(1).map(v => ({...v, queueId: `${v.id}-${Date.now()}-${Math.random()}`})));
    }
  };

  const handleDeletePlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedPlaylists.filter(p => p.id !== id);
    setSavedPlaylists(updated);
    localStorage.setItem('youtubePlaylists', JSON.stringify(updated));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputUrl.trim().length > 1) {
        fetch(`/api/youtube/suggest?q=${encodeURIComponent(inputUrl)}`)
          .then(res => res.json())
          .then(data => {
            if (data.suggestions) {
              setSuggestions(data.suggestions.slice(0, 5));
              setShowSuggestions(true);
            }
          })
          .catch(() => {});
      } else {
        setSuggestions(POPULAR_SEARCHES);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputUrl, isVi]);

  useEffect(() => {
    const saved = localStorage.getItem('recentYoutubeSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent, term?: string) => {
    if (e) e.preventDefault();
    const query = term || inputUrl;
    if (!query.trim()) return;
    
    setInputUrl(query);
    setShowSuggestions(false);
    
    const updatedSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentYoutubeSearches', JSON.stringify(updatedSearches));
    
    setIsSearching(true);
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.videos) {
        setSearchResults(data.videos);
      }
    } catch (err) {
      console.error("Search error", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="font-figtree min-h-screen text-white overflow-hidden relative selection:bg-red-500/30">
      {/* Dynamic Background Video */}
      <div className="absolute inset-0 z-0 bg-black">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover opacity-60"
        >
          <source src="https://res.cloudinary.com/avv55uce/video/upload/v1785590072/YTSave_YouTube_4K-Looped-Furina-Wallpaper-Genshin-Impac_Media_04H14c1QERU_001_1080p_rwncfi.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/80" />
      </div>

      <header className="fixed top-0 left-0 right-0 p-6 z-50 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-3 text-white hover:text-white/70 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white/20 group-hover:scale-105 transition-all">
            <ArrowLeft size={18} />
          </div>
          <span className="text-xs font-bold tracking-[0.2em] uppercase">{isVi ? 'Trở về' : 'Return'}</span>
        </button>
      </header>

      <main className="relative z-10 pt-24 pb-12 px-6 max-w-5xl mx-auto min-h-screen flex flex-col items-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center flex flex-col items-center"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
              <Youtube className="text-red-500" size={42} />
            </div>
          </div>
          <h1 className="text-4xl sm:text-6xl font-display uppercase font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-4">
            {isVi ? 'Phim & Giải trí' : 'Entertainment'}
          </h1>
          <p className="text-white/60 text-lg font-light max-w-xl mx-auto">
            {isVi ? 'Không gian thư giãn điện ảnh. Tìm kiếm và thưởng thức video YouTube yêu thích của bạn không quảng cáo.' : 'Your cinematic relaxation space. Search and enjoy your favorite YouTube videos distraction-free.'}
          </p>
        </motion.div>

        {/* Search Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-2xl mb-12"
        >
          <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-2 rounded-[2rem] shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 pointer-events-none" />
            <form onSubmit={handleSearch} className="flex relative z-10">
              <div ref={searchRef} className="relative flex-1 group">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                  placeholder={isVi ? "Tìm kiếm tên video hoặc ca khúc..." : "Search for videos or music..."}
                  className="w-full bg-transparent pl-14 pr-4 py-4 text-base focus:outline-none text-white placeholder:text-white/40"
                />
                <Search size={20} className="absolute left-5 top-4.5 text-white/40 group-focus-within:text-red-500 transition-colors" />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setInputUrl(suggestion);
                          setShowSuggestions(false);
                          handleSearch(undefined, suggestion);
                        }}
                        className="w-full text-left px-5 py-3 hover:bg-white/5 text-white/80 hover:text-white transition-colors flex items-center gap-3 cursor-pointer"
                      >
                        <Search size={14} className="text-white/40" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isSearching || !inputUrl.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white rounded-full px-8 font-bold flex items-center gap-2 transition-all cursor-pointer m-1"
              >
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{isVi ? 'Tìm kiếm' : 'Search'}</span>
                )}
              </button>
            </form>
            {recentSearches.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSearch(undefined, term)}
                    className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-medium text-white/70 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Search size={10} />
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>


        {/* Queue Section */}
        {youtubeQueue.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl mb-12"
          >
            <div className="flex items-center justify-between mb-6 px-4">
              <div className="flex items-center gap-3">
                <ListVideo size={20} className="text-white/60" />
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">
                  {isVi ? 'Danh sách phát chờ' : 'Up Next'}
                </h3>
                <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {youtubeQueue.length}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowSavePlaylistModal(true)}
                  className="text-xs text-white/50 hover:text-green-400 uppercase tracking-widest transition-colors flex items-center gap-1 font-bold"
                >
                  <Save size={12} />
                  {isVi ? 'Lưu danh sách' : 'Save Playlist'}
                </button>
                <button 
                  onClick={() => setYoutubeQueue([])}
                  className="text-xs text-white/50 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1 font-bold"
                >
                  <Trash2 size={12} />
                  {isVi ? 'Xóa hết' : 'Clear All'}
                </button>
              </div>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar px-2">
              {youtubeQueue.map((vid, idx) => (
                <div key={vid.queueId || `${vid.id}-${idx}`} className="flex-shrink-0 w-64 bg-black/40 border border-white/10 rounded-2xl overflow-hidden relative group">
                  <div className="aspect-video w-full relative">
                    <img src={'thumbnail' in vid ? vid.thumbnail! : `https://img.youtube.com/vi/${vid.id}/mqdefault.jpg`} alt={vid.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40" />
                    <button 
                      onClick={() => {
                        setYoutubeQueue(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 rounded-full text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setYoutubeQueue(prev => prev.filter((_, i) => i !== idx));
                        onPlayVideo(vid.id);
                      }}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors">
                        <Play size={16} fill="currentColor" className="text-white ml-0.5" />
                      </div>
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-white/90 line-clamp-1">{vid.title}</p>
                    {vid.author && <p className="text-[10px] text-white/50 mt-1">{vid.author}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Saved Playlists */}
        {savedPlaylists.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl mb-12"
          >
            <div className="flex items-center gap-3 mb-6 px-4">
              <Folder size={20} className="text-white/60" />
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">
                {isVi ? 'Danh sách đã lưu' : 'Saved Playlists'}
              </h3>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar px-2">
              {savedPlaylists.map((playlist) => (
                <div key={playlist.id} className="flex-shrink-0 w-64 bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 group hover:bg-white/5 transition-colors relative">
                  <button 
                    onClick={(e) => handleDeletePlaylist(playlist.id, e)}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 rounded-full text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-10"
                  >
                    <X size={14} />
                  </button>
                  <div className="flex items-center gap-2">
                    <Folder size={16} className="text-red-400" />
                    <span className="font-bold text-sm truncate pr-6">{playlist.name}</span>
                  </div>
                  <span className="text-xs text-white/50">{playlist.videos.length} {isVi ? 'video' : 'videos'}</span>
                  <button 
                    onClick={() => handleLoadPlaylist(playlist)}
                    className="mt-2 w-full py-2 bg-white/10 hover:bg-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={12} fill="currentColor" />
                    {isVi ? 'Phát danh sách' : 'Play Playlist'}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search Results */}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-5xl"
        >
          <div className="flex items-center gap-3 mb-6 px-4">
            <Film size={20} className="text-white/60" />
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">
              {searchResults.length > 0 ? (isVi ? 'Kết quả tìm kiếm' : 'Search Results') : (isVi ? 'Gợi ý cho bạn' : 'Suggested for you')}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(searchResults.length > 0 ? searchResults : DEFAULT_VIDEOS).map((vid, idx) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                key={vid.id}
                className="group flex flex-col text-left bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 relative"
              >
                <button onClick={() => onPlayVideo(vid.id)} className="w-full text-left cursor-pointer outline-none flex-1 flex flex-col">
                  <div className="w-full aspect-video bg-[#1a1a1a] relative overflow-hidden shadow-inner">
                    <img src={'thumbnail' in vid ? vid.thumbnail! : `https://img.youtube.com/vi/${vid.id}/mqdefault.jpg`} alt={vid.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-sm bg-black/30 transition-all">
                      <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/40 transform scale-75 group-hover:scale-100 transition-transform">
                        <Play size={20} fill="currentColor" className="text-white ml-1" />
                      </div>
                    </div>
                    
                    {'timestamp' in vid && (
                      <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-mono text-white/90 shadow-lg">
                        {vid.timestamp}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col justify-start pb-12">
                    <p className="text-sm font-semibold line-clamp-2 leading-snug mb-2 text-white/90 group-hover:text-white transition-colors">
                      {vid.title}
                    </p>
                    {'author' in vid && (
                      <p className="text-xs text-white/50 truncate font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white/20" />
                        {vid.author}
                      </p>
                    )}
                  </div>
                </button>
                <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayVideo(vid.id, true);
                    }}
                    className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all border border-white/10 cursor-pointer shadow-lg"
                    title={isVi ? "Thu nhỏ & Phát nền" : "Play in background"}
                  >
                    <Minimize2 size={14} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setYoutubeQueue(prev => [...prev, { ...vid, queueId: Math.random().toString(36).substring(7) }]);
                    }}
                    className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all border border-white/10 cursor-pointer shadow-lg"
                    title={isVi ? "Thêm vào danh sách phát" : "Add to queue"}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Save Playlist Modal */}
      <AnimatePresence>
        {showSavePlaylistModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowSavePlaylistModal(false)}
                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 mb-6 text-white/80">
                <Save size={24} className="text-green-400" />
                <h3 className="text-lg font-bold">{isVi ? 'Lưu danh sách phát' : 'Save Playlist'}</h3>
              </div>
              
              <form onSubmit={handleSavePlaylist}>
                <div className="mb-6">
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-bold">
                    {isVi ? 'Tên danh sách' : 'Playlist Name'}
                  </label>
                  <input 
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder={isVi ? "Nhập tên danh sách..." : "Enter playlist name..."}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-400/50 transition-colors"
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowSavePlaylistModal(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    {isVi ? 'Hủy' : 'Cancel'}
                  </button>
                  <button 
                    type="submit"
                    disabled={!newPlaylistName.trim()}
                    className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:hover:bg-green-500 rounded-xl font-bold text-black transition-colors cursor-pointer"
                  >
                    {isVi ? 'Lưu' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
