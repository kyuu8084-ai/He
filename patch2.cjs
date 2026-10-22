const fs = require('fs');

const files = ['src/components/Community.tsx', 'src/components/MusicPlayer.tsx', 'src/components/PomodoroTimer.tsx'];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes('import { triggerHaptic }')) {
    code = "import { triggerHaptic } from '../lib/haptics';\n" + code;
    fs.writeFileSync(file, code);
  }
});
