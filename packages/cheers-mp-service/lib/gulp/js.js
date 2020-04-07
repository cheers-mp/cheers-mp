const gulp = require("gulp");
const gulpIf = require("gulp-if");
const gulpSourcemaps = require("gulp-sourcemaps");
const lazypipe = require("lazypipe");
const gulpReplaces = require("gulp-replaces");
const resolveClientEnv = require("../../utils/resolveClientEnv");
const deepmerge = require("deepmerge");

const defaultOpt = {
  srcDir: "src",
  outputDir: "dist",
  tsConfig: "",
};

function js(opt, userOptions) {
  opt = deepmerge(defaultOpt, opt);
  const isProd = process.env.NODE_ENV === "production";
  const productionSourceMap = isProd && userOptions.productionSourceMap;

  const jsCompressLazy = lazypipe().pipe(function () {
    return gulpIf(isProd, require("gulp-terser")());
  });

  const sourcemapsInitLazy = lazypipe().pipe(gulpSourcemaps.init);
  const sourcemapsWriteLazy = lazypipe().pipe(gulpSourcemaps.write);

  function compileJS() {
    const env = gulpReplaces(resolveClientEnv());
    return gulp
      .src(`${opt.srcDir}/**/*.js`, { since: gulp.lastRun(compileJS) })
      .pipe(gulpIf(productionSourceMap, sourcemapsInitLazy()))
      .pipe(env)
      .pipe(jsCompressLazy())
      .pipe(gulpIf(productionSourceMap, sourcemapsWriteLazy()))
      .pipe(gulp.dest(opt.outputDir));
  }
  compileJS.displayName = "编译js";
  return compileJS;
}

module.exports = js;
