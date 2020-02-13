const fs = require("fs");
const md5 = require("md5");
const path = require("path");
const os = require("os");

exports.normalize = pathStr => pathStr.split(path.sep).join("/");

exports.getHash = localPath => {
  const file = fs.readFileSync(localPath);
  return md5(file);
};

exports.getIPAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iFace = interfaces[devName];
    for (let i = 0; i < iFace.length; i++) {
      const alias = iFace[i];
      if (alias.family === "IPv4" && alias.address !== "127.0.0.1" && !alias.internal) {
        return alias.address;
      }
    }
  }
  console.warn("没有获取到ip，可能导致手机无法预览, 当前默认为localhost");
  return "localhost";
};
