const fs = require('fs');
let code = fs.readFileSync('src/components/Community.tsx', 'utf8');

const importTarget = "import '../styles/theme.css';";
const importReplacement = "import '../styles/theme.css';\nimport AIChat from './AIChat';";
code = code.replace(importTarget, importReplacement);

const renderTarget = "    </div>\n  );\n};\n\nexport default Community;";
const renderReplacement = "      <AIChat />\n    </div>\n  );\n};\n\nexport default Community;";
code = code.replace(renderTarget, renderReplacement);

fs.writeFileSync('src/components/Community.tsx', code);
