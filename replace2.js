const fs = require('fs');

let index = fs.readFileSync('public/index.html', 'utf8');
index = index.replace(/checkout\.html\?price=490/g, 'https://pay.lojou.app/p/p94no');
fs.writeFileSync('public/index.html', index);

let oferta = fs.readFileSync('public/oferta.html', 'utf8');
oferta = oferta.replace(/checkout\.html\?price=197/g, 'https://pay.lojou.app/p/p94no');
fs.writeFileSync('public/oferta.html', oferta);

console.log('Done second round of replacements');
