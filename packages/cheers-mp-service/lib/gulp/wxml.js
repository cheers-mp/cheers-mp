const gulp = require("gulp");
const gulpIf = require("gulp-if");
const gulpCDN = require("gulp-cdnify-plus");
const deepmerge = require("deepmerge");

const defaultOpt = {
  srcDir: "src",
  outputDir: "dist",
  isUseOSS: false,
  rewriter: (url) => url,
};

function wxml(opt, userOptions) {
  opt = deepmerge(defaultOpt, opt);

  function compileWXML() {
    return gulp
      .src(`${opt.srcDir}/**/*.wxml`, { since: gulp.lastRun(compileWXML) })
      .pipe(
        gulpIf(
          opt.isUseOSS,
          gulpCDN({
            rewriter: opt.rewriter,
            wxml: userOptions.transformAssetUrls,
          })
        )
      )
      .pipe(gulp.dest(opt.outputDir));
  }

  compileWXML.displayName = "编译wxml文件";
  return compileWXML;
}

module.exports = wxml;
