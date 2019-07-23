const path = require('path');
const fs = require('fs');
const parseImport = require('parse-import');
const parseCssUrls = require('css-url-parser');

const ESCAPE_REGEX = /[-[\]{}()*+?.,\\^$|#\s]/gi;
const replaceUrls = (content, urlPath, basePath, url) => {
  const basePathDir = path.dirname(basePath);
  try {
    fs.accessSync(urlPath, fs.constants.R_OK);
    const relPath = './' + path.relative(basePathDir, urlPath);
    content = content.replace(new RegExp(url.replace(ESCAPE_REGEX, '\\$&'), 'gi'), relPath);
  } catch (e) {
  }

  return content;
};

const replaceImports = (content, imports, basePath, modulePath) => {
  const moduleDir = path.dirname(modulePath);
  for (let i = 0; i < imports.length; i++) {
    const nextImport = imports[i];
    const importPath = path.resolve(moduleDir, nextImport.path);
    try {
      let importContent = fs.readFileSync(importPath, {encoding: 'utf-8'});
      const parsedUrls = parseCssUrls(importContent);

      for (let i = 0; i < parsedUrls.length; i++) {
        const url = parsedUrls[i];
        const urlPath = path.resolve(path.dirname(modulePath), url);
        importContent = replaceUrls(importContent, urlPath, basePath, url);
      }

      const importContentParsedImports = parseImport(importContent);

      if (importContentParsedImports.length > 0) {
        importContent = replaceImports(importContent, importContentParsedImports, basePath, importPath);
      }

      content = content.replace(new RegExp(nextImport.rule.replace(ESCAPE_REGEX, '\\$&') + ';?'), importContent);
    } catch (e) {
    }
  }
  return content;
};

const plugin = (resourcePath, modulePath, addDependency) => {
  return (context, content, selectors, parent, line, column, length) => {
    if (context === -1) {
      const parsedUrls = parseCssUrls(content);

      for (let i = 0; i < parsedUrls.length; i++) {
        const url = parsedUrls[i];
        const urlPath = path.resolve(path.dirname(modulePath), url);
        content = replaceUrls(content, urlPath, resourcePath, url);
      }

      const parsedImports = parseImport(content);
      content = replaceImports(content, parsedImports, resourcePath, modulePath);
    }
    return content;
  };
};

module.exports = {
  plugin
};