const del = require("del");
const cleaner = (path, cache) => {
  function clean() {
    const patterns = ["dist/**"];
    if (cache) {
      patterns.push("!dist/node_modules", "!dist/miniprogram_npm", "!dist/package.json", "!dist/package-lock.json");
    }
    return del(patterns);
  }
  clean.displayName = "清空输出目录";
  return clean;
};

module.exports = cleaner;
