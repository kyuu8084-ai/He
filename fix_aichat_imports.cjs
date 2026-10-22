const fs = require('fs');
let code = fs.readFileSync('src/components/AIChat.tsx', 'utf8');

const importTarget = "import ReactMarkdown from 'react-markdown';\nimport remarkGfm from 'remark-gfm';\nimport ReactMarkdown from 'react-markdown';\nimport remarkGfm from 'remark-gfm';";
const importReplacement = "import ReactMarkdown from 'react-markdown';\nimport remarkGfm from 'remark-gfm';";
code = code.replace(importTarget, importReplacement);

fs.writeFileSync('src/components/AIChat.tsx', code);
