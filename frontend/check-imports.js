const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Read mockData to get all exports
const mockDataPath = path.join(srcDir, 'data', 'mockData.js');
const mockDataContent = fs.readFileSync(mockDataPath, 'utf8');
const exports = [...mockDataContent.matchAll(/export const (\w+)/g)].map(m => m[1]);
console.log('Available exports from mockData:', exports.join(', '));

// Check each page for imports from mockData
const walkDir = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const importMatch = content.match(/from ['"]@\/data\/mockData['"]/);
      if (importMatch) {
        const lineStart = Math.max(0, content.lastIndexOf('\n', importMatch.index) + 1);
        const lineEnd = content.indexOf('\n', importMatch.index);
        const line = content.substring(lineStart, lineEnd).trim();
        console.log(`\n${path.relative(srcDir, fullPath)}:`);
        console.log(`  ${line}`);
      }
    }
  }
};

walkDir(srcDir);