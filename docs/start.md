---
sidebarDepth: 3
---

# 开始

## 创建新项目（暂不可用）

执行命令：

```bash
npx cheers-mp create 项目名字
```

按提示选择自己需要的配置即可.

模板仓库[传送门](https://github.com/bigmeow/cheers-mp-template)

> 自动创建项目功能未完善暂不可用，可先 clone [typescript 仓库 demo](https://github.com/bigmeow/cheers-mp-typescript-demo) 体验

## 已有的原生小程序使用

1. 将源码放入 `src` 目录下，但是小程序的项目配置文件 `project.config.json` 要放在项目根目录下;
2. 修改 `project.config.json` 中的 `miniprogramRoot` 字段修改为 `dist/`
3. 确保项目根目录下有 `package.json` 文件，没有则运行 `npm init` 命令初始化一个;
4. 执行命令安装核心包：

```bash
npm i cheers-mp-service -D
```

5. 在 `package.json` 的 `scripts` 字段中配置命令:

```json
  "scripts": {
    "dev": "cheers-mp-service serve --open",
    "build": "cheers-mp-service build --upload",
  }
```

6. 项目根目录下新增 `cheers.config.js` 配置文件

## 维护的仓库包

| 包名                                                                                                     | 描述                                                                           |
| :------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| [cheers-mp-service](https://github.com/bigmeow/cheers-mp/tree/master/packages/cheers-mp-service)         | 核心包，脚手架入口，注册了一系列编译相关的命令、加载自定义插件                 |
| [cheers-mp-cli](https://github.com/bigmeow/cheers-mp/tree/master/packages/cheers-mp-cli)                 | 负责创建新项目，初始化项目模板的程序（核心包已内置）                           |
| [cheers-mp-devtools-ci](https://github.com/bigmeow/cheers-mp/tree/master/packages/cheers-mp-devtools-ci) | 负责调用微信小程序开发者工具相关的 CI 命令，比如构建 NPM、上传（核心包已内置） |
| [cheers-mp-images](https://github.com/bigmeow/cheers-mp/tree/master/packages/cheers-mp-images)           | 负责将图片上传到阿里云或者七牛云 OSS （核心包已内置）                          |
| [gulp-cdnify-plus](https://github.com/bigmeow/cheers-mp/tree/master/packages/gulp-cdnify-plus)           | gulp 插件，负责替换样式文件、wxml 文件中的图片地址 （核心包已内置）            |
| [https://github.com/bigmeow/cheers-mp-template](https://github.com/bigmeow/cheers-mp-template)           | 初始化项目具体的模板                                                           |

## 项目推荐目录结构

```bash
├─dist  # 编译后输出目录
├─docs  # 项目文档介绍
├─key   # CI上传密钥
├─src   # 源码目录
│  ├─assets  # 静态资源
│  │  └─images
│  ├─components  # 基础自定义小程序组件
│  ├─pages  # 主包存放的小程序页面
│  │
│  ├─service  # 业务相关 ts
│  │  ├─api   # 所有的 api ts
│  │  └─store # 存储相关
│  ├─sub-package # 子包
│  │  └─pages
│  │      └─test
│  └─utils  # 工具类
│      └─wxs
├─typings # 类型定义
│
├─.env # 环境变量配置
│
├─cheers.config.js  # 脚手架自定义配置
│
├─package.json
│
├─project.config.json # 小程序开发者工具配置文件
│
└─tsconfig.json # typescript 配置
```
