const fs = require('fs');
let code = fs.readFileSync('src/components/study-tools/StudyResourcesList.tsx', 'utf8');

code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { motion, AnimatePresence } from 'motion/react';");

const targetInterface = `interface ResourceItem {
  id: string;
  title: string;
  desc: string;
  link: string;
  badge?: string;
  type?: 'pdf' | 'web' | 'method' | 'audio' | 'tool';
}`;

const replacementInterface = `interface ResourceItem {
  id: string;
  title: string;
  desc: string;
  link: string;
  badge?: string;
  type?: 'pdf' | 'web' | 'method' | 'audio' | 'tool' | 'tip';
  content?: string[];
}`;

code = code.replace(targetInterface, replacementInterface);

const targetState = `  const [activeCategory, setActiveCategory] = useState<string>('all');`;
const replacementState = `  const [activeCategory, setActiveCategory] = useState<string>('all');\n  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);`;
code = code.replace(targetState, replacementState);

fs.writeFileSync('src/components/study-tools/StudyResourcesList.tsx', code);
