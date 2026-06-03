const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const walkDir = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('</write_to_file>')) {
        console.log('Fixing:', path.relative(__dirname, fullPath));
        const cleaned = content.replace(/<\/write_to_file>\s*$/g, '');
        fs.writeFileSync(fullPath, cleaned, 'utf8');
      }
    }
  }
};

walkDir(srcDir);
console.log('Done!');