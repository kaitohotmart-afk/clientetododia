const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && !f.includes('admin'));

const utmScript = `
<!-- UTMIFY UTM TRACKER -->
<script
  src="https://cdn.utmify.com.br/scripts/utms/latest.js"
  data-utmify-prevent-xcod-sck
  data-utmify-prevent-subids
  async
  defer
></script>
`;

const backRedirectScript = `
<!-- BACK REDIRECT -->
<script>
  // Redireciona para a página de oferta (Última Oportunidade)
  const link = 'https://www.clientetodsdia.site/oferta.html';

  function setBackRedirect(url) {
    let urlBackRedirect = url;
    urlBackRedirect = urlBackRedirect =
      urlBackRedirect.trim() +
      (urlBackRedirect.indexOf('?') > 0 ? '&' : '?') +
      document.location.search.replace('?', '').toString();

    history.pushState({}, '', location.href);
    history.pushState({}, '', location.href);
    history.pushState({}, '', location.href);

    window.addEventListener('popstate', () => {
      console.log('onpopstate', urlBackRedirect);
      setTimeout(() => {
        location.href = urlBackRedirect;
      }, 1);
    });
  }

  setBackRedirect(link);
</script>
`;

files.forEach(f => {
    let content = fs.readFileSync(path.join(dir, f), 'utf8');
    let changed = false;

    // Inject UTM script into all pages if not present
    if (!content.includes('cdn.utmify.com.br/scripts/utms/latest.js')) {
        content = content.replace('</head>', utmScript + '</head>');
        changed = true;
    }

    // Inject Back Redirect ONLY into index.html
    if (f === 'index.html' && !content.includes('setBackRedirect')) {
        // Place it before </body> to not block rendering
        content = content.replace('</body>', backRedirectScript + '</body>');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(path.join(dir, f), content);
        console.log('Updated', f);
    }
});
