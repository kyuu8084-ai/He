const fs = require('fs');
let code = fs.readFileSync('src/components/StudyRoom.tsx', 'utf8');

const targetRender = `      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              className={\`px-6 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center gap-3 min-w-[240px] \${
                n.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-white/10 border-white/20 text-white/80'
              }\`}
            >
              {n.type === 'success' ? <Users size={16} /> : <Info size={16} />}
              <span className="text-xs font-bold uppercase tracking-widest">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>`;

const replacementRender = `      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              className={\`px-6 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center gap-3 min-w-[240px] \${
                n.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-white/10 border-white/20 text-white/80'
              }\`}
            >
              {n.type === 'success' ? <Users size={16} /> : <Info size={16} />}
              <span className="text-xs font-bold uppercase tracking-widest">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <BadgeUnlockToast 
        badge={unlockedToastBadge} 
        language={language} 
        onClose={() => setUnlockedToastBadge(null)} 
      />

      {/* Session Summary Toast */}
      <AnimatePresence>
        {completedSessionData && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-12 right-12 z-[100] max-w-sm w-full bg-[#111] text-white p-6 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-[#F598F2]" />
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-1">
                    {language === 'vi' ? 'Hoàn thành!' : 'Session Complete!'}
                  </h3>
                  <p className="text-[11px] text-white/60 font-medium">
                    {language === 'vi' ? 'Bạn đã tập trung rất tốt.' : 'You maintained great focus.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCompletedSessionData(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60 font-medium uppercase tracking-wider">
                  {language === 'vi' ? 'Thời gian học' : 'Focused Time'}
                </span>
                <span className="text-xl font-mono text-white font-bold tracking-tight">
                  {Math.floor(completedSessionData.durationSeconds / 60)}<span className="text-xs text-white/60 ml-1">min</span>
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
              <Coffee size={18} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-200/80 leading-relaxed font-medium">
                {language === 'vi' 
                  ? 'Tuyệt vời! Bây giờ hãy nghỉ ngơi 5 phút, uống một ngụm nước và thư giãn mắt trước khi bắt đầu phiên tiếp theo nhé.' 
                  : 'Great job! Now take a 5-minute break, drink some water, and rest your eyes before the next session.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>`;

code = code.replace(targetRender, replacementRender);

fs.writeFileSync('src/components/StudyRoom.tsx', code);
