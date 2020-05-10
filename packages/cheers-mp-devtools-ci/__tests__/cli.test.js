"use strict";

const CLI = require("../lib/CLI");

async function run() {
  // const projectPath = "C:\\project\\github\\bug";
  const projectPath = "C:\\project\\com\\JK724.XCX.WechatShopping";
  const instance = new CLI("C:\\Program Files (x86)\\Tencent\\微信web开发者工具", "v2");
  await instance.init();
  let res;
  // 调用本地开发者工具打开项目
  // res = await instance.open(projectPath);
  // console.log(res.stderr);
  // console.log(res.stdout);
  // 构建npm
  // res = await instance.buildNPM(projectPath);
  // console.log(res.stderr);
  // console.log(res.stdout);
  // // 上传
  // res = await instance.upload(projectPath, "2020.03.17", "上传测试");
  // console.log(res.stderr);
  // console.log(res.stdout);

  // 关闭
  // res = await instance.quit();

  // 重建文件监听
  res = await instance.resetFileutils(projectPath);

  console.log(res.stderr);
  console.log(res.stdout);
}

run();
