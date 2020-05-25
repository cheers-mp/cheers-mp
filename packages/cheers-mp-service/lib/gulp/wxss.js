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

function wxss(opt) {
  opt = deepmerge(defaultOpt, opt);

  function compileWXSS() {
    return gulp
      .src(`${opt.srcDir}/**/*.wxss`, { since: gulp.lastRun(compileWXSS) })
      .pipe(
        gulpIf(
          opt.isUseOSS,
          gulpCDN({
            rewriter: opt.rewriter,
          })
        )
      )
      .pipe(gulp.dest(opt.outputDir));
  }
  compileWXSS.displayName = "编译wxss";
  return compileWXSS;
}

module.exports = wxss;
