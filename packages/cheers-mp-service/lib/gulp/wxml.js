const gulp = require("gulp");
const gulpIf = require("gulp-if");
const gulpCDN = require("gulp-cdnify");
const deepmerge = require("deepmerge");

const defaultOpt = {
  srcDir: "src",
  outputDir: "dist",
  isUseOSS: false,
  rewriter: (url) => url,
};

function wxml(opt) {
  opt = deepmerge(defaultOpt, opt);

  function compileWXML() {
    return gulp
      .src(`${opt.srcDir}/**/*.wxml`, { since: gulp.lastRun(compileWXML) })
      .pipe(
        gulpIf(
          opt.isUseOSS,
          gulpCDN({
            html: {
              "image[src]": "src",
            },
            rewriter: opt.rewriter,
          })
        )
      )
      .pipe(gulp.dest(opt.outputDir));
  }

  compileWXML.displayName = "编译wxml文件";
  return compileWXML;
}

module.exports = wxml;
