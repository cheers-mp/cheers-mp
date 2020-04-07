const gulp = require("gulp");
const gulpReplaces = require("gulp-replaces");
const deepmerge = require("deepmerge");
const resolveClientEnv = require("../../utils/resolveClientEnv");

const defaultOpt = {
  srcDir: "src",
  outputDir: "dist",
};
function wxs(opt) {
  opt = deepmerge(defaultOpt, opt);

  function compileWXS() {
    const env = gulpReplaces(resolveClientEnv());
    return gulp
      .src(`${opt.srcDir}/**/*.wxs`, { since: gulp.lastRun(compileWXS) })
      .pipe(env)
      .pipe(gulp.dest(opt.outputDir));
  }
  compileWXS.displayName = "编译wxs";
  return compileWXS;
}

module.exports = wxs;
