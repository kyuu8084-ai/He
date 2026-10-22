const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update content layer padding
code = code.replace(
  '      {/* Content Layer */}\n      <div className="relative z-10 flex flex-col h-full px-6 py-8 sm:px-12 sm:py-12">',
  '      {/* Content Layer */}\n      <div className="relative z-10 flex flex-col h-full px-4 py-6 sm:px-12 sm:py-12">'
);

// Update nav gap
code = code.replace(
  '<div className="flex items-center gap-3 sm:gap-4">',
  '<div className="flex items-center gap-2 sm:gap-4">'
);

// Update nav items
code = code.replace(
  'className="liquid-glass w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"',
  'className="liquid-glass w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer shrink-0"'
);

code = code.replace(
  'className="liquid-glass px-3 h-10 sm:h-12 rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase cursor-pointer"',
  'className="liquid-glass px-4 h-11 sm:h-12 rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase cursor-pointer shrink-0"'
);

code = code.replace(
  'className="md:hidden liquid-glass w-12 h-12 rounded-full flex items-center justify-center text-white z-[60]"',
  'className="md:hidden liquid-glass w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white z-[60] shrink-0"'
);

// Update hero content padding
code = code.replace(
  '<div className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-8 sm:space-y-10">',
  '<div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto px-2 sm:px-0 space-y-6 sm:space-y-10">'
);

// Update H1 size to fit on small screens
code = code.replace(
  'className={`font-serif text-[1.75rem] leading-[1.25] sm:text-4xl md:text-5xl lg:text-[4.5rem] md:leading-[1.1] text-glow-strong ${textColor} ${transitionClass}`}',
  'className={`font-serif text-[1.75rem] leading-[1.2] sm:text-4xl md:text-5xl lg:text-[4.5rem] md:leading-[1.1] text-glow-strong ${textColor} ${transitionClass}`}'
);

fs.writeFileSync('src/App.tsx', code);
