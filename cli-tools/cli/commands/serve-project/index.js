const path = require('path');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const WebpackBar = require('webpackbar');
const {DebugReporter} = require('@aofl/cli-lib');
const {loadConfig} = require('../../lib/webpack-config');
const {Routes} = require('../routes');

/**
 *
 *
 * @author Arian Khosravi <arian.khosravi@aofl.com>
 */
class ServeProject {
  /**
   * Creates an instance of ServeProject.
   *
   * @param {String} config
   * @param {String} port
   * @param {String} host
   * @param {Boolean} stats
   * @param {Boolean} profile
   * @param {Boolean} debug
   */
  constructor(config = '.aofl.js', port, host, stats = false,
  profile = false, debug = false, reporter = 'fancy', hot = false, hotOnly = false) {
    this.configPath = path.resolve(config);
    this.port = port;
    this.host = host;
    this.stats = stats;
    this.profile = profile;
    this.debug = debug;
    this.reporter = reporter;
    this.hot = hot;
    this.hotOnly = hotOnly;

    if (debug) {
      this.reporter = new DebugReporter();
    }

    const reporters = [this.reporter];

    this.profile && reporters.push('profile');
    this.stats && reporters.push('stats');

    this.config = loadConfig(this.configPath);
    this.options = this.config.webpack.devServer;
    if (this.options.historyApiFallback === true) {
      this.options.historyApiFallback = {
        index: this.config.build.publicPath
      };
    }

    delete this.config.webpack.devServer;
    if (this.hot) {
      this.options.hot = true;
    }

    if (this.hotOnly) {
      this.options.hot = 'only';
    }

    if (this.options.hot) {
      this.config.webpack.module.rules.push({
        test: /\.(js|ts)$/i,
        enforce: 'pre',
        include: path.join(this.config.root, 'src'),
        exclude: this.config.build.templating.routes.output,
        use: [
          {
            loader: '@aofl/hmr-loader',
            options: {
              ...this.config.build.hmr
            }
          }
        ]
      });
    }

    this.config.webpack.plugins.push(new WebpackBar({
      name: this.config.name,
      profile: true,
      color: '#FFFF00',
      reporters
    }));
  }
  /**
   *
   */
  init() {
    const routes = new Routes(
      this.config.root,
      this.config.build.templating.routes.pattern,
      this.config.build.templating.routes.ignore,
      this.config.build.templating.routes.output
    );
    routes.run();

    const compiler = webpack(this.config.webpack);
    const server = new WebpackDevServer(this.options, compiler);
    server.start();
  }
}

module.exports = ServeProject;
