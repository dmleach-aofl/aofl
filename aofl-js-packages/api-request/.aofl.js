const path = require('path');

module.exports = {
  name: '@aofl/api-request',
  mode: 'stand-alone',
  build: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
    entryReplace: {
      'index': path.join(__dirname, 'index.js')
    },
    eslint: {
      options: {
        config: path.join(__dirname, '..', '.eslintrc.js')
      }
    },
    js: {
      include: [
        path.join(__dirname, 'modules')
      ]
    },
    extend() {
      return {
        output: {
          libraryTarget: 'commonjs2'
        },
        optimization: {
          runtimeChunk: false
        },
        externals: {
          '@aofl/cache-manager': {
            commonjs2: '@aofl/cache-manager',
            commonjs: '@aofl/cache-manager',
            amd: '@aofl/cache-manager',
          }
        }
      }
    }
  }
};