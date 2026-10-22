const fs = require('fs');
let code = fs.readFileSync('src/components/StudyRoom.tsx', 'utf8');

code = code.replace(
  /\{\(peer\.userName \|\| "H"\)\.charAt\(0\)\.toUpperCase\(\)\}\n\s*<\/div>\n\s*<span className="text-xs font-semibold text-white\/80">/g,
  `{(peer.userName || "H").charAt(0).toUpperCase()}
                    </div>
                    )}
                    <span className="text-xs font-semibold text-white/80">`
);

fs.writeFileSync('src/components/StudyRoom.tsx', code);
