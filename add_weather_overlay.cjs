const fs = require('fs');
let code = fs.readFileSync('src/components/StudyRoom.tsx', 'utf8');

// 1. Add icons
const iconsTarget = 'Trash2, ListTodo, FileText, NotebookPen, Lock, Unlock, Info, Award } from "lucide-react";';
const iconsReplacement = 'Trash2, ListTodo, FileText, NotebookPen, Lock, Unlock, Info, Award, Sun, CloudSnow, Wand2 } from "lucide-react";';
code = code.replace(iconsTarget, iconsReplacement);

// 2. Add state
const stateTarget = "  const [roomLight, setRoomLight] = useState(0.4);";
const stateReplacement = "  const [roomLight, setRoomLight] = useState(0.4);\n  const [activeWeather, setActiveWeather] = useState<'none' | 'auto' | 'rain' | 'sun' | 'snow'>('auto');";
code = code.replace(stateTarget, stateReplacement);

// 3. Add WeatherOverlay component
const weatherComponent = `
const WeatherOverlay = ({ weather }: { weather: 'none' | 'rain' | 'sun' | 'snow' }) => {
  if (weather === 'none') return null;

  if (weather === 'rain') {
    const drops = Array.from({ length: 60 });
    return (
      <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden">
        {drops.map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[1px] h-[40px] bg-gradient-to-b from-transparent to-white/30"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: -50,
              opacity: 0 
            }}
            animate={{ 
              y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 50,
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: 0.8 + Math.random() * 0.4,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>
    );
  }

  if (weather === 'sun') {
    const rays = Array.from({ length: 6 });
    return (
      <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden mix-blend-overlay">
        {rays.map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-0 w-32 h-[150vh] bg-gradient-to-b from-yellow-100/10 to-transparent blur-3xl transform -skew-x-12"
            style={{
              left: \`\${10 + i * 18}%\`,
              transformOrigin: 'top'
            }}
            initial={{ opacity: 0.2 }}
            animate={{ 
              opacity: [0.2, 0.4, 0.2],
              skewX: [-12, -8, -12]
            }}
            transition={{
              duration: 10 + Math.random() * 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 3
            }}
          />
        ))}
      </div>
    );
  }

  if (weather === 'snow') {
    const flakes = Array.from({ length: 50 });
    return (
      <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden">
        {flakes.map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white/40 rounded-full blur-[1px]"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: -20,
              opacity: 0 
            }}
            animate={{ 
              y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 20,
              x: \`calc(\${Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000)}px + \${Math.sin(i) * 50}px)\`,
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>
    );
  }

  return null;
};
`;

const videoTarget = "const TRANSLATIONS: Record<string, Record<string, string>> = {";
code = code.replace(videoTarget, weatherComponent + "\n" + videoTarget);

// 4. Add rendered component
const renderTarget = '{/* Room Light Overlay */}';
const renderReplacement = `
      <WeatherOverlay 
        weather={
          activeWeather === 'auto' 
            ? (() => {
                const h = new Date().getHours();
                if (h >= 7 && h <= 16) return 'sun';
                if (h >= 17 && h <= 23) return 'rain';
                return 'snow';
              })()
            : activeWeather
        } 
      />
      {/* Room Light Overlay */}`;

code = code.replace(renderTarget, renderReplacement);

// 5. Add UI to the Ambience menu
const ambienceTarget = `                <div className="grid grid-cols-5 gap-2 pt-1">
                  {AMBIENT_SOUNDS.map((sound) => {`;
const ambienceReplacement = `
                <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
                      <CloudRain size={14} className="text-sky-400" />
                      {language === 'vi' ? 'Hiệu ứng thời tiết' : 'Weather Effects'}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: 'auto', name: language === 'vi' ? 'Tự động' : 'Auto', icon: Wand2 },
                      { id: 'none', name: language === 'vi' ? 'Tắt' : 'None', icon: VolumeX },
                      { id: 'sun', name: language === 'vi' ? 'Nắng' : 'Sun', icon: Sun },
                      { id: 'rain', name: language === 'vi' ? 'Mưa' : 'Rain', icon: CloudRain },
                      { id: 'snow', name: language === 'vi' ? 'Tuyết' : 'Snow', icon: CloudSnow },
                    ].map((w) => {
                      const Icon = w.icon;
                      const isActive = activeWeather === w.id;
                      return (
                        <button
                          key={w.id}
                          onClick={() => setActiveWeather(w.id as any)}
                          className={\`flex flex-col items-center gap-2 p-2.5 rounded-xl transition-all border \${
                            isActive 
                              ? "bg-white text-black border-white shadow-lg shadow-white/20 scale-105 font-bold" 
                              : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                          }\`}
                        >
                          <Icon size={16} className={isActive ? "text-black" : "text-white/80"} />
                          <span className="text-[9px] uppercase tracking-tighter truncate w-full text-center">
                            {w.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 pt-1 mt-2">
                  {AMBIENT_SOUNDS.map((sound) => {`;

code = code.replace(ambienceTarget, ambienceReplacement);

fs.writeFileSync('src/components/StudyRoom.tsx', code);
