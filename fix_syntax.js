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

      // Regex to find the nested string and replace it
      // The exact string in the file is: ${import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:5000'}'}
      // We will replace it with: ${import.meta.env.VITE_API_URL || 'http://localhost:5000'}
      
      const regex = /\$\{import\.meta\.env\.VITE_API_URL \|\| '\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000'\}'\}/g;
      const goodString = "${import.meta.env.VITE_API_URL || 'http://localhost:5000'}";
      
      content = content.replace(regex, goodString);

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed syntax in: ${fullPath}`);
      }
    }
  }
}

processDirectory(dir);
console.log('Finished fixing syntax!');
