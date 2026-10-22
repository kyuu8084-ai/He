const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const importTarget = '@import "tailwindcss";';
const importReplacement = '@import "tailwindcss";\n@plugin "@tailwindcss/typography";';
code = code.replace(importTarget, importReplacement);

fs.writeFileSync('src/index.css', code);
