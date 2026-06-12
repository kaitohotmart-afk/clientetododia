const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && !f.includes('admin'));

const fbPixel = `
  <!-- Meta Pixel Code -->
  <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '1060150572419057');
    fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id=1060150572419057&ev=PageView&noscript=1"
  /></noscript>
  <!-- End Meta Pixel Code -->
`;

files.forEach(f => {
    let content = fs.readFileSync(path.join(dir, f), 'utf8');
    if (!content.includes('1060150572419057')) {
        content = content.replace('</head>', fbPixel + '</head>');
        fs.writeFileSync(path.join(dir, f), content);
        console.log('Injected FB pixel in', f);
    } else {
        console.log('FB pixel already present in', f);
    }
});
