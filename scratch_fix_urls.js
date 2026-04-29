const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'frontend/js');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

const baseUrlCode = `const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://localhost:3000' : 'https://smartbill-vqjf.onrender.com';\n\n`;

for(let file of files){
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Remove existing API_BASE_URL definition if any
    content = content.replace(/const API_BASE_URL = window\.location\.hostname === 'localhost' \|\| window\.location\.hostname === '127\.0\.0\.1' \n\s*\? 'https:\/\/smartbill-vqjf\.onrender\.com' \n\s*: 'https:\/\/smartbill-vqjf\.onrender\.com';\n*/g, '');
    
    if(!content.includes('const API_BASE_URL')){
        content = baseUrlCode + content;
    }
    
    // Replace 'https://smartbill-vqjf.onrender.com...' with API_BASE_URL + '...'
    content = content.replace(/'https:\/\/smartbill-vqjf\.onrender\.com/g, 'API_BASE_URL + \'');
    
    // Replace `https://smartbill-vqjf.onrender.com...` with `${API_BASE_URL}...`
    content = content.replace(/`https:\/\/smartbill-vqjf\.onrender\.com/g, '`${API_BASE_URL}');
    
    fs.writeFileSync(path.join(dir, file), content);
}
console.log('Replaced URLs in frontend');
