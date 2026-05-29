const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'public');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
const scriptTag = '<script src="/security.js"></script>\n</head>';

files.forEach(f => {
    let content = fs.readFileSync(path.join(dir, f), 'utf8');
    if (!content.includes('security.js')) {
        content = content.replace('</head>', scriptTag);
        
        // Also add CSS to prevent text selection
        if (!content.includes('user-select: none')) {
            const cssTag = '<style>body { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }</style>\n</head>';
            content = content.replace('</head>', cssTag);
        }

        fs.writeFileSync(path.join(dir, f), content);
    }
});
console.log('Injected security.js and anti-selection CSS into all public HTML files');
