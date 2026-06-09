const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend', 'src');

const replacements = {
  'rose-500': 'cyan-500',
  'indigo-600': 'violet-600',
  'rose-400': 'cyan-400',
  'indigo-400': 'violet-400',
  'indigo-500': 'violet-500',
  'rose-600': 'cyan-600',
  'fuchsia-500': 'cyan-300'
};

function processDirectory(currentDir) {
  if (!fs.existsSync(currentDir)) return;
  const files = fs.readdirSync(currentDir);

  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      for (const [oldClass, newClass] of Object.entries(replacements)) {
        // Use global regex to replace all instances
        const regex = new RegExp(oldClass, 'g');
        content = content.replace(regex, newClass);
      }

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated theme in: ${fullPath}`);
      }
    }
  }
}

processDirectory(dir);
console.log('Finished applying Aurora Borealis theme!');
