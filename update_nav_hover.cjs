const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetDesktop = `            {t.nav.map(link => (
              <button 
                key={link} 
                onClick={() => {
                  if (link === t.nav[0]) setCurrentView('career');
                  if (link === t.nav[1]) setCurrentView('resources');
                  if (link === t.nav[2]) setCurrentView('community');
                }}
                className="px-4 py-2 text-white/90 text-sm font-medium hover:text-white transition-colors cursor-pointer"
              >
                {link}
              </button>
            ))}`;

const replacementDesktop = `            {t.nav.map(link => (
              <motion.button 
                key={link} 
                onClick={() => {
                  if (link === t.nav[0]) setCurrentView('career');
                  if (link === t.nav[1]) setCurrentView('resources');
                  if (link === t.nav[2]) setCurrentView('community');
                }}
                initial={{ opacity: 0.85, y: 0 }}
                whileHover={{ opacity: 1, y: -2 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="px-4 py-2 text-white text-sm font-medium cursor-pointer"
              >
                {link}
              </motion.button>
            ))}`;

code = code.replace(targetDesktop, replacementDesktop);

fs.writeFileSync('src/App.tsx', code);
