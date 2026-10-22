const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetMobile = `                <motion.button
                  key={link}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.1 + index * 0.05,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  onClick={() => {
                    if (link === t.nav[0]) {
                      setCurrentView('career');
                    } else if (link === t.nav[1]) {
                      setCurrentView('resources');
                    } else if (link === t.nav[2]) {
                      setCurrentView('community');
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-white text-3xl font-serif italic hover:text-white/70 transition-colors"
                >
                  {link}
                </motion.button>`;

const replacementMobile = `                <motion.button
                  key={link}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 0.85, y: 0 }}
                  whileHover={{ opacity: 1, y: -2 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: 0.1 + index * 0.05,
                    ease: "easeOut"
                  }}
                  onClick={() => {
                    if (link === t.nav[0]) {
                      setCurrentView('career');
                    } else if (link === t.nav[1]) {
                      setCurrentView('resources');
                    } else if (link === t.nav[2]) {
                      setCurrentView('community');
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-white text-3xl font-serif italic"
                >
                  {link}
                </motion.button>`;

code = code.replace(targetMobile, replacementMobile);
fs.writeFileSync('src/App.tsx', code);
