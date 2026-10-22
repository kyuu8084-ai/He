const fs = require('fs');
let code = fs.readFileSync('src/components/AIChat.tsx', 'utf8');

const importTarget = "import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';";
const importReplacement = "import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';\nimport ReactMarkdown from 'react-markdown';\nimport remarkGfm from 'remark-gfm';";
code = code.replace(importTarget, importReplacement);

const renderTarget = "                  <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${\n                    msg.role === 'user' \n                      ? 'bg-black text-white rounded-tr-sm' \n                      : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'\n                  }`}>\n                    {msg.text}\n                  </div>";
const renderReplacement = "                  <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${\n                    msg.role === 'user' \n                      ? 'bg-black text-white rounded-tr-sm' \n                      : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'\n                  }`}>\n                    {msg.role === 'user' ? msg.text : (\n                      <div className=\"prose prose-sm prose-gray max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:text-gray-800\">\n                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>\n                      </div>\n                    )}\n                  </div>";
code = code.replace(renderTarget, renderReplacement);

fs.writeFileSync('src/components/AIChat.tsx', code);
