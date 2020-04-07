const postcss = require("postcss");
const Px2rpx = require("@megalo/px2rpx");

module.exports = postcss.plugin("px2rpx", (options) => {
  options = Object.assign(
    {
      rpxUnit: 1,
      rpxPrecision: 6,
    },
    options
  );
  return function (css, result) {
    const oldCssText = css.toString();
    const px2rpxIns = new Px2rpx(options);
    const newCssText = px2rpxIns.generateRpx(oldCssText);
    const newCssObj = postcss.parse(newCssText);
    result.root = newCssObj;
  };
});
