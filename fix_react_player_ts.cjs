const fs = require('fs');
let code = fs.readFileSync('src/components/YouTubePlayer.tsx', 'utf8');

code = code.replace(
  "youtube: {",
  "youtube: { // @ts-ignore"
);

fs.writeFileSync('src/components/YouTubePlayer.tsx', code);
