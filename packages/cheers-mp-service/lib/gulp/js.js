const gulp = require("gulp");
const gulpReplaces = require("gulp-replaces");
const resolveClientEnv = require("../../utils/resolveClientEnv");
const deepmerge = require("deepmerge");

const defaultOpt = {
  srcDir: "src",
  outputDir: "dist",
  tsConfig: ""
};

function js(opt) {
  opt = deepmerge(defaultOpt, opt);

  function compileJS() {
    const env = gulpReplaces(resolveClientEnv());
    return gulp
      .src(`${opt.srcDir}/**/*.js`, { since: gulp.lastRun(compileJS) })
      .pipe(env)
      .pipe(gulp.dest(opt.outputDir));
  }
  compileJS.displayName = "编译js";
  return compileJS;
}

module.exports = js;
