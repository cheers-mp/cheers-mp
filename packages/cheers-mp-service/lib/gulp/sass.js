const gulp = require("gulp");
const gulpSass = require("gulp-sass");
const gulpIf = require("gulp-if");
const gulpCDN = require("gulp-cdnify-plus");
const gulpRename = require("gulp-rename");
const gulpPostcss = require("gulp-postcss");
const deepmerge = require("deepmerge");
const px2rpx = require("./postcss-px2rpx");

gulpSass.compiler = require("dart-sass");

const defaultOpt = {
  srcDir: "src",
  outputDir: "dist",
  isUseOSS: false,
  rewriter: (url) => url,
};

function sass(opt, userOptions) {
  opt = deepmerge(defaultOpt, opt);
  const postcssPlugins = [];
  const sassOption = Object.assign({}, { includePaths: [opt.srcDir] }, userOptions.css.scss || userOptions.css.sass);

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

  function compileSASS() {
    return gulp
      .src(`${opt.srcDir}/**/*.{scss,sass}`, { since: gulp.lastRun(compileSASS) })

      .pipe(gulpSass(sassOption))
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
  compileSASS.displayName = "编译sass/scss";
  return compileSASS;
}

module.exports = sass;
