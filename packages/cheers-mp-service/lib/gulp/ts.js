const gulp = require("gulp");
const gulpTs = require("gulp-typescript");
const gulpAlias = require("gulp-ts-alias");
const gulpReplaces = require("gulp-replaces");
const resolveClientEnv = require("../../utils/resolveClientEnv");
const deepmerge = require("deepmerge");

const defaultOpt = {
  srcDir: "src",
  outputDir: "dist",
  tsConfig: ""
};

function ts(opt) {
  opt = deepmerge(defaultOpt, opt);
  const tsProject = gulpTs.createProject(opt.tsConfig, { moduleResolution: "Node" });

  function compileTS() {
    // TODO 如果ts 的target 是es5，则输出sourcemaps
    const env = gulpReplaces(resolveClientEnv());
    return (
      gulp
        .src(`${opt.srcDir}/**/*.ts`, { since: gulp.lastRun(compileTS) })
        .pipe(gulpAlias({ configuration: tsProject.config }))
        // .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(env)
        // .pipe(sourcemaps.write())
        .pipe(gulp.dest(opt.outputDir))
    );
  }
  compileTS.displayName = "编译typescript";
  return compileTS;
}

module.exports = ts;
