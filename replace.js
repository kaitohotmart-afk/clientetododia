const fs = require('fs');

let index = fs.readFileSync('public/index.html', 'utf8');
index = index.replace(/href="checkout\.html"/g, 'href="https://pay.lojou.app/p/p94no"');
index = index.replace(/href='checkout\.html\?price=490'/g, 'href=\'https://pay.lojou.app/p/p94no\'');
fs.writeFileSync('public/index.html', index);

let oferta = fs.readFileSync('public/oferta.html', 'utf8');
oferta = oferta.replace(/href="checkout\.html\?price=197"/g, 'href="https://pay.lojou.app/p/p94no"');
oferta = oferta.replace(/href='checkout\.html\?price=197&' \+ utmStr/g, 'href=\'https://pay.lojou.app/p/p94no?\' + utmStr');
fs.writeFileSync('public/oferta.html', oferta);

console.log('Done replacing links');
