const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'public');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
    let content = fs.readFileSync(path.join(dir, f), 'utf8');
    
    // Replace the old simple CSS with one that explicitly allows input selection
    const oldCss = '<style>body { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }</style>';
    const newCss = '<style>body { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; } input, textarea { -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text; user-select: text; pointer-events: auto; }</style>';
    
    if (content.includes(oldCss)) {
        content = content.replace(oldCss, newCss);
        fs.writeFileSync(path.join(dir, f), content);
    }
});
console.log('Fixed CSS to ensure inputs remain selectable');
