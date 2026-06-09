const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend', 'src');

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      // Replace 'http://localhost:5000...' or "http://localhost:5000..." with backticks
      content = content.replace(/['"]http:\/\/localhost:5000([^'"]*)['"]/g, '`${import.meta.env.VITE_API_URL || \'http://localhost:5000\'}$1`');

      // Replace remaining http://localhost:5000 (which are already inside backticks)
      content = content.replace(/http:\/\/localhost:5000/g, "${import.meta.env.VITE_API_URL || 'http://localhost:5000'}");

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated URLs in: ${fullPath}`);
      }
    }
  }
}

processDirectory(dir);
console.log('Finished updating URLs!');
