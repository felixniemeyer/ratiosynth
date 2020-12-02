const merge = require('webpack-merge')
const common = require('./webpack-common.js')
const path = require('path') 
const { output } = require('./webpack-common.js')

module.exports = merge(common, {
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'build/release')
  }
})
