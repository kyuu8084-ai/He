const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const iconsTarget = "import { Clock, TrendingUp, Calendar, ArrowLeft, Trophy, Sparkles, Award, BarChart2, Target, Check, Edit2 } from 'lucide-react';";
const iconsReplacement = "import { Clock, TrendingUp, Calendar, ArrowLeft, Trophy, Sparkles, Award, BarChart2, Target, Check, Edit2, ListTodo, Plus, Trash2 } from 'lucide-react';";
code = code.replace(iconsTarget, iconsReplacement);

const stateTarget = "  const [hasCelebratedGoal, setHasCelebratedGoal] = useState(() => localStorage.getItem('focus_goal_celebrated_date') === new Date().toDateString());";
const stateReplacement = `  const [hasCelebratedGoal, setHasCelebratedGoal] = useState(() => localStorage.getItem('focus_goal_celebrated_date') === new Date().toDateString());

  const [tasks, setTasks] = useState<{id: string, text: string, completed: boolean}[]>(() => {
    try {
      const saved = localStorage.getItem('focus_study_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newTaskText, setNewTaskText] = useState('');

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
  };`;

code = code.replace(stateTarget, stateReplacement);

const gridTarget = `          <h3 className="text-xl font-display flex items-center gap-2">Hoạt động gần đây</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">`;
const gridReplacement = `          <h3 className="text-xl font-display flex items-center gap-2">Hoạt động gần đây</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">`;
code = code.replace(gridTarget, gridReplacement);

const tasksSectionTarget = `            {/* Community Comments */}`;
const tasksSectionReplacement = `            {/* Study Tasks */}
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
                        className={\`group flex items-center justify-between gap-3 p-3 rounded-xl border transition-all \${
                          task.completed 
                            ? 'bg-black/5 border-transparent opacity-60' 
                            : 'bg-white border-black/5 hover:border-black/10 shadow-sm'
                        }\`}
                      >
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={\`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors \${
                            task.completed ? 'bg-black text-white' : 'border border-black/20 hover:border-black/40 text-transparent'
                          }\`}
                        >
                          <Check size={12} strokeWidth={3} />
                        </button>
                        
                        <span className={\`flex-1 text-sm transition-all \${task.completed ? 'line-through text-black/50' : 'text-black'}\`}>
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

            {/* Community Comments */}`;
code = code.replace(tasksSectionTarget, tasksSectionReplacement);

fs.writeFileSync('src/components/Dashboard.tsx', code);
