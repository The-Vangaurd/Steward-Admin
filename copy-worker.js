const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '.open-next', 'worker.js');
const dest = path.join(__dirname, '.open-next', '_worker.js');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('Successfully copied .open-next/worker.js to .open-next/assets/_worker.js');
} else {
  console.error('Error: .open-next/worker.js not found');
  process.exit(1);
}
