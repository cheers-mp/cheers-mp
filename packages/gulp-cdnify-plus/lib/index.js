/* eslint-disable no-prototype-builtins */
"use strict";

const url = require("url");
// through2 is a thin wrapper around node transform streams
const through = require("through2");
const log = require("fancy-log");
const PluginError = require("plugin-error");
const rewriteCSSURLs = require("css-url-rewriter");
const wxml = require("@vivaxy/wxml");

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
  wxml: true,
  css: true,
};

const wxmlDefaults = {
  image: "src",
  video: "poster",
  "cover-image": "src",
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

  // Handle wxml selector:attribute settings
  if (options.wxml === false) {
    options.wxml = {};
  } else if (options.wxml === true) {
    options.wxml = wxmlDefaults;
  } else if (typeof options.wxml === "object") {
    for (const key in wxmlDefaults) {
      // eslint-disable-next-line no-prototype-builtins
      if (wxmlDefaults.hasOwnProperty(key)) {
        if (typeof options.wxml[key] === "undefined") {
          options.wxml[key] = wxmlDefaults[key];
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
        // log.info('Changed CSS file: "' + srcFile + '"');
      } else {
        if (/\.js$/.test(srcFile)) {
          log.warn('暂不支持js文件: "' + srcFile + '"');
        }
        try {
          const parsed = wxml.parse(String(file.contents));
          wxml.traverse(parsed, function visitor(node) {
            if (node.type !== 1) return;
            for (const search in options.wxml) {
              if (options.wxml.hasOwnProperty(search)) {
                const attr = options.wxml[search];

                if (attr) {
                  if (node.tagName === search && node.attributes.hasOwnProperty(attr)) {
                    const newValue = rewriteURL(node.attributes[attr]);
                    if (newValue != null && newValue !== node.attributes[attr]) {
                      node.attributes[attr] = newValue;
                    }
                  }
                }
              }
            }
            const oldCSS = node.attributes.style;
            if (options.css && oldCSS) {
              // 内联样式支持
              const newCSS = rewriteCSSURLs(oldCSS, rewriteURL);
              newCSS !== oldCSS && (node.attributes.style = newCSS);
            }
          });

          const serialized = wxml.serialize(parsed);
          file.contents = new Buffer(serialized);

          // log.info('Changed non-css file: "' + srcFile + '"');
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
