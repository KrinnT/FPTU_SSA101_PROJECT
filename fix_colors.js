const fs = require('fs');
const { execSync } = require('child_process');

try {
  const fileLines = execSync('find src -type f \\( -name "*.tsx" -o -name "*.css" \\)').toString().trim().split('\n');
  for (const file of fileLines) {
    if (!file) continue;
    let content = fs.readFileSync(file, 'utf8');
    let replaced = content.replace(/var\(--color-([a-zA-Z0-9-]+)\)/g, 'hsl(var(--\$1))');
    if (content !== replaced) {
      fs.writeFileSync(file, replaced);
      console.log('Fixed', file);
    }
  }
} catch (e) {
  console.error(e);
}
