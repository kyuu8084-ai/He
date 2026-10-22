import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { collection, query, where, orderBy, onSnapshot, limit, doc, updateDoc, setDoc } from 'firebase/firestore';
import { format, startOfDay, subDays, eachDayOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { db, auth } from '../lib/firebase';
import { Clock, TrendingUp, Calendar, ArrowLeft, Trophy, Sparkles, Award, BarChart2, Target, Check, Edit2, ListTodo, Plus, Trash2, Tag as TagIcon, X, Download } from 'lucide-react';
import Leaderboard from './Leaderboard';

interface Comment {
  id: string;
  postId: string;
  content: string;
  createdAt: any;
}

interface StudySession {
  id: string;
  userId: string;
  durationSeconds: number;
  startTime: any;
  endTime: any;
  categoryId?: string;
  tags?: string[];
}

interface ChartData {
  date: string;
  hours: number;
}

const CATEGORY_THEMES: Record<string, { name: string, colors: [string, string, string], accent: string }> = {
  'all': { name: 'Tất cả', colors: ['#F8F8F8', '#F3F4F6', '#EEF2FF'], accent: '#000000' },
  '1': { name: 'Toán học', colors: ['#EFF6FF', '#DBEAFE', '#BFDBFE'], accent: '#2563EB' },
  '2': { name: 'Lập trình', colors: ['#F0FDF4', '#DCFCE7', '#BBF7D0'], accent: '#16A34A' },
  '3': { name: 'Nghệ thuật', colors: ['#FAF5FF', '#F3E8FF', '#E9D5FF'], accent: '#9333EA' },
  '4': { name: 'Ngoại ngữ', colors: ['#FFFBEB', '#FEF3C7', '#FDE68A'], accent: '#D97706' },
  '5': { name: 'Xã hội', colors: ['#FFF1F2', '#FFE4E6', '#FECDD3'], accent: '#E11D48' },
};


const AVAILABLE_TAGS = [
  { id: 'math', label: 'Math', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'coding', label: 'Coding', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'reading', label: 'Reading', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'writing', label: 'Writing', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'focus', label: 'Deep Focus', color: 'bg-gray-800 text-white border-gray-900' },
  { id: 'review', label: 'Review', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
];

const Dashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<StudySession[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [pieData, setPieData] = useState<{name: string, value: number, color: string}[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [todayHours, setTodayHours] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dashboardTab, setDashboardTab] = useState<'analytics' | 'history' | 'leaderboard'>('analytics');
  const [recentComments, setRecentComments] = useState<Comment[]>([]);
    const [dailyGoal, setDailyGoal] = useState(() => Number(localStorage.getItem('focus_daily_goal') || 2));
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(dailyGoal.toString());
  const [hasCelebratedGoal, setHasCelebratedGoal] = useState(() => localStorage.getItem('focus_goal_celebrated_date') === new Date().toDateString());

  const [tasks, setTasks] = useState<{id: string, text: string, completed: boolean}[]>(() => {
    try {
      const saved = localStorage.getItem('focus_study_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newTaskText, setNewTaskText] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('focus_study_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks(prev => [{ id: Math.random().toString(36).substr(2, 9), text: newTaskText.trim(), completed: false }, ...prev]);
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'studySessions'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('startTime', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StudySession));
      
      setSessions(sessionsData);
    }, (error) => { console.error("Firebase onSnapshot error in src/components/Dashboard.tsx:", error); });
    const qComments = query(
      collection(db, 'forumComments'),
      where('authorId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubComments = onSnapshot(qComments, (snapshot) => {
      setRecentComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    }, (error) => console.log(error));

    return () => { unsub(); unsubComments(); };
  }, []);


  useEffect(() => {
    const filtered = selectedCategory === 'all' 
      ? sessions 
      : sessions.filter(s => s.categoryId === selectedCategory);
    
    setFilteredSessions(filtered);
    processChartData(filtered);
  }, [sessions, selectedCategory, dailyGoal]);

  useEffect(() => {
    if (todayHours >= dailyGoal && dailyGoal > 0 && !hasCelebratedGoal) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F598F2', '#2563EB', '#16A34A', '#D97706', '#E11D48']
      });
      setHasCelebratedGoal(true);
      localStorage.setItem('focus_goal_celebrated_date', new Date().toDateString());
    }
  }, [todayHours, dailyGoal, hasCelebratedGoal]);

  const handleSaveGoal = () => {
    const val = Number(tempGoal);
    if (!isNaN(val) && val > 0) {
      setDailyGoal(val);
      localStorage.setItem('focus_daily_goal', val.toString());
      if (todayHours < val) {
        setHasCelebratedGoal(false);
        localStorage.removeItem('focus_goal_celebrated_date');
      }
    }
    setIsEditingGoal(false);
  };

  const processChartData = (data: StudySession[]) => {
    // Last 7 days
    const end = new Date();
    const start = subDays(end, 6);
    const interval = eachDayOfInterval({ start, end });

    const dailyData = interval.map(date => {
      const dayStr = format(date, 'yyyy-MM-dd');
      const daySessions = data.filter(s => {
        const sessionDate = s.startTime?.toDate();
        return sessionDate && format(sessionDate, 'yyyy-MM-dd') === dayStr;
      });

      const totalSeconds = daySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
      return {
        date: format(date, 'EEE'),
        fullDate: dayStr,
        hours: Number((totalSeconds / 3600).toFixed(2))
      };
    });

    setChartData(dailyData);

    const categoryTotals: Record<string, number> = {};
    data.forEach(s => {
      const catId = s.categoryId || 'all';
      categoryTotals[catId] = (categoryTotals[catId] || 0) + s.durationSeconds;
    });
    
    const newPieData = Object.entries(categoryTotals)
      .map(([catId, secs]) => ({
        name: CATEGORY_THEMES[catId]?.name || 'Khác',
        value: Number((secs / 3600).toFixed(1)),
        color: CATEGORY_THEMES[catId]?.accent || '#000000'
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
      
    setPieData(newPieData);

    // Totals
    const totalSecs = data.reduce((acc, s) => acc + s.durationSeconds, 0);
    setTotalHours(Number((totalSecs / 3600).toFixed(1)));

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todaySecs = data
      .filter(s => s.startTime?.toDate() && format(s.startTime.toDate(), 'yyyy-MM-dd') === todayStr)
      .reduce((acc, s) => acc + s.durationSeconds, 0);
    setTodayHours(Number((todaySecs / 3600).toFixed(1)));

    // Goal-based streak calculation
    let currentStreak = 0;
    for (let i = 0; i < 30; i++) {
      const d = subDays(new Date(), i);
      const dStr = format(d, 'yyyy-MM-dd');
      const daySecs = data
        .filter(s => s.startTime?.toDate() && format(s.startTime.toDate(), 'yyyy-MM-dd') === dStr)
        .reduce((acc, s) => acc + s.durationSeconds, 0);
      const dayHours = Number((daySecs / 3600).toFixed(1));
      
      if (dailyGoal > 0 && dayHours >= dailyGoal) {
        currentStreak++;
      } else if (i === 0) {
        // Today hasn't met the goal yet, don't break the streak from yesterday
      } else {
        // Streak broken
        break;
      }
    }
    setStreak(currentStreak);

    if (auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName: auth.currentUser.displayName || 'Focus User',
        photoURL: auth.currentUser.photoURL || '',
        streak: currentStreak,
        totalHours: Number((totalSecs / 3600).toFixed(1)),
        lastUpdated: new Date()
      }, { merge: true }).catch(console.error);
    }
  };

  const theme = CATEGORY_THEMES[selectedCategory];


  const handleDownloadReport = () => {
    let report = `Báo Cáo Tiến Độ Học Tập\n`;
    report += `Ngày tạo: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: vi })}\n`;
    report += `----------------------------------------\n`;
    report += `TỔNG QUAN:\n`;
    report += `- Tổng số giờ học: ${totalHours}h\n`;
    report += `- Số giờ học hôm nay: ${todayHours}h\n`;
    report += `- Chuỗi ngày học liên tiếp: ${streak} ngày\n`;
    report += `- Tổng số phiên học: ${sessions.length} phiên\n`;
    report += `----------------------------------------\n`;
    report += `PHÂN BỔ THỜI GIAN THEO DANH MỤC:\n`;
    
    const catTotals: Record<string, number> = {};
    sessions.forEach(s => {
      const catId = s.categoryId || 'all';
      catTotals[catId] = (catTotals[catId] || 0) + s.durationSeconds;
    });
    
    const catData = Object.entries(catTotals)
      .map(([catId, secs]) => ({
        name: CATEGORY_THEMES[catId]?.name || 'Khác',
        value: Number((secs / 3600).toFixed(1))
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
      
    catData.forEach(c => {
      report += `- ${c.name}: ${c.value}h\n`;
    });
    
    report += `----------------------------------------\n`;
    report += `LỊCH SỬ HỌC TẬP (10 phiên gần nhất):\n`;
    sessions.slice(0, 10).forEach(s => {
      const d = s.startTime?.toDate ? s.startTime.toDate() : new Date();
      const duration = (s.durationSeconds / 60).toFixed(0);
      const catName = CATEGORY_THEMES[s.categoryId || 'all']?.name || 'Khác';
      report += `- ${format(d, 'dd/MM/yyyy HH:mm', { locale: vi })} | ${catName} | ${duration} phút\n`;
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BaoCaoHocTap_${format(new Date(), 'yyyyMMdd')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen overflow-hidden font-body text-black transition-colors duration-1000">
      {/* Dynamic Background */}
      <motion.div 
        animate={{ 
          background: `radial-gradient(at 0% 0%, ${theme.colors[0]} 0%, transparent 50%),
                       radial-gradient(at 100% 0%, ${theme.colors[1]} 0%, transparent 50%),
                       radial-gradient(at 50% 100%, ${theme.colors[2]} 0%, transparent 50%)`,
          backgroundColor: theme.colors[0]
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="fixed inset-0 -z-10"
      />

      <div className="relative max-w-6xl mx-auto p-8 md:p-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack}
              className="p-3 bg-white/80 backdrop-blur-md rounded-2xl border border-black/5 hover:border-black/20 transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-display">Bảng điều khiển học tập</h1>
              <p className="text-sm text-black/60">Theo dõi tiến trình, hiệu suất & bộ sưu tập huy chương.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Tab Switcher */}
            <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-black/5 flex items-center gap-1 shadow-sm">
              <button
                onClick={() => setDashboardTab('analytics')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  dashboardTab === 'analytics'
                    ? 'bg-black text-white shadow-md'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                <BarChart2 size={16} />
                <span>Tổng quan</span>
              </button>
              <button
                onClick={() => setDashboardTab('history')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  dashboardTab === 'history'
                    ? 'bg-black text-white shadow-md'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                <Clock size={16} />
                <span>Lịch sử chi tiết</span>
              </button>
              <button
                onClick={() => setDashboardTab('leaderboard')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  dashboardTab === 'leaderboard'
                    ? 'bg-black text-white shadow-md'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                <Trophy size={16} className={dashboardTab === 'leaderboard' ? 'text-amber-400' : ''} />
                <span>Xếp Hạng</span>
              </button>
            </div>


            <button
              onClick={handleDownloadReport}
              className="hidden sm:flex items-center gap-2 px-4 py-3 bg-white/80 backdrop-blur-md rounded-2xl border border-black/5 hover:bg-black hover:text-white transition-all shadow-sm cursor-pointer font-bold text-sm group"
              title="Tải báo cáo tiến độ"
            >
              <Download size={18} className="group-hover:scale-110 transition-transform" />
              <span>Báo cáo</span>
            </button>
            <div className="hidden sm:flex items-center gap-3 px-5 py-3 bg-white/80 backdrop-blur-md rounded-2xl border border-black/5 shadow-sm">
              <Trophy size={20} className="text-yellow-500" />
              <span className="text-sm font-bold">Chuỗi {streak} ngày</span>
            </div>
          </div>
        </header>

        {dashboardTab === 'leaderboard' ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <Leaderboard />
          </motion.div>
        ) : dashboardTab === 'history' ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-[40px] p-8 sm:p-10 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-display flex items-center gap-3">
                  <Clock size={28} className="text-black/40" />
                  Lịch sử học tập
                </h3>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full text-sm font-bold">
                  <Trophy size={16} className="text-amber-500" />
                  Chuỗi hiện tại: {streak} ngày
                </div>
              </div>
              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-black/10 rounded-3xl">
                    <p className="text-black/40 font-medium">Chưa có dữ liệu phiên học nào.</p>
                  </div>
                ) : (
                  sessions.map((session, i) => {
                    const d = session.startTime?.toDate ? session.startTime.toDate() : new Date();
                    // Calculate consecutive days for this specific session dynamically if we wanted, but let's just show details
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={session.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white border border-black/5 hover:border-black/10 transition-colors shadow-sm gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div 
                            style={{ 
                              backgroundColor: `${CATEGORY_THEMES[session.categoryId || 'all']?.accent || '#000'}15`,
                              color: CATEGORY_THEMES[session.categoryId || 'all']?.accent || '#000'
                            }}
                            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                          >
                            <Calendar size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-lg">{CATEGORY_THEMES[session.categoryId || 'all']?.name || 'Khác'}</p>
                            <p className="text-sm text-black/50 font-medium mb-2">
                              {format(d, 'EEEE, dd/MM/yyyy, HH:mm', { locale: vi })}
                            </p>
                            <div className="flex flex-wrap gap-2 items-center">
                              {session.tags?.map(tagId => {
                                const t = AVAILABLE_TAGS.find(x => x.id === tagId);
                                if (!t) return null;
                                return (
                                  <span key={tagId} className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${t.color}`}>
                                    {t.label}
                                  </span>
                                );
                              })}
                              {editingSessionId === session.id ? (
                                <div className="relative">
                                  <div className="absolute top-full mt-2 left-0 w-[240px] bg-white border border-gray-100 shadow-xl rounded-xl p-3 z-50 flex flex-wrap gap-2">
                                    {AVAILABLE_TAGS.map(t => {
                                      const isSelected = session.tags?.includes(t.id);
                                      return (
                                        <button 
                                          key={t.id}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            const newTags = isSelected 
                                              ? (session.tags || []).filter(x => x !== t.id)
                                              : [...(session.tags || []), t.id];
                                            await updateDoc(doc(db, 'studySessions', session.id), { tags: newTags });
                                          }}
                                          className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${t.color} ${isSelected ? 'ring-2 ring-black ring-offset-1' : 'opacity-60 hover:opacity-100'}`}
                                        >
                                          {t.label}
                                        </button>
                                      );
                                    })}
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setEditingSessionId(null); }}
                                      className="w-full mt-2 text-xs text-gray-500 font-bold bg-gray-50 py-1.5 rounded-lg hover:bg-gray-100"
                                    >
                                      Đóng
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setEditingSessionId(session.id)}
                                  className="text-[10px] text-gray-400 hover:text-black hover:bg-gray-100 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 font-bold border border-transparent hover:border-gray-200"
                                >
                                  <TagIcon size={10} /> Thêm Tag
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 sm:justify-end">
                          <div className="text-right">
                            <p className="text-xs font-bold uppercase tracking-widest text-black/40 mb-1">Thời lượng</p>
                            <p className="font-mono font-bold text-xl">{(session.durationSeconds / 60).toFixed(0)} <span className="text-sm">phút</span></p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-end gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
              {Object.entries(CATEGORY_THEMES).map(([id, cat]) => (
                <button
                  key={id}
                  onClick={() => setSelectedCategory(id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    selectedCategory === id 
                      ? 'bg-black text-white border-black shadow-lg shadow-black/10' 
                      : 'bg-white/50 backdrop-blur-sm text-black/60 border-black/5 hover:border-black/20'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-[32px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-sm group hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-black mb-6 transition-transform group-hover:scale-110">
              <Clock size={24} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Tổng giờ học</h3>
            <p className="text-4xl font-display">{totalHours}<span className="text-lg ml-2">h</span></p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-[32px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-sm group hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div 
                  style={{ color: theme.accent, backgroundColor: `${theme.accent}15` }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                >
                  <Target size={24} />
                </div>
                {isEditingGoal ? (
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-black/10 shadow-sm">
                    <input
                      type="number"
                      value={tempGoal}
                      onChange={(e) => setTempGoal(e.target.value)}
                      className="w-12 text-sm font-bold text-center outline-none bg-transparent"
                      min="0.5"
                      step="0.5"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal()}
                    />
                    <button onClick={handleSaveGoal} className="p-1.5 bg-black text-white rounded-md hover:bg-black/80 transition-colors cursor-pointer">
                      <Check size={12} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setTempGoal(dailyGoal.toString());
                      setIsEditingGoal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-xs font-semibold tracking-wider text-black/60 transition-colors cursor-pointer"
                  >
                    <span>Mục tiêu: {dailyGoal}h</span>
                    <Edit2 size={12} />
                  </button>
                )}
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-black/40 mb-1">Hôm nay</h3>
              <p className="text-4xl font-display mb-1 flex items-baseline gap-2">
                {todayHours}<span className="text-lg text-black/40 font-body font-bold">/ {dailyGoal}h</span>
              </p>
            </div>
            
            {/* Circular Progress Ring */}
            <div className="flex items-center gap-4 sm:gap-6 mt-4">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-black/5"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={251.2}
                    initial={{ strokeDashoffset: 251.2 }}
                    animate={{ strokeDashoffset: 251.2 - (251.2 * Math.min((todayHours / dailyGoal) * 100, 100)) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-lg sm:text-xl font-bold font-display" style={{ color: theme.accent }}>
                    {Math.min(Math.round((todayHours / dailyGoal) * 100), 100)}%
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1">Tiến độ</p>
                <p className="text-xs sm:text-sm font-semibold text-black/70 leading-snug">
                  {todayHours >= dailyGoal 
                    ? "Tuyệt vời! Đã đạt mục tiêu." 
                    : `Còn ${Math.max(dailyGoal - todayHours, 0).toFixed(1)}h nữa.`}
                </p>
                {hasCelebratedGoal && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mt-2 flex items-center gap-1">
                    <Sparkles size={10} /> Đã hoàn thành!
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-[32px] bg-black text-white shadow-xl shadow-black/10 group overflow-hidden relative"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, 0]
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-3xl" 
            />
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-6 relative z-10 transition-transform group-hover:scale-110">
              <Calendar size={24} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2 relative z-10">Số phiên học</h3>
            <p className="text-4xl font-display relative z-10">{filteredSessions.length}</p>
          </motion.div>\n          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-8 rounded-[32px] bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl shadow-orange-500/20 group overflow-hidden relative flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-6 relative z-10 border border-white/20 transition-transform group-hover:scale-110">
                <Trophy size={24} className={streak > 0 ? "animate-pulse" : ""} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/80 mb-1 relative z-10">Study Streak</h3>
            </div>
            <div>
              <p className="text-5xl font-display mb-1 relative z-10 flex items-baseline gap-2">
                {streak} <span className="text-xl font-bold font-body text-white/80">ngày</span>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 relative z-10">
                {streak > 0 ? "Giữ vững phong độ nhé!" : "Bắt đầu chuỗi mới hôm nay!"}
              </p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          className="p-10 rounded-[40px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-sm lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-display flex items-center gap-2">
              <TrendingUp size={24} style={{ color: theme.accent }} />
              Study Trends
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black/40">
              <Sparkles size={12} style={{ color: theme.accent }} />
              7 Ngày Qua ({theme.name})
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px',
                    backgroundColor: 'white',
                    color: '#000',
                    fontWeight: 'bold'
                  }}
                  itemStyle={{ color: theme.accent }}
                  labelStyle={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}
                />
                <Bar 
                  dataKey="hours" 
                  fill={theme.accent} 
                  radius={[8, 8, 8, 8]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
          className="p-10 rounded-[40px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-display flex items-center gap-2">
              <BarChart2 size={24} style={{ color: theme.accent }} />
              Phân bổ thời gian
            </h3>
          </div>
          <div className="h-[200px] w-full mb-6 relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '8px 12px',
                      backgroundColor: 'white',
                      fontWeight: 'bold'
                    }}
                    formatter={(value: number) => [`${value}h`, 'Thời gian']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-black/40 text-sm font-medium border-2 border-dashed border-black/10 rounded-2xl">
                Chưa có dữ liệu
              </div>
            )}
            
            {pieData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-display">{totalHours}h</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">Tổng</span>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="text-black/60">{item.value}h</span>
              </div>
            ))}
          </div>
        </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }} className="space-y-6">
          <h3 className="text-xl font-display flex items-center gap-2">Hoạt động gần đây</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Study Sessions */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                <Clock size={16} /> Phiên học gần nhất
              </h4>
              <div className="space-y-3">
                {filteredSessions.slice(0, 5).map(session => (
                  <motion.div 
                    layout
                    key={session.id} 
                    className="p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-black/5 flex items-center justify-between hover:bg-white/80 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        style={{ backgroundColor: `${theme.accent}10`, color: theme.accent }}
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      >
                        <Clock size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{CATEGORY_THEMES[session.categoryId || 'all'].name}</p>
                        <p className="text-[10px] text-black/40 uppercase tracking-wider">
                          {session.startTime?.toDate ? session.startTime.toDate().toLocaleString('vi-VN') : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{(session.durationSeconds / 60).toFixed(0)} phút</p>
                    </div>
                  </motion.div>
                ))}
                {filteredSessions.length === 0 && (
                  <div className="py-12 text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-dashed border-black/10">
                    <p className="text-xs text-black/40">Chưa có phiên học nào.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Study Tasks */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                <ListTodo size={16} /> Mục tiêu hôm nay
              </h4>
              <div className="p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-black/5 flex flex-col h-full min-h-[300px]">
                <form onSubmit={addTask} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Thêm nhiệm vụ mới..."
                    className="flex-1 bg-white border border-black/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-black/30 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newTaskText.trim()}
                    className="p-2 bg-black text-white rounded-xl hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                  </button>
                </form>
                
                <div className="space-y-2 flex-1 overflow-y-auto pr-2">
                  <AnimatePresence>
                    {tasks.map(task => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`group flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                          task.completed 
                            ? 'bg-black/5 border-transparent opacity-60' 
                            : 'bg-white border-black/5 hover:border-black/10 shadow-sm'
                        }`}
                      >
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                            task.completed ? 'bg-black text-white' : 'border border-black/20 hover:border-black/40 text-transparent'
                          }`}
                        >
                          <Check size={12} strokeWidth={3} />
                        </button>
                        
                        <span className={`flex-1 text-sm transition-all ${task.completed ? 'line-through text-black/50' : 'text-black'}`}>
                          {task.text}
                        </span>
                        
                        <button
                          onClick={() => removeTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-black/10 text-black/40 hover:text-red-500 transition-all shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {tasks.length === 0 && (
                    <div className="py-8 text-center text-xs text-black/40 border border-dashed border-black/10 rounded-xl">
                      Chưa có mục tiêu nào.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Community Comments */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> 
                Bình luận cộng đồng
              </h4>
              <div className="space-y-3">
                {recentComments.map(comment => (
                  <motion.div 
                    layout
                    key={comment.id} 
                    className="p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-black/5 hover:bg-white/80 transition-all"
                  >
                    <p className="text-xs text-black/70 italic line-clamp-2 mb-2">"{comment.content}"</p>
                    <p className="text-[10px] text-black/40 uppercase tracking-wider">
                      {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString('vi-VN') : ''}
                    </p>
                  </motion.div>
                ))}
                {recentComments.length === 0 && (
                  <div className="py-12 text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-dashed border-black/10">
                    <p className="text-xs text-black/40">Chưa có bình luận nào.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </motion.div>
      </>
    )}
      </div>
    </div>
  );
};

export default Dashboard;
