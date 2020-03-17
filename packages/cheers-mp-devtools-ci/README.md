# `cheers-mp-devtools-ci`

小程序开发者工具的命令行调用封装。原文档：https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html

## 安装

```bash
npm i cheers-mp-devtools-ci -D
```

## 引入

```js
require("cheers-mp-devtools-ci");
async function run() {
  const projectPath = "C:\\project\\com\\JK724.XCX.WechatShopping";
  const instance = new CLI("C:\\Program Files (x86)\\Tencent\\微信web开发者工具", "v1");
  await instance.init();
  let res;
  // 调用本地开发者工具打开项目
  res = await instance.open(projectPath);
  console.log(res.stderr);
  console.log(res.stdout);

  // 构建npm
  res = await instance.buildNPM(projectPath);
  console.log(res.stderr);
  console.log(res.stdout);

  // 上传
  res = await instance.upload(projectPath, "2020.03.17", "上传测试");
  console.log(res.stderr);
  console.log(res.stdout);

  // 关闭
  res = await instance.quit();
  // console.log(res.stderr);
  // console.log(res.stdout);
}

run();
```

## 注意

> 由于开发者工具不断的在更新，具体以使用时实际情况为准，本包在最新的（截止到 2020 年 3 月 17 日）[稳定版](https://developers.weixin.qq.com/community/develop/doc/000ca485d088388d9379d646c56c01) 以及 [预发布版](https://developers.weixin.qq.com/community/develop/doc/0004064f12424003b90a1758f56c01) 测试通过。

- 本包作为主库配套包使用，并未支持所有 cli 命令，如有需要，可提 issues
- 官方的命令行有 v1 和 v2 两个版本，v2 版本仅在 `预发布版本1.02.2003121`、 `稳定版1.02.202003092（未发布）` 及其以上支持，从我的测试结果看，v2 版本的命令编译效率、稳定性很差，强烈建议使用 v1 版本的命令以及已发布的最新的稳定版开发者工具
