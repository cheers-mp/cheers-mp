"use strict";

const url = require("url");
// through2 is a thin wrapper around node transform streams
const through = require("through2");
const log = require("fancy-log");
const PluginError = require("plugin-error");
const rewriteCSSURLs = require("css-url-rewriter");
const cheerio = require("cheerio");
const htmlparser2 = require("htmlparser2");

// Consts
const PLUGIN_NAME = "gulp-cdnify-plus";

function isLocalPath(filePath) {
  return (
    typeof filePath === "string" &&
    filePath.length &&
    !filePath.startsWith("http") &&
    !filePath.startsWith("//") &&
    !filePath.startsWith("data:")
  );
}

// Default options
const defaults = {
  html: true,
  css: true,
};

const htmlDefaults = {
  "img[data-src]": "data-src",
  "img[src]": "src",
  'link[rel="apple-touch-icon"]': "href",
  'link[rel="icon"]': "href",
  'link[rel="shortcut icon"]': "href",
  'link[rel="stylesheet"]': "href",
  "script[src]": "src",
  "source[src]": "src",
  "video[poster]": "poster",
};

function extend(target, source) {
  target = target || {};
  for (const prop in source) {
    if (typeof source[prop] === "object") {
      target[prop] = extend(target[prop], source[prop]);
      // overwrite only if undefined
    } else if (typeof target[prop] === "undefined") {
      target[prop] = source[prop];
    }
  }
  return target;
}

// Plugin level function(dealing with files)
function gulpCdnifyPlus(options) {
  if (!options) {
    throw new PluginError(PLUGIN_NAME, "Missing options");
  }

  options = extend(options, defaults);

  // Handle HTML selector:attribute settings
  if (options.html === false) {
    options.html = {};
  } else if (options.html === true) {
    options.html = htmlDefaults;
  } else if (typeof options.html === "object") {
    for (const key in htmlDefaults) {
      // eslint-disable-next-line no-prototype-builtins
      if (htmlDefaults.hasOwnProperty(key)) {
        if (typeof options.html[key] === "undefined") {
          options.html[key] = htmlDefaults[key];
        }
      }
    }
  }

  // Establish the rewriteURL function for this task
  let rewriteURL = options.rewriter;
  const base = options.base;

  if (typeof base === "string") {
    rewriteURL = function (origUrl) {
      return isLocalPath(origUrl) ? url.resolve(base, origUrl) : origUrl;
    };
  } else if (typeof rewriteURL !== "function") {
    throw new PluginError(
      PLUGIN_NAME,
      "Please specify either a `base` string or a `rewriter` function in the task options."
    );
  }

  // Creating a stream through which each file will pass
  return through.obj(function (file, enc, cb) {
    const srcFile = file.path;

    if (file.isNull()) {
      // return empty file
      return cb(null, file);
    }
    if (file.isBuffer()) {
      if (/\.css$/.test(srcFile)) {
        // It's a CSS file.
        const oldCSS = String(file.contents);
        const newCSS = options.css ? rewriteCSSURLs(oldCSS, rewriteURL) : oldCSS;

        file.contents = new Buffer(newCSS);
        log.info('Changed CSS file: "' + srcFile + '"');
      } else {
        if (/\.js$/.test(srcFile)) {
          log.warn('暂不支持js文件: "' + srcFile + '"');
        }
        try {
          const oldHTML = String(file.contents);
          const dom = htmlparser2.parseDOM(oldHTML, {
            decodeEntities: false,
            xmlMode: true,
            recognizeSelfClosing: true,
          });
          const $ = cheerio.load(dom, { decodeEntities: false });

          for (const search in options.html) {
            // eslint-disable-next-line no-prototype-builtins
            if (options.html.hasOwnProperty(search)) {
              const attr = options.html[search];
              if (attr) {
                $(search).attr(attr, function (index, oldValue) {
                  const replaceAfter = rewriteURL(oldValue);
                  return replaceAfter == null || replaceAfter === oldValue ? oldValue : replaceAfter;
                });
              }
            }
          }

          // Update the URLs in any embedded stylesheets
          if (options.css) {
            // 内联样式支持
            $("[style]").attr("style", function (index, oldValue) {
              return rewriteCSSURLs(oldValue, rewriteURL);
            });
            // soup.setInnerHTML('style', function (css) {
            //   return rewriteCSSURLs(css, rewriteURL);
            // });
          }

          // Write it to disk
          file.contents = new Buffer($.html());
          log.info('Changed non-css file: "' + srcFile + '"');
        } catch (e) {
          console.log(e);
          log.warn('File not changed: "' + srcFile + '"');
        }
      }
    }
    if (file.isStream()) {
      throw new PluginError(PLUGIN_NAME, "Stream not supported");
    }
    return cb(null, file);
  });
}

// Exporting the plugin main function
module.exports = gulpCdnifyPlus;
