const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && !f.includes('admin'));

const scriptSnippet = `
<!-- UTMIFY PIXEL -->
<script>
  window.pixelId = "6a1946f57739dd202e99735d";
  var a = document.createElement("script");
  a.setAttribute("async", "");
  a.setAttribute("defer", "");
  a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
  document.head.appendChild(a);
</script>
`;

files.forEach(f => {
    let content = fs.readFileSync(path.join(dir, f), 'utf8');
    if (!content.includes('utmify.com.br/scripts/pixel/pixel.js')) {
        content = content.replace('</head>', scriptSnippet + '</head>');
        fs.writeFileSync(path.join(dir, f), content);
        console.log('Script injected to', f);
    } else {
        console.log('Script already present in', f);
    }
});
