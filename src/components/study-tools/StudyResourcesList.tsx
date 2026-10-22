import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, increment } from 'firebase/firestore';
import { 
  Search,
  ChevronUp,
  ChevronDown, 
  Star, 
  ExternalLink, 
  Lightbulb, 
  Compass, 
  Headphones, 
  FileText, 
  BrainCircuit, 
  Copy, 
  Check, 
  Sparkles,
  BookOpen,
  Download,
  BookmarkCheck,
  Tag
} from 'lucide-react';

interface ResourceItem {
  id: string;
  title: string;
  desc: string;
  link: string;
  badge?: string;
  type?: 'pdf' | 'web' | 'method' | 'audio' | 'tool' | 'tip';
  content?: string[];
}

interface ResourceCategory {
  category: string;
  icon: React.ReactNode;
  items: ResourceItem[];
}

export default function StudyResourcesList({ language }: { language: 'en' | 'vi' }) {
  const isVi = language === 'vi';
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('study_resource_favs');
      return saved ? JSON.parse(saved) : ['pomodoro', 'notion', 'khan'];
    } catch {
      return ['pomodoro', 'notion', 'khan'];
    }
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [showOnlyFavs, setShowOnlyFavs] = useState(false);

  // Votes state
  const [votes, setVotes] = useState<Record<string, { upvotes: number, downvotes: number }>>({});
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down'>>({});

  useEffect(() => {
    // Attempt to load user votes from local storage as a fallback
    try {
      const saved = localStorage.getItem('study_resource_user_votes');
      if (saved) setUserVotes(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('study_resource_user_votes', JSON.stringify(userVotes));
    } catch {}
  }, [userVotes]);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    
    // Subscribe to all resource IDs to get real-time votes
    const allIds = resources.flatMap(c => c.items.map(i => i.id));
    allIds.forEach(id => {
      const unsub = onSnapshot(doc(db, 'resourceVotes', id), (docSnap) => {
        if (docSnap.exists()) {
          setVotes(prev => ({ ...prev, [id]: docSnap.data() as { upvotes: number, downvotes: number } }));
        }
      });
      unsubscribes.push(unsub);
    });
    
    return () => unsubscribes.forEach(u => u());
  }, []);

  const handleVote = async (id: string, type: 'up' | 'down', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentVote = userVotes[id];
    let newVote: 'up' | 'down' | undefined = type;
    
    let upChange = 0;
    let downChange = 0;
    
    if (currentVote === type) {
      // Toggle off
      newVote = undefined;
      if (type === 'up') upChange = -1;
      else downChange = -1;
    } else {
      // Change vote or new vote
      if (type === 'up') {
        upChange = 1;
        if (currentVote === 'down') downChange = -1;
      } else {
        downChange = 1;
        if (currentVote === 'up') upChange = -1;
      }
    }
    
    const newUserVotes = { ...userVotes };
    if (newVote) newUserVotes[id] = newVote;
    else delete newUserVotes[id];
    setUserVotes(newUserVotes);
    
    // Update Firestore
    const ref = doc(db, 'resourceVotes', id);
    try {
      await setDoc(ref, {
        upvotes: increment(upChange),
        downvotes: increment(downChange)
      }, { merge: true });
    } catch (err) {
      console.error("Error updating votes", err);
    }
  };


  useEffect(() => {
    try {
      localStorage.setItem('study_resource_favs', JSON.stringify(favorites));
    } catch (e) {
      // Ignore
    }
  }, [favorites]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const copyToClipboard = (text: string, id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resources: ResourceCategory[] = [
    {
      category: isVi ? 'Mẹo Học Tập' : 'Study Tips',
      icon: <BrainCircuit size={16} className="text-[#F598F2]" />,
      items: [
        {
          id: 'tip-1',
          title: isVi ? 'Cách chống buồn ngủ' : 'How to stay awake',
          desc: isVi ? 'Những phương pháp tự nhiên giúp bạn tỉnh táo khi ôn thi.' : 'Natural methods to stay alert during exam prep.',
          link: '#',
          badge: isVi ? 'Thực tế' : 'Practical',
          type: 'tip',
          content: isVi ? [
            'Uống nước lạnh từng ngụm nhỏ.',
            'Vươn vai và đi lại mỗi 30 phút.',
            'Giữ phòng học luôn đủ ánh sáng trắng.',
            'Nghe nhạc không lời hoặc nhịp điệu nhanh.'
          ] : [
            'Drink cold water in small sips.',
            'Stretch and walk around every 30 mins.',
            'Keep your study room well-lit.',
            'Listen to fast-paced instrumental music.'
          ]
        },
        {
          id: 'tip-2',
          title: isVi ? 'Khắc phục mất tập trung' : 'Overcoming Distractions',
          desc: isVi ? 'Chiến lược giữ tâm trí luôn ở trạng thái Flow.' : 'Strategies to keep your mind in the Flow state.',
          link: '#',
          badge: isVi ? 'Tâm lý' : 'Mindset',
          type: 'tip',
          content: isVi ? [
            'Để điện thoại ở phòng khác hoặc chế độ máy bay.',
            'Dọn dẹp bàn học chỉ để lại những thứ cần thiết.',
            'Ghi những ý nghĩ lang thang ra một tờ giấy nháp.',
            'Dùng kỹ thuật Pomodoro (25 phút học, 5 phút nghỉ).'
          ] : [
            'Leave phone in another room or on airplane mode.',
            'Clear your desk of non-essentials.',
            'Write wandering thoughts on a piece of paper.',
            'Use Pomodoro technique (25m focus, 5m break).'
          ]
        },
        {
          id: 'tip-3',
          title: isVi ? 'Ghi nhớ dài hạn' : 'Long-term Memory',
          desc: isVi ? 'Cách lưu trữ thông tin sâu vào não bộ.' : 'How to store information deep in the brain.',
          link: '#',
          badge: isVi ? 'Khoa học' : 'Science',
          type: 'tip',
          content: isVi ? [
            'Sử dụng Gợi nhớ chủ động (Active Recall).',
            'Lặp lại ngắt quãng (Spaced Repetition) với Flashcards.',
            'Dạy lại kiến thức cho người khác (Feynman).',
            'Ngủ đủ 7-8 tiếng để não bộ xử lý thông tin.'
          ] : [
            'Use Active Recall.',
            'Use Spaced Repetition with Flashcards.',
            'Teach the concept to someone else (Feynman).',
            'Get 7-8 hours of sleep for memory consolidation.'
          ]
        }
      ]
    },
    {
      category: isVi ? 'Phương pháp học thông minh' : 'Study Methods',
      icon: <Lightbulb size={16} className="text-amber-400" />,
      items: [
        { 
          id: 'pomodoro', 
          title: 'Kỹ thuật Pomodoro', 
          desc: isVi ? 'Chia thời gian 25 phút tập trung cao độ + 5 phút nghỉ ngơi để duy trì sự bền bỉ.' : '25m deep focus blocks followed by 5m structured breaks.', 
          link: 'https://pomofocus.io/',
          badge: isVi ? 'Khuyên dùng' : 'Recommended',
          type: 'method'
        },
        { 
          id: 'feynman', 
          title: 'Phương pháp Feynman', 
          desc: isVi ? 'Giải thích khái niệm phức tạp bằng ngôn từ đơn giản như giảng cho em nhỏ.' : 'Learn complex ideas by explaining them simply to others.', 
          link: 'https://fs.blog/feynman-technique/',
          badge: isVi ? 'Tư duy sâu' : 'Deep Thinking',
          type: 'method'
        },
        { 
          id: 'activerecall', 
          title: 'Gợi nhớ chủ động (Active Recall)', 
          desc: isVi ? 'Tự đặt câu hỏi kiểm tra lại thay vì đọc thụ động, tăng khả năng nhớ trên 80%.' : 'Actively test your memory instead of passive re-reading.', 
          link: 'https://aliabdaal.com/activerecallstudytechnique/',
          badge: isVi ? 'Trí nhớ dài hạn' : 'Long-term Memory',
          type: 'method'
        },
        { 
          id: 'spacedrep', 
          title: 'Lặp lại ngắt quãng (Spaced Repetition)', 
          desc: isVi ? 'Ôn tập theo chu kỳ giãn cách (1, 3, 7, 14 ngày) để chống lại đường cong lãng quên.' : 'Review information at spaced intervals to overcome forgetting curve.', 
          link: 'https://ncase.me/remember/',
          badge: isVi ? 'Khoa học ghi nhớ' : 'Memory Science',
          type: 'method'
        }
      ]
    },
    {
      category: isVi ? 'Sổ tay, Bộ đề & Sơ đồ tư duy' : 'Exam Prep & Mindmaps',
      icon: <FileText size={16} className="text-sky-400" />,
      items: [
        {
          id: 'cornell-note',
          title: 'Mẫu Ghi Chú Cornell (PDF)',
          desc: isVi ? 'Phương pháp chia trang ghi chú thành 3 phần: Từ khóa, Nội dung và Tóm tắt.' : 'Cornell note-taking template dividing page into Cues, Notes, and Summary.',
          link: 'https://medium.com/taking-notes-effectively/the-cornell-note-taking-system-b33367b36f7',
          badge: isVi ? 'Mẫu chuẩn' : 'Template',
          type: 'pdf'
        },
        {
          id: 'mindmeister',
          title: 'MindMeister - Vẽ Sơ Đồ Tư Duy',
          desc: isVi ? 'Công cụ lập sơ đồ tư duy trực quan, kết nối ý tưởng và học qua hình ảnh.' : 'Visual mind mapping tool to brainstorm, structure ideas, and study graphically.',
          link: 'https://www.mindmeister.com/',
          badge: isVi ? 'Sơ đồ tư duy' : 'Mindmap',
          type: 'tool'
        },
        {
          id: 'quizlet',
          title: 'Quizlet - Flashcards & Bộ Đề',
          desc: isVi ? 'Học từ vựng và thuật ngữ qua các bộ thẻ ghi nhớ, trò chơi và đề kiểm tra thử.' : 'Learn vocabulary & terminology with digital flashcards, games & tests.',
          link: 'https://quizlet.com',
          badge: isVi ? 'Ôn thi nhanh' : 'Fast Review',
          type: 'tool'
        },
        {
          id: 'anki',
          title: 'Anki Flashcard AI',
          desc: isVi ? 'Phần mềm flashcard mạnh mẽ bậc nhất thế giới áp dụng thuật toán lặp lại ngắt quãng.' : 'World-class intelligent flashcard software utilizing spaced repetition.',
          link: 'https://apps.ankiweb.net/',
          badge: isVi ? 'Thuật toán AI' : 'Smart AI',
          type: 'tool'
        }
      ]
    },
    {
      category: isVi ? 'Nền tảng & Web học tập hữu ích' : 'Useful Web Platforms',
      icon: <Compass size={16} className="text-emerald-400" />,
      items: [
        { 
          id: 'notion', 
          title: 'Notion All-in-One Workspace', 
          desc: isVi ? 'Không gian quản lý ghi chú, thời khóa biểu, mục tiêu và cơ sở dữ liệu học tập.' : 'Central hub for notes, study planners, databases, and habit tracking.', 
          link: 'https://notion.so',
          badge: isVi ? 'Phổ biến nhất' : 'Most Popular',
          type: 'web'
        },
        { 
          id: 'khan', 
          title: 'Khan Academy Việt Nam', 
          desc: isVi ? 'Thư viện bài giảng Toán, Khoa học, Kinh tế miễn phí chất lượng cao từ cơ bản đến nâng cao.' : 'Free world-class courses in math, science, and computing.', 
          link: 'https://vi.khanacademy.org/',
          badge: isVi ? 'Miễn phí 100%' : '100% Free',
          type: 'web'
        },
        { 
          id: 'coursera', 
          title: 'Coursera & edX', 
          desc: isVi ? 'Học các khóa học và chứng chỉ trực tuyến từ các trường đại học hàng đầu thế giới.' : 'Access online courses and certificates from top ivy-league universities.', 
          link: 'https://coursera.org',
          badge: isVi ? 'Chứng chỉ quốc tế' : 'Certificates',
          type: 'web'
        },
        { 
          id: 'wolfram', 
          title: 'Wolfram Alpha - Giải Toán & Khoa Học', 
          desc: isVi ? 'Công cụ tính toán trí tuệ nhân tạo, giải phương trình, vẽ đồ thị và phân tích hoá học.' : 'Computational engine for solving complex math, physics, and chemistry.', 
          link: 'https://www.wolframalpha.com/',
          badge: isVi ? 'Giải Toán AI' : 'Math Solver',
          type: 'tool'
        },
        { 
          id: 'duolingo', 
          title: 'Duolingo - Học Ngoại Ngữ', 
          desc: isVi ? 'Luyện tập Anh, Trung, Nhật, Hàn qua các bài học game hóa ngắn gọn mỗi ngày.' : 'Learn foreign languages with gamified daily lessons.', 
          link: 'https://www.duolingo.com/',
          badge: isVi ? 'Ngoại ngữ' : 'Language',
          type: 'web'
        }
      ]
    },
    {
      category: isVi ? 'Âm thanh & Không gian tập trung' : 'Focus Sound & Ambience',
      icon: <Headphones size={16} className="text-pink-400" />,
      items: [
        { 
          id: 'lofigirl', 
          title: 'Lofi Girl 24/7 Live Stream', 
          desc: isVi ? 'Kênh phát nhạc Lofi hip-hop không lời nhẹ nhàng giúp giải tỏa căng thẳng khi làm bài.' : 'Relaxing 24/7 chill lofi beats to study and relax to.', 
          link: 'https://lofigirl.com/',
          badge: isVi ? 'Nhạc Lofi' : 'Lofi Beats',
          type: 'audio'
        },
        { 
          id: 'brainfm', 
          title: 'Brain.fm - Nhạc Kích Thích Não Bộ', 
          desc: isVi ? 'Âm nhạc tần số sóng não được chứng minh giúp nhập cuộc tập trung chỉ sau 15 phút.' : 'Neural phase-locked music scientifically designed to deepen focus.', 
          link: 'https://www.brain.fm/',
          badge: isVi ? 'Khoa học sóng não' : 'Neuro-music',
          type: 'audio'
        },
        { 
          id: 'noisli', 
          title: 'Noisli - Pha Trộn Tiếng Mưa & Quán Cafe', 
          desc: isVi ? 'Tùy chỉnh tiếng mưa rơi, tiếng lò sưởi, sóng biển hay quán cafe theo sở thích.' : 'Custom sound generator for rain, cafe ambiance, and white noise.', 
          link: 'https://www.noisli.com/',
          badge: isVi ? 'Tiếng ồn trắng' : 'White Noise',
          type: 'audio'
        },
        { 
          id: 'lifeat', 
          title: 'LifeAt.io - Phòng Học Trực Tuyến Ảo', 
          desc: isVi ? 'Góc học tập ảo ngắm mưa, quán cafe Paris hay không gian vũ trụ cùng bộ đếm giờ Pomodoro.' : 'Virtual cozy study spaces with scenic videos, rain, and timer tools.', 
          link: 'https://lifeat.io/',
          badge: isVi ? 'Góc học ảo' : 'Virtual Room',
          type: 'tool'
        }
      ]
    }
  ];

  // Filter Categories list
  const categoryNames = [
    { id: 'all', name: isVi ? 'Tất cả tài nguyên' : 'All Resources' },
    ...resources.map((r, i) => ({ id: `cat_${i}`, name: r.category }))
  ];

  // Filter logic
  const filteredResources = resources.map((cat, catIdx) => {
    if (activeCategory !== 'all' && activeCategory !== `cat_${catIdx}`) {
      return null;
    }

    const matchingItems = cat.items.filter(item => {
      const matchSearch = searchTerm.trim() === '' || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchFav = !showOnlyFavs || favorites.includes(item.id);

      return matchSearch && matchFav;
    });

    if (matchingItems.length === 0) return null;

    return {
      ...cat,
      items: matchingItems
    };
  }).filter(Boolean) as ResourceCategory[];

  const totalItemCount = resources.reduce((acc, c) => acc + c.items.length, 0);

  return (
    <div className="w-full space-y-4 max-h-[62vh] overflow-y-auto custom-scrollbar pr-1 pb-4">
      {/* Top Controls Bar: Search + Category Filters + Favorites Toggle */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 text-white/50" size={14} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isVi ? "Tìm tài liệu, phương pháp, công cụ..." : "Search tools, methods, guides..."}
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-white/40 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-white/40 outline-none transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-white/40 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Favorites Filter Toggle */}
          <button
            onClick={() => setShowOnlyFavs(!showOnlyFavs)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer whitespace-nowrap w-full sm:w-auto justify-center ${
              showOnlyFavs 
                ? 'bg-amber-400/20 border-amber-400/50 text-amber-300' 
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <Star size={13} className={showOnlyFavs ? 'fill-amber-300' : ''} />
            <span>{isVi ? `Đã lưu (${favorites.length})` : `Favorites (${favorites.length})`}</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {categoryNames.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat.id 
                  ? 'bg-white text-black font-semibold' 
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards Grid */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white/5 rounded-2xl border border-white/10">
          <Sparkles className="mx-auto text-white/40 mb-2" size={24} />
          <p className="text-xs text-white/70 font-medium">
            {isVi ? 'Không tìm thấy tài nguyên phù hợp với từ khóa.' : 'No resources match your search criteria.'}
          </p>
          <button
            onClick={() => { setSearchTerm(''); setShowOnlyFavs(false); setActiveCategory('all'); }}
            className="mt-3 text-[11px] text-[#F598F2] hover:underline uppercase tracking-wider font-semibold cursor-pointer"
          >
            {isVi ? 'Xóa bộ lọc search' : 'Reset filters'}
          </button>
        </div>
      ) : (
        filteredResources.map((section, idx) => (
          <div key={idx} className="bg-black/40 backdrop-blur-md border border-white/10 p-4 lg:p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-white/90 border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                {section.icon}
                <h3 className="text-xs lg:text-sm font-semibold tracking-wide uppercase text-white/90">
                  {section.category}
                </h3>
              </div>
              <span className="text-[10px] text-white/40 font-mono">
                {section.items.length} {isVi ? 'mục' : 'items'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {section.items.map((item) => {
                const isFav = favorites.includes(item.id);
                return (
                  <a 
                    key={item.id} 
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-xl transition-all flex flex-col justify-between gap-2.5 cursor-pointer"
                  >
                    <div>
                      {/* Card Header: Badge & Favorite Button */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        {item.badge ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold tracking-wider uppercase bg-white/10 text-white/90 px-2 py-0.5 rounded-md border border-white/10">
                            <Tag size={9} className="text-amber-300" />
                            {item.badge}
                          </span>
                        ) : <div />}

                        <div className="flex items-center gap-1">
                          {/* Copy Link */}
                          <button
                            onClick={(e) => copyToClipboard(item.link, item.id, e)}
                            className="p-1 text-white/40 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                            title={isVi ? "Sao chép liên kết" : "Copy link"}
                          >
                            {copiedId === item.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>

                          {/* Star Favorite */}
                          <button
                            onClick={(e) => toggleFavorite(item.id, e)}
                            className={`p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer ${
                              isFav ? 'text-amber-300' : 'text-white/40 hover:text-white'
                            }`}
                            title={isVi ? "Lưu vào yêu thích" : "Bookmark"}
                          >
                            <Star size={13} className={isFav ? 'fill-amber-300' : ''} />
                          </button>
                        </div>
                      </div>

                      
                      {/* Title */}
                      <div className="flex items-start justify-between gap-2 mt-1">
                        <span className="font-semibold text-xs text-white group-hover:text-[#F598F2] transition-colors leading-snug pr-8">
                          {item.title}
                        </span>
                        
                        {/* Vote Controls */}
                        <div className="absolute top-3 right-3 flex flex-col items-center bg-black/40 rounded-lg p-0.5 border border-white/10 z-10 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleVote(item.id, 'up', e)}
                            className={`p-1 rounded hover:bg-white/10 transition-colors ${userVotes[item.id] === 'up' ? 'text-emerald-400' : 'text-white/40'}`}
                            title={isVi ? "Hữu ích" : "Helpful"}
                          >
                            <ChevronUp size={14} />
                          </button>
                          <span className="text-[9px] font-bold font-mono my-0.5" style={{ color: ((votes[item.id]?.upvotes || 0) - (votes[item.id]?.downvotes || 0)) > 0 ? '#34d399' : ((votes[item.id]?.upvotes || 0) - (votes[item.id]?.downvotes || 0)) < 0 ? '#f87171' : 'white' }}>
                            {(votes[item.id]?.upvotes || 0) - (votes[item.id]?.downvotes || 0)}
                          </span>
                          <button
                            onClick={(e) => handleVote(item.id, 'down', e)}
                            className={`p-1 rounded hover:bg-white/10 transition-colors ${userVotes[item.id] === 'down' ? 'text-red-400' : 'text-white/40'}`}
                            title={isVi ? "Không hữu ích" : "Not helpful"}
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      </div>


                      {/* Description */}
                      <p className="text-[11px] text-white/60 leading-relaxed line-clamp-2 mt-1 font-normal">
                        {item.desc}
                      </p>
                    </div>

                    {/* Bottom Indicator */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-white/40 group-hover:text-white/70 transition-colors">
                      <span className="uppercase tracking-wider font-mono text-[9px]">
                        {item.type || 'web'}
                      </span>
                      <span className="group-hover:translate-x-0.5 transition-transform">
                        {isVi ? 'Truy cập →' : 'Visit →'}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
