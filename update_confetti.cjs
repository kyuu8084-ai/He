const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Add import for canvas-confetti
const importMotion = "import { motion } from 'motion/react';";
const importConfetti = "import { motion, AnimatePresence } from 'motion/react';\nimport confetti from 'canvas-confetti';";
code = code.replace(importMotion, importConfetti);

// Add icons
const iconsTarget = "import { Clock, TrendingUp, Calendar, ArrowLeft, Trophy, Sparkles, Award, BarChart2 } from 'lucide-react';";
const iconsReplacement = "import { Clock, TrendingUp, Calendar, ArrowLeft, Trophy, Sparkles, Award, BarChart2, Target, Check, Edit2 } from 'lucide-react';";
code = code.replace(iconsTarget, iconsReplacement);

// Add states
const statesTarget = "  const [unlockedToastBadge, setUnlockedToastBadge] = useState<Badge | null>(null);";
const statesReplacement = "  const [unlockedToastBadge, setUnlockedToastBadge] = useState<Badge | null>(null);\n  const [dailyGoal, setDailyGoal] = useState(() => Number(localStorage.getItem('focus_daily_goal') || 2));\n  const [isEditingGoal, setIsEditingGoal] = useState(false);\n  const [tempGoal, setTempGoal] = useState(dailyGoal.toString());\n  const [hasCelebratedGoal, setHasCelebratedGoal] = useState(() => localStorage.getItem('focus_goal_celebrated_date') === new Date().toDateString());";
code = code.replace(statesTarget, statesReplacement);

// Add effect for goal completion
const processChartTarget = "  const processChartData = (data: StudySession[]) => {";
const processChartReplacement = `  useEffect(() => {
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

  const processChartData = (data: StudySession[]) => {`;
code = code.replace(processChartTarget, processChartReplacement);

fs.writeFileSync('src/components/Dashboard.tsx', code);
