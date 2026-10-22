const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<script>\s*try \{\s*const desc = Object.getOwnPropertyDescriptor\(window, 'fetch'\);.*?\} catch \(e\) \{\}\s*<\/script>/s, 
`<script>
  try {
    let originalFetch = window.fetch;
    Object.defineProperty(window, 'fetch', {
      get: () => originalFetch,
      set: (v) => { console.warn('Ignored fetch override'); },
      configurable: true,
      enumerable: true
    });
  } catch(e) {}
</script>`);
fs.writeFileSync('index.html', html);
