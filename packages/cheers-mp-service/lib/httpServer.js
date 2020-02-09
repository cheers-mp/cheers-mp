const axios = require("axios").default;
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const { error } = require("../utils/logger");

const portFilePath = path.join(os.homedir(), os.platform() === "win32" ? "/AppData/Local/微信开发者工具/User Data/Default/.ide" : "/Library/Application Support/微信开发者工具/Default/.ide");
const port = fs.readFileSync(portFilePath, "utf-8");
const request = axios.create({
  baseURL: `http://127.0.0.1:${port}`
});

request.interceptors.response.use(
  response => {
    return response.data;
  },
  err => {
    if (err.code === "ECONNREFUSED") {
      error("连接开发者工具服务失败，请先打开微信开发者工具");
    }
    return Promise.reject(err);
  }
);

/**
 * 打开开发者工具或者项目
 * @param {string} projectpath
 */
const openToolOrProject = projectpath =>
  request({
    method: "GET",
    url: "/open",
    params: {
      projectpath
    }
  });

/**
 * 构建npm
 * @param {string} projectpath 上传指定路径中的项目
 */
const buildNPM = projectpath => {
  return request({
    method: "GET",
    url: "/buildnpm",
    params: {
      projectpath
    }
  });
};

module.exports = {
  openToolOrProject,
  buildNPM
};
