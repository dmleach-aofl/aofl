const glob = require('fast-glob');
const path = require('path');
const {spawn} = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');
const fs = require('fs');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const {steps} = require('web-component-tester');
const WctContext = require('web-component-tester/runner/context');
const {CliReporter} = require('web-component-tester/runner/clireporter');
const cleankill = require('cleankill');
const md5 = require('tiny-js-md5');
const {getChunksMap} = require('./assets-map');

/**
 *
 *
 * @class UnitTestingPlugin
 */
class UnitTestingPlugin {
  /**
   *
   *
   * @readonly
   * @static
   * @memberof UnitTestingPlugin
   */
  static get name() {
    return 'AoflUnitTestingPlugin';
  }

  /**
   * Creates an instance of UnitTestingPlugin.
   * @param {*} [options={}]
   * @memberof UnitTestingPlugin
   */
  constructor(options = {}) {
    this.options = defaultsDeep(options, {
      include: '**/*.js',
      exclude: ['**/node_modules/**'],
      output: '__build_tests',
      config: this.getConfigPath(),
      clean: true,
      scripts: []
    });

    this.options.exclude.push(path.join('**', this.options.output, '**'));
    this.options.output = path.resolve(process.env.PWD, this.options.output);
    let wctConfig = {};
    try {
       wctConfig = require(this.options.config);
    } catch (e) {}

    this.wctConfig = defaultsDeep(wctConfig, {
      verbose: false,
      sauce: null,
      plugins: {
        local: null,
        sauce: null,
        istanbul: {
          dir: path.join(process.env.PWD, 'coverage'),
          reporters: ['text-summary', 'lcov'],
          include: this.options.include,
          exclude: this.options.exclude
        }
      },
      root: process.env.PWD,
      npm: true,
      skipCleanup: false,
      persistent: false,
      expanded: false
    });
    this.wctContext = new WctContext(this.wctConfig);
    if (this.wctContext.options.output) {
      new CliReporter(this.wctContext, this.wctContext.options.output, this.wctContext.options);
    }
    this.wctContext.options.suites = [];
    this.runCount = 0;
    this.watchMode = false;
    this.createOutputFolder();
  }

  /**
   *
   *
   * @param {*} compiler
   * @memberof UnitTestingPlugin
   */
  apply(compiler) {
    let files = glob.sync(['**/*.spec.js', '**/index.js'], {
      ignore: this.options.exclude
    });

    let coverAllEntryPath = this.getCoverAllEntryPath(files.filter((item) => item.indexOf('.spec.js') === -1));

    files.push(coverAllEntryPath);
    files.forEach((item) => {
      if (item.indexOf('.spec.js') !== -1) {
        let entryPath = path.resolve(item);
        let entryName = UnitTestingPlugin.name + '-' + md5(entryPath);
        new SingleEntryPlugin(compiler.context, entryPath, entryName).apply(compiler);
      }
    });

    compiler.hooks.beforeRun.tapAsync(UnitTestingPlugin.name, async (compilation, cb) => {
      // await this.cleanOutputFolder();
      // await this.createOutputFolder();
      cb(null);
    });
    compiler.hooks.watchRun.tapAsync(UnitTestingPlugin.name, async (compilation, cb) => {
      this.watchMode = true;
      cb(null);
    });
    compiler.hooks.emit.tapAsync(UnitTestingPlugin.name, async (compilation, cb) => {
      try {
        const chunksMap = getChunksMap(compilation);
        let additionalScripts = this.getAdditionalScripts(compilation, chunksMap);
        for (let key in chunksMap) {
          if (!chunksMap.hasOwnProperty(key) || key.indexOf(UnitTestingPlugin.name) !== 0) continue;
          const source = compilation.assets[chunksMap[key]].source();
          let suite = this.generateSuite(key, source, additionalScripts);
          if (this.wctContext.options.suites.indexOf(suite) === -1) {
            this.wctContext.options.suites.push(suite);
          }
        }

        if (this.wctContext.options.suites.length > 0) {
          if (this.runCount === 1) {
            await steps.setupOverrides(this.wctContext);
            await steps.loadPlugins(this.wctContext);
            await steps.configure(this.wctContext);
            await steps.prepare(this.wctContext);
          }

          if (this.runCount >= 1) {
            await steps.runTests(this.wctContext);
          }
        } else {
          console.log(chalk.red('no tests were supplied to wct'));
        }
      } catch (e) {
        compilation.errors.push(e);
      } finally {
        if (!this.watchMode) {
          // if (this.options.clean) {
            // await this.cleanOutputFolder();
          // }
          await cleankill.close();
        }
      }

      this.runCount++;
      return cb(null);
    });
  }

  /**
   * @return {String}
   */
  getConfigPath() {
    const paths = [
      '.wctrc.json',
      'wct.conf.json'
    ];
    for (let i = 0; i < paths.length; i++) {
      try {
        const p = path.join(process.env.PWD, paths[i]);
        const stat = fs.statSync(p);
        if (stat.isFile()) {
          return p;
        }
      } catch (e) {}
    }
  }

  /**
   *
   * @return {Promise}
   * @memberof UnitTestingPlugin
   */
  cleanOutputFolder() {
    return new Promise((resolve, reject) => {
      let rm = spawn('rm', [
        '-rf',
        this.options.output
      ]);

      rm.on('close', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   *
   *
   * @return {Promise}
   * @memberof UnitTestingPlugin
   */
  createOutputFolder() {
    return new Promise((resolve, reject) => {
      let mkdir = spawn('mkdir', [
        '-p',
        '-m',
        777,
        this.options.output
      ]);

      mkdir.on('close', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * @param {String[]} files
   * @return {String}
   * @memberof UnitTestingPlugin
   */
  getCoverAllEntryPath(files) {
    const context = this.options.output;
    const filename = 'all-tests';
    const jsOutputPath = path.resolve(context, md5(filename) + '.spec.js');
    let content = files.reduce((acc, item) => {
      acc += `import './${path.relative(path.dirname(jsOutputPath), path.resolve(item))}';\n`;
      return acc;
    }, '');

    content += `describe('cover all', function() {
      it('should collect all testable files', function() {
        expect(true).to.equal(true);
      });
    });\n`;

    fs.writeFileSync(jsOutputPath, content, {encoding: 'utf-8'});
    return jsOutputPath;
  }


  /**
   * @param {String} name
   * @param {String} content
   * @param {String} otherScripts
   * @return {String}
   * @memberof UnitTestingPlugin
   */
  generateSuite(name, content, otherScripts) {
    const finalOutputPath = path.resolve(this.options.output, name + '.html');
    let template = fs.readFileSync(path.resolve(__dirname, 'templates', 'sample.html'), 'utf-8');

    template = template
    .replace('aoflUnitTesting:wct-browser-legacy', path.relative(this.options.output, path.resolve(process.env.PWD, 'node_modules', 'web-component-tester', 'browser.js')));

    template = template
    .replace('aoflUnitTesting:fetch-mock', path.relative(this.options.output, path.resolve(process.env.PWD, 'node_modules', 'fetch-mock', 'dist', 'es5', 'client-bundle.js')));

    template = this.replaceTemplatePart(template, 'aoflUnitTesting:js', '<script>\n' + otherScripts + content + '\n</script>');

    fs.writeFileSync(finalOutputPath, template, {encoding: 'utf-8'});

    return path.relative(process.env.PWD, finalOutputPath);
  }


  /**
   *
   * @param {Object} compilation
   * @param {Object} chunksMap
   * @return {String}
   * @memberof UnitTestingPlugin
   */
  getAdditionalScripts(compilation, chunksMap) {
    let scripts = '';
    for (let i = 0; i < this.options.scripts.length; i++) {
      if (typeof chunksMap[this.options.scripts[i]] !== 'undefined' &&
      typeof compilation.assets[chunksMap[this.options.scripts[i]]] !== 'undefined') {
        scripts += compilation.assets[chunksMap[this.options.scripts[i]]].source() + '\n';
      }
    }
    return scripts;
  }

  /**
   *
   *
   * @param {*} template
   * @param {*} match
   * @param {*} replace
   * @return {String}
   * @memberof UnitTestingPlugin
   */
  replaceTemplatePart(template, match, replace) {
    let i = template.indexOf(match);
    while (i > -1) {
      template = template.substring(0, i) + replace + template.substring(i + match.length);
      i = template.indexOf(match, i + replace.length);
    }
    return template;
  }
}

module.exports = UnitTestingPlugin;
