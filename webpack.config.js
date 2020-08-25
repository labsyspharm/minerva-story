const path = require('path')

IndexLoader = {
  entry: './index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, '_includes'),
    libraryTarget: 'var',
    library: 'MinervaStory'
  }
}

ScriptsLoader = {
  entry: './scripts.js',
  output: {
    filename: 'scripts.js',
    path: path.resolve(__dirname, '_includes')
  }
}

module.exports = [IndexLoader, ScriptsLoader]
