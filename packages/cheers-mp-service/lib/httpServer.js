const axios = require("axios").default;
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const { error } = require("../utils/logger");

const portFilePath = path.join(
  os.homedir(),
  os.platform() === "win32"
    ? "/AppData/Local/微信开发者工具/User Data/Default/.ide"
    : "/Library/Application Support/微信开发者工具/Default/.ide"
);
let port;
try {
  port = fs.readFileSync(portFilePath, "utf-8");
} catch (err) {
  error("请打开“小程序开发者工具”，依次点击顶部菜单的“设置”==> “安全设置”==> “服务端口”勾选“开启”");
  process.exit(1);
}
const request = axios.create({
  baseURL: `http://127.0.0.1:${port}`,
});

request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (err) => {
    if (err.code === "ECONNREFUSED") {
      error("连接开发者工具服务失败，请先打开微信开发者工具");
    } else {
      error(JSON.stringify(err.response.data));
    }
    return Promise.reject(err);
  }
);

/**
 * 打开开发者工具或者项目
 * @param {string} projectpath
 */
const openToolOrProject = (projectpath) =>
  request({
    method: "GET",
    url: "/open",
    params: {
      projectpath,
    },
  });

/**
 * 构建npm
 * @param {string} projectpath 上传指定路径中的项目
 */
const buildNPM = (projectpath) => {
  return request({
    method: "GET",
    url: "/buildnpm",
    params: {
      projectpath,
    },
  });
};

/**
 * 上传代码
 * @param {string} projectpath 上传指定路径中的项目
 * @param {string} version
 * @param {string} desc
 */
const upload = (projectpath, version, desc, infooutput) => {
  return request({
    method: "GET",
    url: "/upload",
    params: {
      projectpath,
      version,
      desc,
      infooutput,
    },
  });
};

module.exports = {
  openToolOrProject,
  buildNPM,
  upload,
};
