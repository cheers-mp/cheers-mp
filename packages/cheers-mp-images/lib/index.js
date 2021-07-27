const { createServer } = require("./server");
const { UploadClient } = require("./client");
const { getIPAddress, normalize, getHash } = require("./utils");

/*
interface Config {
  target: string
  proxy: {
    port: number
  },
  oss: {
    type: "ALI" | "QINIU",
    options: {
      // 阿里
      bucket: string
      region: string
      prefix: string
      accessKeyId: string
      accessKeySecret: string
      fileType?: RegExp
      // 七牛
      zone: string,
      accessKey: string,
      secretKey: string,
      bucket: string,
      prefix: string,
      domain: string,
      https: false
    }
  }
}
*/

const ImageOperator = async (config) => {
  const portfinder = require("portfinder");
  const proxy = {
    port: 8080,
    ...config.proxy,
  };
  const port = proxy.port;
  const ip = getIPAddress();
  portfinder.basePort = port;
  const newPort = await portfinder.getPortPromise();
  if (newPort !== port) {
    proxy.port = newPort;
  }
  config.proxy = proxy;
  return {
    upload: () => {
      return UploadClient(config.oss, config.target);
    },
    proxy: () => createServer({ ip, ...config.proxy, target: config.target }),
    /** 获取本地代理地址 */
    getProxyURI: (localFile) => {
      const { port } = config.proxy;
      let relativePath = normalize(localFile);
      return `http://${ip}:${port}/${relativePath}`;
    },
    /** 上传成功后，获取上传后的图片地址 */
    getNetURI: (localFile) => {
      const { type, options } = config.oss;
      const ext = localFile.split(".").reverse()[0];
      const hash = getHash(localFile);
      const split = options.prefix === "" ? "" : `/`;
      if (type === "ALI") {
        return `https://${options.bucket}.${options.region}.aliyuncs.com/${options.prefix}${split}${hash}.${ext}`;
      } else if (type === "QINIU") {
        const domain = options.domain;
        if (/(clouddn.com|qiniucdn.com|qnssl.com|qbox.me)$/i.test(domain)) {
          options.https = false;
        }
        // 七牛云oss不支持目录划分
        return `${options.https ? "https" : "http"}://${domain}/${options.prefix}_${hash}.${ext}`;
      } else if (type === "UCLOUD") {
        return `${options.sslEnabled ? "https" : "http"}://${options.accessDomain || options.endpoint}/${
          options.bucket
        }/${options.prefix}/${hash}.${ext}`;
      } else if (type === "TENCENT") {
        const domain = options.accessDomain || `${options.bucket}.cos.${options.region}.myqcloud.com`;
        return `${options.https ? "https" : "http"}://${domain}/${options.prefix}${split}${hash}.${ext}`;
      }
    },
  };
};

module.exports = ImageOperator;
