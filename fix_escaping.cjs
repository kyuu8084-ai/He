const fs = require('fs');

function fix(file) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/url=\{\\`https/g, 'url={`https');
  code = code.replace(/v=\\?\\?\$\{/g, 'v=${');
  code = code.replace(/\\`\}/g, '`}');
  
  code = code.replace(/src=\{'thumbnail' in vid \? vid\.thumbnail! : \\`https/g, "src={'thumbnail' in vid ? vid.thumbnail! : `https");
  code = code.replace(/vi\/\\\$\{vid\.id\}\/mqdefault\.jpg\\`/g, "vi/${vid.id}/mqdefault.jpg`");

  // fix any remaining escaping from the heredoc
  code = code.replace(/\\`/g, '`');
  code = code.replace(/\\\$/g, '$');

  fs.writeFileSync(file, code);
}

fix('src/components/YouTubePlayer.tsx');
fix('src/components/Entertainment.tsx');
