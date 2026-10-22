const fs = require('fs');
let code = fs.readFileSync('src/components/StudyRoom.tsx', 'utf8');

// 1. Remove rain from type
code = code.replace(
  "const [activeWeather, setActiveWeather] = useState<'none' | 'auto' | 'rain' | 'sun' | 'snow'>('auto');",
  "const [activeWeather, setActiveWeather] = useState<'none' | 'auto' | 'sun' | 'snow'>('auto');"
);

// 2. Remove rain from menu
code = code.replace(
  "                      { id: 'rain', name: language === 'vi' ? 'Mưa' : 'Rain', icon: CloudRain },\n",
  ""
);

// 3. Update auto logic
code = code.replace(
  "                if (h >= 17 && h <= 23) return 'rain';\n                return 'snow';",
  "                return 'snow';"
);

fs.writeFileSync('src/components/StudyRoom.tsx', code);
