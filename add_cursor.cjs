const fs = require('fs');
let code = fs.readFileSync('src/components/StudyRoom.tsx', 'utf8');

const importTarget = 'import BadgeShowcase from "./BadgeShowcase";';
const importReplacement = 'import BadgeShowcase from "./BadgeShowcase";\nimport CustomCursor from "./CustomCursor";';
code = code.replace(importTarget, importReplacement);

const renderTarget = `  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col text-white font-inter bg-black overflow-hidden"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      
      
      
      <audio `;
const renderReplacement = `  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col text-white font-inter bg-black overflow-hidden"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <CustomCursor />
      
      <audio `;
code = code.replace(renderTarget, renderReplacement);

fs.writeFileSync('src/components/StudyRoom.tsx', code);
