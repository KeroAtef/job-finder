const path = require('path');

function getDataDir() {
  return process.env.VERCEL ? '/tmp/data' : path.join(__dirname, '..', '..', 'data');
}

function getDataPath(filename) {
  return path.join(getDataDir(), filename);
}

module.exports = { getDataDir, getDataPath };
