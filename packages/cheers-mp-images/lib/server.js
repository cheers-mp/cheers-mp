// interface Options {
//   port: number
//   target: string
//   ip: string
// }
// exports.ImageProxyPlugin = class ImageProxyPlugin {
//   constructor(options) {
//     this.options = options;
//   }
//   // options: Options
//   apply() {
//     // compiler.plugin('environment', (stats) => {
//     this.createServer(this.options);
//     // })
//     // compiler.plugin('failed', (err) => {
//     // })
//   }
// };

exports.createServer = async function createServer({ target, ip, port }) {
  const express = require("express");
  // const path = require("path");
  const chalk = require("chalk");
  const app = express();
  // const route = path.basename(target);
  app.use(`/`, express.static(target));

  app.listen(port, "0.0.0.0");
  console.log(chalk.green.bold(`图片代理服务运行中...  => http://${ip}:${port}`));
  return `http://${ip}:${port}`;
};
