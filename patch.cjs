const fs = require('fs');
let code = fs.readFileSync('src/components/StudyRoom.tsx', 'utf8');

if (!code.includes('import { triggerHaptic }')) {
  code = "import { triggerHaptic } from '../lib/haptics';\n" + code;
}
fs.writeFileSync('src/components/StudyRoom.tsx', code);
