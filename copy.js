const fs = require('fs');

// File destination.txt will be created or overwritten by default.
fs.copyFile('src/index.html', 'dist/index.html', (err) => {});
