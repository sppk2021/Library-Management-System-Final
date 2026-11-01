const fs = require('fs');
const path = require('path');

function cleanArtifacts(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/hover:bg-indigo-700\s*hover:bg-indigo-700\s*hover:hover:bg-indigo-700\s*hover:/g, 'hover:bg-indigo-700');
    content = content.replace(/hover:bg-indigo-700\s*hover:hover:bg-indigo-700\s*hover:/g, 'hover:bg-indigo-700');
    content = content.replace(/hover:bg-indigo-700\s*hover:bg-indigo-700\s*/g, 'hover:bg-indigo-700 ');
    content = content.replace(/hover:bg-indigo-700\s*text-white/g, 'hover:bg-indigo-700 text-white');
    content = content.replace(/disabled:hover:bg-indigo-700\/50 disabled:\/50/g, 'disabled:bg-indigo-400/50');
    content = content.replace(/hover:bg-indigo-700\s*text-white/g, 'hover:bg-indigo-700 text-white');
    content = content.replace(/hover:bg-indigo-700\s*text-[a-z0-9\-]+/g, (match) => match.replace(/\s+/, ' '));
    content = content.replace(/bg-indigo-600\s+hover:bg-indigo-700/g, 'bg-indigo-600 hover:bg-indigo-700');
    content = content.replace(/bg-indigo-600\s*hover:bg-indigo-700\s*text-indigo-800/g, 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-800'); // restore gradient for text if wanted, but wait, the prompt said NO GRADIENS AT ALL. 
    content = content.replace(/bg-indigo-600\s*hover:bg-indigo-700\s*text-indigo-800/g, 'text-indigo-800'); // no gradient

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
            cleanArtifacts(fullPath);
        }
    }
}

processDirectory('./src');
