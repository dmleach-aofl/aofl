const CommanderHelper = require('./modules/commander-helper');
const {environments, project, resources} = require('./modules/constants-enumerate');
const getTranslationCalls = require('./modules/get-translation-calls');
const {Git} = require('./modules/git');
const htmlWebpackConfig = require('./modules/html-webpack-config');
const {Npm} = require('./modules/npm');
const {PathHelper} = require('./modules/path-helper');
const {ProjectHelper} = require('./modules/project-helper');
const {TerminalHelper} = require('./modules/terminal-helper');
const {TtTag} = require('./modules/tt-tags');
const {DebugReporter} = require('./modules/webpackbar-debug-reporter');
const {loadConfig} = require('./modules/webpack-config');


module.exports.CommanderHelper = CommanderHelper;
module.exports.environments = environments;
module.exports.project = project;
module.exports.resources = resources;
module.exports.getTranslationCalls = getTranslationCalls;
module.exports.Git = Git;
module.exports.htmlWebpackConfig = htmlWebpackConfig;
module.exports.Npm = Npm;
module.exports.PathHelper = PathHelper;
module.exports.ProjectHelper = ProjectHelper;
module.exports.TerminalHelper = TerminalHelper;
module.exports.TtTag = TtTag;
module.exports.DebugReporter = DebugReporter;
module.exports.loadConfig = loadConfig;
