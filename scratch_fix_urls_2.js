const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'frontend/js');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

for(let file of files){
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Replace the malformed first line
    content = content.replace(/const API_BASE_URL = \(window\.location\.hostname === 'localhost' \|\| window\.location\.hostname === '127\.0\.0\.1' \|\| window\.location\.protocol === 'file:'\) \? 'http:\/\/localhost:3000' : API_BASE_URL \+ '';\n*/, "const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://localhost:3000' : 'https://smartbill-vqjf.onrender.com';\n");
    
    fs.writeFileSync(path.join(dir, file), content);
}
console.log('Fixed API_BASE_URL in frontend JS files');
