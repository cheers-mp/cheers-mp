const gulp = require("gulp");
const gulpIf = require("gulp-if");
const gulpCDN = require("gulp-cdnify");
const deepmerge = require("deepmerge");

const defaultOpt = {
  srcDir: "src",
  outputDir: "dist",
  isUseOSS: false,
  rewriter: () => null,
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
            // wxml文件中的style属性中的图片不替换，因为目前这个替换库中使用的解析html标签的库存在bug,
            // 同时存在自闭合标签时和style属性时会解析不正确
            // TODO 若要支持可以考虑fock它并换掉它的解析库
            css: false,
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
