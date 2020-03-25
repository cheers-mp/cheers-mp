const gulp = require("gulp");
const gulpTs = require("gulp-typescript");
const gulpIf = require("gulp-if");
const gulpSourcemaps = require("gulp-sourcemaps");
const gulpAlias = require("gulp-ts-alias");
const gulpReplaces = require("gulp-replaces");
const resolveClientEnv = require("../../utils/resolveClientEnv");
const deepmerge = require("deepmerge");
const lazypipe = require("lazypipe");

const defaultOpt = {
  srcDir: "src",
  outputDir: "dist",
  tsConfig: ""
};

function ts(opt, userOptions) {
  opt = deepmerge(defaultOpt, opt);
  const tsProject = gulpTs.createProject(opt.tsConfig, { moduleResolution: "Node" });
  const isProd = process.env.NODE_ENV === "production";
  const productionSourceMap = isProd && userOptions.productionSourceMap;

  const jsCompressLazy = lazypipe().pipe(function() {
    return gulpIf(isProd, require("gulp-terser")());
  });

  const sourcemapsInitLazy = lazypipe().pipe(gulpSourcemaps.init);
  const sourcemapsWriteLazy = lazypipe().pipe(gulpSourcemaps.write);

  function compileTS() {
    // TODO 如果ts 的target 是es5，则开发模式下默认输出sourcemaps
    const env = gulpReplaces(resolveClientEnv());
    return gulp
      .src(`${opt.srcDir}/**/*.ts`, { since: gulp.lastRun(compileTS) })
      .pipe(gulpAlias({ configuration: tsProject.config }))
      .pipe(gulpIf(productionSourceMap, sourcemapsInitLazy()))
      .pipe(tsProject())
      .pipe(env)
      .pipe(jsCompressLazy())
      .pipe(gulpIf(productionSourceMap, sourcemapsWriteLazy()))
      .pipe(gulp.dest(opt.outputDir));
  }
  compileTS.displayName = "编译typescript";
  return compileTS;
}

module.exports = ts;
