const fs = require('fs');
let code = fs.readFileSync('src/components/StudyRoom.tsx', 'utf8');

// Remove activeWeather state
code = code.replace(/  const \[activeWeather, setActiveWeather\] = useState\w*.*?\n/g, "");

// Remove WeatherOverlay component
let overlayRegex = /const WeatherOverlay = \(\{ weather \}[\s\S]*?return null;\n\};\n\n/;
code = code.replace(overlayRegex, "");

// Remove <WeatherOverlay /> usage
let usageRegex = /      <WeatherOverlay[\s\S]*?\/>\n/;
code = code.replace(usageRegex, "");

// Remove weather options from menu
let menuRegex = /                <div className="flex flex-col gap-3 pt-2 border-t border-white\/10">[\s\S]*?Hiệu ứng thời tiết[\s\S]*?<\/div>\n                <\/div>\n/;
code = code.replace(menuRegex, "");

fs.writeFileSync('src/components/StudyRoom.tsx', code);
