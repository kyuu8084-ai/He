const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const targetCard = `          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-[32px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-sm group hover:shadow-md transition-all"
          >
            <div 
              style={{ color: theme.accent, backgroundColor: \`\${theme.accent}15\` }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
            >
              <TrendingUp size={24} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Hôm nay</h3>
            <p className="text-4xl font-display">{todayHours}<span className="text-lg ml-2">h</span></p>
          </motion.div>`;

const replacementCard = `          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-[32px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-sm group hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div 
                  style={{ color: theme.accent, backgroundColor: \`\${theme.accent}15\` }}
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
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: \`\${Math.min((todayHours / dailyGoal) * 100, 100)}%\` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ backgroundColor: theme.accent }}
                  className="h-full rounded-full"
                />
              </div>
              {hasCelebratedGoal && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mt-2 flex items-center gap-1">
                  <Sparkles size={10} /> Đã hoàn thành mục tiêu!
                </p>
              )}
            </div>
          </motion.div>`;

code = code.replace(targetCard, replacementCard);
fs.writeFileSync('src/components/Dashboard.tsx', code);
