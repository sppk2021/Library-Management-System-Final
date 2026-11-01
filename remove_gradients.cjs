const fs = require('fs');
const path = require('path');

function replaceGradients(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/bg-gradient-to-[a-brt]{1,2}/g, 'bg-indigo-600');
    content = content.replace(/from-[a-z]+-[0-9]{3}/g, 'hover:bg-indigo-700');
    content = content.replace(/via-[a-z]+-[0-9]{3}/g, '');
    content = content.replace(/to-[a-z]+-[0-9]{3}/g, '');
    content = content.replace(/text-transparent/g, 'text-indigo-800');
    content = content.replace(/bg-clip-text/g, '');

    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated: ' + filePath);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== 'dist') {
                processDirectory(fullPath);
            }
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            replaceGradients(fullPath);
        }
    }
}

processDirectory('./src');
