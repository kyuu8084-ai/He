const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importTarget = "import { MusicPlayer } from './components/MusicPlayer';";
const importReplacement = "import { MusicPlayer } from './components/MusicPlayer';\nimport DailyInspiration from './components/DailyInspiration';";
code = code.replace(importTarget, importReplacement);

const renderTarget = `          <AnimatePresence mode="wait">
            {state.succeeded ? (`;
const renderReplacement = `          <DailyInspiration language={language} isDarkMode={isDarkMode} />

          <AnimatePresence mode="wait">
            {state.succeeded ? (`;
code = code.replace(renderTarget, renderReplacement);

fs.writeFileSync('src/App.tsx', code);
