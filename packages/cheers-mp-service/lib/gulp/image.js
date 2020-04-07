const gulp = require("gulp");
const deepmerge = require("deepmerge");

const defaultOpt = {
  srcDir: "src",
  outputDir: "dist",
  isUseOSS: false,
};
const IMAGE_EXT = "{jpg,jpeg,png,gif,bmp,webp}";

function image(opt) {
  opt = deepmerge(defaultOpt, opt);
  // 不使用oss拷贝所有图片，开启oss则只拷贝文件名带有LOCAL_前缀的图片

  function compileImage() {
    return gulp
      .src(`${opt.srcDir}/**/*.${IMAGE_EXT}`, { since: gulp.lastRun(compileImage) })
      .pipe(gulp.dest(opt.outputDir));
  }
  compileImage.displayName = "拷贝图片";

  const copyLOCAL = () => {
    return gulp
      .src(`${opt.srcDir}/**/LOCAL_*.${IMAGE_EXT}`, { since: gulp.lastRun(copyLOCAL) })
      .pipe(gulp.dest(opt.outputDir));
  };
  copyLOCAL.displayName = "拷贝LOCAL_前缀的图片";

  return opt.isUseOSS ? copyLOCAL : compileImage;
}

module.exports = image;
