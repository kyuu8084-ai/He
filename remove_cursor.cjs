const fs = require('fs');
let code = fs.readFileSync('src/components/StudyRoom.tsx', 'utf8');

const importTarget = 'import CustomCursor from "./CustomCursor";\n';
code = code.replace(importTarget, '');

const renderTarget = '<CustomCursor />\n      ';
code = code.replace(renderTarget, '');

fs.writeFileSync('src/components/StudyRoom.tsx', code);
