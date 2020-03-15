const gulp = require("gulp");
const gulpLess = require("gulp-less");
const gulpIf = require("gulp-if");
const gulpCDN = require("gulp-cdnify");
const gulpRename = require("gulp-rename");
const deepmerge = require("deepmerge");

const defaultOpt = {
  srcDir: "src",
  outputDir: "dist",
  isUseOSS: false,
  rewriter: url => url
};

function less(opt) {
  opt = deepmerge(defaultOpt, opt);

  function compileLESS() {
    return (
      gulp
        .src(`${opt.srcDir}/**/*.less`, { since: gulp.lastRun(compileLESS) })
        .pipe(gulpLess())
        // .pipe(postcss())
        // .pipe(
        //   insert.transform((contents, file) => {
        //     if (!file.path.includes("src" + path.sep + "common")) {
        //       contents = `@import '/common/index.wxss';${contents}`;
        //     }
        //     return contents;
        //   })
        // )
        .pipe(
          gulpIf(
            opt.isUseOSS,
            gulpCDN({
              rewriter: opt.rewriter
            })
          )
        )
        .pipe(gulpRename({ extname: ".wxss" }))
        .pipe(gulp.dest(opt.outputDir))
    );
  }
  compileLESS.displayName = "编译less";
  return compileLESS;
}

module.exports = less;
