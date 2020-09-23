const path = require('path')

IndexLoader = {
  entry: './index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'includes'),
    libraryTarget: 'var',
    library: 'MinervaStory'
  }
}

module.exports = [IndexLoader]
