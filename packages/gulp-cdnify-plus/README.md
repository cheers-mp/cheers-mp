# `gulp-cdnify-plus`

fock 自 [gulp-cdnify](https://github.com/kaiqigong/gulp-cdnify)、[grunt-cdnify](https://github.com/callumlocke/grunt-cdnify)， 将 `类html标记语言` 的解析器修改为 [@vivaxy/wxml](https://github.com/vivaxy/wxml),原仓库更适用于Html标签，在某些情况下会出现标签解析不正确.

`cheers-mp` 小程序脚手架用它来处理 wxml\less\sass 文件的图片链接，将 `image` 标签的 `src`、 `css` 的 `backgroud: url()` 等替换成云存储链接。此库通用，并不局限于`cheers-mp` 小程序脚手架中

## install

```bash
npm i gulp-cdnify-plus --save-dev
```

## Usage

```javascript
gulp.task("cdnify", function () {
  var cdnify = require("gulp-cdnify-plus");

  return gulp
    .src(["dist/**/*.{css,html,wxml}"])
    .pipe(
      cdnify({
        base: "http://pathto/your/cdn/",
      })
    )
    .pipe(gulp.dest("dist/"));
});
```

### For those who want to rewrite the url with their own specific rules.

```javascript
pipe(
  $.cdnify({
    rewriter: function (url, process) {
      if (/eot]ttf|woff|woff2/.test(url)) {
        return "http://myfontcdn.com/" + url;
      } else if (/(png|jpg|gif)$/.test(url)) {
        return "http://myimagecdn.com/" + url;
      } else {
        return process(url);
      }
    },
  })
);
```

### If you want to read custom source (Eg. favicon)

```javascript
pipe(
  $.cdnify({
    wxml: {
      'image': "src"
    },
  })
);
```

### Default sources:

```javascript
sources = {
  image: "src",
  video: "poster",
  "cover-image": "src",
};
```
