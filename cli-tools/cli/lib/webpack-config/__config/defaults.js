const path = require('path');
const environmentEnumerate = require('../../environment-enumerate');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const htmlWebpackconfig = require('../../html-webpack-config');


module.exports = (root) => {
  return {
    name: 'Aofl JS App',
    root,
    build: {
      filename: process.env.NODE_ENV === environmentEnumerate.PRODUCTION ? '[name]-[chunkhash].js': '[name]-[chunkhash].js',
      path: path.join(root, '__build'),
      publicPath: '/',
      devtool: (process.env.NODE_ENV === environmentEnumerate.PRODUCTION ? 'nosources-source-map': 'source-map'),
      cache: true,
      hardSourceCache: true,
      middleware: [],
      extend: () => {},
      css: {
        test: /\.css$/,
        component: [path.join(root, 'templates', 'main', 'css', 'index.css')],
        global: {
          level: process.env.NODE_ENV === 'development'? 'none': 'auto',
          purifyCSS: {
            whitelist: ['route-view'],
          },
        },
        cssLoader: {}, // options
        postCssLoader: {
          plugins: [
            autoprefixer(),
            cssnano(),
          ],
        }, // options
      },
      images: {
        test: /\.(png|jpe?g|gif|svg)$/,
        exclude: /node_modules\/(?!@aofl|@polymer|lit-html|lit-element).*/,
        fileLoader: {
          // name: process.env.NODE_ENV === environmentEnumerate.PRODUCTION ? '[hash:7].[ext]': '[name]-[hash:7].[ext]',
          // limit: 1000
        },
        imgLoader: {
          plugins: process.env.NODE_ENV === 'production' && [
            require('imagemin-gifsicle')(),
            require('imagemin-mozjpeg')({
              quality: 90,
            }),
            require('imagemin-optipng')(),
            require('imagemin-svgo')(),
          ],
        },
      },
      fonts: {
        test: /\.(woff2?|ttf|eot|svg#.*)$/,
        exclude: /node_modules\/(?!@aofl|@polymer|lit-html|lit-element).*/,
        fileLoader: {
          name: process.env.NODE_ENV === environmentEnumerate.PRODUCTION ? '[hash:7].[ext]': '[name]-[hash:7].[ext]',
        },
      },
      eslint: {
        test: /\.js$/,
        exclude: /(node_modules|sw)/,
        enforce: 'pre',
        options: {
          config: path.join(__dirname, '.eslintrc.js'),
        },
      },
      js: {
        test: /\.js$/,
        exclude: /node_modules\/(?!@aofl|@polymer|lit-html|lit-element).*/,
        babel: {
          cacheDirectory: true,
          ...require(path.join(__dirname, '.babelrc.js')),
        },
      },
      templating: {
        template: {
          name: 'main',
          template: path.resolve(root, 'templates', 'main', 'template.ejs'),
          filename: path.join('templates', 'main', 'template.html'),
          ...htmlWebpackconfig(process.env.NODE_ENV),
        },
        routes: {
          mainRoutes: path.join(root, 'routes'),
          pattern: [path.join('routes', '**', 'index.js')],
          ignore: ['**/__build/**/*', '**/node_modules/**/*'],
        },
        loaderOptions: {
          path: path.join(root, 'modules', '__config', 'routes.js'),
        },
      },
      terser: {
        parallel: true,
        sourceMap: true,
        extractComments: true,
      },
      serviceworker: {
        swSrc: path.join(__dirname, 'sw.js'),
        swDest: 'sw.js',
        exclude: [/\.LICENSE$/, /\.map\.js$/],
      },
      favicon: {
        from: 'assets/favicon.ico',
        to: 'favicon.ico',
      },
      pwaManifest: {
        'name': 'Aofl Starter App',
        'short_name': 'AoflStarter',
        'description': 'Aofl Starter App',
        'display': 'standalone',
        'theme-color': '#fdf667',
        'background_color': '#fdf667',
        'crossorigin': 'use-credentials', // can be null, use-credentials or anonymous
        'ios': {
          'apple-mobile-web-app-title': 'Aofl Starter App',
          'apple-mobile-web-app-status-bar-style': '#fdf667',
        },
        'icons': [
          {
            src: 'assets/manifest/icon-48x48.png',
            sizes: '48x48',
          },
          {
            src: 'assets/manifest/icon-72x72.png',
            sizes: '72x72',
          },
          {
            src: 'assets/manifest/icon-96x96.png',
            sizes: '96x96',
          },
          {
            src: 'assets/manifest/icon-144x144.png',
            sizes: '144x144',
          },
          {
            src: 'assets/manifest/icon-192x192.png',
            sizes: '192x192',
          },
          {
            src: 'assets/manifest/icon-512x512.png',
            sizes: '512x512',
          },
        ],
      },
    },
    devServer: {
      contentBase: path.join(root, '__build'),
      port: 8080,
      host: 'localhost',
      openPage: '',
      open: true,
      stats: 'minimal',
      historyApiFallback: true,
    },
    unitTesting: {
      config: path.join(root, '.wctrc.json'),
      maxChunks: 1,
      exclude: [
        '**/__build*',
        '**/node_modules',
        '**/node_modules_sourced',
        '**/documentation{,!(/tests/**)}',
        '**/__config',
        '**/*-instance/**',
        '**/*-polyfill/**',
      ],
      scripts: [
        'runtime',
        'common',
        'main',
      ],
    },
  };
};