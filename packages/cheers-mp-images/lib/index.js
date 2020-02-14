const relative = require("relative");
const { createServer } = require("./server");
const { UploadClient } = require("./client");
const { getIPAddress, normalize, getHash } = require("./utils");
// interface Config {
//   target: string
//   proxy: {
//     port: number
//   },
//   oss: {
//     bucket: string
//     region: string
//     publicPath: string
//     accessKeyId: string
//     accessKeySecret: string
//     fileType?: RegExp
//   }
// }

const ImageOperator = config => {
  const ip = getIPAddress();
  return {
    upload: () => {
      return UploadClient(config.oss, config.target);
    },
    proxy: () => createServer({ ip, ...config.proxy, target: config.target }),
    getProxyURI: localFile => {
      const { port } = config.proxy;
      let relativePath = normalize(localFile);
      return `http://${ip}:${port}/${relativePath}`;
    },
    getNetURI: localFile => {
      const { bucket, region, publicPath } = config.oss;
      const ext = localFile.split(".").reverse()[0];
      const hash = getHash(localFile);
      return `https://${bucket}.${region}.aliyuncs.com${publicPath}/${hash}.${ext}`;
    }
  };
};

module.exports = ImageOperator;
