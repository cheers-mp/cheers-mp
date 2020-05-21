# 使用命令

在一个 Cheers-mp-cli 创建的项目中，`cheers-mp-service` 安装了一个名为 `cheers-mp-service` 的命令。你可以在 npm scripts 中以 `cheers-mp-service`、或者从终端中以 `./node_modules/.bin/cheers-mp-service` 访问这个命令。

这是你使用默认 preset 的项目的 `package.json`：

```json
{
  "scripts": {
    "serve": "cheers-mp-service serve --open",
    "build": "cheers-mp-service build"
  }
}
```

你可以通过 npm 或 Yarn 调用这些 script：

```bash
npm run serve
# OR
yarn serve
```

如果你可以使用 [npx](https://github.com/npm/npx) (最新版的 npm 应该已经自带)，也可以直接这样调用命令：

```bash
npx cheers-mp-service serve --open
```

## 约定

在开始具体命令之前，以 `cheers-mp-service serve --open` 这条完整的命令为例，我们做一个称呼上的约定：

- `cheers-mp-service` 是脚手架提供的服务
- `serve` 是一条具体的命令，命令名字叫 `serve`
- `--open` 是这条命令的 `参数` 或者 `选项`，可同时使用多个 `选项`
- `参数` 或者 `选项` 后面可能需要传值也可能不需要，具体取决命令本身是否有默认值

## cheers-mp-service serve

```
用法：cheers-mp-service serve [选项] [选项值]
示例：cheers-mp-service serve --mode uat --open

选项：

  --mode    指定环境模式 (默认值：development)
  --open    编译后自动在开发者工具中打开项目(仅compiler.type为hard时生效)
```

`cheers-mp-service serve` 命令会打开监听模式， 监听项目中被修改的文件然后重新编译该文件；如果你启用了 `oss` 配置，则会额外启动一个图片服务器，用于代理项目中用到的图片资源。

## cheers-mp-service build

```
用法：cheers-mp-service build [选项] [选项值]

选项：

  --mode    指定 env 文件模式 (默认: production)
  --clean   是否每次编译前先清空处理掉输出目录(默认: true)
  --watch   开启监听模式,默认关闭
  --upload  编译结束后是否自动调用开发者工具上传，上传的小程序可在后台设置为体验版，默认关闭
```

`cheers-mp-service build` 会在 `dist/` 目录产生一个可用于生产环境的包，带有 JS/CSS/WXML 的压缩和 `sourceMap`。

::: danger 注意
无论是 `serve` 还是 `build` 命令， 都不会将你的 js 编译成 es5， 也不会将你的 css 编译成兼容更低版本的样式。
所以，你的开发者工具要勾选上 `es6转es5`、`增强编译`、`上传时补全样式`
:::

## 查看所有的可用命令

你可以运行以下命令查看所有注入的命令：

```bash
npx vue-cli-service help
```

你也可以这样学习每个命令可用的选项：

```bash
npx vue-cli-service help [command]
```

例如执行下面命令：

```bash
npx vue-cli-service help serve
```

将会输出：

```bash
  使用: cheers-mp-cli-service build [options] [entry]

  具体选项:

    --mode    指定 env 文件模式 (默认: development)
    --clean   是否每次编译前先清空处理掉输出目录(默认: true)
    --watch   开启监听模式,默认关闭
    --upload  编译结束后是否自动调用开发者工具上传，上传的小程序可在后台设置为体验版，默认关闭
```
