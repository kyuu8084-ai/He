import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Trophy, Medal, Star, Share2, Check } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  displayName: string;
  photoURL?: string;
  streak: number;
  totalHours: number;
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShare = (user: LeaderboardUser, rank: number) => {
    const text = `Tôi đang có chuỗi ${user.streak} ngày focus liên tiếp và đang xếp hạng #${rank} trên bảng xếp hạng! 🔥 Cùng tham gia focus nhé!`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(user.id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(console.error);
  };

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('streak', 'desc'),
      limit(10)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LeaderboardUser));
      setLeaders(usersData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-black/40">Đang tải...</div>;
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-[40px] p-8 sm:p-10 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-display flex items-center gap-3">
          <Trophy size={28} className="text-amber-500" />
          Bảng xếp hạng (Chuỗi ngày)
        </h3>
      </div>
      <div className="space-y-4">
        {leaders.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-black/10 rounded-3xl">
            <p className="text-black/40 font-medium">Chưa có dữ liệu người dùng.</p>
          </div>
        ) : (
          leaders.map((user, index) => {
            const isCurrentUser = auth.currentUser?.uid === user.id;
            return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={user.id}
              className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-white border transition-colors shadow-sm gap-4 ${isCurrentUser ? 'border-amber-400 shadow-amber-500/10' : 'border-black/5 hover:border-black/10'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 font-bold text-lg ${
                  index === 0 ? 'bg-amber-100 text-amber-600' :
                  index === 1 ? 'bg-gray-100 text-gray-500' :
                  index === 2 ? 'bg-orange-50 text-orange-700' :
                  'bg-black/5 text-black/40'
                }`}>
                  {index === 0 ? <Trophy size={20} /> : index === 1 ? <Medal size={20} /> : index === 2 ? <Star size={20} /> : `#${index + 1}`}
                </div>
                <div>
                  <p className="font-bold text-base sm:text-lg">{user.displayName || 'Anonymous'}</p>
                  <p className="text-xs sm:text-sm text-black/50 font-medium">
                    {user.totalHours?.toFixed(1) || 0} giờ tổng cộng
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-right">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-black/40 mb-1">Chuỗi focus</p>
                  <p className="font-mono font-bold text-lg sm:text-xl text-amber-600">{user.streak || 0} <span className="text-sm">ngày</span></p>
                </div>
                {isCurrentUser && (
                  <button
                    onClick={() => handleShare(user, index + 1)}
                    className="p-2 sm:px-4 sm:py-2 rounded-xl bg-black/5 hover:bg-black/10 text-black transition-colors flex items-center justify-center gap-2 font-bold text-sm"
                    title="Chia sẻ chuỗi"
                  >
                    {copiedId === user.id ? (
                      <>
                        <Check size={16} className="text-green-600" />
                        <span className="hidden sm:inline text-green-700">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Share2 size={16} />
                        <span className="hidden sm:inline">Chia sẻ</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          )})
        )}
      </div>
    </div>
  );
}
