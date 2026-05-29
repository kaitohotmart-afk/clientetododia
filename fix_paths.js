const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'public');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
    let content = fs.readFileSync(path.join(dir, f), 'utf8');
    content = content.replace(/src="images\//g, 'src="/images/');
    content = content.replace(/href="images\//g, 'href="/images/');
    fs.writeFileSync(path.join(dir, f), content);
});
console.log('Fixed image paths');
