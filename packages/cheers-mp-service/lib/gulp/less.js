const gulp = require("gulp");
const gulpLess = require("gulp-less");
const gulpIf = require("gulp-if");
const gulpCDN = require("gulp-cdnify-plus");
const gulpRename = require("gulp-rename");
const gulpPostcss = require("gulp-postcss");
const deepmerge = require("deepmerge");
const px2rpx = require("./postcss-px2rpx");

const defaultOpt = {
  srcDir: "src",
  outputDir: "dist",
  isUseOSS: false,
  rewriter: (url) => url,
};

function less(opt, userOptions) {
  opt = deepmerge(defaultOpt, opt);
  const postcssPlugins = [];
  if (Array.isArray(userOptions.css.postcss) && userOptions.css.postcss.length > 0) {
    postcssPlugins.push(...userOptions.css.postcss);
  }
  if (userOptions.css.px2rpx) {
    postcssPlugins.push(px2rpx(userOptions.css.px2rpx));
  }
  if (process.env.NODE_ENV === "production") {
    postcssPlugins.push(
      require("cssnano")({
        preset: [
          "default",
          {
            discardComments: { removeAll: true },
            calc: false,
          },
        ],
      })
    );
  }

  function compileLESS() {
    return gulp
      .src(`${opt.srcDir}/**/*.less`, { since: gulp.lastRun(compileLESS) })

      .pipe(gulpLess(userOptions.css.less))
      .pipe(gulpIf(postcssPlugins.length > 0, gulpPostcss(postcssPlugins)))
      .pipe(
        gulpIf(
          opt.isUseOSS,
          gulpCDN({
            rewriter: opt.rewriter,
          })
        )
      )
      .pipe(gulpRename({ extname: ".wxss" }))
      .pipe(gulp.dest(opt.outputDir));
  }
  compileLESS.displayName = "编译less";
  return compileLESS;
}

module.exports = less;
