const gulp = require("gulp");
const deepmerge = require("deepmerge");

const defaultOpt = {
  srcDir: "src",
  outputDir: "dist",
};
function json(opt) {
  opt = deepmerge(defaultOpt, opt);

  function compileJSON() {
    return gulp.src(`${opt.srcDir}/**/*.json`, { since: gulp.lastRun(compileJSON) }).pipe(gulp.dest(opt.outputDir));
  }
  compileJSON.displayName = "拷贝JSON";
  return compileJSON;
}

module.exports = json;
