const fs = require('fs');
let code = fs.readFileSync('src/components/StudyRoom.tsx', 'utf8');

// 1. Remove state
code = code.replace(
  "  const [activeWeather, setActiveWeather] = useState<'none' | 'auto' | 'sun' | 'snow'>('auto');\n",
  ""
);

// 2. Remove WeatherOverlay component
code = code.replace(
  /const WeatherOverlay = \(\{ weather \}: \{ weather: 'none' \| 'sun' \| 'snow' \}\) => \{[\s\S]*?  \}\n\n  return null;\n\};\n\n/g,
  ""
);

// Let's do string replacement for the exact component text
