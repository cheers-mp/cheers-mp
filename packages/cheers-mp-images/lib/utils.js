const fs = require("fs");
const md5 = require("md5");
const path = require("path");

exports.normalize = (pathStr) => pathStr.split(path.sep).join("/");

exports.getHash = (localPath) => {
  const file = fs.readFileSync(localPath);
  return md5(file);
};

exports.getIPAddress = () => {
  const address = require("address");
  const defaultGateway = require("default-gateway");
  const result = defaultGateway.v4.sync();
  let lanUrlForConfig = address.ip(result && result.interface);

  if (lanUrlForConfig) {
    // Check if the address is a private ip
    // https://en.wikipedia.org/wiki/Private_network#Private_IPv4_address_spaces
    if (!/^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(lanUrlForConfig)) {
      // Address is private
      lanUrlForConfig = "127.0.0.1";
      console.warn("没有获取到局域网ip，可能导致手机无法预览, 当前默认为" + lanUrlForConfig);
    }
  }
  return lanUrlForConfig;
};
